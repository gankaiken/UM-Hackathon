// lib/agents/langStyleAnalyzer.ts
// Agent 6: Language Style Analyzer — conditional, only when Sentinel Stage 2 fires.
// Scores 7 signals to detect mid-session style shift / discontinuity consistent with AI proxy use.

import { zhipuJson } from '../zhipu';
import { mockStyleAnalyzer } from './mock';
import type { StyleAnalysisResult, TranscriptEntry } from '../types';
import { env } from '../env';
import { executeAgent, logMockUsage } from './agentUtils';

export async function runLanguageStyleAnalyzer(
  transcript: TranscriptEntry[]
): Promise<StyleAnalysisResult> {
  const candidateTurns = transcript.filter(t => t.role === 'candidate');
  const mid = Math.ceil(candidateTurns.length / 2);
  const earlyHalf = candidateTurns.slice(0, mid).map(t => t.content).join('\n');
  const lateHalf = candidateTurns.slice(mid).map(t => t.content).join('\n');

  if (!env.ZHIPU_API_KEY || env.ZHIPU_API_KEY === 'your_zhipu_api_key_here') {
    logMockUsage('LanguageStyleAnalyzer');
    return mockStyleAnalyzer(earlyHalf + '\n---\n' + lateHalf);
  }

  try {
    return await executeAgent(
      () => zhipuJson<StyleAnalysisResult>({
        messages: [
          { role: 'system', content: STYLE_ANALYZER_PROMPT },
          {
            role: 'user',
            content: `EARLY HALF (first ${mid} responses):
${earlyHalf}

LATE HALF (remaining ${candidateTurns.length - mid} responses):
${lateHalf}

Analyze for style discontinuity and output the JSON verdict.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      }),
      { agentName: 'LanguageStyleAnalyzer' }
    );
  } catch (error) {
    console.warn('[LanguageStyleAnalyzer] Z.ai call failed; falling back to mock mode:', error instanceof Error ? error.message : error);
    logMockUsage('LanguageStyleAnalyzer', undefined, 'Z.ai failure');
    return mockStyleAnalyzer(earlyHalf + '\n---\n' + lateHalf);
  }
}

const STYLE_ANALYZER_PROMPT = `You are the Language Style Analyzer for TalentBridge AI.

Triggered ONLY when Sentinel Stage 2 fires (suspicious tab-switching + paste activity).
Your job: compare early-half vs late-half candidate responses to detect within-session style discontinuity and authenticity anomalies.
Do NOT claim absolute certainty of AI authorship; focus purely on structural language shifts.

7 SIGNALS to check:

Tier 1 Signals (Significant Anomalies) → Penalty: -20 each
1. SCOPE DRIFT / OVER-EXPLANATION: Late-half answers provide excessively broad, textbook-style generic context unprompted.
2. RESPONSE LENGTH SHIFT: Late-half answers are vastly longer than early-half despite no increase in question complexity.
3. LANGUAGE REGISTER JUMP: Candidate suddenly switches from casual/colloquial phrasing to highly formal, academic, or corporate syntax.
4. PERSONAL DETAIL DENSITY DROP: Early half has specific names/numbers/dates/anecdotes; late half becomes entirely generic or theoretical.

Tier 2 Signals (Structural Anomalies) → Penalty: -10 each
5. DISCOURSE MARKER EMERGENCE: Structured markers ("Firstly,", "In conclusion,", "Furthermore,") suddenly appear in the late half.
6. SENTENCE UNIFORMITY / REPETITION: Late-half sentence structures become highly uniform, robotic, or use repetitive transition patterns.
7. COLLOQUIAL MARKER RETENTION: Cultural markers (e.g., "lah", "lor", "kan") present early are completely abandoned in the late half.

Score calculation:
style_consistency_score = Math.max(0, 100 - (sum of penalties))

Thresholds:
- 80-100: Consistent — clean
- 60-79: Minor variation — normal
- 40-59: Moderate shift — flag
- <40: Significant shift → PASS_TO_AUDITOR_STRONG_FLAG

Output strict JSON exactly matching this structure:
{
  "style_consistency_score": number,
  "anomaly_detected": boolean,
  "primary_anomaly_type": "description of main anomaly" or null,
  "signal_breakdown": {
    "scope_drift_penalty": 0 or -20,
    "response_length_shift_penalty": 0 or -20,
    "language_register_jump_penalty": 0 or -20,
    "personal_detail_density_drop_penalty": 0 or -20,
    "discourse_marker_emergence_penalty": 0 or -10,
    "sentence_uniformity_penalty": 0 or -10,
    "colloquial_marker_retention_penalty": 0 or -10
  },
  "recommendation": "CLEAN|MINOR_VARIATION|FLAG_TO_AUDITOR|PASS_TO_AUDITOR_STRONG_FLAG"
}`;
