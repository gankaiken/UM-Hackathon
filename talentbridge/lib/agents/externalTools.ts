// lib/agents/externalTools.ts
// Real API integrations with Trace Mode fallback.

import { google } from 'googleapis';
import { getAuthorizedGoogleClient } from '../auth';
import { db } from '../db';
import { agentLogs } from '../db/schema';
import { env } from '../env';

export interface OrchestrationResult {
  success: boolean;
  mode: 'live' | 'trace';
  message: string;
  data?: unknown;
}

interface ZoomMeetingPayload {
  id?: string | number;
  join_url?: string;
  start_url?: string;
  topic?: string;
  start_time?: string;
  duration?: number;
}

/**
 * Gmail: Send an email.
 */
export async function sendEmail(
  employerId: string,
  to: string, 
  subject: string, 
  body: string
): Promise<OrchestrationResult> {
  const auth = await getAuthorizedGoogleClient(employerId);
  
  if (!auth) {
    return {
      success: true,
      mode: 'trace',
      message: `[TRACE] Gmail would send to ${to}: "${subject}"`,
      data: { to, subject, body_preview: body.slice(0, 100) + '...' }
    };
  }

  try {
    const gmail = google.gmail({ version: 'v1', auth });
    
    // Create RFC 2822 message
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: TalentBridge AI <me>`,
      `To: ${to}`,
      `Content-Type: text/plain; charset=utf-8`,
      `MIME-Version: 1.0`,
      `Subject: ${utf8Subject}`,
      '',
      body,
    ];
    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });

    return {
      success: true,
      mode: 'live',
      message: `Email sent to ${to}`,
    };
  } catch (err) {
    console.error('[Gmail] Send error:', err);
    return {
      success: false,
      mode: 'live',
      message: `Gmail Error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Google Calendar: Create an event.
 */
export async function createCalendarEvent(
  employerId: string,
  candidateEmail: string, 
  startTime: string, 
  durationMinutes: number,
  meetingLink?: string
): Promise<OrchestrationResult> {
  const auth = await getAuthorizedGoogleClient(employerId);

  if (!auth) {
    return {
      success: true,
      mode: 'trace',
      message: `[TRACE] Calendar would create event with ${candidateEmail} at ${startTime}`,
      data: { candidateEmail, startTime, durationMinutes }
    };
  }

  try {
    const calendar = google.calendar({ version: 'v3', auth });
    const end = new Date(new Date(startTime).getTime() + durationMinutes * 60000).toISOString();

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `Interview: ${candidateEmail}`,
        description: `TalentBridge AI Interview Session. ${meetingLink ? `\nMeeting Link: ${meetingLink}` : ''}`,
        start: { dateTime: startTime },
        end: { dateTime: end },
        attendees: [{ email: candidateEmail }],
        reminders: { useDefault: true },
      },
    });

    return {
      success: true,
      mode: 'live',
      message: `Calendar event created: ${event.data.htmlLink}`,
      data: { eventId: event.data.id }
    };
  } catch (err) {
    console.error('[Calendar] Insert error:', err);
    return {
      success: false,
      mode: 'live',
      message: `Calendar Error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Zoom: Create a real meeting via Server-to-Server OAuth when configured.
 */
export async function createZoomMeeting(
  employerId: string,
  topic: string,
  startTime: string,
  sessionId?: string
): Promise<OrchestrationResult> {
  const traceFallback = async (message: string, details?: Record<string, unknown>) => {
    await logZoomStep(sessionId, false, { employerId, topic, startTime }, { mode: 'trace', message, ...details });
    return {
      success: false,
      mode: 'trace' as const,
      message,
      data: details,
    };
  };

  if (!env.ZOOM_ACCOUNT_ID || !env.ZOOM_CLIENT_ID || !env.ZOOM_CLIENT_SECRET) {
    return traceFallback(`[TRACE] Zoom meeting creation unavailable: missing Zoom environment configuration`, {
      reason: 'missing_zoom_env',
    });
  }

  try {
    const tokenResult = await requestZoomAccessToken();
    if (!tokenResult.success) {
      return traceFallback(`[TRACE] Zoom meeting creation unavailable: ${tokenResult.message}`, {
        reason: 'zoom_token_failed',
      });
    }

    const meetingResult = await createZoomMeetingWithToken(tokenResult.accessToken, topic, startTime);
    if (!meetingResult.success) {
      return traceFallback(`[TRACE] Zoom meeting creation unavailable: ${meetingResult.message}`, {
        reason: 'zoom_meeting_failed',
      });
    }

    const meeting = meetingResult.meeting;
    const data = {
      meeting_id: meeting.id,
      join_url: meeting.join_url,
      start_url: meeting.start_url,
      topic: meeting.topic,
      start_time: meeting.start_time,
      duration: meeting.duration,
    };

    await logZoomStep(sessionId, true, { employerId, topic, startTime }, data);
    return {
      success: true,
      mode: 'live',
      message: `Zoom meeting created: ${meeting.join_url || meeting.id}`,
      data,
    };
  } catch (error) {
    return traceFallback(`[TRACE] Zoom meeting creation unavailable: ${error instanceof Error ? error.message : String(error)}`, {
      reason: 'zoom_unexpected_error',
    });
  }
}

export async function requestZoomAccessToken() {
  if (!env.ZOOM_ACCOUNT_ID || !env.ZOOM_CLIENT_ID || !env.ZOOM_CLIENT_SECRET) {
    return { success: false as const, message: 'missing Zoom credentials' };
  }

  const basicAuth = Buffer.from(`${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(env.ZOOM_ACCOUNT_ID)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    }
  );

  const rawText = await response.text();
  if (!response.ok) {
    return {
      success: false as const,
      message: `token request failed with status ${response.status}: ${sanitizeZoomError(rawText)}`,
    };
  }

  const payload = safeJsonParse(rawText) as { access_token?: string } | null;
  if (!payload?.access_token) {
    return {
      success: false as const,
      message: 'token response did not include an access token',
    };
  }

  return {
    success: true as const,
    accessToken: payload.access_token,
  };
}

