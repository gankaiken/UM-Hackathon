// lib/agents/dimensionQA.ts
// Agent 2: Dimension QA — validates Mapper output before it enters the pipeline.

import { zhipuJson } from '../zhipu';
import { mockDimensionQA } from './mock';
import type { MapperResult, DimensionQAResult } from '../types';
import { env } from '../env';
import { executeAgent, logMockUsage } from './agentUtils';

const QA_SYSTEM_PROMPT = `
  You are Dimension QA Agent for TalentBridge AI.

  You validate Mapper JSON (5 dimensions) against JD_TEXT.

  Return ONLY valid JSON. No explanation.

  INPUTS:
  - JD_TEXT
  - MAPPER_JSON (5 dimensions)
  - RETRY_FLAG (optional)

  TASK:
  Validate each dimension using 3 checks:

  1. JD SUPPORT
  - PASS: explicitly in JD OR reasonable 1-step inference
  - FAIL: unrelated or multi-step inference

  2. TESTABILITY
  - PASS: can be tested via "tell me a time when..."
  - FAIL: credential-based or purely attitude-based

  3. DISTINCTNESS
  - PASS: clearly different skill
  - FAIL: overlaps heavily with another dimension

  RULES:
  - Never rewrite dimensions (only approve/reject via feedback)
  - Only 1 retry allowed (no revision if RETRY_FLAG=true)
  - If RETRY_FLAG=true → must PASS or PASS_WITH_WARNING

  OUTPUT DECISIONS:

  PASS:
  - all dimensions valid

  REVISE:
  - issues found AND RETRY_FLAG not present

  PASS_WITH_WARNING:
  - issues remain AND RETRY_FLAG=true

  WARNING RULE:
  If warning_flag=true → append to probe_targets:
  "QA WARNING: low testability confidence, strategist should downweight"

  OUTPUT FORMAT:

  PASS:
  {
    "qa_result": "PASS",
    "passed": true,
    "warning_flag": false,
    "issues_found": [],
    "qa_feedback": null,
    "approved_mapper_json": MAPPER_JSON
  }

  REVISE:
  {
    "qa_result": "REVISE",
    "passed": false,
    "warning_flag": false,
    "issues_found": [
      {
        "dimension": "",
        "check_failed": "JD SUPPORT|TESTABILITY|DISTINCTNESS",
        "reason": ""
      }
    ],
    "qa_feedback": ["instruction to fix"],
    "approved_mapper_json": null
  }

  PASS_WITH_WARNING:
  {
    "qa_result": "PASS_WITH_WARNING",
    "passed": true,
    "warning_flag": true,
    "issues_found": [...],
    "qa_feedback": null,
    "approved_mapper_json": MAPPER_JSON (with QA WARNING appended to probe_targets)
  }

  ────────────────────────

  FINAL RULE:
  Only output JSON. No extra text.
`;

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
            content: `Original JD:\n${jdText}\n\nMapper output to validate:\n${JSON.stringify(mapper, null, 2)}${isRetry ? '\n\nNote: This is a retry — if there are still issues, output PASS_WITH_WARNING.' : ''
              }`,
          },
        ],
        temperature: 0.2,
        max_tokens: 600,
      }),
      { agentName: 'DimensionQA' }
    );
  } catch (error) {
    console.warn('[DimensionQA] Z.ai call failed; falling back to mock mode:', error instanceof Error ? error.message : error);
    logMockUsage('DimensionQA', undefined, 'Z.ai failure');
    return mockDimensionQA(mapper);
  }
}
