import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { DisputeResolution } from '@/lib/types';
import { assertHrOwnsSession, requireHrUser } from '@/lib/hrAuth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const user = requireHrUser(req);
    if (user instanceof NextResponse) return user;

    const { resolution, notes } = await req.json();

    if (!['upheld', 'revised', 'fresh_interview'].includes(resolution)) {
      return NextResponse.json(
        { error: 'Invalid resolution action.' },
        { status: 400 }
      );
    }

    const ownership = await assertHrOwnsSession(user, sessionId);
    if (!ownership.ok) return ownership.response;

    const now = Date.now();
    await db.update(sessions)
      .set({
        disputeResolvedAt: now,
        disputeResolution: resolution as DisputeResolution,
        disputeResolutionNotes: notes?.trim() || null,
        disputeStatus: 'resolved',
      })
      .where(eq(sessions.id, sessionId))
      .run();

    return NextResponse.json({
      success: true,
      disputeResolvedAt: now,
      disputeResolution: resolution,
      disputeStatus: 'resolved',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
