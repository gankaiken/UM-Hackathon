'use client';
// components/GlobalNav.tsx — Parallel Portal Navigation v5.0 (JobStreet Inspired)
// Shared top-bar structure for both Candidate and Employer portals.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import NotificationBell from './NotificationBell';

export default function GlobalNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Fullscreen pages hide the nav
  const isHidden =
    pathname?.startsWith('/interview/') ||
    pathname?.startsWith('/result/') ||
    pathname?.includes('/apply');

  if (isHidden) return null;

  // Mode Detection
  const isEmployerMode = pathname?.startsWith('/hr') || pathname?.startsWith('/verdicts');

  // Helper for active link styling
  const isActive = (path: string) => {
    if (path === '/hr') return pathname === '/hr'; 
    return pathname?.startsWith(path);
  };

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        background: isEmployerMode 
          ? (scrolled ? '#0A0E14' : '#080A0F') // Dark for HR
          : (scrolled ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.82)'), // Light for Candidate
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: isEmployerMode
          ? '1px solid #1E2433'
          : (scrolled ? '1px solid rgba(0,0,0,0.07)' : '1px solid rgba(0,0,0,0.03)'),
        transition: 'all 0.3s ease',
        boxShadow: scrolled ? '0 1px 24px rgba(0,0,0,0.05)' : 'none',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 32px',
          height: 68, // slightly taller for professional feel
          display: 'flex',
          alignItems: 'center',
          gap: 0,
        }}
      >
        {/* ── Logo ───────────────────────────────────────────────────── */}
        <Link
          href={isEmployerMode ? "/hr" : "/"}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            flexShrink: 0,
            marginRight: 40,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
              borderRadius: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isEmployerMode ? '0 0 16px rgba(37,99,235,0.25)' : '0 2px 8px rgba(37,99,235,0.15)',
            }}
          >
            <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
            </svg>
          </div>
          <span
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: isEmployerMode ? '#F9FAFB' : '#0A0C12',
              letterSpacing: '-0.5px',
              fontFamily: 'var(--font-display)',
            }}
          >
            Talent
            <span
              style={{
                background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Bridge
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#9CA3AF',
                marginLeft: 5,
                WebkitTextFillColor: '#9CA3AF',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {isEmployerMode ? 'HR' : 'AI'}
            </span>
          </span>
        </Link>

        {/* ── Contextual Navigation Links ────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isEmployerMode ? (
            <>
              <NavItem href="/hr" label="Dashboard" active={isActive('/hr')} isDark />
              <NavItem href="/hr/upload" label="Post a Role" active={isActive('/hr/upload')} isDark />
              <NavItem href="/verdicts" label="Verdicts" active={isActive('/verdicts')} isDark />
            </>
          ) : (
            <>
              <NavItem href="/jobs" label="Job search" active={isActive('/jobs')} />
              <NavItem href="/my-applications" label="My applications" active={isActive('/my-applications')} />
              <NavItem href="/how-it-works" label="How it works" active={isActive('/how-it-works')} />
            </>
          )}
        </div>

        {/* ── Right side Actions ──────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          
          {/* Notification Bell */}
          <NotificationBell isDark={isEmployerMode} />
          
          {/* Portrait Switcher — JobStreet Style */}
          <Link
            href={isEmployerMode ? "/" : "/hr"}
            style={{
              color: isEmployerMode ? '#64748B' : '#4B5568',
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: 8,
              transition: 'all 0.2s ease',
              fontFamily: 'var(--font-body)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = isEmployerMode ? '#FFFFFF' : '#0A0C12';
              e.currentTarget.style.background = isEmployerMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = isEmployerMode ? '#64748B' : '#4B5568';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {isEmployerMode ? "Jobseeker site" : "Employer site"}
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ opacity: 0.6 }}>
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" fill="currentColor" />
            </svg>
          </Link>

          {!isEmployerMode && (
            <Link
              href="/jobs"
              className="btn-accent"
              style={{
                padding: '0 20px',
                height: 40,
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                letterSpacing: '-0.1px',
                textDecoration: 'none',
              }}
            >
              Sign up
            </Link>
          )}
        </div>
      </div>

    </nav>
  );
}

function NavItem({ href, label, active, isDark }: { href: string; label: string; active: boolean; isDark?: boolean }) {
  return (
    <Link
      href={href}
      style={{
        padding: '8px 18px',
        borderRadius: 10,
        fontSize: 14,
        fontWeight: active ? 700 : 500,
        color: active 
          ? (isDark ? '#FFFFFF' : '#2563EB') 
          : (isDark ? '#64748B' : '#4B5568'),
        textDecoration: 'none',
        background: active 
          ? (isDark ? 'rgba(37,99,235,0.2)' : 'rgba(37,99,235,0.07)') 
          : 'transparent',
        transition: 'all 0.15s ease',
        fontFamily: 'var(--font-body)',
        letterSpacing: '-0.1px',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = isDark ? '#FFFFFF' : '#0A0C12';
          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = isDark ? '#64748B' : '#4B5568';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {label}
      {active && (
        <span style={{ 
          position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', 
          width: 4, height: 4, borderRadius: '50%', 
          background: isDark ? '#2563EB' : 'currentColor' 
        }} />
      )}
    </Link>
  );
}
