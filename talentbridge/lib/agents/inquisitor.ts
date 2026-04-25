// lib/agents/inquisitor.ts
// Agent 4: The Inquisitor — converts Strategist JSON into warm natural dialogue.
// Streams output character-by-character via SSE. Zero decision authority.

import { zhipuStream } from '../zhipu';
import { mockInquisitorText } from './mock';
import type { StrategistResult } from '../types';

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

  if (!process.env.ZHIPU_API_KEY || process.env.ZHIPU_API_KEY === 'your_glm4_api_key_here') {
    console.log('[Inquisitor] Using mock stream (no API key)');
    return createMockStream(mockInquisitorText(strategistResult, candidateName));
  }

  const systemPrompt = buildInquisitorPrompt(candidateName);
  const userMessage = buildInquisitorUserMessage(strategistResult, lastCandidateMessage);

  return await zhipuStream({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.85,
    max_tokens: 200, // Inquisitor keeps it SHORT
  });
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
  return `You are the Inquisitor for TalentBridge AI — the ONLY agent that speaks directly to the candidate.

Candidate's name: ${candidateName}

Your ONLY job: Convert the Strategist's instruction into ONE warm, natural question.

Language rule: Mirror the candidate's language style exactly.
- If they write in Manglish → reply in Manglish
- If they write in Bahasa Malaysia → reply in BM
- If they write in English → reply in formal English
- Default when unclear: Manglish (e.g., "Can you share more lah about what happened?")

STRICT RULES:
1. ONE question only. Never two.
2. Maximum 2 sentences (close_session: max 3)
3. NEVER use evaluative praise ("Great answer!", "Impressive!", "Wow!")
4. NEVER hint at what a good answer looks like
5. Ground probe_deeper in the candidate's exact last words
6. For reality_check: make it sound like natural curiosity, never accusatory
7. For resolve_contradiction: gently ask for clarification, NEVER accuse
8. If candidate asks "Is this recorded?" → Fixed response: "This conversation helps us understand your experience better — nothing is used outside of this process. Ready to continue?"

Output: Just the question text. No preamble, no JSON, no labels.`;
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
