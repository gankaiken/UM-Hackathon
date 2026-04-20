// lib/agents/strategist.ts
// Agent 3: The Strategist — the hidden brain directing every interview turn.
// Reads transcript + coverage map + Sentinel signals → outputs instruction JSON.

import { zhipuJson } from '../zhipu';
import { mockStrategist } from './mock';
import type { StrategistResult, CoverageMap, SentinelData, TranscriptEntry, MapperResult } from '../types';

export async function runStrategist(
  transcript: TranscriptEntry[],
  mapper: MapperResult,
  coverageMap: CoverageMap,
  sentinelData: SentinelData,
  turnNumber: number,
  turnsSinceRealityCheck: number
): Promise<StrategistResult> {
  if (!process.env.ZHIPU_API_KEY || process.env.ZHIPU_API_KEY === 'your_glm4_api_key_here') {
    console.log('[Strategist] Using mock (no API key)');
    // Update coverage map heuristically for mock
    const updatedMap = updateCoverageMapMock(coverageMap, mapper.core_dimensions, transcript);
    return mockStrategist(
      turnNumber, updatedMap, mapper.core_dimensions,
      sentinelData.focus_loss_events, sentinelData.paste_events, turnsSinceRealityCheck
    );
  }

  const conversationSummary = transcript
    .map(t => `[Turn ${t.turnNumber}] ${t.role === 'inquisitor' ? 'AI' : 'Candidate'}: ${t.content}`)
    .join('\n');

  const systemPrompt = buildStrategistPrompt(mapper);

  const result = await zhipuJson<StrategistResult>({
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `CURRENT STATE:
Turn number: ${turnNumber}
Turns since last reality check: ${turnsSinceRealityCheck}
Coverage map: ${JSON.stringify(coverageMap)}
Sentinel data: ${JSON.stringify(sentinelData)}

FULL CONVERSATION:
${conversationSummary}

Output the next action as JSON only.`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });

  return result;
}

// Heuristic mock coverage updater — advances state based on response length
function updateCoverageMapMock(
  current: CoverageMap,
  dimensions: string[],
  transcript: TranscriptEntry[]
): CoverageMap {
  const updated = { ...current };
  const candidateTurns = transcript.filter(t => t.role === 'candidate');
  const totalTurns = candidateTurns.length;

  dimensions.forEach((dim, i) => {
    const turnsPerDim = Math.floor(totalTurns / dimensions.length);
    const dimTurns = candidateTurns.slice(i * turnsPerDim, (i + 1) * turnsPerDim);
    const totalWords = dimTurns.reduce((s, t) => s + t.content.split(' ').length, 0);

    if (!updated[dim] || updated[dim] === 'UNEXPLORED') {
      if (totalTurns > i * 2) updated[dim] = 'TOUCHED';
    }
    if (updated[dim] === 'TOUCHED' && totalWords > 30) updated[dim] = 'DEVELOPING';
    if (updated[dim] === 'DEVELOPING' && totalWords > 80) updated[dim] = 'SUFFICIENT';
  });

  return updated;
}

function buildStrategistPrompt(mapper: MapperResult): string {
  return `You are the Strategist agent for TalentBridge AI — the hidden intelligence directing the interview.

Role: Read the full conversation and decide the EXACT next move. You never speak to the candidate directly.

The 5 dimensions you are tracking:
${mapper.core_dimensions.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Probe targets:
${mapper.probe_targets.map(p => `- ${p}`).join('\n')}

Coverage states: UNEXPLORED → TOUCHED → DEVELOPING → SUFFICIENT

Priority decision logic (stop at first match):
1. Sentinel Stage 2 (focus_loss_events > 3 AND paste_events > 1) AND turns_since_last_reality_check >= 3 → reality_check
2. Contradiction detected → resolve_contradiction (max 2 per session)
3. Current dimension TOUCHED or DEVELOPING → probe_deeper
4. Current dimension SUFFICIENT or probed 3x with no Action Nodes → change_dimension
5. All SUFFICIENT or turn >= 20 → close_session

Action Node indicators (score ONLY these):
- Quantified result ("sales up 30%", "12,000 followers")
- Sought resources when stuck
- Adapted after failure
- Demonstrated impact awareness
- Independent initiative
- Cause-effect reasoning ("I did X because Y")

Output strict JSON only:
{
  "turn_number": number,
  "turns_since_last_reality_check": number,
  "next_action": "probe_deeper|change_dimension|reality_check|resolve_contradiction|close_session",
  "target_dimension": "string",
  "probe_angle": "exact question guidance for Inquisitor",
  "contradiction_context": null or "string",
  "sentinel_override": boolean,
  "coverage_map": { "dim": "STATE" },
  "forced_close_log": null or "string",
  "reasoning": "your internal reasoning — visible in debug panel"
}`;
}
