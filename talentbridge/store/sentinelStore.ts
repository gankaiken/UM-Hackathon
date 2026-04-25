// store/sentinelStore.ts
// Zustand store — Sentinel behavioural tracking state (client-side only)

import { create } from 'zustand';
import type { SentinelData } from '@/lib/types';

interface SentinelStore {
  data: SentinelData;
  recordFocusLoss: (durationSeconds: number) => void;
  recordPaste: () => void;
  recordTabSwitch: () => void;
  reset: () => void;
}

const DEFAULT_DATA: SentinelData = {
  focus_loss_events: 0,
  total_away_duration_seconds: 0,
  paste_events: 0,
  tab_switches: 0,
};

export const useSentinelStore = create<SentinelStore>((set) => ({
  data: { ...DEFAULT_DATA },

  recordFocusLoss: (durationSeconds: number) =>
    set(state => ({
      data: {
        ...state.data,
        focus_loss_events: state.data.focus_loss_events + 1,
        total_away_duration_seconds: state.data.total_away_duration_seconds + durationSeconds,
      },
    })),

  recordPaste: () =>
    set(state => ({
      data: {
        ...state.data,
        paste_events: state.data.paste_events + 1,
      },
    })),

  recordTabSwitch: () =>
    set(state => ({
      data: {
        ...state.data,
        tab_switches: state.data.tab_switches + 1,
      },
    })),

  reset: () => set({ data: { ...DEFAULT_DATA } }),
}));
