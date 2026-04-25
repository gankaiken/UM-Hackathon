import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { runOrchestration } from '@/lib/agents/integrationCoordinator';
import { assertHrOwnsSession, requireHrUser } from '@/lib/hrAuth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const user = requireHrUser(req);
    if (user instanceof NextResponse) return user;

    const ownership = await assertHrOwnsSession(user, sessionId);
    if (!ownership.ok) return ownership.response;
    const session = ownership.session;

    const state = session.orchestrationState ? JSON.parse(session.orchestrationState) : null;
    return NextResponse.json({ state });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch state' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const user = requireHrUser(req);
    if (user instanceof NextResponse) return user;

    const ownership = await assertHrOwnsSession(user, sessionId);
    if (!ownership.ok) return ownership.response;
    const session = ownership.session;

    if (session.hrResponse !== 'offer') {
      return NextResponse.json(
        { error: 'Orchestration only available after HR Proceed.' },
        { status: 409 }
      );
    }

    const verdict = session.verdict ? JSON.parse(session.verdict) : null;
    if (!verdict) return NextResponse.json({ error: 'No verdict found' }, { status: 400 });

    // Kick off orchestration in the background (or await if simple trace)
    // For demo stability, we'll await the trace mode result
    await runOrchestration(sessionId, verdict);

    const updatedSession = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    return NextResponse.json({
      success: true,
      state: updatedSession?.orchestrationState ? JSON.parse(updatedSession.orchestrationState) : null
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
