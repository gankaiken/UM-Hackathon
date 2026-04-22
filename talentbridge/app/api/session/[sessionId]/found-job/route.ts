// app/api/session/[sessionId]/found-job/route.ts
// POST: Candidate marks themselves as having found a job
// Removes them from the active pipeline to avoid wasting HR time

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    await db.update(sessions)
      .set({
        foundJob: true,
        foundJobAt: Date.now(),
        status: 'abandoned',
      })
      .where(eq(sessions.id, sessionId))
      .run();

    console.log(`[FoundJob] Candidate ${session.candidateName} marked as found-job for session ${sessionId}`);

    return NextResponse.json({ success: true, message: 'Congratulations! You have been removed from this pipeline.' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
