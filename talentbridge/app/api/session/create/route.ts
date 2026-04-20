// app/api/session/create/route.ts
// Creates a new interview session linked to a JD.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, jdCache } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { CoverageMap, SentinelData } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { jdId, candidateName } = await req.json();

    if (!jdId || !candidateName) {
      return NextResponse.json({ error: 'jdId and candidateName are required' }, { status: 400 });
    }

    // Check JD exists
    const jd = await db.select().from(jdCache).where(eq(jdCache.id, jdId)).get();
    if (!jd) {
      return NextResponse.json({ error: 'JD not found' }, { status: 404 });
    }

    const mapper = JSON.parse(jd.mapperOutput);
    // Initialize coverage map with all dimensions as UNEXPLORED
    const initialCoverageMap: CoverageMap = {};
    for (const dim of mapper.core_dimensions) {
      initialCoverageMap[dim] = 'UNEXPLORED';
    }

    const initialSentinel: SentinelData = {
      focus_loss_events: 0,
      total_away_duration_seconds: 0,
      paste_events: 0,
      tab_switches: 0,
    };

    const sessionId = uuid();
    const now = Date.now();

    await db.insert(sessions).values({
      id: sessionId,
      jdId,
      candidateName: candidateName.trim(),
      status: 'active',
      turnCount: 0,
      coverageMap: JSON.stringify(initialCoverageMap),
      sentinelData: JSON.stringify(initialSentinel),
      createdAt: now,
    });

    return NextResponse.json({
      sessionId,
      jdId,
      candidateName,
      roleTitle: jd.roleTitle,
    });
  } catch (error) {
    console.error('[Session Create] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
