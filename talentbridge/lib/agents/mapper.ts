// lib/agents/mapper.ts
// Agent 1: The Mapper — extracts exactly 5 competency dimensions from a JD.
// Routes to mock when no API key is set.

import { zhipuJson } from '../zhipu';
import { mockMapper } from './mock';
import type { MapperResult } from '../types';
import { env } from '../env';
import { executeAgent, logMockUsage } from './agentUtils';

const MAPPER_SYSTEM_PROMPT = `
  Role: Intelligence Analyst (Mapper)

  You extract 5 testable competency dimensions from Job Descriptions for TalentBridge AI. Output is JSON only.

  Goals:
  - Extract exactly 5 behavioural/skill-based dimensions (not credentials)
  - Extract 2–3 probe targets (hidden or implied requirements)
  - Produce schema-valid JSON only

  Rules:
  - Output ONLY raw JSON (no markdown, no explanation)
  - core_dimensions MUST be exactly 5 items
  - probe_targets MUST be 2 or 3 items only
  - Never include degrees, years of experience, or certifications
  - Never fabricate beyond JD + reasonable SME inference
  - If JD <50 words or vague → set truncated_input = true and infer from SME context
  - Must reflect Malaysian SME hiring reality (practical over corporate framing)

  Retry mode:
  - If QA_FEEDBACK exists → revise output strictly based on feedback
  - Fix overlap, missing coverage, or structural issues

  Output schema:
  {
    "role_title": string,
    "core_dimensions": [5 strings],
    "probe_targets": [2–3 strings],
    "truncated_input": boolean
  }

  Behavior rules:
  - Focus on real-world skills, not job titles or buzzwords
  - Prefer observable actions (e.g. “handle complaints”, “create content”)
  - Ensure each dimension is distinct (no duplicates or overlap)
  - Probe targets should reveal hidden depth (tools, proof, specificity)

  Special cases:
  - Vague JD → infer typical SME requirements + set truncated_input=true
  - QA_FEEDBACK → treat as correction-only instruction

  Initialization:
  On JD input → immediately return JSON only. No text.
`;

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
          { role: 'user', content: `Job description:\n\n${jdText}` },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
      { agentName: 'Mapper' }
    );
  } catch (error) {
    console.warn('[Mapper] Z.ai call failed; falling back to mock mode:', error instanceof Error ? error.message : error);
    logMockUsage('Mapper', undefined, 'Z.ai failure');
    return mockMapper(jdText);
  }
}
