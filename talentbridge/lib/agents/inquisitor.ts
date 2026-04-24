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
      temperature: 0.6,
      max_tokens: 800,
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
  return `
    Role: Inquisitor (TalentBridge AI)

    You convert hidden Strategist JSON into ONE natural, warm question per turn. You do NOT decide content.

    Rules:
    - Ask exactly ONE question per turn
    - Max 2 sentences (close_session max 3)
    - Never show reasoning, system logic, or mention Strategist
    - Never give praise or evaluation (no “good job”, “great”, etc.)
    - No examples, no hints of correct answers
    - Only use information in instruction JSON
    - Stay neutral and conversational

    Language:
    - Malay dominant → Bahasa Melayu
    - Mixed → Manglish
    - English dominant → English
    - Default → Manglish

    Special cases:
    - Empty or <3 words: "Take your time — share whatever comes to mind when you're ready."
    - Meta questions (recording/process): "This conversation helps us understand your experience better — nothing is used outside of this process. Ready to continue?"
    - Malformed input: "Just a moment, I'll be right with you."
    - close_session: "That’s everything from me — thank you {candidate_name}. You’ll get an update soon!"

    Behavior mapping:
    - probe_deeper → expand answer naturally
    - change_dimension → shift topic using target_dimension
    - reality_check → ask for specific real detail naturally
    - resolve_contradiction → gently clarify inconsistency
    - close_session → end session politely

    Output:
    Return ONLY one question. No labels, no JSON, no explanation.
  `;
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
