'use client';
// components/candidate/SentinelTracker.tsx
// Pure JS behavioral monitoring — zero AI tokens.
// Runs as a background effect, posts events to Zustand store.

import { useEffect, useRef } from 'react';
import { useSentinelStore } from '@/store/sentinelStore';

export default function SentinelTracker() {
  const { recordFocusLoss, recordPaste, recordTabSwitch } = useSentinelStore();
  const focusLostAtRef = useRef<number | null>(null);

  useEffect(() => {
    // ── Track tab/window focus loss ──────────────────────────────────────
    const handleBlur = () => {
      focusLostAtRef.current = Date.now();
    };

    const handleFocus = () => {
      if (focusLostAtRef.current !== null) {
        const durationMs = Date.now() - focusLostAtRef.current;
        const durationSeconds = durationMs / 1000;
        recordFocusLoss(durationSeconds);
        recordTabSwitch();
        focusLostAtRef.current = null;
      }
    };

    // ── Track paste events ───────────────────────────────────────────────
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      // Only track pastes in the answer textarea
      if (target.tagName === 'TEXTAREA' || target.id === 'answer-input') {
        recordPaste();
      }
    };

    // ── Track visibility change (phone lock, tab switch) ─────────────────
    const handleVisibilityChange = () => {
      if (document.hidden) {
        focusLostAtRef.current = Date.now();
      } else {
        if (focusLostAtRef.current !== null) {
          const durationMs = Date.now() - focusLostAtRef.current;
          recordFocusLoss(durationMs / 1000);
          recordTabSwitch();
          focusLostAtRef.current = null;
        }
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [recordFocusLoss, recordPaste, recordTabSwitch]);

  // Invisible — no DOM output
  return null;
}
