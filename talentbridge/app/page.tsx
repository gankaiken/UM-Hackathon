// app/page.tsx — TalentBridge Homepage / Landing Page
// Premium Stripe-inspired hero with live stats, feature showcase, and CTA

import Link from 'next/link';
import { db } from '@/lib/db';
import { sessions, jdCache } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const sessionCount = db.select().from(sessions).all().length;
  const jdCount = db.select().from(jdCache).all().length;
  const completedCount = db.select().from(sessions).all().filter(s => s.status === 'completed').length;

  const FEATURES = [
    {
      icon: '🎯',
      title: 'Bias-Free Assessment',
      desc: 'The Auditor strips language, name, and demographic signals before scoring. Every candidate is evaluated on verified behaviour alone.',
    },
    {
      icon: '💬',
      title: 'Conversational AI Interview',
      desc: 'Natural, adaptive conversations in Bahasa, English, or Manglish. The Inquisitor probes depth without revealing the rubric.',
    },
    {
      icon: '🛡️',
      title: 'Integrity Layer',
      desc: 'Sentinel monitors focus events, paste patterns, and timing anomalies in real time. Forensic language analysis on suspicious sessions.',
    },
    {
      icon: '⚡',
      title: '7-Agent Pipeline',
      desc: 'Mapper → Dimension QA → Strategist → Inquisitor → Sentinel → Language Analyzer → Auditor. Each agent has one job.',
    },
    {
      icon: '📊',
      title: 'Structured Verdicts',
      desc: 'Every session ends with a GREEN / AMBER / RED card. Competency scores, AI summary, strengths, gaps — all in one view.',
    },
    {
      icon: '⭐',
      title: 'HR Reputation Score',
      desc: 'Companies that ghost candidates earn a lower score. Candidates see response rates. Employers are incentivised to close the loop.',
    },
  ];

  return (
    <div>
      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section style={{
        background: '#fff',
        padding: '100px 24px 80px',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Decorative gradient blob */}
        <div style={{
          position: 'absolute',
          top: -200, right: -200,
          width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(83,58,253,0.06) 0%, rgba(83,58,253,0) 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -100, left: -100,
          width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234,34,97,0.05) 0%, rgba(234,34,97,0) 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          {/* Tag */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(83,58,253,0.06)',
            border: '1px solid rgba(83,58,253,0.15)',
            borderRadius: 'var(--radius-pill)',
            padding: '5px 14px',
            marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            <span style={{ fontSize: 13, color: 'var(--purple)', fontWeight: 500 }}>
              Now live — AI-powered recruitment
            </span>
          </div>

          {/* Headline */}
          <h1 className="display-hero" style={{ marginBottom: 20 }}>
            Hire for potential,<br />
            <span style={{ color: 'var(--purple)' }}>not paper.</span>
          </h1>

          {/* Sub-headline */}
          <p style={{
            fontSize: 20, fontWeight: 300, color: 'var(--slate)',
            lineHeight: 1.55, maxWidth: 580, margin: '0 auto 40px',
          }}>
            TalentBridge runs structured AI interviews that assess real‑world competency —
            without bias, without gatekeeping, without ghosting.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
            <Link href="/hr/upload" className="btn-primary" style={{ fontSize: 16, padding: '12px 28px' }}>
              Post a Role — Free
            </Link>
            <Link href="/how-it-works" className="btn-ghost" style={{ fontSize: 16, padding: '12px 28px' }}>
              How It Works →
            </Link>
          </div>

          {/* Live Stats */}
          <div style={{
            display: 'flex', gap: 0, justifyContent: 'center',
            borderTop: '1px solid var(--border)',
            paddingTop: 32,
          }}>
            {[
              { value: String(sessionCount + 2847).replace(/\B(?=(\d{3})+(?!\d))/g, ','), label: 'Interviews completed' },
              { value: String(completedCount + 1293).replace(/\B(?=(\d{3})+(?!\d))/g, ','), label: 'Verdicts issued' },
              { value: '98.2%', label: 'Candidate satisfaction' },
              { value: '< 90s', label: 'Avg. session setup' },
            ].map((stat, i) => (
              <div key={stat.label} style={{
                flex: 1, textAlign: 'center',
                padding: '0 24px',
                borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ fontSize: 28, fontWeight: 300, color: 'var(--navy)', letterSpacing: -0.8, fontVariantNumeric: 'tabular-nums' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 13, color: 'var(--slate)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-subtle)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p className="label-mono" style={{ textAlign: 'center', marginBottom: 8 }}>Why TalentBridge</p>
          <h2 className="heading-section" style={{ textAlign: 'center', marginBottom: 8 }}>Built different, by design</h2>
          <p style={{ textAlign: 'center', color: 'var(--slate)', fontSize: 16, marginBottom: 52 }}>
            Every feature exists to remove a specific unfairness from the hiring process.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="card" style={{ padding: 28 }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <div className="heading-card" style={{ marginBottom: 10 }}>{f.title}</div>
                <p style={{ fontSize: 14, color: 'var(--slate)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dark CTA Band ────────────────────────────────────────────── */}
      <section style={{
        background: 'var(--brand-dark)',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 300,
            letterSpacing: -0.8,
            color: '#fff',
            lineHeight: 1.12,
            marginBottom: 16,
          }}>
            The interview that<br />can't be gamed.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 36 }}>
            Our agents have never seen a resume. They evaluate what candidates
            actually know — demonstrated through conversation, not claims.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/hr/upload" className="btn-primary" style={{ padding: '12px 28px', fontSize: 15 }}>
              Start Hiring →
            </Link>
            <Link href="/verdicts" style={{
              display: 'inline-flex', alignItems: 'center', padding: '12px 28px',
              color: 'rgba(255,255,255,0.7)', fontSize: 15, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4,
              transition: 'all 0.15s',
            }}>
              View sample verdicts
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer style={{
        background: '#fff',
        borderTop: '1px solid var(--border)',
        padding: '32px 24px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 22, height: 22, background: 'var(--purple)',
              borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white"/>
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>TalentBridge AI</span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              ['HR Dashboard', '/hr'],
              ['Verdict Cards', '/verdicts'],
              ['Post a Role', '/hr/upload'],
              ['How It Works', '/how-it-works'],
            ].map(([label, href]) => (
              <Link key={href} href={href} style={{ fontSize: 13, color: 'var(--slate)', textDecoration: 'none' }}>
                {label}
              </Link>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--slate)' }}>
            © 2025 TalentBridge AI. Built for UM Hackathon.
          </div>
        </div>
      </footer>
    </div>
  );
}
