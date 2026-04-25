// app/api/jd/upload/route.ts
// Handles JD upload: Mapper -> DimensionQA -> cache in SQLite -> return interview link

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jdCache } from '@/lib/db/schema';
import { runMapper } from '@/lib/agents/mapper';
import { runDimensionQA } from '@/lib/agents/dimensionQA';
import { v4 as uuid } from 'uuid';
import type { JdUploadResponse, MapperResult } from '@/lib/types';
import { requireHrUser } from '@/lib/hrAuth';
import { getRequestIp, logAuditEvent } from '@/lib/security';
import { requireCsrf } from '@/lib/csrf';
import { buildStructuredJobText, parseTimeslotsInput, serializeTimeslots } from '@/lib/jdFields';
import { buildSafetyErrorMessage, validateHrInputs } from '@/lib/hrSafety';

export async function POST(req: NextRequest) {
  try {
    const user = requireHrUser(req);
    if (user instanceof NextResponse) return user;
    const csrfError = requireCsrf(req);
    if (csrfError) return csrfError;

    const {
      title = '',
      description = '',
      requirements = '',
      jdText,
      customDimensions,
      quizQuestions,
      timeslots,
    } = await req.json();

    const resolvedTitle = typeof title === 'string' ? title.trim() : '';
    const resolvedDescription = typeof description === 'string' && description.trim() ? description.trim() : jdText;
    const resolvedRequirements = typeof requirements === 'string' ? requirements.trim() : '';

    if (!resolvedDescription || typeof resolvedDescription !== 'string' || resolvedDescription.trim().length < 10) {
      return NextResponse.json({ error: 'Job description is required (min 10 chars)' }, { status: 400 });
    }

    const safety = validateHrInputs({ customDimensions, quizQuestions });
    if (safety.blocked.length > 0) {
      return NextResponse.json({ error: buildSafetyErrorMessage(safety.blocked), blocked: safety.blocked }, { status: 400 });
    }

    const structuredJd = buildStructuredJobText({
      title: resolvedTitle || 'Untitled Role',
      description: resolvedDescription,
      requirements: resolvedRequirements,
    });
    const safeTimeslots = parseTimeslotsInput(timeslots);

    const jdId = uuid();
    const now = Date.now();

    const mapperInput = safety.customDimensions.length > 0
      ? `${structuredJd}\n\nHR Custom Dimensions:\n${safety.customDimensions.join('\n')}`
      : structuredJd;

    console.log(`[JD Upload] Running Mapper for jdId: ${jdId}`);
    const mapperResult = await runMapper(mapperInput);

    let qaResult = await runDimensionQA(mapperResult, mapperInput, false);
    let finalMapper: MapperResult = mapperResult;

    if (qaResult.status === 'REVISE') {
      console.log('[JD Upload] QA REVISE -> retrying Mapper');
      finalMapper = await runMapper(mapperInput + '\n\nQA Feedback:\n' + (qaResult.qa_feedback ?? []).join('\n'));
      qaResult = await runDimensionQA(finalMapper, mapperInput, true);
    }

    const interviewLink = `/hr/interview-link/${jdId}`;

    await db.insert(jdCache).values({
      id: jdId,
      employerId: user.id,
      rawJd: structuredJd,
      roleTitle: resolvedTitle || finalMapper.role_title,
      mapperOutput: JSON.stringify(finalMapper),
      qaStatus: qaResult.status,
      qaOutput: JSON.stringify(qaResult),
      interviewLink,
      customDimensions: JSON.stringify(safety.customDimensions),
      quizQuestions: JSON.stringify(safety.quizQuestions),
      timeslots: safeTimeslots.length > 0 ? serializeTimeslots(safeTimeslots) : null,
      createdAt: now,
    }).run();

    const response: JdUploadResponse & { warnings?: string[] } = {
      jdId,
      roleTitle: resolvedTitle || finalMapper.role_title,
      mapperResult: finalMapper,
      qaStatus: qaResult.status,
      interviewLink,
      warnings: safety.warnings,
    };

    await logAuditEvent({
      actorType: 'hr',
      actorId: user.id,
      action: 'jd.upload',
      status: 'success',
      ipAddress: getRequestIp(req),
      targetType: 'jd',
      targetId: jdId,
      details: { roleTitle: resolvedTitle || finalMapper.role_title, warnings: safety.warnings },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[JD Upload] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
