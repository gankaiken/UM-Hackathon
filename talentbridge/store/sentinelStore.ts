// store/sentinelStore.ts
// Zustand store — Sentinel behavioural tracking state (client-side only)

import { create } from 'zustand';
import type { SentinelData } from '@/lib/types';

interface SentinelStore {
  data: SentinelData;
  beginQuestionWindow: () => void;
  recordFocusLoss: (durationSeconds: number) => void;
  recordPaste: () => void;
  recordTabSwitch: () => void;
  recordAnswerTiming: (durationMs: number, answerLength: number) => void;
  // Hard-coded rule: large paste auto-flagged as AI-generated
  recordAiPaste: (charCount: number) => void;
  hydrate: (data: Partial<SentinelData>) => void;
  reset: () => void;
}

const DEFAULT_DATA: SentinelData = {
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

export const useSentinelStore = create<SentinelStore>((set) => ({
  data: { ...DEFAULT_DATA },

  beginQuestionWindow: () =>
    set(state => ({
      data: {
        ...state.data,
        current_question_focus_loss_seconds: 0,
        current_question_tab_switches: 0,
        integrity_stage:
          state.data.focus_loss_events > 3 && state.data.paste_events > 1
            ? 'stage_2_alert'
            : 'clean',
      },
    })),

  recordFocusLoss: (durationSeconds: number) =>
    set(state => ({
      data: {
        ...state.data,
        focus_loss_events: state.data.focus_loss_events + 1,
        total_away_duration_seconds: state.data.total_away_duration_seconds + durationSeconds,
        current_question_focus_loss_seconds:
          (state.data.current_question_focus_loss_seconds ?? 0) + durationSeconds,
        integrity_stage: getIntegrityStage({
          ...state.data,
          focus_loss_events: state.data.focus_loss_events + 1,
          paste_events: state.data.paste_events,
          current_question_focus_loss_seconds:
            (state.data.current_question_focus_loss_seconds ?? 0) + durationSeconds,
          current_question_tab_switches: state.data.current_question_tab_switches ?? 0,
        }),
      },
    })),

  recordPaste: () =>
    set(state => ({
      data: {
        ...state.data,
        paste_events: state.data.paste_events + 1,
        integrity_stage: getIntegrityStage({
          ...state.data,
          focus_loss_events: state.data.focus_loss_events,
          paste_events: state.data.paste_events + 1,
          current_question_focus_loss_seconds: state.data.current_question_focus_loss_seconds ?? 0,
          current_question_tab_switches: state.data.current_question_tab_switches ?? 0,
        }),
      },
    })),

  recordTabSwitch: () =>
    set(state => ({
      data: {
        ...state.data,
        tab_switches: state.data.tab_switches + 1,
        current_question_tab_switches: (state.data.current_question_tab_switches ?? 0) + 1,
        integrity_stage: getIntegrityStage({
          ...state.data,
          tab_switches: state.data.tab_switches + 1,
          paste_events: state.data.paste_events,
          focus_loss_events: state.data.focus_loss_events,
          current_question_focus_loss_seconds: state.data.current_question_focus_loss_seconds ?? 0,
          current_question_tab_switches: (state.data.current_question_tab_switches ?? 0) + 1,
        }),
      },
    })),

  recordAnswerTiming: (durationMs: number, answerLength: number) =>
    set(state => {
      const timings = [...(state.data.answer_timings_ms ?? []), Math.max(0, Math.round(durationMs))];
      const isTimingAnomaly =
        durationMs > 120_000 ||
        (durationMs > 45_000 && answerLength > 280);

      return {
      data: {
        ...state.data,
        answer_timings_ms: timings,
        last_answer_elapsed_ms: Math.max(0, Math.round(durationMs)),
        last_answer_timing_anomaly: isTimingAnomaly,
        timing_anomaly_count: (state.data.timing_anomaly_count ?? 0) + (isTimingAnomaly ? 1 : 0),
        integrity_stage: getIntegrityStage({
          ...state.data,
          current_question_focus_loss_seconds: state.data.current_question_focus_loss_seconds ?? 0,
          current_question_tab_switches: state.data.current_question_tab_switches ?? 0,
          focus_loss_events: state.data.focus_loss_events,
          paste_events: state.data.paste_events,
        }),
      },
    };
  }),

  recordAiPaste: (charCount: number) =>
    set(state => ({
      data: {
        ...state.data,
        paste_events: state.data.paste_events, // already recorded by recordPaste
        ai_paste_detected: true,
        ai_paste_char_count: Math.max(state.data.ai_paste_char_count ?? 0, charCount),
        integrity_stage: getIntegrityStage({
          ...state.data,
          focus_loss_events: state.data.focus_loss_events,
          paste_events: state.data.paste_events,
          current_question_focus_loss_seconds: state.data.current_question_focus_loss_seconds ?? 0,
          current_question_tab_switches: state.data.current_question_tab_switches ?? 0,
        }),
      },
    })),

  hydrate: (data: Partial<SentinelData>) =>
    set({
      data: {
        ...DEFAULT_DATA,
        ...data,
        answer_timings_ms: data.answer_timings_ms ?? DEFAULT_DATA.answer_timings_ms,
        current_question_focus_loss_seconds:
          data.current_question_focus_loss_seconds ?? DEFAULT_DATA.current_question_focus_loss_seconds,
        current_question_tab_switches:
          data.current_question_tab_switches ?? DEFAULT_DATA.current_question_tab_switches,
        integrity_stage: getIntegrityStage({
          ...DEFAULT_DATA,
          ...data,
          current_question_focus_loss_seconds:
            data.current_question_focus_loss_seconds ?? DEFAULT_DATA.current_question_focus_loss_seconds,
          current_question_tab_switches:
            data.current_question_tab_switches ?? DEFAULT_DATA.current_question_tab_switches,
        }),
      },
    }),

  reset: () => set({ data: { ...DEFAULT_DATA } }),
}));

function getIntegrityStage(data: Partial<SentinelData>) {
  if ((data.focus_loss_events ?? 0) > 3 && (data.paste_events ?? 0) > 1) {
    return 'stage_2_alert' as const;
  }

  if (
    (data.current_question_tab_switches ?? 0) > 2 ||
    (data.current_question_focus_loss_seconds ?? 0) > 30
  ) {
    return 'stage_1_alert' as const;
  }

  return 'clean' as const;
}
