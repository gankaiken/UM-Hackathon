// app/api/session/create/route.ts
// Creates a new interview session linked to a JD.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, jdCache } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { CoverageMap } from '@/lib/types';
import { DEFAULT_SENTINEL_DATA } from '@/lib/sentinel';

export async function POST(req: NextRequest) {
  try {
    const {
      jdId,
      candidateName,
      // Extended profile fields from step 2 of apply form
      candidateEmail = '',
      candidatePhone = '',
      candidateLinkedin = '',
      candidatePortfolio = '',
      candidateBio = '',
      resumeFileName = '',
    } = await req.json();

    if (!jdId || !candidateName) {
      return NextResponse.json({ error: 'jdId and candidateName are required' }, { status: 400 });
    }

    // Check JD exists and is not already filled
    const jd = await db.select().from(jdCache).where(eq(jdCache.id, jdId)).get();
    if (!jd) {
      return NextResponse.json({ error: 'JD not found' }, { status: 404 });
    }
    if (jd.roleFilled) {
      return NextResponse.json({ error: 'This role has already been filled. Thank you for your interest!' }, { status: 409 });
    }

    const mapper = JSON.parse(jd.mapperOutput);
    // Initialize coverage map with all dimensions as UNEXPLORED
    const initialCoverageMap: CoverageMap = {};
    for (const dim of mapper.core_dimensions) {
      initialCoverageMap[dim] = 'UNEXPLORED';
    }

    const sessionId = uuid();
    const now = Date.now();

    await db.insert(sessions).values({
      id: sessionId,
      jdId,
      candidateName: candidateName.trim(),
      candidateEmail: candidateEmail.trim(),
      candidatePhone: candidatePhone.trim(),
      candidateLinkedin: candidateLinkedin.trim(),
      candidatePortfolio: candidatePortfolio.trim(),
      candidateBio: candidateBio.trim(),
      resumeFileName: resumeFileName.trim(),
      status: 'active',
      turnCount: 0,
      coverageMap: JSON.stringify(initialCoverageMap),
      sentinelData: JSON.stringify(DEFAULT_SENTINEL_DATA),
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
