// lib/agents/integrationCoordinator.ts
// Agent 8: The Integration Coordinator — orchestrates Gmail, Calendar, and Zoom.

import { db } from '../db';
import { sessions, jdCache } from '../db/schema';
import { eq } from 'drizzle-orm';
import { VerdictResult } from '../types';
import { sendEmail } from './externalTools';

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
export async function runOrchestration(sessionId: string, verdict: VerdictResult) {
  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  if (!session) throw new Error('Session not found');

  const jd = db.select().from(jdCache).where(eq(jdCache.id, session.jdId)).get();
  const employerId = jd?.employerId || 'default';

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

    const body = `Hi ${session.candidateName},\n\n` +
      `Great news! We've reviewed your TalentBridge AI interview for the ${jd?.roleTitle || 'Role'} position and would like to move forward.\n\n` +
      `Please use the link below to select a time for your next-stage interview with our team:\n\n` +
      `${scheduleLink}\n\n` +
      `Looking forward to speaking with you!\n\n` +
      `Best regards,\n` +
      `Hiring Team`;

    // Step 1: Send Invitation Email
    const emailResult = await sendEmail(
      employerId,
      session.candidateEmail || 'candidate@example.com',
      `Next Steps: Interview Invitation for ${jd?.roleTitle || 'Role'}`,
      body
    );
    
    state.mode = emailResult.mode;
    state.steps.push({
      step: 'invitation_email',
      timestamp: Date.now(),
      message: emailResult.message,
      success: emailResult.success
    });
    
    if (!emailResult.success) throw new Error(emailResult.message);
    
    state.status = 'invited';
    await updateOrchestrationState(sessionId, state);

  } catch (err) {
    state.status = 'failed';
    state.lastError = err instanceof Error ? err.message : String(err);
    await updateOrchestrationState(sessionId, state);
  }
}

async function updateOrchestrationState(sessionId: string, state: OrchestrationState) {
  state.updatedAt = Date.now();
  await db.update(sessions)
    .set({ orchestrationState: JSON.stringify(state) })
    .where(eq(sessions.id, sessionId))
    .run();
}
