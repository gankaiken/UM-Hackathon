'use client';
// components/NotificationBell.tsx
// Global notification bell — top-right, click opens panel
// Plays subtle sound on new notification

import { useState, useEffect, useRef } from 'react';

export interface Notification {
  id: string;
  type: 'deadline' | 'status' | 'system' | 'reminder';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'reminder',
    title: 'Response overdue',
    body: 'TechCorp Sdn Bhd has not responded to Alex Tan\'s application in 52 hours. HR Reputation Score affected.',
    time: '2h ago',
    read: false,
  },
  {
    id: '2',
    type: 'status',
    title: 'Verdict ready',
    body: 'Siti Nurhaliza\'s interview for Senior UX Designer is complete. Verdict: GREEN — Fast Track.',
    time: '4h ago',
    read: false,
  },
  {
    id: '3',
    type: 'deadline',
    title: '48hr response window closing',
    body: 'You have 6 hours left to respond to 3 pending candidates before your HR Reputation Score is penalised.',
    time: '6h ago',
    read: true,
  },
  {
    id: '4',
    type: 'system',
    title: 'Sentinel flag raised',
    body: 'Unusual paste behaviour detected during Ahmad Razif\'s interview. Manual review recommended.',
    time: '1d ago',
    read: true,
  },
];

function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {
    // silently ignore if audio not available
  }
}

const TYPE_CONFIG = {
  reminder: { icon: '⏰', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  status:   { icon: '✓',  color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  deadline: { icon: '🔔', color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)' },
  system:   { icon: '🛡', color: '#6366F1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)' },
};

interface Props {
  isDark?: boolean;
}

export default function NotificationBell({ isDark = false }: Props) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const panelRef = useRef<HTMLDivElement>(null);
  const soundPlayedRef = useRef(false);

  const unread = notifs.filter(n => !n.read).length;

  // Auto-close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Play sound once on mount if there are unread
  useEffect(() => {
    if (unread > 0 && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      setTimeout(playNotificationSound, 800);
    }
  }, [unread]);

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const textColor = isDark ? '#94A3B8' : '#4B5568';
  const iconBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const iconHoverBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        style={{
          width: 40, height: 40,
          borderRadius: 10,
          background: open ? iconHoverBg : iconBg,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'background 0.15s ease',
          color: textColor,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = iconHoverBg; }}
        onMouseLeave={e => { e.currentTarget.style.background = open ? iconHoverBg : iconBg; }}
        aria-label="Notifications"
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        {/* Badge */}
        {unread > 0 && (
          <span style={{
            position: 'absolute',
            top: 6, right: 6,
            width: 8, height: 8,
            borderRadius: '50%',
            background: '#EF4444',
            boxShadow: '0 0 0 2px ' + (isDark ? '#080A0F' : '#FFFFFF'),
            animation: 'pulse-glow 2s infinite',
          }} />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          width: 360,
          maxHeight: 480,
          background: isDark ? '#141820' : '#FFFFFF',
          border: isDark ? '1px solid #1E2433' : '1px solid #E5E7EB',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 500,
          animation: 'fadeInDown 0.2s ease',
        }}>
          {/* Panel Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: isDark ? '1px solid #1E2433' : '1px solid #F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: isDark ? '#F9FAFB' : '#0A0C12', fontFamily: 'var(--font-display)' }}>
                Notifications
              </span>
              {unread > 0 && (
                <span style={{
                  background: '#EF4444', color: '#FFFFFF',
                  fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                  fontFamily: 'var(--font-mono)'
                }}>
                  {unread}
                </span>
              )}
            </div>
            <button
              onClick={markAllRead}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, color: '#2563EB',
                fontFamily: 'var(--font-body)', padding: '4px 8px', borderRadius: 6,
              }}
            >
              Mark all read
            </button>
          </div>

          {/* Notification List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
                No notifications yet
              </div>
            ) : (
              notifs.map(n => {
                const cfg = TYPE_CONFIG[n.type];
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    style={{
                      padding: '14px 20px',
                      borderBottom: isDark ? '1px solid #1A2030' : '1px solid #F9FAFB',
                      display: 'flex',
                      gap: 12,
                      cursor: 'pointer',
                      background: n.read
                        ? 'transparent'
                        : isDark ? 'rgba(37,99,235,0.05)' : 'rgba(37,99,235,0.02)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB'; }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = n.read
                        ? 'transparent'
                        : isDark ? 'rgba(37,99,235,0.05)' : 'rgba(37,99,235,0.02)';
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8,
                      }}>
                        <span style={{
                          fontSize: 13, fontWeight: n.read ? 500 : 700,
                          color: isDark ? '#F9FAFB' : '#0A0C12',
                          fontFamily: 'var(--font-body)',
                        }}>
                          {n.title}
                        </span>
                        <span style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                          {n.time}
                        </span>
                      </div>
                      <p style={{
                        fontSize: 12, color: isDark ? '#64748B' : '#6B7280',
                        lineHeight: 1.5, marginTop: 3,
                        fontFamily: 'var(--font-body)',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      } as React.CSSProperties}>
                        {n.body}
                      </p>
                    </div>
                    {!n.read && (
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#2563EB', flexShrink: 0, marginTop: 6,
                      }} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 20px',
            borderTop: isDark ? '1px solid #1E2433' : '1px solid #F3F4F6',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>
              TalentBridge sends alerts for unresponded applications after <strong style={{ color: isDark ? '#64748B' : '#6B7280' }}>48 hours</strong>
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
