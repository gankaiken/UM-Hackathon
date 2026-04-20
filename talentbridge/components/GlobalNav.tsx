'use client';
// components/GlobalNav.tsx — Unified navigation bar

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const EMPLOYER_LINKS = [
  {
    href: '/hr',
    label: 'HR Dashboard',
    icon: (
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    href: '/verdicts',
    label: 'Verdict Cards',
    icon: (
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 12c0-4.97-4.03-9-9-9S3 7.03 3 12s4.03 9 9 9 9-4.03 9-9z" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
  },
];

const CANDIDATE_LINKS = [
  {
    href: '/jobs',
    label: 'Find Jobs',
    icon: (
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '#',
    label: 'My Applications',
    icon: (
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    ),
  },
];

export default function GlobalNav() {
  const pathname = usePathname();

  const isFullscreenPage =
    pathname?.startsWith('/interview/') || pathname?.startsWith('/result/') || pathname?.includes('/apply');
  if (isFullscreenPage) return null;

  const isCandidateMode = pathname?.startsWith('/jobs');

  const activeLinks = isCandidateMode ? CANDIDATE_LINKS : EMPLOYER_LINKS;

  const isActive = (href: string) => {
    if (href === '/hr') return pathname === '/hr';
    if (href === '/jobs') return pathname === '/jobs';
    return href !== '#' && pathname?.startsWith(href);
  };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(255,255,255,0.94)',
      backdropFilter: 'blur(16px) saturate(180%)',
      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      borderBottom: '1px solid #e5edf5',
      boxShadow: 'rgba(50,50,93,0.06) 0px 1px 0px',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 24px',
        height: 60,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 0,
      }}>
        {/* Logo */}
        <Link href="/" style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          textDecoration: 'none',
          marginRight: 24,
          flexShrink: 0,
        }}>
          <div style={{
            width: 28, height: 28,
            background: '#533afd',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white"/>
            </svg>
          </div>
          <span style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#061b31',
            letterSpacing: '-0.3px',
          }}>
            Talent<span style={{ color: '#533afd' }}>Bridge</span>{' '}
            <span style={{ color: '#64748d', fontWeight: 300, fontSize: 12 }}>AI</span>
          </span>
        </Link>

        {/* Mode Switcher */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          padding: 4,
          borderRadius: 8,
          marginRight: 32,
        }}>
          <Link href="/jobs" style={{
            padding: '4px 12px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            color: isCandidateMode ? '#061b31' : '#64748d',
            background: isCandidateMode ? '#fff' : 'transparent',
            boxShadow: isCandidateMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}>
            Job Seeker
          </Link>
          <Link href="/hr" style={{
            padding: '4px 12px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            color: !isCandidateMode ? '#061b31' : '#64748d',
            background: !isCandidateMode ? '#fff' : 'transparent',
            boxShadow: !isCandidateMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}>
            Employer
          </Link>
        </div>

        {/* Nav links row */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          flex: 1,
        }}>
          {activeLinks.map(link => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: active ? 500 : 400,
                  color: active ? '#533afd' : '#273951',
                  textDecoration: 'none',
                  background: active ? 'rgba(83,58,253,0.06)' : 'transparent',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ opacity: active ? 1 : 0.6, display: 'flex', alignItems: 'center' }}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginLeft: 'auto',
        }}>
          <Link
            href="/how-it-works"
            style={{
              fontSize: 13,
              color: '#64748d',
              textDecoration: 'none',
              marginRight: 16,
              fontWeight: 500,
            }}
          >
            How It Works
          </Link>
          {!isCandidateMode && (
            <Link
              href="/hr/upload"
              style={{
                display: 'inline-flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                background: '#533afd',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12l7-7 7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Post Job
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