export async function createZoomMeetingWithToken(accessToken: string, topic: string, startTime: string) {
  const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      topic,
      type: 2,
      start_time: startTime,
      duration: 60,
      timezone: 'Asia/Kuala_Lumpur',
      settings: {
        waiting_room: true,
        join_before_host: false,
      },
    }),
  });

  const rawText = await response.text();
  if (!response.ok) {
    return {
      success: false as const,
      message: `meeting creation failed with status ${response.status}: ${sanitizeZoomError(rawText)}`,
    };
  }

  const payload = safeJsonParse(rawText) as ZoomMeetingPayload | null;
  return {
    success: true as const,
    meeting: payload ?? {},
  };
}

export async function deleteZoomMeetingWithToken(accessToken: string, meetingId: string | number) {
  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 204) {
    return { success: true as const };
  }

  const rawText = await response.text();
  return {
    success: false as const,
    message: `meeting delete failed with status ${response.status}: ${sanitizeZoomError(rawText)}`,
  };
}

async function logZoomStep(
  sessionId: string | undefined,
  success: boolean,
  inputSummary: Record<string, unknown>,
  outputSummary: Record<string, unknown>
) {
  if (!sessionId) return;

  try {
    await db.insert(agentLogs).values({
      sessionId,
      agentName: 'Zoom Integration',
      status: success ? 'success' : 'error',
      latency: 0,
      inputSummary: JSON.stringify(inputSummary),
      outputSummary: JSON.stringify(outputSummary),
      errorMessage: success ? null : String(outputSummary.message || outputSummary.reason || 'Zoom integration failed'),
      createdAt: Date.now(),
    }).run();
  } catch (error) {
    console.error('[Zoom] Failed to save agent log:', error);
  }
}

function sanitizeZoomError(rawText: string) {
  const parsed = safeJsonParse(rawText) as { reason?: string; message?: string; error?: string } | null;
  return parsed?.reason || parsed?.message || parsed?.error || rawText || 'unknown error';
}

function safeJsonParse(rawText: string) {
  try {
    return JSON.parse(rawText);
  } catch {
    return null;
  }
}
