import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { DisputeResolution } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { resolution, notes } = await req.json();

    if (!['upheld', 'revised', 'fresh_interview'].includes(resolution)) {
      return NextResponse.json(
        { error: 'Invalid resolution action.' },
        { status: 400 }
      );
    }

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

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
