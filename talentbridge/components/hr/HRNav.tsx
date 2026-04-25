'use client';
// components/hr/HRNav.tsx — Dedicated HR Workspace Sidebar v1.0
// Dark "Agentic Terminal" aesthetic. Only rendered inside /hr/* routes.

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HRNavProps {
  activeSessions?: number;
  completedCount?: number;
}

const NAV_ITEMS = [
  {
    href: '/hr',
    exact: true,
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    href: '/hr/upload',
    label: 'Post a Role',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12l7-7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/verdicts',
    label: 'Verdicts',
    badge: true,
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function HRNav({ activeSessions = 0, completedCount = 0 }: HRNavProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };

  return (
    <aside
      style={{
        width: 240,
        minHeight: '100vh',
        background: '#080A0F',
        borderRight: '1px solid #1E2433',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
      }}
    >
      {/* ── Logo / Brand ──────────────────────────────────────────── */}
      <div
        style={{
          padding: '28px 24px 24px',
          borderBottom: '1px solid #1E2433',
        }}
      >
        <Link
          href="/hr"
          style={{ textDecoration: 'none', display: 'block' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 16px rgba(37,99,235,0.35)',
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#F9FAFB',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.4px',
                  lineHeight: 1.2,
                }}
              >
                TalentBridge
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#2563EB',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                HR Workspace
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ── Nav Items ─────────────────────────────────────────────── */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#374151',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            padding: '0 12px',
            marginBottom: 8,
          }}
        >
          Navigation
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="hr-nav-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: active ? '#F9FAFB' : '#6B7280',
                  background: active ? 'rgba(37,99,235,0.15)' : 'transparent',
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  borderLeft: active ? '2.5px solid #2563EB' : '2.5px solid transparent',
                  marginLeft: -2,
                }}
              >
                <span style={{ color: active ? '#2563EB' : '#4B5568', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && completedCount > 0 && (
                  <span
                    style={{
                      background: '#2563EB',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '1px 7px',
                      borderRadius: 20,
                      fontFamily: 'var(--font-mono)',
                      minWidth: 20,
                      textAlign: 'center',
                    }}
                  >
                    {completedCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* ── Divider ───────────────────────────────────────────────── */}
        <div style={{ height: 1, background: '#1E2433', margin: '16px 12px' }} />

        {/* Settings */}
        <Link
          href="#"
          className="hr-nav-link"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 12px',
            borderRadius: 10,
            textDecoration: 'none',
            color: '#4B5568',
            background: 'transparent',
            fontSize: 14,
            fontWeight: 400,
            fontFamily: 'var(--font-body)',
            transition: 'all 0.15s ease',
            borderLeft: '2.5px solid transparent',
            marginLeft: -2,
          }}
        >
          <span style={{ flexShrink: 0 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.8" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </span>
          Settings
        </Link>
      </nav>

      {/* ── Status Footer ─────────────────────────────────────────── */}
      <div
        style={{
          padding: '16px 24px 28px',
          borderTop: '1px solid #1E2433',
        }}
      >
        {/* Pipeline Status */}
        <div
          style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.15)',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#10B981',
                display: 'inline-block',
                boxShadow: '0 0 8px rgba(16,185,129,0.8)',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#10B981',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Pipeline Operational
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#4B5568',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.4,
            }}
          >
            {activeSessions > 0
              ? `${activeSessions} active session${activeSessions > 1 ? 's' : ''}`
              : 'No active sessions'}
            {' · '}7 agents ready
          </div>
        </div>

        {/* Back to public site */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: '#374151',
            textDecoration: 'none',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            padding: '6px 0',
            transition: 'color 0.15s ease',
          }}
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to public site
        </Link>
      </div>
    </aside>
  );
}
