import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { HrResponse } from '@/lib/types';

const VALID_RESPONSES: HrResponse[] = ['offer', 'hold', 'reject'];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await req.json();
    const response = body?.response as HrResponse | undefined;

    if (!response || !VALID_RESPONSES.includes(response)) {
      return NextResponse.json({ error: 'Invalid HR response' }, { status: 400 });
    }

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

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

    return NextResponse.json({
      success: true,
      sessionId,
      hrResponse: response,
      hrRespondedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
