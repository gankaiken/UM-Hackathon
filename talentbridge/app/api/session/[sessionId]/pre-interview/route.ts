import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, jdCache } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { parseStructuredJobText } from '@/lib/jdFields';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const jd = await db.select().from(jdCache).where(eq(jdCache.id, session.jdId)).get();
    if (!jd) return NextResponse.json({ error: 'JD not found' }, { status: 404 });

    const parsedJd = parseStructuredJobText(jd.rawJd, jd.roleTitle);

    return NextResponse.json({
      roleTitle: jd.roleTitle,
      companyName: jd.employerId === 'default' ? 'Nexus Digital Sdn Bhd' : jd.employerId,
      employerId: jd.employerId,
      candidateName: session.candidateName,
      jobDescription: parsedJd.description,
      requirements: parsedJd.requirements,
      quizQuestions: jd.quizQuestions ? JSON.parse(jd.quizQuestions) : [],
      quizAnswers: session.quizAnswers ? JSON.parse(session.quizAnswers) : [],
      preScreeningContext: session.preScreeningContext ? JSON.parse(session.preScreeningContext) : {},
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const { quizAnswers, preScreeningContext } = await req.json();

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.status !== 'active') {
      return NextResponse.json({ error: 'This session is no longer active' }, { status: 409 });
    }

    await db.update(sessions).set({
      quizAnswers: JSON.stringify(Array.isArray(quizAnswers) ? quizAnswers : []),
      preScreeningContext: JSON.stringify(preScreeningContext && typeof preScreeningContext === 'object' ? preScreeningContext : {}),
    }).where(eq(sessions.id, sessionId)).run();

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
