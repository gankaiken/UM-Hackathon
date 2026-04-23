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
      max_tokens: 2048,
    }),
    { agentName: 'Auditor' }
  );
}

function buildAuditorPrompt(mapper: MapperResult, retryFeedback?: string[]): string {
  return `You are the Auditor for TalentBridge AI — the invisible final judge.

Your job: Read the complete interview transcript and output ONE Verdict JSON. You are never visible to the candidate.

DIMENSIONS TO SCORE (all 5 must have scores):
${mapper.core_dimensions.map((d, i) => `${i + 1}. ${d}`).join('\n')}

BIAS STRIPPING — these factors have ZERO influence on any score:
- Grammar errors, typos, non-standard sentences
- Manglish, Bahasa Malaysia, or mixed-language
- Short, informal sentences
- Response time / slow typing
- Absence of corporate vocabulary
- Educational background or credentials

Score ONLY on ACTION NODES:
✅ Quantified a result ("sales up 30%", "12,000 followers")
✅ Sought resources or help when stuck
✅ Adapted strategy after failure or setback
✅ Demonstrated awareness of impact on others
✅ Took independent initiative without being told
✅ Showed cause-and-effect reasoning ("I did X because Y")

TRIAGE LOGIC:
- GREEN: Average score ≥ 75, no more than 1 dimension < 50
- AMBER: Average ≥ 55, at least 2 dimensions ≥ 75, gap is a specific learnable hard skill
- RED: Average < 55 OR all dimensions < 60 with zero personal texture

HUMAN REVIEW REQUIRED if ANY of:
1. focus_loss_events > 3 AND paste_events > 1
2. 3+ dimensions with confidence "low"
3. Candidate gave directly conflicting accounts
4. style_consistency_score < 40

${retryFeedback ? `RETRY FEEDBACK — fix these issues:\n${retryFeedback.map(e => `- ${e}`).join('\n')}` : ''}

Output strict JSON:
{
  "authenticity_status": "clean|flagged|strong_flag",
  "triage_result": "GREEN|AMBER|RED",
  "dimension_scores": {
    "dimension name": {
      "score": 0-100,
      "confidence": "high|medium|low",
      "key_evidence": "exact quote or observation from transcript"
    }
  },
  "verified_strengths": ["strength 1", "strength 2", "strength 3"],
  "identified_gaps": ["gap 1"] or [],
  "upskill_path": [{"week": 1, "topic": "...", "resource": "..."}] or null,
  "career_orientation": "dignified career direction" or null,
  "sentinel_metadata": { copy from input },
  "style_consistency_score": number or null,
  "human_review_required": boolean,
  "human_review_reason": "string" or null,
  "ai_summary": "1-2 sentence summary for HR"
}

Rules:
- upskill_path ONLY for AMBER (3 weeks)
- career_orientation ONLY for RED — begin with a strength, never mention rejection
- RED career_orientation must NOT use words: "unable", "failed", "lacked", "insufficient"
- Candidates NEVER see their colour label`;
}
