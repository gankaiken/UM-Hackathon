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
        max_tokens: 1200,
      }),
      { agentName: 'LanguageStyleAnalyzer' }
    );
  } catch (error) {
    console.warn('[LanguageStyleAnalyzer] Z.ai call failed; falling back to mock mode:', error instanceof Error ? error.message : error);
    logMockUsage('LanguageStyleAnalyzer', undefined, 'Z.ai failure');
    return mockStyleAnalyzer(earlyHalf + '\n---\n' + lateHalf);
  }
}

const STYLE_ANALYZER_PROMPT = `
  You are the Language Style Analyzer for TalentBridge AI.

  You only output JSON. No explanation.

  You activate only when:
  Sentinel: focus_loss_events > 3 AND paste_events > 1

  INPUT:
  - TRANSCRIPT (candidate turns only)

  TASK:
  Compare EARLY (first 50% turns) vs LATE (last 50%).

  Detect style shift using 7 signals.

  Output style_consistency_score (0–100).

  SPLIT RULE:
  - First 50% turns = EARLY
  - Last 50% turns = LATE
  - Odd middle turn → EARLY

  SIGNALS:

  [T1] Scope Drift
  - 0 = relevant answer
  - -10 = slight over-explanation late
  - -20 = generic essay-style late

  [T1] Length Shift
  Compare avg words:
  - 0 = <2x increase
  - -10 = 2–2.4x
  - -20 = ≥2.5x (no question complexity change)

  [T1] Register Shift
  - -20 = BM/Manglish → English-formal (≥80% late turns)
  - -10 = partial shift (40–79%)
  - 0 = stable/mixed

  [T1] Personal Detail Drop
  (personal = name/date/number/place/event)
  - 0 = stable
  - -10 = 20–39% drop
  - -20 = ≥40% drop

  [T2] Formal Markers (late only)
  ("Firstly", "Furthermore", "In conclusion")
  - -5 = 1 marker
  - -10 = 2+

  [T2] Sentence Uniformity
  - 0 = natural variation
  - -10 = overly uniform/repetitive late

  [T2] Colloquial Drop (if early slang exists: lah/lor/leh/kan)
  - 0 = stable
  - -5 = reduced late
  - -10 = fully removed late

  SCORING:
  style_consistency_score = 100 − |total penalties|
  (min 0, max 100)

  ANOMALY RULE:
  - score < 44 → strong anomaly
  - 44–71 → moderate anomaly
  - ≥ 72 → clean

  OUTPUT JSON ONLY:

  {
    "style_consistency_score": 0-100,

    "signal_results": {
      "scope_drift": {"penalty": 0|-10|-20, "note": ""},
      "response_length_shift": {
        "early_avg_words": 0,
        "late_avg_words": 0,
        "penalty": 0|-10|-20,
        "note": ""
      },
      "language_register_shift": {
        "early_register": "",
        "late_register": "",
        "penalty": 0|-10|-20,
        "note": ""
      },
      "personal_detail_density_shift": {
        "penalty": 0|-10|-20,
        "note": ""
      },
      "formality_shift": {
        "penalty": 0|-5|-10,
        "note": ""
      },
      "sentence_uniformity": {
        "penalty": 0|-10,
        "note": ""
      },
      "colloquial_marker_retention": {
        "penalty": 0|-5|-10,
        "note": ""
      }
    },

    "anomaly_detected": true|false,
    "primary_anomaly_type": "",

    "recommendation":
      "PASS_TO_AUDITOR_CLEAN" |
      "PASS_TO_AUDITOR_WITH_FLAG" |
      "PASS_TO_AUDITOR_STRONG_FLAG"
  }
`;
