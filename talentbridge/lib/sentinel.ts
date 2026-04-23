import type { SentinelData, SentinelStage } from './types';

export const DEFAULT_SENTINEL_DATA: SentinelData = {
  focus_loss_events: 0,
  total_away_duration_seconds: 0,
  paste_events: 0,
  tab_switches: 0,
  current_question_focus_loss_seconds: 0,
  current_question_tab_switches: 0,
  integrity_stage: 'clean',
  answer_timings_ms: [],
  last_answer_elapsed_ms: 0,
  timing_anomaly_count: 0,
  last_answer_timing_anomaly: false,
  ai_paste_detected: false,
  ai_paste_char_count: 0,
};

const STAGE_RANK: Record<SentinelStage, number> = {
  clean: 0,
  stage_1_alert: 1,
  stage_2_alert: 2,
};

export function normalizeSentinelData(data: Partial<SentinelData> = {}): SentinelData {
  const normalized: SentinelData = {
    ...DEFAULT_SENTINEL_DATA,
    ...data,
    focus_loss_events: data.focus_loss_events ?? DEFAULT_SENTINEL_DATA.focus_loss_events,
    total_away_duration_seconds:
      data.total_away_duration_seconds ?? DEFAULT_SENTINEL_DATA.total_away_duration_seconds,
    paste_events: data.paste_events ?? DEFAULT_SENTINEL_DATA.paste_events,
    tab_switches: data.tab_switches ?? DEFAULT_SENTINEL_DATA.tab_switches,
    current_question_focus_loss_seconds:
      data.current_question_focus_loss_seconds ?? DEFAULT_SENTINEL_DATA.current_question_focus_loss_seconds,
    current_question_tab_switches:
      data.current_question_tab_switches ?? DEFAULT_SENTINEL_DATA.current_question_tab_switches,
    integrity_stage: isSentinelStage(data.integrity_stage) ? data.integrity_stage : 'clean',
    answer_timings_ms: Array.isArray(data.answer_timings_ms)
      ? data.answer_timings_ms
      : DEFAULT_SENTINEL_DATA.answer_timings_ms,
    last_answer_elapsed_ms: data.last_answer_elapsed_ms ?? DEFAULT_SENTINEL_DATA.last_answer_elapsed_ms,
    timing_anomaly_count: data.timing_anomaly_count ?? DEFAULT_SENTINEL_DATA.timing_anomaly_count,
    last_answer_timing_anomaly:
      data.last_answer_timing_anomaly ?? DEFAULT_SENTINEL_DATA.last_answer_timing_anomaly,
    ai_paste_detected: data.ai_paste_detected ?? DEFAULT_SENTINEL_DATA.ai_paste_detected,
    ai_paste_char_count: data.ai_paste_char_count ?? DEFAULT_SENTINEL_DATA.ai_paste_char_count,
  };

  return {
    ...normalized,
    integrity_stage: transitionIntegrityStage(normalized),
  };
}

export function beginSentinelQuestionWindow(data: SentinelData): SentinelData {
  const resetData = {
    ...data,
    current_question_focus_loss_seconds: 0,
    current_question_tab_switches: 0,
  };

  return {
    ...resetData,
    integrity_stage: transitionIntegrityStage(resetData),
  };
}

export function transitionIntegrityStage(data: Partial<SentinelData>): SentinelStage {
  const currentStage = isSentinelStage(data.integrity_stage) ? data.integrity_stage : 'clean';

  if (currentStage === 'stage_2_alert') {
    return 'stage_2_alert';
  }

  if ((data.focus_loss_events ?? 0) > 3 && (data.paste_events ?? 0) > 1) {
    return 'stage_2_alert';
  }

  if (
    (data.current_question_tab_switches ?? 0) > 2 ||
    (data.current_question_focus_loss_seconds ?? 0) > 30
  ) {
    return maxStage(currentStage, 'stage_1_alert');
  }

  return currentStage;
}

function maxStage(current: SentinelStage, incoming: SentinelStage): SentinelStage {
  return STAGE_RANK[incoming] > STAGE_RANK[current] ? incoming : current;
}

function isSentinelStage(value: unknown): value is SentinelStage {
  return value === 'clean' || value === 'stage_1_alert' || value === 'stage_2_alert';
}
