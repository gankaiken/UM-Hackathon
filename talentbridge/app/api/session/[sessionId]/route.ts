// app/api/session/[sessionId]/route.ts
// GET: Load session state + transcript for resume functionality

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, transcripts, jdCache } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { SessionState, TranscriptEntry } from '@/lib/types';
import { normalizeSentinelData } from '@/lib/sentinel';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const jd = await db.select().from(jdCache).where(eq(jdCache.id, session.jdId)).get();
    if (!jd) {
      return NextResponse.json({ error: 'JD not found for session' }, { status: 404 });
    }
    if (jd.employerId !== session.employerId) {
      return NextResponse.json({ error: 'Session ownership mismatch' }, { status: 403 });
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

    const now = Date.now();
    let { sessionLifecycleStatus, sessionExpiredAt, partialProfileCreatedAt } = session;

    if (session.status === 'active' && (!sessionLifecycleStatus || sessionLifecycleStatus !== 'expired')) {
      const lastActivityAt = dbTranscripts.length > 0 
        ? dbTranscripts[dbTranscripts.length - 1].createdAt 
        : session.createdAt;
      
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      if (now - lastActivityAt > SEVEN_DAYS) {
        sessionLifecycleStatus = 'expired';
        sessionExpiredAt = now;
        partialProfileCreatedAt = now;
        
        await db.update(sessions).set({
          sessionLifecycleStatus,
          sessionExpiredAt,
          partialProfileCreatedAt
        }).where(eq(sessions.id, sessionId)).run();
      }
    }

    const sessionState: SessionState = {
      sessionId: session.id,
      jdId: session.jdId,
      candidateName: session.candidateName,
      // ── Extra info for welcome screen / My Applications ────────
      roleTitle: jd.roleTitle,
      companyName: jd.employerId === 'default' ? 'Nexus Digital Sdn Bhd' : jd.employerId,
      hrResponse: session.hrResponse === 'offer' || session.hrResponse === 'hold' || session.hrResponse === 'reject'
        ? session.hrResponse
        : null,
      scheduledSlot: session.scheduledSlot,
      // ───────────────────────────────────────────────────────────
      status: session.status,
      foundJob: session.foundJob,
      foundJobAt: session.foundJobAt,
      interviewScheduledAt: session.interviewScheduledAt,
      interviewMeetingLink: session.interviewMeetingLink,
      interviewScheduleNote: session.interviewScheduleNote,
      quizAnswers: session.quizAnswers ? JSON.parse(session.quizAnswers) : [],
      preScreeningContext: session.preScreeningContext ? JSON.parse(session.preScreeningContext) : null,
      disputeRequestedAt: session.disputeRequestedAt,
      disputeReason: session.disputeReason,
      disputeStatus: session.disputeStatus,
      moderationStatus: session.moderationStatus,
      moderationErrors: session.moderationErrors ? JSON.parse(session.moderationErrors) : null,
      moderationEscalatedAt: session.moderationEscalatedAt,
      sessionLifecycleStatus,
      sessionExpiredAt,
      partialProfileCreatedAt,
      turnCount: session.turnCount,
      coverageMap: JSON.parse(session.coverageMap),
      sentinelData: normalizeSentinelData(JSON.parse(session.sentinelData)),
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
