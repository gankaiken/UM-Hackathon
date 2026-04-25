// lib/agents/inquisitor.ts
// Agent 4: The Inquisitor — converts Strategist JSON into warm natural dialogue.
// Streams output character-by-character via SSE. Zero decision authority.

import { zhipuStream } from '../zhipu';
import { mockInquisitorText } from './mock';
import type { StrategistResult } from '../types';
import { env } from '../env';
import { logMockUsage } from './agentUtils';

export async function runInquisitorStream(
  strategistResult: StrategistResult,
  candidateName: string,
  lastCandidateMessage: string
): Promise<ReadableStream<string>> {
  if (isMetaQuestion(lastCandidateMessage)) {
    return createMockStream(
      'This conversation helps us understand your experience better - nothing is used outside of this process. Ready to continue?'
    );
  }

  if (!env.ZHIPU_API_KEY || env.ZHIPU_API_KEY === 'your_zhipu_api_key_here') {
    logMockUsage('Inquisitor');
    return createMockStream(mockInquisitorText(strategistResult, candidateName));
  }

  const systemPrompt = buildInquisitorPrompt(candidateName);
  const userMessage = buildInquisitorUserMessage(strategistResult, lastCandidateMessage);

  try {
    return await zhipuStream({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.85,
      max_tokens: 200, // Inquisitor keeps it SHORT
    });
  } catch (error) {
    console.warn('[Inquisitor] Z.ai stream failed; falling back to mock mode:', error instanceof Error ? error.message : error);
    logMockUsage('Inquisitor');
    return createMockStream(mockInquisitorText(strategistResult, candidateName));
  }
}

function isMetaQuestion(message: string) {
  return /\b(is this recorded|is this being recorded|are you recording|recorded\?|what is this used for|how will this be used)\b/i.test(
    message
  );
}

// Creates a mock stream that simulates character-by-character typing
function createMockStream(text: string): ReadableStream<string> {
  const words = text.split(' ');
  let wordIndex = 0;

  return new ReadableStream<string>({
    async pull(controller) {
      if (wordIndex >= words.length) {
        controller.close();
        return;
      }

      // Emit word by word with small delay to simulate typing
      const word = (wordIndex > 0 ? ' ' : '') + words[wordIndex];
      wordIndex++;
      controller.enqueue(word);

      // Small artificial delay for realistic streaming effect
      await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 40));
    },
  });
}

function buildInquisitorPrompt(candidateName: string): string {
  return `You are the Inquisitor for TalentBridge AI — the only agent who speaks directly to the candidate.

Your job: turn the Strategist’s instruction into ONE warm, natural question.

Language rule: match the candidate’s style exactly (Manglish / BM / formal English). Default: Manglish.

Rules:

Ask ONE question only (max 2 sentences; close_session max 3)
No praise or evaluation
Don’t hint what a “good” answer is
For probe_deeper: use the candidate’s exact last words
For reality_check: sound curious, not accusatory
For resolve_contradiction: clarify gently, don’t accuse
If asked “Is this recorded?” → reply: “This conversation helps us understand your experience better — nothing is used outside of this process. Ready to continue?”

Output: only the question, nothing else.`;
}

function buildInquisitorUserMessage(strategist: StrategistResult, lastMessage: string): string {
  return `Strategist instruction:
Action: ${strategist.next_action}
Target dimension: ${strategist.target_dimension}
Probe angle: ${strategist.probe_angle}
${strategist.contradiction_context ? `Contradiction context: ${strategist.contradiction_context}` : ''}
${strategist.sentinel_override ? 'Note: Sentinel flagged suspicious activity. Begin reality check naturally.' : ''}

Candidate's last message: "${lastMessage}"

Write the next question now (one question, max 2 sentences):`;
}
