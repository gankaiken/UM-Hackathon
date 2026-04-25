// app/api/verdict/[sessionId]/route.ts
// POST: Trigger Auditor + Schema Validator → save Verdict to session
// GET: Retrieve verdict for a session

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, transcripts, jdCache } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { runAuditor } from '@/lib/agents/auditor';
import { validateAuditorOutput } from '@/lib/schemaValidator';
import type { TranscriptEntry, SentinelData, StyleAnalysisResult } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;

  try {
    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const jd = await db.select().from(jdCache).where(eq(jdCache.id, session.jdId)).get();
    if (!jd) return NextResponse.json({ error: 'JD not found' }, { status: 404 });

    const mapperResult = JSON.parse(jd.mapperOutput);
    const sentinelData: SentinelData = JSON.parse(session.sentinelData);
    const styleAnalysis: StyleAnalysisResult | null = session.styleAnalysis
      ? JSON.parse(session.styleAnalysis)
      : null;

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
      createdAt: t.createdAt,
    }));

    // Run Auditor with retry up to 2 times
    let verdict = null;
    let isValid = false;
    let lastErrors: string[] = [];

    for (let attempt = 0; attempt < 3; attempt++) {
      console.log(`[Verdict] Auditor attempt ${attempt + 1} for session ${sessionId}`);
      const result = await runAuditor(
        transcript,
        mapperResult,
        sentinelData,
        styleAnalysis,
        attempt > 0 ? lastErrors : undefined
      );

      const validation = validateAuditorOutput(result, mapperResult, sentinelData, styleAnalysis);

      if (validation.valid) {
        verdict = result;
        isValid = true;
        break;
      }

      lastErrors = validation.retry_feedback ?? [];
      console.log(`[Verdict] Schema validation failed (attempt ${attempt + 1}):`, lastErrors);
    }

    if (!verdict) {
      // Use last result even if invalid — don't block the candidate
      verdict = await runAuditor(transcript, mapperResult, sentinelData, styleAnalysis, lastErrors);
    }

    // Save verdict to session
    await db.update(sessions)
      .set({
        verdict: JSON.stringify(verdict),
        verdictValid: isValid,
        status: 'completed',
        completedAt: Date.now(),
      })
      .where(eq(sessions.id, sessionId))
      .run();

    return NextResponse.json({ verdict, valid: isValid });
  } catch (error) {
    console.error('[Verdict POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (!session.verdict) return NextResponse.json({ ready: false }, { status: 202 });

    return NextResponse.json({
      ready: true,
      verdict: JSON.parse(session.verdict),
      valid: session.verdictValid,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
