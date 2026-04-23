// app/api/schedule/[sessionId]/slots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, jdCache } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.hrResponse !== 'offer') {
      return NextResponse.json({ error: 'This session is not eligible for scheduling' }, { status: 403 });
    }

    const jd = db.select().from(jdCache).where(eq(jdCache.id, session.jdId)).get();
    
    // Default slots for demo if none stored in JD
    const defaultSlots = [
      { start: new Date(Date.now() + 86400000 + 3600000).toISOString(), end: new Date(Date.now() + 86400000 + 7200000).toISOString(), available: true },
      { start: new Date(Date.now() + 172800000 + 3600000).toISOString(), end: new Date(Date.now() + 172800000 + 7200000).toISOString(), available: true },
      { start: new Date(Date.now() + 259200000 + 3600000).toISOString(), end: new Date(Date.now() + 259200000 + 7200000).toISOString(), available: true },
    ];

    const slots = jd?.timeslots ? JSON.parse(jd.timeslots) : defaultSlots;

    return NextResponse.json({
      session: {
        candidateName: session.candidateName,
        candidateEmail: session.candidateEmail,
        scheduledSlot: session.scheduledSlot,
      },
      jd: {
        roleTitle: jd?.roleTitle,
        employerId: jd?.employerId,
      },
      slots,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
