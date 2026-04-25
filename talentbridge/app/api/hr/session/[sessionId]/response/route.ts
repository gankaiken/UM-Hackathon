import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { HrResponse } from '@/lib/types';
import { assertHrOwnsSession, requireHrUser } from '@/lib/hrAuth';
import { getRequestIp, logAuditEvent } from '@/lib/security';
import { requireCsrf } from '@/lib/csrf';

const VALID_RESPONSES: HrResponse[] = ['offer', 'hold', 'reject'];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const user = requireHrUser(req);
    if (user instanceof NextResponse) return user;
    const csrfError = requireCsrf(req);
    if (csrfError) return csrfError;

    const body = await req.json();
    const response = body?.response as HrResponse | undefined;

    if (!response || !VALID_RESPONSES.includes(response)) {
      return NextResponse.json({ error: 'Invalid HR response' }, { status: 400 });
    }

    const ownership = await assertHrOwnsSession(user, sessionId);
    if (!ownership.ok) return ownership.response;
    const session = ownership.session;

    const hrRespondedAt = Date.now();
    await db.update(sessions)
      .set({
        hrResponse: response,
        hrRespondedAt,
        interviewScheduledAt: response === 'offer' ? session.interviewScheduledAt : null,
        interviewMeetingLink: response === 'offer' ? session.interviewMeetingLink : null,
        interviewScheduleNote: response === 'offer' ? session.interviewScheduleNote : null,
      })
      .where(eq(sessions.id, sessionId))
      .run();

    await logAuditEvent({
      actorType: 'hr',
      actorId: user.id,
      action: 'hr.response',
      status: 'success',
      ipAddress: getRequestIp(req),
      targetType: 'session',
      targetId: sessionId,
      details: { response },
    });

    return NextResponse.json({
      success: true,
      sessionId,
      hrResponse: response,
      hrRespondedAt,
    });
  } catch (error) {
    await logAuditEvent({ actorType: 'hr', action: 'hr.response', status: 'failure', ipAddress: getRequestIp(req), targetType: 'session', targetId: (await params).sessionId });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
