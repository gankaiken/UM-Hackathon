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
    if (!jd || jd.employerId !== session.employerId) {
      return NextResponse.json({ error: 'Scheduling record is invalid' }, { status: 403 });
    }
    
    const slots = jd?.timeslots ? JSON.parse(jd.timeslots) : getDefaultSlots();

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

function getDefaultSlots() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return [1, 2, 3].map((dayOffset, index) => {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() + dayOffset);
    start.setHours(10 + index, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    return { start: start.toISOString(), end: end.toISOString(), available: true };
  });
}
