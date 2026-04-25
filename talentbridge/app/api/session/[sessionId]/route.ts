// app/api/session/[sessionId]/route.ts
// GET: Load session state + transcript for resume functionality

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, transcripts, jdCache } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { SessionState, TranscriptEntry } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const jd = await db.select().from(jdCache).where(eq(jdCache.id, session.jdId)).get();
    if (!jd) {
      return NextResponse.json({ error: 'JD not found for session' }, { status: 404 });
    }

    const dbTranscripts = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.sessionId, sessionId))
      .orderBy(asc(transcripts.turnNumber))
      .all();

    const transcript: TranscriptEntry[] = dbTranscripts.map(t => ({
      role: t.role as 'inquisitor' | 'candidate',
      content: t.content,
      turnNumber: t.turnNumber,
      strategistJson: t.strategistJson ? JSON.parse(t.strategistJson) : undefined,
      createdAt: t.createdAt,
    }));

    const sessionState: SessionState = {
      sessionId: session.id,
      jdId: session.jdId,
      candidateName: session.candidateName,
      status: session.status,
      turnCount: session.turnCount,
      coverageMap: JSON.parse(session.coverageMap),
      sentinelData: JSON.parse(session.sentinelData),
      transcript,
      mapperResult: JSON.parse(jd.mapperOutput),
    };

    return NextResponse.json(sessionState);
  } catch (error) {
    console.error('[Session GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
