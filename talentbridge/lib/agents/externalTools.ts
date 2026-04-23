// lib/agents/externalTools.ts
// Real API integrations with Trace Mode fallback.

import { google } from 'googleapis';
import { getAuthorizedGoogleClient } from '../auth';

export interface OrchestrationResult {
  success: boolean;
  mode: 'live' | 'trace';
  message: string;
  data?: unknown;
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
 * Zoom: Create a meeting (Scaffolded).
 */
export async function createZoomMeeting(employerId: string, topic: string, startTime: string): Promise<OrchestrationResult> {
  // Real Zoom integration requires Server-to-Server OAuth which is separate from Google.
  // We keep it scaffolded as trace for now per constraints.
  return {
    success: true,
    mode: 'trace',
    message: `[TRACE] Zoom would create meeting: "${topic}" at ${startTime}`,
  };
}
