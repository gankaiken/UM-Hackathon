import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, jdCache } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const session = await db.select().from(sessions).where(eq(sessions.id, params.sessionId)).get();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const jd = await db.select().from(jdCache).where(eq(jdCache.id, session.jdId)).get();
    if (!jd) return NextResponse.json({ error: 'JD not found' }, { status: 404 });

    return NextResponse.json({
      roleTitle: jd.roleTitle,
      employerId: jd.employerId,
      candidateName: session.candidateName,
      quizQuestions: jd.quizQuestions ? JSON.parse(jd.quizQuestions) : [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { quizAnswers, preScreeningContext } = await req.json();

    await db.update(sessions).set({
      quizAnswers: JSON.stringify(quizAnswers || []),
      preScreeningContext: JSON.stringify(preScreeningContext || {}),
    }).where(eq(sessions.id, params.sessionId)).run();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
