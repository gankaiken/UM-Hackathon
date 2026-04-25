// lib/agents/langStyleAnalyzer.ts
// Agent 6: Language Style Analyzer — conditional, only when Sentinel Stage 2 fires.
// Scores 5 signals to detect mid-session style shift consistent with AI proxy use.

import { zhipuJson } from '../zhipu';
import { mockStyleAnalyzer } from './mock';
import type { StyleAnalysisResult, TranscriptEntry } from '../types';

export async function runLanguageStyleAnalyzer(
  transcript: TranscriptEntry[]
): Promise<StyleAnalysisResult> {
  const candidateTurns = transcript.filter(t => t.role === 'candidate');
  const mid = Math.ceil(candidateTurns.length / 2);
  const earlyHalf = candidateTurns.slice(0, mid).map(t => t.content).join('\n');
  const lateHalf = candidateTurns.slice(mid).map(t => t.content).join('\n');

  if (!process.env.ZHIPU_API_KEY || process.env.ZHIPU_API_KEY === 'your_glm4_api_key_here') {
    console.log('[LanguageStyleAnalyzer] Using mock (no API key)');
    return mockStyleAnalyzer(earlyHalf + '\n---\n' + lateHalf);
  }

  return await zhipuJson<StyleAnalysisResult>({
    messages: [
      { role: 'system', content: STYLE_ANALYZER_PROMPT },
      {
        role: 'user',
        content: `EARLY HALF (first ${mid} responses):
${earlyHalf}

LATE HALF (remaining ${candidateTurns.length - mid} responses):
${lateHalf}

Analyze for style shifts and output the JSON verdict.`,
      },
    ],
    temperature: 0.2,
    max_tokens: 1024,
  });
}

const STYLE_ANALYZER_PROMPT = `You are the Language Style Analyzer for TalentBridge AI.

Triggered ONLY when Sentinel Stage 2 fires (suspicious tab-switching + paste activity).
Your job: compare early-half vs late-half candidate responses for style shifts.

5 SIGNALS to check:

1. RESPONSE LENGTH SHIFT: Late-half answers ≥ 2.5× longer than early-half with no question complexity increase → penalty -20
2. FORMALITY SHIFT: Structured discourse markers ("Firstly,", "In conclusion,", "Furthermore,") appear in late half, absent in early → penalty -20
3. LANGUAGE REGISTER SHIFT: Candidate using Manglish suddenly writes ≥80% formal English in late half → penalty -20
4. PERSONAL DETAIL DENSITY SHIFT: Early half has specific names/numbers/dates; late half is generic → penalty -20
5. COLLOQUIAL MARKER RETENTION: "lah", "lor", "kan", "mah" present early, COMPLETELY absent late → penalty -20 (Malaysia-specific)

Score: style_consistency_score = 100 − (sum of penalties)
- 80-100: Consistent — clean
- 60-79: Minor variation — normal
- 40-59: Moderate shift — flag
- <40: Significant shift → PASS_TO_AUDITOR_STRONG_FLAG

Output strict JSON:
{
  "style_consistency_score": number,
  "anomaly_detected": boolean,
  "primary_anomaly_type": "description of main anomaly" or null,
  "signal_breakdown": {
    "response_length_shift": 0 or -20,
    "formality_shift": 0 or -20,
    "language_register_shift": 0 or -20,
    "personal_detail_density_shift": 0 or -20,
    "colloquial_marker_retention": 0 or -20
  },
  "recommendation": "CLEAN|MINOR_VARIATION|FLAG_TO_AUDITOR|PASS_TO_AUDITOR_STRONG_FLAG"
}`;
