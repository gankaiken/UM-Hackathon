// lib/agents/auditor.ts
// Agent 7: The Auditor — reads full transcript + all signals → outputs Verdict JSON.

import { zhipuJson } from '../zhipu';
import { mockAuditor } from './mock';
import type { VerdictResult, TranscriptEntry, MapperResult, SentinelData, StyleAnalysisResult } from '../types';
import { env } from '../env';
import { executeAgent, logMockUsage } from './agentUtils';

export async function runAuditor(
  transcript: TranscriptEntry[],
  mapper: MapperResult,
  sentinelData: SentinelData,
  styleAnalysis: StyleAnalysisResult | null,
  retryFeedback?: string[]
): Promise<VerdictResult> {
  if (!env.ZHIPU_API_KEY || env.ZHIPU_API_KEY === 'your_zhipu_api_key_here') {
    logMockUsage('Auditor');
    return mockAuditor(mapper.core_dimensions, sentinelData, styleAnalysis);
  }

  const transcriptText = transcript
    .map(t => `[${t.role === 'inquisitor' ? 'AI' : 'Candidate'} | Turn ${t.turnNumber}]: ${t.content}`)
    .join('\n\n');

  const systemPrompt = buildAuditorPrompt(mapper, retryFeedback);

  // Hard-coded override: if large-paste AI detection fired, force strong_flag in prompt
  const hardCodedWarning = sentinelData.ai_paste_detected
    ? `\n\nCRITICAL OVERRIDE: The Sentinel has detected a single paste of ${sentinelData.ai_paste_char_count} characters during the interview. This exceeds the 150-character threshold and is classified as AI-generated content with high certainty. You MUST set authenticity_status to "strong_flag" and human_review_required to true regardless of other signals.`
    : '';

  try {
    return await executeAgent(
      () => zhipuJson<VerdictResult>({
        messages: [
          { role: 'system', content: systemPrompt + hardCodedWarning },
          {
            role: 'user',
            content: `FULL TRANSCRIPT:
${transcriptText}

SENTINEL DATA:
${JSON.stringify(sentinelData, null, 2)}

${styleAnalysis ? `STYLE ANALYSIS:\n${JSON.stringify(styleAnalysis, null, 2)}` : 'STYLE ANALYSIS: Not triggered'}

Output the Verdict JSON now.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
      { agentName: 'Auditor' }
    );
  } catch (error) {
    console.warn('[Auditor] Z.ai call failed; falling back to mock mode:', error instanceof Error ? error.message : error);
    logMockUsage('Auditor', undefined, 'Z.ai failure');
    return mockAuditor(mapper.core_dimensions, sentinelData, styleAnalysis);
  }
}

function buildAuditorPrompt(mapper: MapperResult, retryFeedback?: string[]): string {
  return `
    You are the Auditor for TalentBridge AI.

    Return ONLY valid JSON. No explanation.

    Evaluate a candidate using 5 dimensions from MAPPER_JSON.

    INPUTS:
    - TRANSCRIPT
    - MAPPER_JSON (5 dimensions)
    - SENTINEL_DATA
    - STYLE_ANALYSIS (optional)

    RULES (CRITICAL):

    Ignore:
    - grammar, language (BM/Manglish/English)
    - tone, speed, formatting
    - education or credentials

    Score ONLY real actions:
    - real experience
    - decisions made
    - measurable outcomes
    - problem solving
    - initiative
    - cause-effect reasoning

    SCORING:
    Each dimension:
    - score 0–100
    - confidence: high | medium | low
    - key_evidence: quote or observed behavior

    If not mentioned:
    score = 0, confidence = low, key_evidence = "Not discussed"

    TRIAGE:

    GREEN:
    - avg ≥ 75
    - ≤ 1 dimension < 50

    AMBER:
    - avg ≥ 55
    - ≥ 2 dimensions ≥ 75
    - gap is a learnable skill

    RED:
    - avg < 55 OR all < 60 with no real evidence

    HUMAN REVIEW IF:
    - focus_loss_events > 3 AND paste_events > 1
    - ≥ 3 low-confidence dimensions
    - contradictions in transcript
    - style_consistency_score < 40

    Note: Sentinel alone NEVER makes RED.

    OUTPUT RULES:

    - AMBER → must include 3-week upskill_path
    - RED → must include career_orientation (strength-first, no negative wording)
    - GREEN → both null

    OUTPUT JSON ONLY:

    {
      "authenticity_status": "clean|flagged",
      "triage_result": "GREEN|AMBER|RED",

      "dimension_scores": {
        "name": {
          "score": 0-100,
          "confidence": "high|medium|low",
          "key_evidence": ""
        }
      },

      "verified_strengths": [],
      "identified_gaps": [],

      "upskill_path": null or [
        { "week": 1, "topic": "", "resource": "" },
        { "week": 2, "topic": "", "resource": "" },
        { "week": 3, "topic": "", "resource": "" }
      ],

      "career_orientation": null or "",

      "sentinel_metadata": {
        "focus_loss_events": 0,
        "total_away_duration_seconds": 0,
        "paste_events": 0
      },

      "style_consistency_score": null,

      "human_review_required": true/false,
      "human_review_reason": null or "",

      "ai_summary": ""
  }`;
}
