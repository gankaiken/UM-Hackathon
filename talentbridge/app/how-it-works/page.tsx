'use client';
// app/how-it-works/page.tsx — Architecture Page v3.0
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Eye, Clipboard, Timer, Link as LinkIcon, Microscope, ShieldCheck, Check, Search, Upload, UserPlus, MessageSquare, FileText, Send, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

const AGENTS = [
  {
    num: '01', name: 'The Mapper', version: 'v1.2', score: '88/100',
    desc: 'Reads the JD and extracts exactly 5 core competency dimensions that are behavioural, testable, and distinct. Identifies probe targets. Outputs strict JSON only — never generates dialogue.',
    badge: 'Output: JSON only',
    badgeColor: '#2563EB',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: '02', name: 'Dimension QA', version: 'v1.1', score: '93/100',
    desc: 'Quality gatekeeper. Validates Mapper output across 3 checks: JD support, testability, and distinctness. Returns PASS, REVISE, or PASS_WITH_WARNING. Never rewrites — only validates.',
    badge: 'Quality gate',
    badgeColor: '#0EA5E9',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: '03', name: 'The Strategist', version: 'v1.1', score: '93/100',
    desc: 'Invisible real-time brain. After every candidate response, it updates a multi-state coverage map and selects the next action from a 5-priority tree.',
    badge: 'Real-time',
    badgeColor: '#06B6D4',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: '04', name: 'The Inquisitor', version: 'v1.3', score: '92/100',
    desc: 'The only agent that speaks to the candidate. Converts cold Strategist JSON into warm, natural conversation. Handles BM / English / Manglish. Has zero decision authority — only asks.',
    badge: 'BM / EN / Manglish',
    badgeColor: '#10B981',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: '05', name: 'The Sentinel', version: 'Pure Code', score: 'Zero tokens',
    desc: 'Pure JavaScript behavioural watchdog. Monitors tab switches, focus loss, paste events, and response timing. Stage 1 flags Strategist. Stage 2 (focus_loss > 3 AND paste > 1) triggers Style Analyzer.',
    badge: 'Zero AI tokens',
    badgeColor: '#F59E0B',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: '06', name: 'Style Analyzer', version: 'v1.1', score: '95/100',
    desc: 'Conditional forensic analyst. Only fires on Sentinel Stage 2 alert. Scores 5 signals: response length shifts, formality jumps, register switches, personal detail density drops, colloquial marker loss.',
    badge: 'Conditional only',
    badgeColor: '#8B5CF6',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: '07', name: 'The Auditor', version: 'v1.2', score: '91/100',
    desc: 'Invisible final judge. Reads the full transcript + all metadata. Strips all bias signals (grammar, language, credentials). Scores only Action Nodes — decisions taken, results quantified, adaptation shown.',
    badge: 'Output: Verdict Card',
    badgeColor: '#EF4444',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const ANTI_CHEAT = [
  {
    title: 'Window Focus Tracking',
    desc: 'document.visibilitychange events logged and timestamped. Total away duration passed to Auditor as tamper-evident metadata.',
    icon: <Eye size={24} color="#2563EB" />,
  },
  {
    title: 'Paste Event Detection',
    desc: 'Browser-level paste listener counts clipboard insertions per question. High frequency triggers Sentinel Stage 2.',
    icon: <Clipboard size={24} color="#2563EB" />,
  },
  {
    title: 'Response Timing',
    desc: 'Per-question elapsed time tracked. Sub-30s or 10+ min responses flagged. Timing pattern analysis detects copy-paste behaviour.',
    icon: <Timer size={24} color="#2563EB" />,
  },
  {
    title: 'Reality Check Probes',
    desc: 'Strategist injects specific detail questions that only someone with genuine lived experience can answer credibly.',
    icon: <LinkIcon size={24} color="#2563EB" />,
  },
  {
    title: 'Language Style Forensics',
    desc: 'Stage 2 analysis scores 5 signals across early vs late session halves. A sudden vocabulary elevation inconsistent with prior responses gets flagged.',
    icon: <Microscope size={24} color="#2563EB" />,
  },
  {
    title: 'Schema Validator',
    desc: 'Pure code validator checks Auditor output completeness before any verdict reaches the employer. Retry logic on failure.',
    icon: <ShieldCheck size={24} color="#2563EB" />,
  },
];

export default function HowItWorksPage() {
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
    <div style={{ overflow: 'hidden' }}>
      {/* Mouse Glow */}
      <div
        ref={glowRef}
        style={{
          position: 'fixed', width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 9999,
          transform: 'translate(-50%, -50%)',
          transition: 'left 0.12s ease-out, top 0.12s ease-out',
        }}
      />

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section
        className="section-dark"
        style={{
          padding: '120px 40px 100px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }} />
        <div style={{
          position: 'absolute', top: '30%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.12), transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto' }}>
          <div className="label" style={{ color: '#06B6D4', marginBottom: 24 }}>Technical Architecture</div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(40px, 5.5vw, 68px)',
              fontWeight: 800,
              lineHeight: 1.07,
              letterSpacing: '-2px',
              color: '#F9FAFB',
              marginBottom: 24,
            }}
          >
            Seven agents working <br /> in silent coordination
          </h1>
          <p className="body-large" style={{ color: '#94A3B8', marginBottom: 48, maxWidth: 580, margin: '0 auto 48px' }}>
            TalentBridge isn&apos;t a form with an AI label. It&apos;s a structured multi-agent pipeline where
            each agent has exactly one job — and none of them can be fooled by the candidate.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/hr/upload" className="btn-accent" style={{ padding: '0 32px', height: 52 }}>
              Try It Live →
            </Link>
            <Link href="/verdicts" className="btn-ghost" style={{ height: 52, padding: '0 24px' }}>
              View Sample Verdicts
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7-AGENT CARDS (Light) ─────────────────────────────────────── */}
      <section style={{ padding: '100px 40px', background: '#F6F8FC' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="label" style={{ color: '#2563EB', marginBottom: 16 }}>The 8-Agent Workflow</div>
            <h2 className="heading-2" style={{ color: '#0A0C12', marginBottom: 16 }}>How the pipeline works</h2>
            <p className="body-large" style={{ maxWidth: 560, margin: '0 auto' }}>
              Separation of concerns prevents role drift, gaming, and hallucination.
              Average prompt score: <strong style={{ color: '#0A0C12' }}>92/100</strong>
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {AGENTS.map((agent) => (
              <div
                key={agent.num}
                style={{
                  gridColumn: agent.num === '07' ? '1 / -1' : 'auto',
                  background: '#FFFFFF',
                  border: '1.5px solid #E5E7EB',
                  borderRadius: 20,
                  padding: '28px',
                  transition: 'all 0.25s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = agent.badgeColor + '60';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${agent.badgeColor}15`;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, flexShrink: 0,
                    background: agent.badgeColor + '12',
                    border: `1.5px solid ${agent.badgeColor}25`,
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: agent.badgeColor,
                  }}>
                    {agent.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: '#9CA3AF',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.8px', marginBottom: 4, textTransform: 'uppercase',
                    }}>
                      AGENT {agent.num}
                    </div>
                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#0A0C12',
                      letterSpacing: '-0.3px',
                    }}>
                      {agent.name}
                    </h3>
                  </div>
                </div>

                <p style={{
                  fontSize: 14, lineHeight: 1.65, color: '#6B7280',
                  fontFamily: 'var(--font-body)', marginBottom: 18,
                }}>
                  {agent.desc}
                </p>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    background: agent.badgeColor + '12',
                    color: agent.badgeColor,
                    fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-body)',
                    padding: '4px 10px', borderRadius: 6,
                    letterSpacing: '0.3px',
                  }}>
                    {agent.badge}
                  </span>
                  <span style={{
                    fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-mono)',
                  }}>
                    {agent.version} · {agent.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CANDIDATE JOURNEY (Dark) ──────────────────────────────────── */}
      <section className="section-dark" style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="label" style={{ color: '#06B6D4', marginBottom: 16 }}>End-to-End Flow</div>
            <h2 className="heading-2" style={{ color: '#F9FAFB', marginBottom: 16 }}>Candidate Journey</h2>
            <p className="body-large" style={{ maxWidth: 500, margin: '0 auto' }}>
              From JD upload to verdict card — everything automated, nothing manual.
            </p>
          </div>

          {/* Journey steps */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px 48px',
            marginBottom: 64,
          }}>
            {[
              { label: 'Employer uploads JD', sub: 'Mapper + QA run once — cached for all candidates', done: true, icon: <Upload size={20} /> },
              { label: 'Candidate enters via link', sub: 'No registration. Name → start immediately', done: true, icon: <UserPlus size={20} /> },
              { label: 'AI interview', sub: '15–20 min. Inquisitor + Strategist + Sentinel running', done: true, icon: <MessageSquare size={20} /> },
              { label: 'Auditor scores', sub: 'Full transcript analysis. Bias stripped.', done: false, icon: <FileText size={20} /> },
              { label: 'Verdict issued', sub: 'Green / Amber / Redirect. Schema validated.', done: false, icon: <Send size={20} /> },
              { label: 'Employer responds (48hr)', sub: 'HR Reputation Score tracks every reply', done: false, icon: <Check size={20} /> },
            ].map((step, i) => (
              <div key={step.label} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '24px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)',
                position: 'relative',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: step.done ? 'linear-gradient(135deg, #2563EB, #0EA5E9)' : 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                  color: step.done ? '#FFF' : '#475569',
                  boxShadow: step.done ? '0 0 20px rgba(37,99,235,0.3)' : 'none',
                }}>
                  {step.icon}
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: '#06B6D4',
                  fontFamily: 'var(--font-mono)', letterSpacing: '1px',
                  marginBottom: 8, textTransform: 'uppercase',
                }}>
                  STEP 0{i + 1}
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 600,
                  color: '#F9FAFB',
                  fontFamily: 'var(--font-body)', marginBottom: 6,
                }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5 }}>{step.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              {
                icon: <CheckCircle2 size={32} color="#10B981" />,
                title: 'GREEN — Fast Track',
                desc: 'Average ≥ 75. Direct to final interview. Employer gets 48-hour response window tracked by system.',
                color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',
              },
              {
                icon: <AlertCircle size={32} color="#F59E0B" />,
                title: 'AMBER — Conditional',
                desc: 'Great potential + one learnable gap. 3-week upskill path generated. Re-evaluation offered on completion.',
                color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',
              },
              {
                icon: <XCircle size={32} color="#EF4444" />,
                title: 'Redirect — Career Pivot',
                desc: 'Fundamental mismatch. Candidate receives dignified career orientation. The word "Red" is never shown to them.',
                color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)',
              },
            ].map((t) => (
              <div
                key={t.title}
                style={{
                  background: t.bg, border: `1.5px solid ${t.border}`,
                  borderRadius: 24, padding: '32px 32px 48px',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 40px ${t.border}`;
                  (e.currentTarget as HTMLElement).style.borderColor = t.color;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.borderColor = t.border;
                }}
              >
                <div style={{ marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontWeight: 800, color: t.color, fontSize: 16, fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>
                  {t.title}
                </div>
                <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
                  {t.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANTI-CHEAT (Light) ───────────────────────────────────────── */}
      <section style={{ padding: '100px 40px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="label" style={{ color: '#2563EB', marginBottom: 16 }}>Integrity Layer</div>
            <h2 className="heading-2" style={{ color: '#0A0C12', marginBottom: 16 }}>Anti-Cheat Mechanisms</h2>
            <p className="body-large" style={{ maxWidth: 520, margin: '0 auto' }}>
              Sentinel monitors every session silently. Candidates cannot disable or detect it.
              Flags are metadata — they never auto-reject.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {ANTI_CHEAT.map((item) => (
              <div
                key={item.title}
                style={{
                  background: '#F6F8FC',
                  border: '1.5px solid #E5E7EB',
                  borderRadius: 18,
                  padding: '28px',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(37,99,235,0.25)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 30px rgba(37,99,235,0.08)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#F6F8FC';
                  (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 16, lineHeight: 1 }}>{item.icon}</div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16, fontWeight: 700,
                  color: '#0A0C12', marginBottom: 10, letterSpacing: '-0.3px',
                }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: '#6B7280', fontFamily: 'var(--font-body)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: '100px 40px',
          background: 'linear-gradient(135deg, #0F1117, #080A0F)',
          textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.14), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="heading-2" style={{ color: '#F9FAFB', marginBottom: 24 }}>
            Ready to hire smarter?
          </h2>
          <p className="body-large" style={{ marginBottom: 48, maxWidth: 520, margin: '0 auto 48px' }}>
            Post your first role in under 2 minutes. The 8-agent workflow handles everything.
          </p>
          <Link href="/hr/upload" className="btn-accent" style={{ padding: '0 36px', height: 52, fontSize: 16 }}>
            Initialize Agent Workflow →
          </Link>
        </div>
      </section>
    </div>
  );
}
