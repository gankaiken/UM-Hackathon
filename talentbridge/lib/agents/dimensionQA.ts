// lib/agents/dimensionQA.ts
// Agent 2: Dimension QA — validates Mapper output before it enters the pipeline.

import { zhipuJson } from '../zhipu';
import { mockDimensionQA } from './mock';
import type { MapperResult, DimensionQAResult } from '../types';
import { env } from '../env';
import { executeAgent, logMockUsage } from './agentUtils';

const QA_SYSTEM_PROMPT = `You are the Dimension QA Agent for TalentBridge AI.

Your role: Validate that a Mapper agent's extracted competency dimensions are accurate, complete, and testable BEFORE any candidate is interviewed.

Three checks to apply to ALL 5 dimensions:
1. JD SUPPORT: Is this dimension traceable to the JD text or a reasonable inference from the role type?
2. TESTABILITY: Can this be probed through text conversation about real past experience? Fail: credential-based or purely attitudinal.
3. DISTINCTNESS: Is this dimension meaningfully different from the other 4? Fail: two dimensions so similar one question covers both.

Three possible outputs:
- PASS: All checks pass. Forward to Strategist.
- REVISE: Return structured qa_feedback list. Mapper will retry.
- PASS_WITH_WARNING: Second pass, pass with warning_flag: true and notes.

Rules:
- You VALIDATE only — you NEVER rewrite dimensions yourself
- Output ONLY valid JSON

Output schema:
{
  "status": "PASS" | "REVISE" | "PASS_WITH_WARNING",
  "qa_feedback": ["string"] | undefined,
  "warning_flag": boolean | undefined,
  "warning_notes": ["string"] | undefined
}`;

export async function runDimensionQA(
  mapper: MapperResult,
  jdText: string,
  isRetry: boolean = false
): Promise<DimensionQAResult> {
  if (!env.ZHIPU_API_KEY || env.ZHIPU_API_KEY === 'your_zhipu_api_key_here') {
    logMockUsage('DimensionQA');
    return mockDimensionQA(mapper);
  }

  try {
    return await executeAgent(
      () => zhipuJson<DimensionQAResult>({
      messages: [
        { role: 'system', content: QA_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Original JD:\n${jdText}\n\nMapper output to validate:\n${JSON.stringify(mapper, null, 2)}${
            isRetry ? '\n\nNote: This is a retry — if there are still issues, output PASS_WITH_WARNING.' : ''
          }`,
        },
      ],
      temperature: 0.2,
      max_tokens: 512,
    }),
      { agentName: 'DimensionQA' }
    );
  } catch (error) {
    console.warn('[DimensionQA] Z.ai call failed; falling back to mock mode:', error instanceof Error ? error.message : error);
    logMockUsage('DimensionQA', undefined, 'Z.ai failure');
    return mockDimensionQA(mapper);
  }
}
