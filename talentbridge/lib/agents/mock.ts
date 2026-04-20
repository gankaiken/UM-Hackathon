// lib/agents/mock.ts
// Mock AI agent responses — used when ZHIPU_API_KEY is not set.
// All mocks return correctly-structured data matching the real agent output.
// To switch to real AI: just replace these calls in the agent files.

import type {
  MapperResult,
  DimensionQAResult,
  StrategistResult,
  StyleAnalysisResult,
  VerdictResult,
  CoverageMap,
  NextAction,
} from '../types';

// ── Mapper mock ───────────────────────────────────────────────────────────────
export function mockMapper(jdText: string): MapperResult {
  const words = jdText.slice(0, 50);
  const isShort = jdText.split(' ').length < 50;

  return {
    role_title: extractRoleTitle(jdText),
    core_dimensions: [
      'Communication and stakeholder engagement',
      'Problem-solving under time constraints',
      'Self-directed learning and adaptability',
      'Collaboration and team contribution',
      'Execution quality and attention to detail',
    ],
    probe_targets: [
      'JD mentions "experience preferred" — determine if candidate has any real project ownership',
      'No metrics mentioned — probe whether candidate tracks their own output results',
    ],
    truncated_input: isShort,
  };
}

function extractRoleTitle(jd: string): string {
  // Try to extract role from first line
  const firstLine = jd.split('\n')[0].trim();
  if (firstLine.length > 5 && firstLine.length < 80) return firstLine;
  return 'Open Position';
}

// ── Dimension QA mock ─────────────────────────────────────────────────────────
export function mockDimensionQA(_mapper: MapperResult): DimensionQAResult {
  return { status: 'PASS' };
}

// ── Strategist mock ───────────────────────────────────────────────────────────
const MOCK_QUESTIONS: Record<string, string[]> = {
  open: [
    "Tell me a bit about yourself — what kind of work have you been doing lately?",
    "What's a project you worked on recently that you're genuinely proud of?",
  ],
  probe: [
    "That sounds interesting — can you walk me through exactly what you did step by step?",
    "What was the most difficult part of that, and how did you handle it?",
    "Did you measure the results? What numbers came out of it?",
    "Was there a moment where things didn't go as planned? What happened?",
  ],
  reality_check: [
    "Going back to what you mentioned earlier — what was the specific date or month that happened?",
    "Can you remember the exact name of the tool or platform you used for that?",
  ],
  change: [
    "Got it, thanks for sharing that. Let's talk about something a bit different — how do you usually handle working with others?",
    "Okay, switching gears — can you tell me about a time you had to learn something completely new for a job?",
  ],
  close: [
    "That's really helpful, thank you so much for your time today. We'll be reviewing everything and you'll hear from us soon.",
  ],
};

export function mockStrategist(
  turnNumber: number,
  coverageMap: CoverageMap,
  dimensions: string[],
  sentinelFocusLoss: number,
  sentinelPaste: number,
  turnsSinceRealityCheck: number
): StrategistResult {
  // Determine dimension states
  const suffCount = Object.values(coverageMap).filter((s) => s === 'SUFFICIENT').length;
  const unexplored = dimensions.find((d) => !coverageMap[d] || coverageMap[d] === 'UNEXPLORED');
  const developing = dimensions.find((d) => coverageMap[d] === 'TOUCHED' || coverageMap[d] === 'DEVELOPING');
  const targetDim = developing ?? unexplored ?? dimensions[0];

  // Priority 1: Sentinel anomaly
  if (sentinelFocusLoss > 3 && sentinelPaste > 1 && turnsSinceRealityCheck >= 3) {
    return buildStrategistResult(turnNumber, turnsSinceRealityCheck, 'reality_check', targetDim, coverageMap,
      MOCK_QUESTIONS.reality_check[0], true, 'Sentinel Stage 2 triggered. Inserting reality check.');
  }

  // Priority 5: Close session
  if (suffCount >= dimensions.length || turnNumber >= 20) {
    return buildStrategistResult(turnNumber, turnsSinceRealityCheck, 'close_session', dimensions[0], coverageMap,
      MOCK_QUESTIONS.close[0], false, 'All dimensions SUFFICIENT or turn limit reached.');
  }

  // Priority 4: Change dimension
  if (!developing && unexplored) {
    return buildStrategistResult(turnNumber, turnsSinceRealityCheck, 'change_dimension', targetDim, coverageMap,
      pick(MOCK_QUESTIONS.change), false, `Moving to unexplored dimension: ${targetDim}`);
  }

  // Priority 3: Probe deeper (default)
  const isFirst = turnNumber <= 2;
  return buildStrategistResult(turnNumber, turnsSinceRealityCheck, 'probe_deeper', targetDim, coverageMap,
    isFirst ? pick(MOCK_QUESTIONS.open) : pick(MOCK_QUESTIONS.probe),
    false, `Probing deeper on ${targetDim} (currently ${coverageMap[targetDim] ?? 'UNEXPLORED'})`);
}

