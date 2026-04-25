import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function buildPreviewSchedule(baseTime: number) {
  const scheduledAt = baseTime + 24 * 60 * 60 * 1000;
  const meetingLink = `https://zoom.us/j/${String(baseTime).slice(-9)}`;
  const note =
    'Demo scheduling preview created. External Gmail, Calendar, and Zoom APIs are not connected in this build.';

  return { scheduledAt, meetingLink, note };
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).get();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.hrResponse !== 'offer') {
      return NextResponse.json(
        { error: 'Schedule preview is only available after HR marks Proceed.' },
        { status: 409 }
      );
    }

    if (session.interviewScheduledAt && session.interviewMeetingLink) {
      return NextResponse.json({
        success: true,
        interviewScheduledAt: session.interviewScheduledAt,
        interviewMeetingLink: session.interviewMeetingLink,
        interviewScheduleNote: session.interviewScheduleNote,
      });
    }

    const preview = buildPreviewSchedule(Date.now());

    await db.update(sessions)
      .set({
        interviewScheduledAt: preview.scheduledAt,
        interviewMeetingLink: preview.meetingLink,
        interviewScheduleNote: preview.note,
      })
      .where(eq(sessions.id, sessionId))
      .run();

    return NextResponse.json({
      success: true,
      interviewScheduledAt: preview.scheduledAt,
      interviewMeetingLink: preview.meetingLink,
      interviewScheduleNote: preview.note,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
