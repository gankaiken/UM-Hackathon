import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jdCache, sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireHrUser } from '@/lib/hrAuth';
import { runMapper } from '@/lib/agents/mapper';
import { runDimensionQA } from '@/lib/agents/dimensionQA';
import { getRequestIp, logAuditEvent } from '@/lib/security';
import { buildStructuredJobText, parseStructuredJobText, parseTimeslotsInput, serializeTimeslots } from '@/lib/jdFields';
import { buildSafetyErrorMessage, validateHrInputs } from '@/lib/hrSafety';

export async function GET(req: NextRequest, { params }: { params: Promise<{ jdId: string }> }) {
  try {
    const { jdId } = await params;
    const user = requireHrUser(req);
    if (user instanceof NextResponse) return user;

    const jd = await db.select().from(jdCache).where(eq(jdCache.id, jdId)).get();
    if (!jd) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (jd.employerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const applicants = await db.select().from(sessions).where(eq(sessions.jdId, jdId)).all();

    return NextResponse.json({
      id: jd.id,
      rawJd: jd.rawJd,
      roleTitle: jd.roleTitle,
      ...parseStructuredJobText(jd.rawJd, jd.roleTitle),
      customDimensions: jd.customDimensions ? JSON.parse(jd.customDimensions) : [],
      quizQuestions: jd.quizQuestions ? JSON.parse(jd.quizQuestions) : [],
      timeslots: jd.timeslots ? JSON.parse(jd.timeslots) : [],
      applicantCount: applicants.length,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ jdId: string }> }) {
  try {
    const { jdId } = await params;
    const user = requireHrUser(req);
    if (user instanceof NextResponse) return user;

    const {
      title = '',
      description = '',
      requirements = '',
      jdText,
      customDimensions,
      quizQuestions,
      timeslots,
    } = await req.json();

    const jd = await db.select().from(jdCache).where(eq(jdCache.id, jdId)).get();
    if (!jd) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (jd.employerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const safety = validateHrInputs({ customDimensions, quizQuestions });
    if (safety.blocked.length > 0) {
      return NextResponse.json({ error: buildSafetyErrorMessage(safety.blocked), blocked: safety.blocked }, { status: 400 });
    }

    const resolvedTitle = typeof title === 'string' ? title.trim() : '';
    const resolvedDescription = typeof description === 'string' && description.trim() ? description.trim() : jdText;
    const resolvedRequirements = typeof requirements === 'string' ? requirements.trim() : '';
    const structuredJd = buildStructuredJobText({
      title: resolvedTitle || jd.roleTitle || 'Untitled Role',
      description: resolvedDescription || '',
      requirements: resolvedRequirements,
    });
    const safeTimeslots = parseTimeslotsInput(timeslots);

    let finalMapperOutput = jd.mapperOutput;
    let finalQaOutput = jd.qaOutput;
    let finalQaStatus = jd.qaStatus;
    let finalRoleTitle = resolvedTitle || jd.roleTitle;

    const oldDimensionsStr = jd.customDimensions ? JSON.parse(jd.customDimensions).join('\n') : '';
    const newDimensionsStr = safety.customDimensions.join('\n');

    if (jd.rawJd !== structuredJd || oldDimensionsStr !== newDimensionsStr) {
      let fullText = structuredJd;
      if (safety.customDimensions.length > 0) {
        fullText += '\n\nHR Custom Dimensions:\n' + safety.customDimensions.join('\n');
      }

      const mapperResult = await runMapper(fullText);
      let qaResult = await runDimensionQA(mapperResult, fullText, false);
      let finalMapper = mapperResult;

      if (qaResult.status === 'REVISE') {
        finalMapper = await runMapper(fullText + '\n\nQA Feedback:\n' + (qaResult.qa_feedback ?? []).join('\n'));
        qaResult = await runDimensionQA(finalMapper, fullText, true);
      }

      finalMapperOutput = JSON.stringify(finalMapper);
      finalQaOutput = JSON.stringify(qaResult);
      finalQaStatus = qaResult.status;
      finalRoleTitle = resolvedTitle || finalMapper.role_title;
    }

    await db.update(jdCache).set({
      rawJd: structuredJd,
      roleTitle: finalRoleTitle,
      mapperOutput: finalMapperOutput,
      qaStatus: finalQaStatus,
      qaOutput: finalQaOutput,
      customDimensions: JSON.stringify(safety.customDimensions),
      quizQuestions: JSON.stringify(safety.quizQuestions),
      timeslots: safeTimeslots.length > 0 ? serializeTimeslots(safeTimeslots) : null,
    }).where(eq(jdCache.id, jdId)).run();

    await logAuditEvent({
      actorType: 'hr',
      actorId: user.id,
      action: 'jd.edit',
      status: 'success',
      ipAddress: getRequestIp(req),
      targetType: 'jd',
      targetId: jdId,
      details: { roleTitle: finalRoleTitle, warnings: safety.warnings },
    });

    return NextResponse.json({ success: true, warnings: safety.warnings });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
