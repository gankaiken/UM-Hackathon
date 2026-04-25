import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, transcripts, jdCache } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { runStrategist } from '@/lib/agents/strategist';
import { runInquisitorStream } from '@/lib/agents/inquisitor';
import type { SentinelData, TranscriptEntry } from '@/lib/types';
import { normalizeSentinelData } from '@/lib/sentinel';

export const maxDuration = 60; // Allow enough time for LLM generation

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, message, sentinelData } = body;

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const jd = await db.select().from(jdCache).where(eq(jdCache.id, session.jdId)).get();
    if (!jd) {
      return NextResponse.json({ error: 'JD not found' }, { status: 404 });
    }

    const turnNumber = session.turnCount + 1;
    const now = Date.now();
    const mergedSentinelData = mergeSentinelData(
      session.sentinelData ? JSON.parse(session.sentinelData) : {},
      sentinelData || {}
    );

    // 1. Save candidate message
    await db.insert(transcripts).values({
      sessionId,
      turnNumber,
      role: 'candidate',
      content: message,
      sentinelSnapshot: JSON.stringify(mergedSentinelData),
      createdAt: now,
    });

    // 2. Fetch history
    const dbTranscripts = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.sessionId, sessionId))
      .orderBy(asc(transcripts.turnNumber))
      .all();

    const transcriptEntries: TranscriptEntry[] = dbTranscripts.map(t => ({
      role: t.role as 'inquisitor' | 'candidate',
      content: t.content,
      turnNumber: t.turnNumber,
      strategistJson: t.strategistJson ? JSON.parse(t.strategistJson) : undefined,
      createdAt: t.createdAt,
    }));

    // 3. Strategist Agent (Determine next move)
    const mapperResult = JSON.parse(jd.mapperOutput);
    const coverageMap = JSON.parse(session.coverageMap);
    const turnsSinceRealityCheck = computeTurnsSinceLastRealityCheck(transcriptEntries);
    
    const strategistResult = await runStrategist(
      transcriptEntries,
      mapperResult,
      coverageMap,
      mergedSentinelData,
      turnNumber,
      turnsSinceRealityCheck
    );

    // Update Session
    await db.update(sessions).set({
      turnCount: turnNumber,
      coverageMap: JSON.stringify(strategistResult.coverage_map),
      sentinelData: JSON.stringify(mergedSentinelData),
    }).where(eq(sessions.id, sessionId));

    // 4. Inquisitor Agent (Generate response stream)
    const stream = await runInquisitorStream(
      strategistResult,
      session.candidateName,
      message
    );

    // 5. SSE Encoding & Save AI Message
    const encoder = new TextEncoder();
    let aiFullResponse = '';

    const transformStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // End of stream, save AI message to DB
              await db.insert(transcripts).values({
                sessionId,
                turnNumber,
                role: 'inquisitor',
                content: aiFullResponse,
                strategistJson: JSON.stringify(strategistResult),
                createdAt: Date.now(),
              });
              
              const closing = strategistResult.next_action === 'close_session';
              const payload = JSON.stringify({ 
                closing, 
                turnCount: turnNumber,
                coverageMap: strategistResult.coverage_map,
                reasoning: strategistResult.reasoning
              });
              controller.enqueue(encoder.encode(`event: done\ndata: ${payload}\n\n`));
              controller.close();
              break;
            }
            if (value) {
              aiFullResponse += value;
              const chunkPayload = JSON.stringify({ text: value });
              controller.enqueue(encoder.encode(`event: chunk\ndata: ${chunkPayload}\n\n`));
            }
          }
        } catch (error) {
          console.error('[Inquisitor Stream Error]', error);
          controller.error(error);
        }
      }
    });

    return new NextResponse(transformStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[Chat API Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function computeTurnsSinceLastRealityCheck(transcript: TranscriptEntry[]) {
  const candidateTurns = transcript.filter(entry => entry.role === 'candidate').length;
  const strategistTurns = transcript
    .filter(entry => entry.role === 'inquisitor' && entry.strategistJson)
    .map(entry => entry.strategistJson!);

  for (let index = strategistTurns.length - 1; index >= 0; index -= 1) {
    if (strategistTurns[index].next_action === 'reality_check') {
      const candidateTurnsAtRealityCheck = strategistTurns[index].turn_number;
      return Math.max(0, candidateTurns - candidateTurnsAtRealityCheck);
    }
  }

  return candidateTurns;
}

function mergeSentinelData(
  existing: Partial<SentinelData>,
  incoming: Partial<SentinelData>
): SentinelData {
  const merged: SentinelData = {
    focus_loss_events: Math.max(incoming.focus_loss_events ?? 0, existing.focus_loss_events ?? 0),
    total_away_duration_seconds: Math.max(
      incoming.total_away_duration_seconds ?? 0,
      existing.total_away_duration_seconds ?? 0
    ),
    paste_events: Math.max(incoming.paste_events ?? 0, existing.paste_events ?? 0),
    tab_switches: Math.max(incoming.tab_switches ?? 0, existing.tab_switches ?? 0),
    current_question_focus_loss_seconds:
      incoming.current_question_focus_loss_seconds ?? existing.current_question_focus_loss_seconds ?? 0,
    current_question_tab_switches:
      incoming.current_question_tab_switches ?? existing.current_question_tab_switches ?? 0,
    integrity_stage: existing.integrity_stage === 'stage_2_alert'
      ? 'stage_2_alert'
      : incoming.integrity_stage ?? existing.integrity_stage ?? 'clean',
    answer_timings_ms: incoming.answer_timings_ms ?? existing.answer_timings_ms ?? [],
    last_answer_elapsed_ms: incoming.last_answer_elapsed_ms ?? existing.last_answer_elapsed_ms ?? 0,
    timing_anomaly_count: incoming.timing_anomaly_count ?? existing.timing_anomaly_count ?? 0,
    last_answer_timing_anomaly: incoming.last_answer_timing_anomaly ?? existing.last_answer_timing_anomaly ?? false,
    ai_paste_detected: incoming.ai_paste_detected ?? existing.ai_paste_detected ?? false,
    ai_paste_char_count: Math.max(incoming.ai_paste_char_count ?? 0, existing.ai_paste_char_count ?? 0),
  };

  return normalizeSentinelData(merged);
}
