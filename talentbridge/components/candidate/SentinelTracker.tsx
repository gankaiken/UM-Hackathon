'use client';
// components/candidate/SentinelTracker.tsx
// Pure JS behavioral monitoring — zero AI tokens.
// Runs as a background effect, posts events to Zustand store.
// Hard-coded rule: paste > 150 chars in textarea → auto-flag as AI-generated.

import { useEffect, useRef } from 'react';
import { useSentinelStore } from '@/store/sentinelStore';

// Threshold: pastes longer than this are auto-flagged as AI-generated content
const AI_PASTE_CHAR_THRESHOLD = 150;

export default function SentinelTracker() {
  const { recordFocusLoss, recordPaste, recordTabSwitch, recordAiPaste } = useSentinelStore();
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

    // ── Track paste events with AI auto-detection ────────────────────────
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.id === 'answer-input') {
        recordPaste();

        // Hard-coded rule: large paste = AI-generated
        const pastedText = e.clipboardData?.getData('text') ?? '';
        if (pastedText.length >= AI_PASTE_CHAR_THRESHOLD) {
          console.warn(
            `[Sentinel] HARD RULE: Paste of ${pastedText.length} chars exceeds threshold (${AI_PASTE_CHAR_THRESHOLD}). Auto-flagging as AI-generated.`
          );
          recordAiPaste(pastedText.length);
        }
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
  }, [recordFocusLoss, recordPaste, recordTabSwitch, recordAiPaste]);

  // Invisible — no DOM output
  return null;
}
