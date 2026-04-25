// lib/agents/integrationCoordinator.ts
// Agent 8: The Integration Coordinator — sends the scheduling email and tracks external-tool handoff state.

import { db } from '../db';
import { agentLogs, sessions, jdCache } from '../db/schema';
import { eq } from 'drizzle-orm';
import { VerdictResult } from '../types';
import { sendEmail, SendEmailResult } from '../email';

export interface OrchestrationState {
  mode: 'trace' | 'live';
  status: 'idle' | 'running' | 'invited' | 'scheduled' | 'failed';
  steps: Array<{ step: string; timestamp: number; message: string; success: boolean }>;
  lastError?: string;
  updatedAt: number;
}

/**
 * Runs the initial orchestration flow: sends a scheduling link invitation.
 */
export async function runOrchestration(sessionId: string, _verdict: VerdictResult) {
  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  if (!session) throw new Error('Session not found');

  const jd = db.select().from(jdCache).where(eq(jdCache.id, session.jdId)).get();

  const state: OrchestrationState = {
    mode: 'trace',
    status: 'running',
    steps: [],
    updatedAt: Date.now(),
  };

  await updateOrchestrationState(sessionId, state);

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const scheduleLink = `${appUrl}/schedule/${sessionId}`;

    const subject = `Next Steps: Interview Invitation for ${jd?.roleTitle || 'Role'}`;
    const text = `Hi ${session.candidateName},\n\n` +
      `Great news! We've reviewed your TalentBridge AI interview for the ${jd?.roleTitle || 'Role'} position and would like to move forward.\n\n` +
      `Please use the link below to select a time for your next-stage interview with our team:\n\n` +
      `${scheduleLink}\n\n` +
      `Looking forward to speaking with you!\n\n` +
      `Best regards,\n` +
      `Hiring Team`;
    const html = `
      <p>Hi ${escapeHtml(session.candidateName)},</p>
      <p>Great news! We've reviewed your TalentBridge AI interview for the ${escapeHtml(jd?.roleTitle || 'Role')} position and would like to move forward.</p>
      <p>Please use the link below to select a time for your next-stage interview with our team:</p>
      <p><a href="${scheduleLink}">${scheduleLink}</a></p>
      <p>Looking forward to speaking with you!</p>
      <p>Best regards,<br/>Hiring Team</p>
    `;

    // Step 1: Send Invitation Email
    const recipient = session.candidateEmail || 'candidate@example.com';
    const emailResult = await sendEmail({ to: recipient, subject, html, text });
    await logIntegrationEmailStep(sessionId, 'invitation_email', emailResult, recipient, subject);
    
    state.mode = emailResult.mode;
    state.steps.push({
      step: 'invitation_email',
      timestamp: Date.now(),
      message: emailResult.message,
      success: emailResult.success
    });
    
    state.status = emailResult.success ? 'invited' : 'failed';
    if (!emailResult.success) {
      state.lastError = emailResult.message;
    }
    await updateOrchestrationState(sessionId, state);

  } catch (err) {
    state.status = 'failed';
    state.lastError = err instanceof Error ? err.message : String(err);
    await updateOrchestrationState(sessionId, state);
  }
}

export async function logIntegrationEmailStep(
  sessionId: string,
  step: string,
  result: SendEmailResult,
  recipient: string,
  subject: string
) {
  try {
    await db.insert(agentLogs).values({
      sessionId,
      agentName: 'Integration Coordinator',
      status: result.success ? 'success' : 'error',
      latency: 0,
      inputSummary: JSON.stringify({ step, recipient, subject }),
      outputSummary: JSON.stringify({ mode: result.mode, recipient, subject }),
      errorMessage: result.success ? null : result.message,
      createdAt: Date.now(),
    }).run();
  } catch (error) {
    console.error('[Integration Coordinator] Failed to save email agent log:', error);
  }
}

async function updateOrchestrationState(sessionId: string, state: OrchestrationState) {
  state.updatedAt = Date.now();
  await db.update(sessions)
    .set({ orchestrationState: JSON.stringify(state) })
    .where(eq(sessions.id, sessionId))
    .run();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
