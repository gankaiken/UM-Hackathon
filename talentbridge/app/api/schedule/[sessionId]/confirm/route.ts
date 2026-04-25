// app/api/schedule/[sessionId]/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, jdCache } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createCalendarEvent, createZoomMeeting } from '@/lib/agents/externalTools';
import { logIntegrationEmailStep, OrchestrationState } from '@/lib/agents/integrationCoordinator';
import { sendEmail } from '@/lib/email';
import { getRequestIp, logAuditEvent } from '@/lib/security';
import { requireCsrf } from '@/lib/csrf';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const csrfError = requireCsrf(req);
    if (csrfError) return csrfError;
    const { slot } = await req.json();

    const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.hrResponse !== 'offer') {
      return NextResponse.json({ error: 'This session is not eligible for scheduling' }, { status: 403 });
    }
    if (session.scheduledSlot) return NextResponse.json({ error: 'Already scheduled' }, { status: 400 });

    const jd = db.select().from(jdCache).where(eq(jdCache.id, session.jdId)).get();
    if (!jd || jd.employerId !== session.employerId) {
      return NextResponse.json({ error: 'Scheduling record is invalid' }, { status: 403 });
    }
    const employerId = jd?.employerId || 'default';
    const allowedSlots = jd?.timeslots ? safeParseSlots(jd.timeslots) : getDefaultSlots();
    const selectedSlot = normalizeRequestedSlot(slot);
    if (!selectedSlot) {
      return NextResponse.json({ error: 'Invalid slot payload' }, { status: 400 });
    }

    const matchedSlot = allowedSlots.find(candidate =>
      candidate.available !== false &&
      candidate.start === selectedSlot.start &&
      candidate.end === selectedSlot.end
    );
    if (!matchedSlot) {
      return NextResponse.json({ error: 'Selected slot is no longer available' }, { status: 400 });
    }

    const existingBookings = db
      .select({ id: sessions.id, scheduledSlot: sessions.scheduledSlot })
      .from(sessions)
      .where(eq(sessions.jdId, session.jdId))
      .all();
    const alreadyBooked = existingBookings.some(booking => {
      if (booking.id === sessionId || !booking.scheduledSlot) return false;
      try {
        const bookedSlot = JSON.parse(booking.scheduledSlot) as { start?: unknown };
        return bookedSlot.start === matchedSlot.start;
      } catch {
        return false;
      }
    });
    if (alreadyBooked) {
      return NextResponse.json({ error: 'Selected slot has already been booked' }, { status: 409 });
    }

    // 1. Update Session State
    await db.update(sessions)
      .set({ scheduledSlot: JSON.stringify(matchedSlot) })
      .where(eq(sessions.id, sessionId))
      .run();

    const state: OrchestrationState = session.orchestrationState ? JSON.parse(session.orchestrationState) : {
      mode: 'trace',
      status: 'invited',
      steps: [],
      updatedAt: Date.now(),
    };

    // 2. Create Zoom Meeting (Trace in demo)
    const zoomResult = await createZoomMeeting(employerId, `Interview: ${session.candidateName}`, matchedSlot.start, sessionId);
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
      matchedSlot.start,
      60,
      getJoinUrl(zoomResult.data)
    );
    state.steps.push({
      step: 'calendar_event',
      timestamp: Date.now(),
      message: calResult.message,
      success: calResult.success
    });

    // 4. Send Confirmation Email
    const zoomJoinUrl = getJoinUrl(zoomResult.data);
    const meetingDetails = zoomJoinUrl
      ? `Join Zoom meeting: ${zoomJoinUrl}`
      : 'Meeting link will be shared by the hiring team.';
    const formattedStart = new Date(matchedSlot.start).toLocaleString('en-MY');
    const subject = `Confirmed: Interview for ${jd?.roleTitle}`;
    const text = `Hi ${session.candidateName},\n\n` +
      `Your interview for ${jd?.roleTitle} has been confirmed for ${new Date(matchedSlot.start).toLocaleString('en-MY')}.\n\n` +
      `${meetingDetails}\n\n` +
      `If calendar integration is connected, a calendar invite may also be sent.`;
    const html = `
      <p>Hi ${escapeHtml(session.candidateName)},</p>
      <p>Your interview for ${escapeHtml(jd?.roleTitle || 'Role')} has been confirmed for <strong>${escapeHtml(formattedStart)}</strong>.</p>
      <p>${escapeHtml(meetingDetails)}</p>
      <p>If calendar integration is connected, a calendar invite may also be sent.</p>
    `;

    const recipient = session.candidateEmail || 'candidate@example.com';
    const emailResult = await sendEmail({ to: recipient, subject, html, text });
    await logIntegrationEmailStep(sessionId, 'confirmation_email', emailResult, recipient, subject);
    state.mode = emailResult.mode;
    state.steps.push({
      step: 'confirmation_email',
      timestamp: Date.now(),
      message: emailResult.message,
      success: emailResult.success
    });

    state.status = 'scheduled';
    if (!emailResult.success) {
      state.lastError = emailResult.message;
    }
    state.updatedAt = Date.now();
    
    await db.update(sessions)
      .set({
        orchestrationState: JSON.stringify(state),
        interviewScheduledAt: Date.now(),
        interviewMeetingLink: zoomJoinUrl || session.interviewMeetingLink || '',
        interviewScheduleNote: zoomResult.mode === 'trace'
          ? zoomResult.message
          : session.interviewScheduleNote || '',
      })
      .where(eq(sessions.id, sessionId))
      .run();

    await logAuditEvent({
      actorType: 'candidate',
      actorId: sessionId,
      action: 'schedule.confirm',
      status: 'success',
      ipAddress: getRequestIp(req),
      targetType: 'session',
      targetId: sessionId,
      details: { slotStart: matchedSlot.start },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[ScheduleConfirm] Error:', err);
    await logAuditEvent({ actorType: 'candidate', action: 'schedule.confirm', status: 'failure', ipAddress: getRequestIp(req), targetType: 'session', targetId: (await params).sessionId });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface ScheduleSlot {
  start: string;
  end: string;
  available?: boolean;
}

function normalizeRequestedSlot(value: unknown): ScheduleSlot | null {
  if (!value || typeof value !== 'object') return null;
  const slot = value as { start?: unknown; end?: unknown; available?: unknown };
  if (typeof slot.start !== 'string' || typeof slot.end !== 'string') return null;

  const start = new Date(slot.start);
  const end = new Date(slot.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (end.getTime() <= start.getTime()) return null;
  if (start.getTime() < Date.now() - 60_000) return null;
  if (end.getTime() - start.getTime() > 4 * 60 * 60 * 1000) return null;

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    available: slot.available === false ? false : true,
  };
}

function safeParseSlots(value: string): ScheduleSlot[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeRequestedSlot)
      .filter((slot): slot is ScheduleSlot => Boolean(slot));
  } catch {
    return [];
  }
}

function getDefaultSlots(): ScheduleSlot[] {
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getJoinUrl(data: unknown) {
  if (data && typeof data === 'object' && 'join_url' in data && typeof data.join_url === 'string') {
    return data.join_url;
  }

  return undefined;
}
