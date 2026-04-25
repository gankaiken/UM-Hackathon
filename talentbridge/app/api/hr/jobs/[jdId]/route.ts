import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jdCache, sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireHrUser } from '@/lib/hrAuth';
import { runMapper } from '@/lib/agents/mapper';
import { runDimensionQA } from '@/lib/agents/dimensionQA';
import { getRequestIp, logAuditEvent } from '@/lib/security';

export async function GET(req: NextRequest, { params }: { params: { jdId: string } }) {
  try {
    const user = requireHrUser(req);
    if (user instanceof NextResponse) return user;

    const jd = await db.select().from(jdCache).where(eq(jdCache.id, params.jdId)).get();
    if (!jd) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (jd.employerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const applicants = await db.select().from(sessions).where(eq(sessions.jdId, params.jdId)).all();

    return NextResponse.json({
      id: jd.id,
      rawJd: jd.rawJd,
      roleTitle: jd.roleTitle,
      customDimensions: jd.customDimensions ? JSON.parse(jd.customDimensions) : [],
      quizQuestions: jd.quizQuestions ? JSON.parse(jd.quizQuestions) : [],
      applicantCount: applicants.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { jdId: string } }) {
  try {
    const user = requireHrUser(req);
    if (user instanceof NextResponse) return user;

    const { jdText, customDimensions, quizQuestions } = await req.json();

    const jd = await db.select().from(jdCache).where(eq(jdCache.id, params.jdId)).get();
    if (!jd) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (jd.employerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if re-run needed (only if jdText or customDimensions change)
    let finalMapperOutput = jd.mapperOutput;
    let finalQaOutput = jd.qaOutput;
    let finalQaStatus = jd.qaStatus;
    let finalRoleTitle = jd.roleTitle;

    const oldDimensionsStr = jd.customDimensions ? JSON.parse(jd.customDimensions).join('\n') : '';
    const newDimensionsStr = (customDimensions || []).join('\n');

    if (jd.rawJd !== jdText || oldDimensionsStr !== newDimensionsStr) {
      console.log(`[JD Edit] Re-running Mapper for jdId: ${params.jdId}`);
      let fullText = jdText.trim();
      if (customDimensions && customDimensions.length > 0) {
         fullText += '\n\nHR Custom Dimensions:\n' + customDimensions.join('\n');
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
      finalRoleTitle = finalMapper.role_title;
    }

    await db.update(jdCache).set({
      rawJd: jdText.trim(),
      roleTitle: finalRoleTitle,
      mapperOutput: finalMapperOutput,
      qaStatus: finalQaStatus,
      qaOutput: finalQaOutput,
      customDimensions: JSON.stringify(customDimensions || []),
      quizQuestions: JSON.stringify(quizQuestions || []),
    }).where(eq(jdCache.id, params.jdId)).run();

    await logAuditEvent({
      actorType: 'hr',
      actorId: user.id,
      action: 'jd.edit',
      status: 'success',
      ipAddress: getRequestIp(req),
      targetType: 'jd',
      targetId: params.jdId,
      details: { roleTitle: finalRoleTitle },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
