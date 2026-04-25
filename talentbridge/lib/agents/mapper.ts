// lib/agents/mapper.ts
// Agent 1: The Mapper — extracts exactly 5 competency dimensions from a JD.
// Routes to mock when no API key is set.

import { zhipuJson } from '../zhipu';
import { mockMapper } from './mock';
import type { MapperResult } from '../types';
import { env } from '../env';
import { executeAgent, logMockUsage } from './agentUtils';

const MAPPER_SYSTEM_PROMPT = `You are the Mapper agent for TalentBridge AI, a hiring intelligence system.

Your role: Read a job description (JD) and extract exactly 5 core competency dimensions that can be tested through a text conversation about real past experience.

Rules:
- Extract the EXACT role title from the text (e.g. 'Senior Frontend Developer'). DO NOT hallucinate titles. If it's missing, use 'Untitled Role'.
- Extract EXACTLY 5 dimensions — not 4, not 6
- Dimensions must be BEHAVIOURAL and testable through conversation (e.g. "problem-solving under pressure", NOT "has a degree")
- Identify 2-3 probe targets — things the JD implies but doesn't state explicitly
- If JD is under 50 words, set truncated_input: true and infer from Malaysian SME norms for that role type
- Respond in English regardless of JD language
- Output ONLY valid JSON matching the schema below

Output schema:
{
  "role_title": "exact title from JD or 'Untitled Role'",
  "core_dimensions": ["dim1", "dim2", "dim3", "dim4", "dim5"],
  "probe_targets": ["probe1", "probe2"],
  "truncated_input": false
}`;

export async function runMapper(jdText: string): Promise<MapperResult> {
  // Use mock if no API key
  if (!env.ZHIPU_API_KEY || env.ZHIPU_API_KEY === 'your_zhipu_api_key_here') {
    logMockUsage('Mapper');
    return mockMapper(jdText);
  }

  try {
    return await executeAgent(
      () => zhipuJson<MapperResult>({
        messages: [
          { role: 'system', content: MAPPER_SYSTEM_PROMPT },
          { role: 'user', content: `Here is the job description:\n\n${jdText}` },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
      { agentName: 'Mapper' }
    );
  } catch (error) {
    console.warn('[Mapper] Z.ai call failed; falling back to mock mode:', error instanceof Error ? error.message : error);
    logMockUsage('Mapper', undefined, 'Z.ai failure');
    return mockMapper(jdText);
  }
}
