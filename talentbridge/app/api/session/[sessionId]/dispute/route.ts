import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { reason } = await req.json();

    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a short explanation for the dispute.' },
        { status: 400 }
      );
    }

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const now = Date.now();
    await db.update(sessions)
      .set({
        disputeRequestedAt: now,
        disputeReason: reason.trim(),
        disputeStatus: 'requested',
      })
      .where(eq(sessions.id, sessionId))
      .run();

    return NextResponse.json({
      success: true,
      disputeRequestedAt: now,
      disputeStatus: 'requested',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
