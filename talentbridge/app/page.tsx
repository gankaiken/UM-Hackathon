'use client';
// app/page.tsx — Premium Landing Page with Mouse Glow + Motion Effects
// Design reference: Connectly.ai × CoreShift × Dribbble Social Media Platform

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import ParticleBackground from '@/components/ParticleBackground';
import ParticleShapeWrapper from '@/components/ParticleShapeWrapper';
import Counter from '@/components/Counter';



const STATS = [
  { value: '200K+', label: 'Malaysian grads ghosted yearly' },
  { value: '73%', label: 'Never receive any reply' },
  { value: '8', label: 'Specialised workflow agents' },
  { value: '92/100', label: 'Average prompt score' },
];

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Bias-Stripped Verdicts',
    desc: 'Grammar, language register, and credentials have zero influence. The Auditor scores only decisions and actions.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: '8-Agent Workflow',
    desc: 'Mapper → QA → Strategist → Inquisitor → Sentinel → Style Analyzer → Auditor. Airtight separation of concerns.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Anti-Cheat Sentinel',
    desc: 'Pure JavaScript behavioural monitoring — zero AI tokens — detects tab switches, paste events, and focus anomalies.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    title: 'No One Gets Ghosted',
    desc: 'HR Reputation Score tracks employer response behavior privately. Delayed replies are logged and low-response employers can be warned on candidate surfaces.',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Upskill Pathfinder',
    desc: 'Amber candidates receive a personalised 3-week learning plan. Every "No" comes with a "Here\'s how to get there."',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M4 6h16M4 12h16m-7 6h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'B40 Resilient Design',
    desc: 'Works on 3G. Session persisted every turn. SSE streaming means the first character appears within 1 second.',
  },
];

const PIPELINE = [
  { num: '01', name: 'Mapper', desc: 'Reads JD, extracts 5 competency dimensions', color: '#2563EB' },
  { num: '02', name: 'QA Gate', desc: 'Validates dimensions before interviews begin', color: '#0EA5E9' },
  { num: '03', name: 'Strategist', desc: 'Directs every turn in real-time — invisible to candidate', color: '#06B6D4' },
  { num: '04', name: 'Inquisitor', desc: 'Conducts warm, multilingual conversation', color: '#10B981' },
  { num: '05', name: 'Sentinel', desc: 'Zero-token behavioural monitor', color: '#F59E0B' },
  { num: '06', name: 'Style Analyzer', desc: 'Forensic language shift detection (conditional)', color: '#EF4444' },
  { num: '07', name: 'Auditor', desc: 'Bias-stripped final verdict + structured scorecard', color: '#8B5CF6' },
];

