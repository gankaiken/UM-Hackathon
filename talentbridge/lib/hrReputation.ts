const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
const COLD_START_VERDICT_THRESHOLD = 5;

export interface EmployerVerdictRecord {
  employerId: string | null;
  verdict: string | null;
  completedAt: number | null;
  hrRespondedAt: number | null;
}

export interface EmployerReputation {
  employerId: string;
  active: boolean;
  totalCompletedVerdicts: number;
  respondedWithin48Hours: number;
  overdueGhostingEvents: number;
  responseRate48h: number | null;
  score: number | null;
  status: 'cold_start' | 'excellent' | 'healthy' | 'watchlist' | 'low_response';
  candidateWarning: boolean;
}

export function calculateEmployerReputation(
  employerId: string,
  records: EmployerVerdictRecord[],
  now: number
): EmployerReputation {
  const completedVerdicts = records.filter(
    record => normalizeEmployerId(record.employerId) === normalizeEmployerId(employerId) && Boolean(record.verdict)
  );

  return calculateReputationFromCompletedVerdicts(normalizeEmployerId(employerId), completedVerdicts, now);
}

export function calculateAggregateEmployerReputation(
  records: EmployerVerdictRecord[],
  now: number
): EmployerReputation {
  return calculateReputationFromCompletedVerdicts(
    'all-employers',
    records.filter(record => Boolean(record.verdict)),
    now
  );
}

function calculateReputationFromCompletedVerdicts(
  employerId: string,
  completedVerdicts: EmployerVerdictRecord[],
  now: number
): EmployerReputation {
  const totalCompletedVerdicts = completedVerdicts.length;
  const respondedWithin48Hours = completedVerdicts.filter(record => {
    if (!record.completedAt || !record.hrRespondedAt) return false;
    return record.hrRespondedAt - record.completedAt <= FORTY_EIGHT_HOURS;
  }).length;
  const overdueGhostingEvents = completedVerdicts.filter(record => {
    if (!record.completedAt || record.hrRespondedAt) return false;
    return now - record.completedAt > FORTY_EIGHT_HOURS;
  }).length;

  if (totalCompletedVerdicts < COLD_START_VERDICT_THRESHOLD) {
    return {
      employerId,
      active: false,
      totalCompletedVerdicts,
      respondedWithin48Hours,
      overdueGhostingEvents,
      responseRate48h: null,
      score: null,
      status: 'cold_start',
      candidateWarning: false,
    };
  }

  const responseRate48h = respondedWithin48Hours / totalCompletedVerdicts;
  const ghostingRate = overdueGhostingEvents / totalCompletedVerdicts;
  const score = clampScore(Math.round(responseRate48h * 100 - ghostingRate * 20));
  const status = getReputationStatus(score);

  return {
    employerId,
    active: true,
    totalCompletedVerdicts,
    respondedWithin48Hours,
    overdueGhostingEvents,
    responseRate48h,
    score,
    status,
    candidateWarning: status === 'low_response',
  };
}

export function buildEmployerReputationMap(
  records: EmployerVerdictRecord[],
  now: number
): Map<string, EmployerReputation> {
  const employerIds = new Set(records.map(record => normalizeEmployerId(record.employerId)));
  const reputations = new Map<string, EmployerReputation>();

  for (const employerId of employerIds) {
    reputations.set(employerId, calculateEmployerReputation(employerId, records, now));
  }

  return reputations;
}

export function normalizeEmployerId(employerId: string | null | undefined) {
  return employerId?.trim() || 'default';
}

function getReputationStatus(score: number): EmployerReputation['status'] {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'healthy';
  if (score >= 70) return 'watchlist';
  return 'low_response';
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}
