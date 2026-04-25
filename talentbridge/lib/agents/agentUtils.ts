// lib/agents/agentUtils.ts
// Robust execution, retries, and SQLite logging for agents.

import { db } from '../db';
import { agentLogs } from '../db/schema';

export interface AgentExecutionOptions {
  agentName: string;
  sessionId?: string;
  maxRetries?: number;
}

/**
 * Executes an agent call with retry logic and logs the result to SQLite.
 */
export async function executeAgent<T>(
  action: () => Promise<T>,
  options: AgentExecutionOptions
): Promise<T> {
  const { agentName, sessionId, maxRetries = 2 } = options;
  const start = Date.now();
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts <= maxRetries) {
    try {
      const result = await action();
      const latency = Date.now() - start;
      
      // Async log success
      saveAgentLog({
        sessionId,
        agentName,
        status: 'success',
        latency,
        output: JSON.stringify(result),
        createdAt: Date.now(),
      }).catch(err => console.error('[AgentLog] Failed to save log:', err));

      return result;
    } catch (err) {
      attempts++;
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[${agentName}] Attempt ${attempts} failed:`, lastError.message);
      
      if (attempts <= maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 500));
      }
    }
  }

  // Log final failure
  const latency = Date.now() - start;
  saveAgentLog({
    sessionId,
    agentName,
    status: 'error',
    latency,
    errorMessage: lastError?.message,
    createdAt: Date.now(),
  }).catch(err => console.error('[AgentLog] Failed to save error log:', err));

  throw lastError;
}

/**
 * Truncates and saves log to DB.
 */
async function saveAgentLog(data: {
  sessionId?: string;
  agentName: string;
  status: string;
  latency: number;
  output?: string;
  errorMessage?: string;
  createdAt: number;
}) {
  const MAX_SUMMARY_LENGTH = 1000;
  
  await db.insert(agentLogs).values({
    sessionId: data.sessionId,
    agentName: data.agentName,
    status: data.status,
    latency: data.latency,
    outputSummary: data.output ? data.output.slice(0, MAX_SUMMARY_LENGTH) : null,
    errorMessage: data.errorMessage,
    createdAt: data.createdAt,
  }).run();
}

/**
 * Formats a generic "Using Mock" log when API keys are missing.
 */
export function logMockUsage(agentName: string, sessionId?: string, reason = 'no API key') {
  console.log(`[${agentName}] Using mock (${reason})`);
  saveAgentLog({
    sessionId,
    agentName,
    status: 'success',
    latency: 0,
    output: `[FALLBACK MOCK] ${reason}`,
    createdAt: Date.now(),
  }).catch(() => {});
}
