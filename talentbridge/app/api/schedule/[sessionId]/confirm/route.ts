// app/api/schedule/[sessionId]/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, jdCache } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createCalendarEvent, createZoomMeeting, sendEmail } from '@/lib/agents/externalTools';
import { OrchestrationState } from '@/lib/agents/integrationCoordinator';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { slot } = await req.json();

    const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.scheduledSlot) return NextResponse.json({ error: 'Already scheduled' }, { status: 400 });

    const jd = db.select().from(jdCache).where(eq(jdCache.id, session.jdId)).get();
    const employerId = jd?.employerId || 'default';

    // 1. Update Session State
    await db.update(sessions)
      .set({ scheduledSlot: JSON.stringify(slot) })
      .where(eq(sessions.id, sessionId))
      .run();

    const state: OrchestrationState = session.orchestrationState ? JSON.parse(session.orchestrationState) : {
      mode: 'trace',
      status: 'invited',
      steps: [],
      updatedAt: Date.now(),
    };

    // 2. Create Zoom Meeting (Trace in demo)
    const zoomResult = await createZoomMeeting(employerId, `Interview: ${session.candidateName}`, slot.start);
    state.steps.push({
      step: 'zoom_creation',
      timestamp: Date.now(),
      message: zoomResult.message,
      success: zoomResult.success
    });

    // 3. Create Calendar Event (Real if connected)
    const calResult = await createCalendarEvent(
      employerId,
      session.candidateEmail || 'candidate@example.com',
      slot.start,
      60,
      zoomResult.data?.join_url
    );
    state.steps.push({
      step: 'calendar_event',
      timestamp: Date.now(),
      message: calResult.message,
      success: calResult.success
    });

    // 4. Send Confirmation Email
    const body = `Hi ${session.candidateName},\n\n` +
      `Your interview for ${jd?.roleTitle} has been confirmed for ${new Date(slot.start).toLocaleString('en-MY')}.\n\n` +
      `Zoom Link: ${zoomResult.message.includes('[TRACE]') ? 'Scaffolded-Zoom-Link' : zoomResult.data?.join_url}\n\n` +
      `A calendar invite has been sent to your email.`;

    const emailResult = await sendEmail(
      employerId,
      session.candidateEmail || 'candidate@example.com',
      `Confirmed: Interview for ${jd?.roleTitle}`,
      body
    );
    state.steps.push({
      step: 'confirmation_email',
      timestamp: Date.now(),
      message: emailResult.message,
      success: emailResult.success
    });

    state.status = 'scheduled';
    state.updatedAt = Date.now();
    
    await db.update(sessions)
      .set({ orchestrationState: JSON.stringify(state) })
      .where(eq(sessions.id, sessionId))
      .run();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[ScheduleConfirm] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
