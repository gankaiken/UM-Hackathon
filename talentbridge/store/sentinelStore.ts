// store/sentinelStore.ts
// Zustand store — Sentinel behavioural tracking state (client-side only)

import { create } from 'zustand';
import type { SentinelData } from '@/lib/types';
import {
  beginSentinelQuestionWindow,
  DEFAULT_SENTINEL_DATA,
  normalizeSentinelData,
  transitionIntegrityStage,
} from '@/lib/sentinel';

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

export const useSentinelStore = create<SentinelStore>((set) => ({
  data: { ...DEFAULT_SENTINEL_DATA },

  beginQuestionWindow: () =>
    set(state => ({
      data: beginSentinelQuestionWindow(state.data),
    })),

  recordFocusLoss: (durationSeconds: number) =>
    set(state => ({
      data: {
        ...state.data,
        focus_loss_events: state.data.focus_loss_events + 1,
        total_away_duration_seconds: state.data.total_away_duration_seconds + durationSeconds,
        current_question_focus_loss_seconds:
          (state.data.current_question_focus_loss_seconds ?? 0) + durationSeconds,
        integrity_stage: transitionIntegrityStage({
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
        integrity_stage: transitionIntegrityStage({
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
        integrity_stage: transitionIntegrityStage({
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
        integrity_stage: transitionIntegrityStage({
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
        integrity_stage: transitionIntegrityStage({
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
      data: normalizeSentinelData(data),
    }),

  reset: () => set({ data: { ...DEFAULT_SENTINEL_DATA } }),
}));