function buildStrategistResult(
  turnNumber: number,
  turnsSinceRealityCheck: number,
  action: NextAction,
  dim: string,
  coverageMap: CoverageMap,
  probeAngle: string,
  sentinelOverride: boolean,
  reasoning: string
): StrategistResult {
  return {
    turn_number: turnNumber,
    turns_since_last_reality_check: action === 'reality_check' ? 0 : turnsSinceRealityCheck + 1,
    next_action: action,
    target_dimension: dim,
    probe_angle: probeAngle,
    contradiction_context: null,
    sentinel_override: sentinelOverride,
    coverage_map: coverageMap,
    forced_close_log: action === 'close_session' && turnNumber >= 20 ? 'Turn limit reached' : null,
    reasoning,
  };
}

// ── Inquisitor mock ───────────────────────────────────────────────────────────
// Returns the question text that will be streamed character by character
export function mockInquisitorText(strategistResult: StrategistResult, candidateName: string): string {
  const { next_action, probe_angle } = strategistResult;

  if (next_action === 'close_session') {
    return `Thank you so much for your time, ${candidateName}! It's been a great conversation. We'll be in touch soon with our feedback.`;
  }

  return probe_angle;
}

// ── Language Style Analyzer mock ──────────────────────────────────────────────
export function mockStyleAnalyzer(_transcriptText: string): StyleAnalysisResult {
  return {
    style_consistency_score: 72,
    anomaly_detected: false,
    primary_anomaly_type: null,
    signal_breakdown: {
      response_length_shift: 0,
      formality_shift: 0,
      language_register_shift: -8,
      personal_detail_density_shift: 0,
      colloquial_marker_retention: -20,
    },
    recommendation: 'MINOR_VARIATION',
  };
}

// ── Auditor mock ──────────────────────────────────────────────────────────────
export function mockAuditor(
  dimensions: string[],
  sentinelData: { focus_loss_events: number; total_away_duration_seconds: number; paste_events: number; tab_switches: number },
  styleAnalysis: StyleAnalysisResult | null
): VerdictResult {
  const scores = Object.fromEntries(
    dimensions.map((dim, i) => [
      dim,
      {
        score: [82, 68, 91, 55, 74][i % 5],
        confidence: (['high', 'medium', 'high', 'medium', 'high'] as const)[i % 5],
        key_evidence: MOCK_EVIDENCE[i % MOCK_EVIDENCE.length],
      },
    ])
  );

  const avgScore = Object.values(scores).reduce((s, d) => s + d.score, 0) / dimensions.length;
  const triage = avgScore >= 75 ? 'GREEN' : avgScore >= 55 ? 'AMBER' : 'RED';

  const needsHumanReview =
    (sentinelData.focus_loss_events > 3 && sentinelData.paste_events > 1) ||
    (styleAnalysis?.style_consistency_score != null && styleAnalysis.style_consistency_score < 40);

  return {
    authenticity_status: needsHumanReview ? 'flagged' : 'clean',
    triage_result: triage,
    dimension_scores: scores,
    verified_strengths: [
      'Strong self-initiative — took action without being directed',
      'Demonstrated ability to adapt strategy when faced with obstacles',
      'Clear cause-and-effect reasoning in past decision-making',
    ],
    identified_gaps: triage !== 'GREEN'
      ? ['Structured data analytics tools (e.g. performance tracking platforms)']
      : [],
    upskill_path: triage === 'AMBER' ? [
      { week: 1, topic: 'Analytics Fundamentals', resource: 'Google Analytics Academy (Free)' },
      { week: 2, topic: 'Data Interpretation', resource: 'LinkedIn Learning — Data Literacy' },
      { week: 3, topic: 'Practice Project', resource: 'TalentBridge Guided Exercise' },
    ] : null,
    career_orientation: triage === 'RED'
      ? 'Based on our conversation, your strengths shine in hands-on, people-facing environments. Roles in customer success, operations support, or community management may be a strong fit for your natural skillset.'
      : null,
    sentinel_metadata: sentinelData,
    style_consistency_score: styleAnalysis?.style_consistency_score ?? null,
    human_review_required: needsHumanReview,
    human_review_reason: needsHumanReview
      ? 'Sentinel Stage 2 triggered: elevated tab-switch and paste activity detected'
      : null,
    ai_summary: triage === 'GREEN'
      ? 'Strong candidate with demonstrated execution track record and adaptable mindset. Recommend proceeding to final interview.'
      : triage === 'AMBER'
      ? 'Solid foundational qualities with one specific tooling gap. Recommend completing the 3-week upskill path before re-evaluation.'
      : 'Candidate shows genuine intent but experience depth does not match role requirements at this time. Career orientation provided.',
  };
}

const MOCK_EVIDENCE = [
  "Described specific outcome: 'We went from 200 to 800 followers in 3 months after I changed posting schedule'",
  "Showed initiative: 'I didn't wait for approval — I just set it up and showed the team after'",
  "Quantified impact: 'Reduced customer complaints by roughly half over two weeks'",
  "Demonstrated adaptation: 'When the first approach failed, I switched to a different method based on customer feedback'",
  "Had personal detail: 'It was during Chinese New Year, I remember because we were short-staffed'",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