export default function LandingPage() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.left = e.clientX + 'px';
        glowRef.current.style.top = e.clientY + 'px';
      }
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div style={{ overflow: 'hidden', background: '#FFFFFF' }}>

      {/* ── MOUSE GLOW ────────────────────────────────────────────────── */}
      <div
        ref={glowRef}
        style={{
          position: 'fixed',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, rgba(6,182,212,0.03) 40%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate(-50%, -50%)',
          transition: 'left 0.1s ease-out, top 0.1s ease-out',
        }}
      />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 40px 80px',
          position: 'relative',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #F6F9FF 0%, #FFFFFF 60%)',
        }}
      >
        {/* Antigravity particle background */}
        <ParticleBackground />

        {/* Background grid dots */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(37,99,235,0.07) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            opacity: 0.7,
            pointerEvents: 'none',
          }}
        />

        {/* Glow orbs */}
        <div style={{
          position: 'absolute', top: '15%', left: '10%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.12), transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '20%', right: '8%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.12), transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 860 }}>

          {/* Tag */}
          <div
            className="fade-in"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.2)',
              borderRadius: 40,
              padding: '6px 16px',
              marginBottom: 32,
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#2563EB',
              display: 'inline-block',
              animation: 'pulse-glow 2s ease-in-out infinite',
              boxShadow: '0 0 8px rgba(37,99,235,0.6)',
            }} />
            <span style={{
              fontSize: 13, fontWeight: 600, color: '#2563EB',
              letterSpacing: '-0.1px', fontFamily: 'var(--font-body)',
            }}>
              Malaysia&apos;s First Anti-Ghost Hiring Platform
            </span>
          </div>

          {/* Headline */}
          <h1
            className="fade-in fade-in-delay-1"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 5vw, 64px)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-2.5px',
              color: '#0A0C12',
              marginBottom: 28,
            }}
          >
            Hire smarter.<br />
            <span style={{
              background: 'linear-gradient(135deg, #1E40AF 0%, #0369A1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Ghost no one.
            </span>
          </h1>

          {/* Sub */}
          <p
            className="fade-in fade-in-delay-2"
            style={{
              fontSize: 20,
              lineHeight: 1.65,
              color: '#4B5568',
              marginBottom: 48,
              maxWidth: 640,
              margin: '0 auto 48px',
              fontFamily: 'var(--font-body)',
            }}
          >
            TalentBridge AI runs an 8-agent workflow that extracts competency dimensions from your JD,
            conducts a structured interview, and delivers bias-stripped verdicts — automatically.
          </p>

          {/* CTAs */}
          <div
            className="fade-in fade-in-delay-3"
            style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 72 }}
          >
            <Link href="/hr/upload" className="btn-accent" style={{ padding: '0 32px', height: 52, fontSize: 16 }}>
              Post a Role Free →
            </Link>
            <Link href="/jobs" className="btn-secondary" style={{ height: 52, padding: '0 28px', fontSize: 16 }}>
              Find Jobs
            </Link>
            <Link href="/how-it-works" className="btn-ghost" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 15, color: '#4B5568', fontWeight: 500,
              textDecoration: 'none', alignSelf: 'center',
              fontFamily: 'var(--font-body)',
              padding: '10px 16px',
            }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M10 8l6 4-6 4V8z" fill="currentColor"/>
              </svg>
              See how it works
            </Link>
          </div>

          {/* Stats row */}
          <div
            className="fade-in"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 2,
              background: '#F1F5F9',
              borderRadius: 20,
              padding: '4px',
              border: '1px solid #E5E7EB',
            }}
          >
            {STATS.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: '20px 16px',
                  textAlign: 'center',
                  background: '#FFFFFF',
                  borderRadius: 16,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#0A0C12',
                  letterSpacing: '-1px',
                  lineHeight: 1,
                  marginBottom: 6,
                  background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  <Counter end={s.value} delay={i * 100} />
                </div>
                <div style={{
                  fontSize: 12,
                  color: '#6B7280',
                  lineHeight: 1.4,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM STATEMENT (Dark band) ─────────────────────────────── */}
      <section
        className="section-dark"
        style={{ padding: '100px 40px', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }} />

        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <div className="label" style={{ color: '#2563EB', marginBottom: 20 }}>The Problem</div>
              <h2 className="heading-2" style={{ marginBottom: 24, color: '#F9FAFB' }}>
                Three failures every existing tool ignores
              </h2>
              <p className="body-large" style={{ marginBottom: 40 }}>
                73% of Malaysian graduates never hear back from employers — not a rejection, just silence.
                HR teams drown in AI-generated CVs. Rejected candidates receive no feedback.
              </p>
              <Link href="/how-it-works" className="btn-accent" style={{ padding: '0 28px' }}>
                See Our Solution →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { problem: 'CV inauthenticity (AI-generated)', solution: 'Multi-layer behavioural + style forensics', icon: '🛡' },
                { problem: 'Candidate ghosting', solution: 'Private HR response score with candidate-safe warnings', icon: '📡' },
                { problem: 'No feedback on rejection', solution: 'Amber upskill path / Red career redirect', icon: '🚀' },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--surface-card)',
                    border: '1.5px solid var(--surface-border)',
                    borderRadius: 16,
                    padding: '20px 24px',
                    display: 'flex',
                    gap: 16,
                    alignItems: 'flex-start',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(37,99,235,0.4)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--surface-border)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--surface-card)';
                  }}
                >
                  <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.4 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, color: '#FCA5A5', fontWeight: 600, marginBottom: 4, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Problem
                    </div>
                    <div style={{ fontSize: 14, color: '#94A3B8', marginBottom: 8 }}>{item.problem}</div>
                    <div style={{ fontSize: 12, color: '#86EFAC', fontWeight: 600, marginBottom: 4, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      TalentBridge Fixes This
                    </div>
                    <div style={{ fontSize: 14, color: '#F9FAFB', fontWeight: 500 }}>{item.solution}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES (Light section) ───────────────────────────────────── */}
      <section style={{ padding: '100px 40px', background: '#F6F8FC' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div className="label" style={{ color: '#2563EB', marginBottom: 16 }}>Platform Features</div>
            <h2 className="heading-2" style={{ marginBottom: 16, color: '#0A0C12' }}>
              Everything you need to hire with confidence
            </h2>
            <p className="body-large" style={{ maxWidth: 560, margin: '0 auto' }}>
              Not a copilot. Not a form with an AI label.
              A stateful agentic system designed end-to-end for fair, dignified hiring.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #E5E7EB',
                  borderRadius: 20,
                  padding: '32px',
                  transition: 'all 0.25s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(37,99,235,0.3)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(37,99,235,0.10)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(6,182,212,0.08))',
                    border: '1.5px solid rgba(37,99,235,0.15)',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                    color: '#2563EB',
                  }}
                >
                  {f.icon}
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#0A0C12',
                  marginBottom: 10,
                  letterSpacing: '-0.3px',
                }}>
                  {f.title}
                </h3>
                <p style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: '#6B7280',
                  fontFamily: 'var(--font-body)',
                }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PIPELINE VISUAL (Dark) ─────────────────────────────────────── */}
      <section
        className="section-black"
        style={{ padding: '100px 40px', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800, height: 800, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.08), transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div className="label" style={{ color: '#2563EB', marginBottom: 16 }}>8-Agent Architecture</div>
            <h2 className="heading-2" style={{ color: '#F9FAFB', marginBottom: 16 }}>
              The pipeline behind every verdict
            </h2>
            <p className="body-large" style={{ maxWidth: 540, margin: '0 auto' }}>
              Each agent has exactly one responsibility.
              Separation of concerns prevents gaming, hallucination, and role drift.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, alignItems: 'start' }}>
            {PIPELINE.map((agent, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                {/* Agent card */}
                <div
                  style={{
                    width: '100%',
                    background: 'var(--surface-card)',
                    border: `1.5px solid ${agent.color}30`,
                    borderRadius: 16,
                    padding: '18px 12px',
                    textAlign: 'center',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = agent.color + '80';
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${agent.color}25`;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = agent.color + '30';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
                    color: agent.color, marginBottom: 8, letterSpacing: '0.5px',
                  }}>
                    {agent.num}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: '#F9FAFB',
                    fontFamily: 'var(--font-display)', letterSpacing: '-0.2px', marginBottom: 8,
                    lineHeight: 1.3,
                  }}>
                    {agent.name}
                  </div>
                  <div style={{
                    fontSize: 11, color: '#64748B', lineHeight: 1.4,
                    fontFamily: 'var(--font-body)',
                  }}>
                    {agent.desc}
                  </div>
                </div>
                {/* Arrow connector */}
                {i < PIPELINE.length - 1 && (
                  <div style={{
                    width: '100%',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    marginTop: 'auto',
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Flow arrows between agents (just a line) */}
          <div style={{
            textAlign: 'center', marginTop: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <svg width="600" height="20" viewBox="0 0 600 20">
              <defs>
                <linearGradient id="arrowGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              <line x1="10" y1="10" x2="580" y2="10" stroke="url(#arrowGrad)" strokeWidth="2" strokeDasharray="8 6" />
              <polygon points="570,5 580,10 570,15" fill="#06B6D4" />
            </svg>
          </div>
          <p style={{
            textAlign: 'center', fontSize: 13, color: '#475569',
            fontFamily: 'var(--font-body)', marginTop: 8,
          }}>
            Left to right data flow · Each agent isolated · Verdict JSON schema-validated before release
          </p>
        </div>
      </section>

      {/* ── TRIAGE OUTCOMES (Light) ────────────────────────────────────── */}
      <section style={{ padding: '100px 40px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="label" style={{ color: '#2563EB', marginBottom: 16 }}>Verdict System</div>
            <h2 className="heading-2" style={{ color: '#0A0C12', marginBottom: 16 }}>
              Every candidate gets a clear outcome
            </h2>
            <p className="body-large" style={{ maxWidth: 500, margin: '0 auto' }}>
              No more silence. Every session produces a structured verdict with evidence,
              upskill paths, and human review flags.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
            {[
              {
                emoji: '🟢',
                label: 'GREEN — Fast Track',
                desc: 'Average dimension score ≥ 75. Candidate is directly advanced. Employer receives full scorecard and 48-hour response window starts.',
                bg: '#F0FDF4',
                border: '#BBF7D0',
                accent: '#059669',
                cta: 'Strong behavioural match',
              },
              {
                emoji: '🟡',
                label: 'AMBER — Conditional',
                desc: 'Great potential, one skill gap. A personalised 3-week upskill path is auto-generated. Candidate is re-evaluated on completion.',
                bg: '#FFFBEB',
                border: '#FDE68A',
                accent: '#D97706',
                cta: 'Gap identified + path provided',
              },
              {
                emoji: '🔴',
                label: 'Redirect — Career Pivot',
                desc: 'Fundamental mismatch. Candidate receives a dignified career orientation. The word "Red" is never shown to them.',
                bg: '#FEF2F2',
                border: '#FECACA',
                accent: '#DC2626',
                cta: 'Respectful redirect, no label',
              },
            ].map((t, i) => (
              <div
                key={i}
                style={{
                  background: t.bg,
                  border: `1.5px solid ${t.border}`,
                  borderRadius: 24,
                  padding: '36px',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 40px ${t.border}80`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 16, lineHeight: 1 }}>{t.emoji}</div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  fontWeight: 700,
                  color: t.accent,
                  marginBottom: 14,
                  letterSpacing: '-0.3px',
                }}>
                  {t.label}
                </h3>
                <p style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: '#374151',
                  fontFamily: 'var(--font-body)',
                  marginBottom: 20,
                }}>
                  {t.desc}
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 600, color: t.accent,
                  fontFamily: 'var(--font-body)',
                }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t.cta}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE CHAT DEMO MOCKUP (Dark) ──────────────────────────────── */}
      <section
        className="section-dark"
        style={{ padding: '100px 40px', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <div className="label" style={{ color: '#06B6D4', marginBottom: 20 }}>Live AI Interview</div>
            <h2 className="heading-2" style={{ color: '#F9FAFB', marginBottom: 24 }}>
              The Inquisitor speaks.<br />The candidate never sees the strategy.
            </h2>
            <p className="body-large" style={{ marginBottom: 32 }}>
              Behind every question is the Strategist&apos;s live dimension coverage map.
              The Inquisitor converts cold JSON instructions into warm, natural conversation.
              Candidates cannot game what they cannot see.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link href="/how-it-works" className="btn-accent" style={{ padding: '0 28px' }}>
                View Architecture →
              </Link>
              <Link href="/hr/upload" className="btn-ghost" style={{ padding: '0 24px' }}>
                Try Live Demo
              </Link>
            </div>
          </div>

          {/* Chat mockup */}
          <div style={{
            background: 'var(--surface-card)',
            border: '1.5px solid var(--surface-border)',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
          }}>
            {/* Header */}
            <div style={{
              background: 'var(--surface-dark)',
              borderBottom: '1px solid var(--surface-border)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F9FAFB' }}>TalentBridge AI</div>
                <div style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                  Inquisitor Active · Turn 7
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{
                  background: 'rgba(245,158,11,0.15)', color: '#F59E0B',
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                  fontFamily: 'var(--font-mono)',
                }}>
                  SENTINEL ACTIVE
                </span>
              </div>
            </div>

            {/* Chat messages */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* AI msg */}
              <div style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--surface-border)',
                borderRadius: '16px 16px 16px 4px',
                padding: '14px 16px',
                maxWidth: '85%', alignSelf: 'flex-start',
              }}>
                <p style={{ fontSize: 13, color: '#E2E8F0', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                  You mentioned growing a TikTok page to 12,000 followers — what specific strategy shift did you make when the algorithm changed?
                </p>
              </div>

              {/* User msg */}
              <div style={{
                background: 'linear-gradient(135deg, #2563EB, #0EA5E9)',
                borderRadius: '16px 16px 4px 16px',
                padding: '14px 16px',
                maxWidth: '80%', alignSelf: 'flex-end',
              }}>
                <p style={{ fontSize: 13, color: '#fff', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                  lepas algorithm tukar end of last year, saya stop buat trending video and focus balik kat loyal community — buat live every week, reply semua comments...
                </p>
              </div>

              {/* AI msg 2 */}
              <div style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--surface-border)',
                borderRadius: '16px 16px 16px 4px',
                padding: '14px 16px',
                maxWidth: '85%', alignSelf: 'flex-start',
              }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563EB', animation: 'typing-bounce 1.2s infinite ease-in-out' }} />
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563EB', animation: 'typing-bounce 1.2s 0.2s infinite ease-in-out' }} />
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563EB', animation: 'typing-bounce 1.2s 0.4s infinite ease-in-out' }} />
                </div>
              </div>
            </div>

            {/* Strategist overlay */}
            <div style={{
              margin: '0 20px 20px',
              background: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.2)',
              borderRadius: 12,
              padding: '12px 16px',
            }}>
              <div style={{ fontSize: 10, color: '#2563EB', fontWeight: 700, fontFamily: 'var(--font-mono)', marginBottom: 6, letterSpacing: '0.5px' }}>
                STRATEGIST COVERAGE MAP — HIDDEN FROM CANDIDATE
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { label: 'Content Creation', state: 'DEVELOPING', color: '#F59E0B' },
                  { label: 'Analytics', state: 'UNEXPLORED', color: '#64748B' },
                  { label: 'Campaign Exec', state: 'SUFFICIENT', color: '#10B981' },
                  { label: 'Community', state: 'TOUCHED', color: '#0EA5E9' },
                  { label: 'Creative Output', state: 'UNEXPLORED', color: '#64748B' },
                ].map((d) => (
                  <div key={d.label} style={{
                    fontSize: 10, padding: '3px 8px', borderRadius: 4,
                    background: d.color + '20', color: d.color,
                    fontFamily: 'var(--font-mono)', fontWeight: 600,
                    letterSpacing: '0.3px',
                  }}>
                    {d.label}: {d.state}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEVELOPER MODULE (Stardust + Shape) ────────────────────────── */}
      <section 
        style={{ 
          padding: '120px 40px', 
          background: '#05070A', 
          position: 'relative', 
          overflow: 'hidden' 
        }}
      >
        {/* Secondary stardust background for this section */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.6 }}>
          <ParticleBackground mode="random" dark={true} />
        </div>

        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <ParticleShapeWrapper shape="braces">
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="label" style={{ color: '#8B5CF6', marginBottom: 20 }}>For Developers</div>
              <h2 className="heading-2" style={{ color: '#F9FAFB', marginBottom: 24, fontSize: 'clamp(32px, 4vw, 48px)' }}>
                Integrate TalentBridge into your existing stack
              </h2>
              <p className="body-large" style={{ maxWidth: 640, margin: '0 auto 48px', color: '#94A3B8' }}>
                Explore how TalentBridge could plug into a broader recruitment stack.
                This demo showcases the interview engine and the shape of future integration workflows.
              </p>
              
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                <code style={{ 
                  background: '#1A1D23', 
                  color: '#A5B4FC', 
                  padding: '12px 20px', 
                  borderRadius: 12, 
                  fontSize: 14,
                  fontFamily: 'var(--font-mono)',
                  border: '1px solid #2D3139'
                }}>
                  npm install @talentbridge/sdk
                </code>
                <button className="btn-ghost" style={{ height: 46, color: '#F9FAFB', border: '1px solid rgba(255,255,255,0.2)' }}>
                  View API Docs
                </button>
              </div>
            </div>
          </ParticleShapeWrapper>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}

      <section
        style={{
          padding: '120px 40px',
          background: 'linear-gradient(135deg, #0F1117 0%, #080A0F 50%, #0A1628 100%)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.15), transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)',
            borderRadius: 40, padding: '6px 16px', marginBottom: 32,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 8px rgba(16,185,129,0.8)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#6EE7B7' }}>Platform is live · B40-optimised</span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5vw, 60px)',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: 24,
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
          }}>
            Ready to hire smarter?
          </h2>
          <p style={{
            fontSize: 18, color: '#94A3B8', lineHeight: 1.65,
            marginBottom: 48, fontFamily: 'var(--font-body)',
          }}>
            Post your first role in under 2 minutes.
            The 8-agent workflow handles everything from extraction to verdict and follow-up preview.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/hr/upload" className="btn-accent" style={{ height: 52, padding: '0 36px', fontSize: 16 }}>
              Post a Role Free →
            </Link>
            <Link href="/jobs" style={{
              display: 'inline-flex', alignItems: 'center',
              height: 52, padding: '0 28px',
              borderRadius: 10, fontSize: 15, fontWeight: 500,
              color: '#94A3B8', textDecoration: 'none',
              border: '1.5px solid rgba(255,255,255,0.12)',
              transition: 'all 0.2s ease', fontFamily: 'var(--font-body)',
            }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#F9FAFB';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#94A3B8';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
              }}
            >
              I&apos;m a Job Seeker
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
