import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, transcripts, jdCache } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { runStrategist } from '@/lib/agents/strategist';
import { runInquisitorStream } from '@/lib/agents/inquisitor';
import type { TranscriptEntry } from '@/lib/types';

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

    // 1. Save candidate message
    await db.insert(transcripts).values({
      sessionId,
      turnNumber,
      role: 'candidate',
      content: message,
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
    
    // Simple reality check heuristic based on Sentinel
    const turnsSinceRealityCheck = session.turnCount; // simplified for demo
    
    const strategistResult = await runStrategist(
      transcriptEntries,
      mapperResult,
      coverageMap,
      sentinelData || {},
      turnNumber,
      turnsSinceRealityCheck
    );

    // Update Session
    await db.update(sessions).set({
      turnCount: turnNumber,
      coverageMap: JSON.stringify(strategistResult.coverage_map),
      sentinelData: JSON.stringify(sentinelData || {}),
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
