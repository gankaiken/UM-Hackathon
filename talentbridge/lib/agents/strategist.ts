// lib/agents/strategist.ts
// Agent 3: The Strategist — the hidden brain directing every interview turn.
// Reads transcript + coverage map + Sentinel signals → outputs instruction JSON.

import { zhipuJson } from '../zhipu';
import { mockStrategist } from './mock';
import type {
  StrategistResult,
  CoverageMap,
  SentinelData,
  TranscriptEntry,
  MapperResult,
  DimensionState,
  NextAction,
} from '../types';
import { normalizeSentinelData } from '../sentinel';
import { env } from '../env';
import { executeAgent, logMockUsage } from './agentUtils';

interface ContradictionSignal {
  context: string | null;
  severity: 'none' | 'soft' | 'strong';
  confidence: 'low' | 'medium' | 'high';
  clusterKey: string | null;
}

interface CoverageEvidence {
  mentions: number;
  words: number;
  actionNodes: number;
  strongActionNodes: number;
}

interface StallSignal {
  stalled: boolean;
  stalledDimension: string | null;
  stallCount: number;
}

export async function runStrategist(
  transcript: TranscriptEntry[],
  mapper: MapperResult,
  coverageMap: CoverageMap,
  sentinelData: SentinelData,
  turnNumber: number,
  turnsSinceRealityCheck: number
): Promise<StrategistResult> {
  const normalizedSentinelData = normalizeSentinelData(sentinelData);
  const derivedCoverageMap = deriveCoverageMap(coverageMap, mapper.core_dimensions, transcript);
  const contradiction = detectContradiction(transcript);
  const currentDimension = getCurrentDimension(transcript, mapper.core_dimensions, derivedCoverageMap);
  const normalizedTurnsSinceRealityCheck = Math.max(0, turnsSinceRealityCheck);

  if (!env.ZHIPU_API_KEY || env.ZHIPU_API_KEY === 'your_zhipu_api_key_here') {
    logMockUsage('Strategist');
    const mockResult = mockStrategist(
      turnNumber,
      derivedCoverageMap,
      mapper.core_dimensions,
      normalizedSentinelData.focus_loss_events,
      normalizedSentinelData.paste_events,
      normalizedTurnsSinceRealityCheck
    );

    return finalizeStrategistResult(
      mockResult,
      mapper.core_dimensions,
      derivedCoverageMap,
      contradiction,
      currentDimension,
      normalizedSentinelData,
      transcript,
      normalizedTurnsSinceRealityCheck,
      turnNumber
    );
  }

  const conversationSummary = transcript
    .map(entry => `[Turn ${entry.turnNumber}] ${entry.role === 'inquisitor' ? 'AI' : 'Candidate'}: ${entry.content}`)
    .join('\n');

  const systemPrompt = buildStrategistPrompt(
    mapper,
    currentDimension,
    contradiction,
    normalizedSentinelData.integrity_stage
  );

  let result: StrategistResult;
  try {
    result = await executeAgent(
      () => zhipuJson<StrategistResult>({
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `CURRENT STATE:
Turn number: ${turnNumber}
Turns since last reality check: ${normalizedTurnsSinceRealityCheck}
Current dimension in focus: ${currentDimension ?? 'none'}
Explicit Sentinel integrity state: ${normalizedSentinelData.integrity_stage}
Coverage map: ${JSON.stringify(derivedCoverageMap)}
Sentinel integrity stage: ${normalizedSentinelData.integrity_stage}
Sentinel data: ${JSON.stringify(normalizedSentinelData)}
Contradiction signal: ${contradiction.context ?? 'none'}

FULL CONVERSATION:
${conversationSummary}

Output the next action as JSON only.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1200,
      }),
      { agentName: 'Strategist' }
    );
  } catch (error) {
    console.warn('[Strategist] Z.ai call failed; falling back to mock mode:', error instanceof Error ? error.message : error);
    logMockUsage('Strategist');
    result = mockStrategist(
      turnNumber,
      derivedCoverageMap,
      mapper.core_dimensions,
      normalizedSentinelData.focus_loss_events,
      normalizedSentinelData.paste_events,
      normalizedTurnsSinceRealityCheck
    );
  }

  return finalizeStrategistResult(
    result,
    mapper.core_dimensions,
    derivedCoverageMap,
    contradiction,
    currentDimension,
    normalizedSentinelData,
    transcript,
    normalizedTurnsSinceRealityCheck,
    turnNumber
  );
}

function finalizeStrategistResult(
  result: StrategistResult,
  dimensions: string[],
  coverageMap: CoverageMap,
  contradiction: ContradictionSignal,
  currentDimension: string | null,
  sentinelData: SentinelData,
  transcript: TranscriptEntry[],
  turnsSinceRealityCheck: number,
  turnNumber: number
): StrategistResult {
  const fallbackTarget =
    currentDimension ??
    pickFirstDimensionByState(coverageMap, dimensions, 'TOUCHED') ??
    pickFirstDimensionByState(coverageMap, dimensions, 'DEVELOPING') ??
    pickFirstDimensionByState(coverageMap, dimensions, 'UNEXPLORED') ??
    dimensions[0];

  let nextAction: NextAction = result.next_action;
  const contradictionContext = result.contradiction_context ?? contradiction.context;
  let sentinelOverride = Boolean(result.sentinel_override);
  let targetDimension = dimensions.includes(result.target_dimension)
    ? result.target_dimension
    : fallbackTarget;
  let forcedCloseLog = result.forced_close_log ?? null;
  let probeAngle = result.probe_angle;

  const shouldClose = dimensions.every(dim => coverageMap[dim] === 'SUFFICIENT') || turnNumber >= 20;
  const integrityStage = sentinelData.integrity_stage ?? 'clean';
  const shouldRealityCheck =
    integrityStage === 'stage_2_alert'
      ? turnsSinceRealityCheck >= 1
      : integrityStage === 'stage_1_alert' && turnsSinceRealityCheck >= 3;
  const stallSignal = detectDimensionStall(transcript, currentDimension);
  const shouldResolveContradiction = shouldEscalateContradiction(contradiction, transcript, turnNumber);

  if (shouldClose) {
    nextAction = 'close_session';
    targetDimension = fallbackTarget;
    forcedCloseLog = turnNumber >= 20 ? 'Turn limit reached' : forcedCloseLog;
  } else if (shouldRealityCheck) {
    nextAction = 'reality_check';
    sentinelOverride = true;
    targetDimension = fallbackTarget;
    probeAngle =
      integrityStage === 'stage_2_alert'
        ? `Run a calm integrity reality check on ${targetDimension}; ask for a concrete, personally handled detail without accusing the candidate.`
        : `Ask for one concrete detail from the candidate's most recent example in ${targetDimension}, such as an exact number, tool, date, or step they personally handled.`;
  } else if (shouldResolveContradiction) {
    nextAction = 'resolve_contradiction';
    targetDimension = fallbackTarget;
    probeAngle = `Gently ask the candidate to reconcile the two conflicting accounts around ${targetDimension} without sounding accusatory.`;
  } else if (stallSignal.stalled) {
    nextAction = 'change_dimension';
    targetDimension =
      pickFirstDimensionByStateExcluding(coverageMap, dimensions, 'UNEXPLORED', stallSignal.stalledDimension) ??
      pickFirstDimensionByStateExcluding(coverageMap, dimensions, 'TOUCHED', stallSignal.stalledDimension) ??
      pickFirstDimensionByStateExcluding(coverageMap, dimensions, 'DEVELOPING', stallSignal.stalledDimension) ??
      fallbackTarget;
    probeAngle = `Move away from ${stallSignal.stalledDimension ?? 'the current dimension'} and open a fresh line of questioning in ${targetDimension}.`;
  }

  if (nextAction === 'change_dimension') {
    targetDimension =
      pickFirstDimensionByStateExcluding(
        coverageMap,
        dimensions,
        'UNEXPLORED',
        stallSignal.stalled ? stallSignal.stalledDimension : null
      ) ??
      pickFirstDimensionByStateExcluding(
        coverageMap,
        dimensions,
        'TOUCHED',
        stallSignal.stalled ? stallSignal.stalledDimension : null
      ) ??
      pickFirstDimensionByStateExcluding(
        coverageMap,
        dimensions,
        'DEVELOPING',
        stallSignal.stalled ? stallSignal.stalledDimension : null
      ) ??
      targetDimension;
  }

  probeAngle = avoidRepeatedQuestion(probeAngle, transcript, targetDimension, nextAction);

  const reasoningNotes = [
    result.reasoning?.trim(),
    `Coverage refreshed from transcript.`,
    `Turns since last reality check: ${turnsSinceRealityCheck}.`,
    integrityStage === 'stage_1_alert'
      ? `Explicit Sentinel state is stage_1_alert (${sentinelData.current_question_tab_switches ?? 0} current-question tab switches, ${(sentinelData.current_question_focus_loss_seconds ?? 0).toFixed(1)}s current-question focus loss).`
      : null,
    integrityStage === 'stage_2_alert'
      ? `Explicit Sentinel state is stage_2_alert and cannot downgrade within this session.`
      : null,
    stallSignal.stalled
      ? `Dimension stall detected on ${stallSignal.stalledDimension}: ${stallSignal.stallCount} probe_deeper turns with zero new Action Nodes.`
      : null,
    contradiction.context ? `Contradiction signal: ${contradiction.context}` : null,
    contradiction.clusterKey ? `Contradiction cluster: ${contradiction.clusterKey} (${contradiction.confidence}).` : null,
    (sentinelData.timing_anomaly_count ?? 0) > 0
      ? `Timing anomalies observed: ${sentinelData.timing_anomaly_count} (soft signal only).`
      : null,
  ].filter(Boolean);

  return {
    ...result,
    turn_number: turnNumber,
    turns_since_last_reality_check: nextAction === 'reality_check' ? 0 : turnsSinceRealityCheck + 1,
    next_action: nextAction,
    target_dimension: targetDimension,
    probe_angle: probeAngle,
    contradiction_context: contradictionContext,
    sentinel_override: sentinelOverride,
    coverage_map: coverageMap,
    forced_close_log: forcedCloseLog,
    reasoning: reasoningNotes.join(' '),
  };
}

function avoidRepeatedQuestion(
  probeAngle: string,
  transcript: TranscriptEntry[],
  targetDimension: string,
  nextAction: NextAction
) {
  const lastQuestion = [...transcript]
    .reverse()
    .find(entry => entry.role === 'inquisitor')?.content;

  if (!lastQuestion || normalizeQuestion(lastQuestion) !== normalizeQuestion(probeAngle)) {
    return probeAngle;
  }

  if (nextAction === 'change_dimension') {
    return `Let us move into ${targetDimension}. Can you share one specific example that shows how you handled this in real work?`;
  }

  if (nextAction === 'probe_deeper') {
    return `Can you go one level deeper on ${targetDimension}: what exactly did you do, and what happened after that?`;
  }

  return `Can you clarify one concrete detail about ${targetDimension} so we can understand your experience better?`;
}

function normalizeQuestion(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function deriveCoverageMap(
  current: CoverageMap,
  dimensions: string[],
  transcript: TranscriptEntry[]
): CoverageMap {
  const derived: CoverageMap = {};
  const evidenceByDimension = new Map<string, CoverageEvidence>();
  const strategistByTurn = new Map<number, StrategistResult>();

  for (const dimension of dimensions) {
    derived[dimension] = current[dimension] ?? 'UNEXPLORED';
    evidenceByDimension.set(dimension, {
      mentions: 0,
      words: 0,
      actionNodes: 0,
      strongActionNodes: 0,
    });
  }

  for (const entry of transcript) {
    if (entry.role === 'inquisitor' && entry.strategistJson) {
      strategistByTurn.set(entry.turnNumber, entry.strategistJson);
    }
  }

  const lastStrategist = [...strategistByTurn.values()].pop();

  for (const entry of transcript) {
    if (entry.role !== 'candidate') continue;

    const linkedStrategist =
      strategistByTurn.get(entry.turnNumber) ??
      (entry.turnNumber === transcript[transcript.length - 1]?.turnNumber ? lastStrategist : undefined);
    const dimension = linkedStrategist?.target_dimension;
    if (!dimension || !evidenceByDimension.has(dimension)) continue;

    const evidence = evidenceByDimension.get(dimension)!;
    const analysis = analyzeCandidateAnswer(entry.content);

    evidence.mentions += 1;
    evidence.words += analysis.wordCount;
    evidence.actionNodes += analysis.actionNodeCount;
    evidence.strongActionNodes += analysis.strongActionNodeCount;
  }

  for (const dimension of dimensions) {
    const evidence = evidenceByDimension.get(dimension)!;
    let nextState: DimensionState = 'UNEXPLORED';

    if (evidence.mentions > 0) {
      nextState = 'TOUCHED';
    }
    if (evidence.actionNodes >= 1 || evidence.words >= 25 || evidence.mentions >= 2) {
      nextState = 'DEVELOPING';
    }
    if (evidence.strongActionNodes >= 1 || evidence.actionNodes >= 2 || evidence.words >= 90) {
      nextState = 'SUFFICIENT';
    }

    derived[dimension] = maxCoverageState(derived[dimension], nextState);
  }

  return derived;
}

function analyzeCandidateAnswer(content: string) {
  const text = content.toLowerCase();
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  const matches = [
    /\b\d+(?:\.\d+)?%|\b\d+(?:,\d{3})+|\b\d+k\b|\b\d+\s*(?:followers|customers|users|posts|sales|orders|hours|days|weeks|months|years)\b/i,
    /\b(because|so that|therefore|sebab|supaya)\b/i,
    /\b(i asked|i checked|i searched|i learned|i watched|i read|i referred|saya tanya|saya cari)\b/i,
    /\b(i changed|i adapted|i switched|i adjusted|after it failed|lepas tu saya ubah)\b/i,
    /\b(i initiated|i proposed|i started|i decided|i created|i set up|saya buat sendiri)\b/i,
    /\b(team|customer|client|user|community|orang lain|pelanggan)\b/i,
  ];

  let actionNodeCount = 0;
  for (const pattern of matches) {
    if (pattern.test(text)) {
      actionNodeCount += 1;
    }
  }

  const strongActionNodeCount =
    /\b\d+(?:\.\d+)?%|\b\d+(?:,\d{3})+|\b\d+k\b/i.test(text) &&
    /\b(because|so that|therefore|sebab|supaya)\b/i.test(text)
      ? 1
      : 0;

  return { wordCount, actionNodeCount, strongActionNodeCount };
}

function detectContradiction(transcript: TranscriptEntry[]): ContradictionSignal {
  const candidateTurns = transcript.filter(entry => entry.role === 'candidate');
  if (candidateTurns.length < 2) {
    return { context: null, severity: 'none', confidence: 'low', clusterKey: null };
  }

  const latest = candidateTurns[candidateTurns.length - 1].content;
  const prior = candidateTurns.slice(0, -1).map(entry => entry.content);

  const priorNoExperience = prior.some(text => /\b(no experience|never worked|tak pernah kerja|tiada pengalaman)\b/i.test(text));
  const latestHasExperience = /\b(\d+\+?\s*(?:years?|bulan|months?)\s+(?:of\s+)?experience|worked as|managed|led)\b/i.test(latest);
  if (priorNoExperience && latestHasExperience) {
    return {
      context: 'The candidate previously said they had no relevant experience, but the latest answer describes direct prior experience.',
      severity: 'strong',
      confidence: 'high',
      clusterKey: 'experience-history',
    };
  }

  const quantifiedConflict = findQuantifiedConflict(prior, latest);
  if (quantifiedConflict) {
    return quantifiedConflict;
  }

  return { context: null, severity: 'none', confidence: 'low', clusterKey: null };
}

function findQuantifiedConflict(priorMessages: string[], latestMessage: string): ContradictionSignal | null {
  const topicPatterns = [
    { label: 'followers', clusterKey: 'followers-count', pattern: /(\d+(?:,\d{3})?|\d+k)\s+followers?/i },
    { label: 'sales', clusterKey: 'sales-count', pattern: /(\d+(?:,\d{3})?|\d+k)\s+(?:sales|orders?)/i },
    { label: 'customers', clusterKey: 'customer-count', pattern: /(\d+(?:,\d{3})?|\d+k)\s+customers?/i },
    { label: 'team size', clusterKey: 'team-size', pattern: /team of\s+(\d+(?:,\d{3})?)/i },
  ];

  for (const topic of topicPatterns) {
    const latestMatch = latestMessage.match(topic.pattern);
    if (!latestMatch) continue;

    for (const previous of priorMessages) {
      const priorMatch = previous.match(topic.pattern);
      if (!priorMatch) continue;

      const latestValue = normalizeNumericClaim(latestMatch[1]);
      const priorValue = normalizeNumericClaim(priorMatch[1]);
      if (latestValue !== null && priorValue !== null && latestValue !== priorValue) {
        return {
          context: `The candidate gave conflicting ${topic.label} figures earlier (${priorMatch[1]}) and now (${latestMatch[1]}).`,
          severity: 'strong',
          confidence: 'high',
          clusterKey: topic.clusterKey,
        };
      }
    }
  }

  return null;
}

function shouldEscalateContradiction(
  contradiction: ContradictionSignal,
  transcript: TranscriptEntry[],
  turnNumber: number
) {
  if (contradiction.severity !== 'strong' || contradiction.confidence !== 'high' || !contradiction.clusterKey) {
    return false;
  }

  const priorContradictionTurns = transcript
    .filter(
      entry =>
        entry.role === 'inquisitor' &&
        entry.strategistJson?.next_action === 'resolve_contradiction'
    )
    .map(entry => ({
      turnNumber: entry.turnNumber,
      clusterKey: getContradictionClusterKey(entry.strategistJson?.contradiction_context),
    }));

  if (priorContradictionTurns.length >= 2) {
    return false;
  }

  const lastContradictionTurn = priorContradictionTurns.at(-1);
  if (lastContradictionTurn && turnNumber - lastContradictionTurn.turnNumber < 2) {
    return false;
  }

  const sameClusterPrompt = [...priorContradictionTurns]
    .reverse()
    .find(entry => entry.clusterKey === contradiction.clusterKey);

  if (sameClusterPrompt && turnNumber - sameClusterPrompt.turnNumber < 4) {
    return false;
  }

  return true;
}

function detectDimensionStall(
  transcript: TranscriptEntry[],
  currentDimension: string | null
): StallSignal {
  if (!currentDimension) {
    return { stalled: false, stalledDimension: null, stallCount: 0 };
  }

  const candidateByTurn = new Map<number, TranscriptEntry>();
  for (const entry of transcript) {
    if (entry.role === 'candidate') {
      candidateByTurn.set(entry.turnNumber, entry);
    }
  }

  let zeroActionProbeCount = 0;

  for (let index = transcript.length - 1; index >= 0; index -= 1) {
    const entry = transcript[index];
    if (entry.role !== 'inquisitor' || !entry.strategistJson) continue;

    const strategist = entry.strategistJson;
    if (strategist.target_dimension !== currentDimension) {
      if (zeroActionProbeCount > 0) break;
      continue;
    }

    if (strategist.next_action !== 'probe_deeper') {
      if (zeroActionProbeCount > 0) break;
      continue;
    }

    const candidateTurn = candidateByTurn.get(entry.turnNumber);
    if (!candidateTurn) continue;

    const analysis = analyzeCandidateAnswer(candidateTurn.content);
    if (analysis.actionNodeCount === 0) {
      zeroActionProbeCount += 1;
      if (zeroActionProbeCount >= 3) {
        return {
          stalled: true,
          stalledDimension: currentDimension,
          stallCount: zeroActionProbeCount,
        };
      }
      continue;
    }

    break;
  }

  return {
    stalled: false,
    stalledDimension: currentDimension,
    stallCount: zeroActionProbeCount,
  };
}

function getContradictionClusterKey(context: string | null | undefined) {
  if (!context) return null;

  const normalized = context.toLowerCase();
  if (normalized.includes('no relevant experience') || normalized.includes('direct prior experience')) {
    return 'experience-history';
  }
  if (normalized.includes('followers')) return 'followers-count';
  if (normalized.includes('sales')) return 'sales-count';
  if (normalized.includes('customers')) return 'customer-count';
  if (normalized.includes('team size')) return 'team-size';

  return normalized;
}

function normalizeNumericClaim(raw: string) {
  const normalized = raw.toLowerCase().replace(/,/g, '').trim();
  if (normalized.endsWith('k')) {
    const value = Number.parseFloat(normalized.slice(0, -1));
    return Number.isNaN(value) ? null : value * 1000;
  }

  const value = Number.parseFloat(normalized);
  return Number.isNaN(value) ? null : value;
}

function getCurrentDimension(
  transcript: TranscriptEntry[],
  dimensions: string[],
  coverageMap: CoverageMap
) {
  for (let index = transcript.length - 1; index >= 0; index -= 1) {
    const strategist = transcript[index].strategistJson;
    if (strategist?.target_dimension && dimensions.includes(strategist.target_dimension)) {
      if (strategist.next_action === 'change_dimension') {
        return strategist.target_dimension;
      }
      if (strategist.next_action !== 'close_session') {
        return strategist.target_dimension;
      }
    }
  }

  return (
    pickFirstDimensionByState(coverageMap, dimensions, 'TOUCHED') ??
    pickFirstDimensionByState(coverageMap, dimensions, 'DEVELOPING') ??
    pickFirstDimensionByState(coverageMap, dimensions, 'UNEXPLORED') ??
    dimensions[0] ??
    null
  );
}

function pickFirstDimensionByState(
  coverageMap: CoverageMap,
  dimensions: string[],
  state: DimensionState
) {
  return dimensions.find(dimension => coverageMap[dimension] === state) ?? null;
}

function pickFirstDimensionByStateExcluding(
  coverageMap: CoverageMap,
  dimensions: string[],
  state: DimensionState,
  excludedDimension: string | null
) {
  return dimensions.find(
    dimension => dimension !== excludedDimension && coverageMap[dimension] === state
  ) ?? null;
}

function maxCoverageState(current: DimensionState, incoming: DimensionState): DimensionState {
  const rank: Record<DimensionState, number> = {
    UNEXPLORED: 0,
    TOUCHED: 1,
    DEVELOPING: 2,
    SUFFICIENT: 3,
  };

  return rank[incoming] > rank[current] ? incoming : current;
}

function buildStrategistPrompt(
  mapper: MapperResult,
  currentDimension: string | null,
  contradiction: ContradictionSignal,
  integrityStage: SentinelData['integrity_stage']
) {
  return `You are TalentBridge AI Strategist agent, hidden controller of interview flow, reading full conversation and Mapper JSON. Track exactly 5 dimensions from mapper.core_dimensions and probe_targets. Never speak to candidate, only output JSON next_action.

Dimensions:
${mapper.core_dimensions}

Probe targets:
${mapper.probe_targets}

Current dimension: ${currentDimension ?? 'none'}
Contradiction: ${contradiction?.context ?? 'none'}
Sentinel stage: ${integrityStage ?? 'clean'}

Coverage states: UNEXPLORED TOUCHED DEVELOPING SUFFICIENT.

Priority:
If Sentinel stage_2 OR stage_1 and turns_since_last_reality_check >= 3 → reality_check
Else if contradiction detected → resolve_contradiction
Else if current dimension TOUCHED/DEVELOPING → probe_deeper (<3 times)
Else if SUFFICIENT or stalled → change_dimension
Else if all SUFFICIENT or turn >= 20 → close_session

Action Nodes only:
quantified result, real incident, cause-effect, adaptation, initiative, help-seeking, impact awareness.

probe_angle = instruction for Inquisitor (grounded if probe_deeper, broad if change_dimension)

Output ONLY JSON:
turn_number, turns_since_last_reality_check, next_action, target_dimension, probe_angle, contradiction_context, sentinel_override, coverage_map, forced_close_log, reasoning`;
}
