// app/how-it-works/page.tsx — Architecture explanation page for judges & stakeholders
'use client';
import Link from 'next/link';

const AGENTS = [
  {
    num: '01',
    name: 'The Mapper',
    desc: 'Reads the JD and extracts 5–7 core competency dimensions with assigned weights. Identifies probe targets. Outputs strict JSON only — never generates dialogue.',
    badge: 'OUTPUT: JSON only',
    icon: '🗺️',
  },
  {
    num: '02',
    name: 'The Inquisitor',
    desc: 'Conducts the live conversation. Warm, adaptive, multilingual. Does not score or judge — only surfaces depth. Cannot be gamed because it never reveals the rubric.',
    badge: 'BM / EN / Manglish',
    icon: '💬',
  },
  {
    num: '03',
    name: 'The Strategist',
    desc: 'Real-time orchestrator. Tracks which dimensions have been covered and directs the Inquisitor to probe unexplored areas. Invisible to the candidate.',
    badge: 'REAL-TIME',
    icon: '🧭',
  },
  {
    num: '04',
    name: 'The Sentinel',
    desc: 'Passive behavioural monitor. Tracks focus losses, paste events, and tab switches. Triggers Stage 2 forensic language analysis if anomaly thresholds are breached.',
    badge: 'ZERO-LATENCY',
    icon: '🛡️',
  },
  {
    num: '05',
    name: 'Lang Style Analyzer',
    desc: 'Activated only on Sentinel Stage 2 flags. Performs 5-signal forensic analysis: register shifts, vocabulary density, response-time anomalies, coherence drops.',
    badge: 'CONDITIONAL',
    icon: '🔬',
  },
  {
    num: '06',
    name: 'The Dimension QA',
    desc: 'Validates that the Mapper\'s dimension extraction meets quality thresholds. Ensures sufficient signal coverage before the interview begins.',
    badge: 'QUALITY GATE',
    icon: '✅',
  },
  {
    num: '07',
    name: 'The Auditor',
    desc: 'Invisible to the candidate. Reads the full transcript post-interview. Strips language bias. Evaluates decision logic only. Outputs 3-colour verdict + competency scores.',
    badge: 'OUTPUT: Verdict Card',
    icon: '⚖️',
  },
];

const JOURNEY = [
  { label: 'Submit intro', done: true },
  { label: 'Mapper runs', done: true },
  { label: 'AI interview', done: true },
  { label: 'Auditor scores', done: false },
  { label: 'Verdict issued', done: false },
  { label: 'Reply in 48hr', done: false },
];

const TRIAGE = [
  {
    color: 'GREEN',
    title: 'GREEN — Fast Track',
    desc: 'Strong behavioural match. Direct to final interview.',
    bg: 'rgba(21,190,83,0.08)',
    border: 'rgba(21,190,83,0.25)',
    text: 'var(--green-text)',
  },
  {
    color: 'AMBER',
    title: 'AMBER — Conditional',
    desc: 'Great potential, one skill gap. Auto-generated 3-week upskill path. Re-scored on completion.',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    text: '#92650a',
  },
  {
    color: 'RED',
    title: 'RED — Human Review',
    desc: 'Fundamental mismatch or anomaly flags. Requires HR review before any decision.',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    text: 'var(--triage-red-text)',
  },
];

const ANTI_CHEAT = [
  {
    title: 'Window Focus Tracking',
    desc: 'document.visibilitychange events logged and timestamped. Total away duration passed to Auditor as metadata.',
    icon: '👁️',
  },
  {
    title: 'Response Timing',
    desc: '3–5 minute floor per dimension. Sub-30s or 10+ min responses flagged. Pattern analysis detects copy-paste timing.',
    icon: '⏱️',
  },
  {
    title: 'Cross-Reference Checks',
    desc: 'Inquisitor revisits same events from different angles to verify internal consistency across multiple turns.',
    icon: '🔗',
  },
  {
    title: 'Paste Event Detection',
    desc: 'Browser-level paste event listener counts clipboard insertions. High frequency triggers Sentinel Stage 2.',
    icon: '📋',
  },
  {
    title: 'Language Forensics',
    desc: 'Stage 2 analysis detects register shifts — sudden vocabulary elevation inconsistent with prior responses.',
    icon: '🔬',
  },
  {
    title: 'Session Integrity',
    desc: 'All Sentinel signals are hashed and sealed before the Auditor receives them — tamper-evident pipeline.',
    icon: '🔐',
  },
];

