// app/api/jd/upload/route.ts
// Handles JD upload: Mapper → DimensionQA → cache in SQLite → return interview link

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jdCache } from '@/lib/db/schema';
import { runMapper } from '@/lib/agents/mapper';
import { runDimensionQA } from '@/lib/agents/dimensionQA';
import { v4 as uuid } from 'uuid';
import type { JdUploadResponse, MapperResult } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { jdText, employerId = 'default' } = await req.json();

    if (!jdText || typeof jdText !== 'string' || jdText.trim().length < 10) {
      return NextResponse.json({ error: 'JD text is required (min 10 chars)' }, { status: 400 });
    }

    const jdId = uuid();
    const now = Date.now();

    // Step 1: Run Mapper
    console.log(`[JD Upload] Running Mapper for jdId: ${jdId}`);
    const mapperResult = await runMapper(jdText.trim());

    // Step 2: Run Dimension QA (with retry logic if REVISE)
    let qaResult = await runDimensionQA(mapperResult, jdText, false);
    let finalMapper: MapperResult = mapperResult;

    if (qaResult.status === 'REVISE') {
      console.log(`[JD Upload] QA REVISE — retrying Mapper`);
      // In mock mode, mapper won't change; in real mode, re-run mapper with QA feedback
      finalMapper = await runMapper(jdText + '\n\nQA Feedback:\n' + (qaResult.qa_feedback ?? []).join('\n'));
      qaResult = await runDimensionQA(finalMapper, jdText, true); // isRetry=true → forces PASS_WITH_WARNING
    }

    // Step 3: Build interview link token (same as jdId for now)
    const interviewLink = `/hr/interview-link/${jdId}`;

    // Step 4: Persist to SQLite
    await db.insert(jdCache).values({
      id: jdId,
      employerId,
      rawJd: jdText.trim(),
      roleTitle: finalMapper.role_title,
      mapperOutput: JSON.stringify(finalMapper),
      qaStatus: qaResult.status,
      qaOutput: JSON.stringify(qaResult),
      interviewLink,
      createdAt: now,
    });

    console.log(`[JD Upload] Complete — role: ${finalMapper.role_title}, qaStatus: ${qaResult.status}`);

    const response: JdUploadResponse = {
      jdId,
      roleTitle: finalMapper.role_title,
      mapperResult: finalMapper,
      qaStatus: qaResult.status,
      interviewLink,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[JD Upload] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
