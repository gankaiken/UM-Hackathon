'use client';

import type { CSSProperties, ReactNode } from 'react';

type Tone = 'info' | 'success' | 'warning' | 'error';

const TONES: Record<Tone, { background: string; border: string; color: string }> = {
  info: { background: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' },
  success: { background: '#F0FDF4', border: '#A7F3D0', color: '#047857' },
  warning: { background: '#FFFBEB', border: '#FDE68A', color: '#B45309' },
  error: { background: '#FEF2F2', border: '#FECACA', color: '#B91C1C' },
};

export default function StatusNotice({
  tone = 'info',
  title,
  children,
  style,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const colors = TONES[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      style={{
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        padding: '12px 14px',
        color: colors.color,
        ...style,
      }}
    >
      {title ? (
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </div>
      ) : null}
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}