export default function HowItWorksPage() {
  return (
    <div style={{ paddingBottom: 80 }}>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--brand-dark)',
        padding: '80px 24px',
        textAlign: 'center',
      }}
        className="fade-in"
      >
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
            Technical Architecture
          </p>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 300,
            letterSpacing: -1.2,
            color: '#fff',
            lineHeight: 1.06,
            marginBottom: 20,
          }}>
            Seven agents working<br />in silent coordination
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontWeight: 300 }}>
            TalentBridge isn't a form with an AI label. It's a structured multi-agent pipeline
            where each agent has exactly one job — and none of them can be fooled.
          </p>
          <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/hr/upload" className="btn-primary" style={{ padding: '10px 24px' }}>
              Try It Now
            </Link>
            <Link href="/verdicts" className="btn-ghost" style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.3)', padding: '10px 24px' }}>
              View Sample Verdicts
            </Link>
          </div>
        </div>
      </div>

      {/* ── 7-Agent Pipeline ──────────────────────────────────────────── */}
      <div className="page-container">
        <div className="section-label" style={{ textAlign: 'center', marginBottom: 8 }}>Three-Agent Pipeline (Simplified)</div>
        <h2 className="heading-section" style={{ textAlign: 'center', marginBottom: 6 }}>How the pipeline works</h2>
        <p style={{ textAlign: 'center', color: 'var(--slate)', fontSize: 15, marginBottom: 48 }}>
          Each agent has a single responsibility. Separation of concerns prevents gaming.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {AGENTS.map(agent => (
            <div key={agent.num} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>{agent.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--slate)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
                    AGENT {agent.num}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--navy)', letterSpacing: -0.2 }}>{agent.name}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: 'var(--slate)', lineHeight: 1.65, marginBottom: 16 }}>
                {agent.desc}
              </p>
              <span style={{
                display: 'inline-block',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 500,
                padding: '3px 8px',
                borderRadius: 4,
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                color: 'var(--slate)',
                letterSpacing: 0.4,
              }}>
                {agent.badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Candidate Journey ──────────────────────────────────────────── */}
      <div style={{ background: 'var(--bg-subtle)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="section-label" style={{ textAlign: 'center', marginBottom: 8 }}>End-to-End Flow</div>
          <h2 className="heading-section" style={{ textAlign: 'center', marginBottom: 40 }}>Candidate Journey</h2>

          {/* Journey steps */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 0,
            marginBottom: 40,
          }}>
            {JOURNEY.map((step, i) => (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', padding: '0 12px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: step.done ? 'var(--purple)' : '#fff',
                    border: `2px solid ${step.done ? 'var(--purple)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 8px',
                    boxShadow: step.done ? 'var(--shadow-sm)' : 'none',
                  }}>
                    {step.done
                      ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : <span style={{ fontSize: 11, color: 'var(--slate)', fontWeight: 600 }}>{i + 1}</span>
                    }
                  </div>
                  <div style={{ fontSize: 12, color: step.done ? 'var(--purple)' : 'var(--slate)', fontWeight: step.done ? 500 : 400, whiteSpace: 'nowrap' }}>
                    {step.label}
                  </div>
                </div>
                {i < JOURNEY.length - 1 && (
                  <div style={{ width: 32, height: 1, background: 'var(--border)' }} />
                )}
              </div>
            ))}
          </div>

          {/* Triage outcomes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {TRIAGE.map(t => (
              <div key={t.color} style={{
                background: t.bg,
                border: `1px solid ${t.border}`,
                borderRadius: 'var(--radius-lg)',
                padding: 20,
              }}>
                <div style={{ fontWeight: 600, color: t.text, fontSize: 14, marginBottom: 8 }}>{t.title}</div>
                <p style={{ fontSize: 13, color: 'var(--slate)', lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Anti-Cheat Section ─────────────────────────────────────────── */}
      <div className="page-container">
        <div className="section-label" style={{ textAlign: 'center', marginBottom: 8 }}>Integrity Layer</div>
        <h2 className="heading-section" style={{ textAlign: 'center', marginBottom: 8 }}>Anti-Cheat Mechanisms</h2>
        <p style={{ textAlign: 'center', color: 'var(--slate)', fontSize: 15, marginBottom: 40 }}>
          Sentinel monitors every session silently. Candidates cannot disable or detect it.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {ANTI_CHEAT.map(item => (
            <div key={item.title} className="card-sm" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div style={{ fontWeight: 500, fontSize: 15, color: 'var(--navy)' }}>{item.title}</div>
              <p style={{ fontSize: 13, color: 'var(--slate)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA Band ──────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--brand-dark)', padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 300, color: '#fff', letterSpacing: -0.8, marginBottom: 16 }}>
          Ready to hire smarter?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 32 }}>
          Post your first role in under 2 minutes. AI handles the rest.
        </p>
        <Link href="/hr/upload" className="btn-primary" style={{ padding: '12px 32px', fontSize: 16 }}>
          Post a Role →
        </Link>
      </div>
    </div>
  );
}
