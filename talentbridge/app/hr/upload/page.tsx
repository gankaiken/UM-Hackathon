'use client';
// app/hr/upload/page.tsx — Post a Job (Stripe-themed)

import { useState, useRef } from 'react';
import Link from 'next/link';
import type { JdUploadResponse } from '@/lib/types';
import { getCsrfTokenFromCookie } from '@/lib/clientSecurity';

type UploadState = 'idle' | 'scanning' | 'qa' | 'done' | 'error';

const TICKER_MESSAGES = [
  'Parsing corporate jargon...',
  'Extracting competency signals...',
  'Filtering credential requirements...',
  'Identifying behavioural dimensions...',
  'Running Dimension QA validation...',
  'Calibrating probe targets...',
];

const JD_TEMPLATES = [
  {
    label: 'Marketing Executive',
    text: `Junior Marketing Executive\n\nNexus Digital Sdn Bhd · Kuala Lumpur\n\nWe are looking for a driven Junior Marketing Executive to join our social commerce team. Focus on TikTok Shop, Instagram, and community-driven growth campaigns.\n\nKey Responsibilities:\n- Develop and execute social media strategies across TikTok, Instagram, and LinkedIn\n- Create content that drives measurable conversion and brand engagement\n- Analyse campaign performance using analytics tools and report ROI weekly\n- Build and nurture community around our brand\n- Coordinate with KOLs and external agencies\n\nRequirements:\n- Good communication skills in BM & English\n- Experience or interest in social commerce\n- Data awareness — comfortable with metrics\n- Creative mindset, self-motivated`,
  },
  {
    label: 'Frontend Developer',
    text: `Senior Frontend Developer\n\nTechCorp Malaysia · Remote-friendly\n\nWe need a Senior Frontend Developer who can own complex UI systems and mentor junior engineers.\n\nResponsibilities:\n- Architect and build scalable React/TypeScript applications\n- Design and maintain component libraries\n- Collaborate with design on UX implementation\n- Conduct code reviews and mentor juniors\n- Drive technical decisions on the frontend stack\n\nRequirements:\n- 3+ years React/TypeScript experience\n- Strong understanding of web performance\n- System design thinking\n- Excellent communication for cross-functional work`,
  },
  {
    label: 'Customer Service',
    text: `Customer Experience Specialist\n\nHandle customer inquiries across phone, email, and live chat. Resolve issues professionally and efficiently. Build long-term customer relationships. Escalate complex issues appropriately. Maintain accurate customer records.\n\nRequirements:\n- Patient, empathetic personality\n- Good interpersonal and communication skills\n- Problem-solving mindset\n- Fresh graduates welcome`,
  },
];

export default function PostJobPage() {
  const [jdText, setJdText] = useState('');
  const [customDimensions, setCustomDimensions] = useState('');
  const [quizQuestions, setQuizQuestions] = useState('');
  const [state, setState] = useState<UploadState>('idle');
  const [tickerIdx, setTickerIdx] = useState(0);
  const [result, setResult] = useState<JdUploadResponse | null>(null);
  const [error, setError] = useState('');
  const [sessionLink, setSessionLink] = useState('');
  const [copied, setCopied] = useState(false);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleUpload() {
    if (!jdText.trim() || state === 'scanning') return;
    setState('scanning');
    setResult(null);
    setError('');
    setSessionLink('');
    setTickerIdx(0);

    tickerRef.current = setInterval(() => {
      setTickerIdx(i => (i + 1) % TICKER_MESSAGES.length);
    }, 650);

    try {
      const res = await fetch('/api/jd/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfTokenFromCookie() },
        body: JSON.stringify({
          jdText: jdText.trim(),
          customDimensions: customDimensions.trim() ? customDimensions.split('\n').filter(Boolean) : [],
          quizQuestions: quizQuestions.trim() ? quizQuestions.split('\n').filter(Boolean) : []
        }),
      });
      if (tickerRef.current) clearInterval(tickerRef.current);

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error ?? 'Upload failed');
      }

      setState('qa');
      const data: JdUploadResponse = await res.json();
      await new Promise(r => setTimeout(r, 800));
      setResult(data);
      setState('done');
    } catch (err: unknown) {
      if (tickerRef.current) clearInterval(tickerRef.current);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
    }
  }

  async function createSession() {
    if (!result) return;
    const sessionRes = await fetch('/api/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jdId: result.jdId, candidateName: '' }),
    });
    if (sessionRes.ok) {
      const s = await sessionRes.json();
      setSessionLink(`${window.location.origin}/interview/${s.sessionId}`);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(sessionLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      {/* Hero header */}
      <section style={{
        background: 'linear-gradient(180deg, #F6F9FF 0%, #FFFFFF 100%)',
        padding: '56px 40px 40px',
        borderBottom: '1px solid #E5E7EB',
        marginBottom: 0,
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 12 }}>Employer Tools</div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(30px, 4vw, 44px)',
            fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.5px',
            color: '#0A0C12', marginBottom: 10,
          }}>Post a Role</h1>
          <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.65, fontFamily: 'var(--font-body)', maxWidth: 520 }}>
            Paste your job description. The AI Mapper extracts competency dimensions and activates a bespoke interview in seconds.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 40px 100px' }}>

      {/* JD Textarea */}
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <label className="section-label" style={{ marginBottom: 0 }}>Job Description</label>
          <span style={{ fontSize: 12, color: 'var(--slate)', fontVariantNumeric: 'tabular-nums' }}>
            {jdText.split(' ').filter(Boolean).length} words
          </span>
        </div>
        <textarea
          value={jdText}
          onChange={e => setJdText(e.target.value)}
          placeholder="Paste your full JD here — role, responsibilities, and requirements..."
          disabled={state === 'scanning' || state === 'qa'}
          rows={12}
          style={{
            width: '100%',
            border: '1.5px solid #D1D5DB',
            borderRadius: 10,
            padding: '14px 16px',
            color: '#0A0C12',
            fontSize: 14,
            lineHeight: 1.65,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            background: '#FFFFFF',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => {
            e.target.style.borderColor = '#2563EB';
            e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
          }}
          onBlur={e => {
            e.target.style.borderColor = '#D1D5DB';
            e.target.style.boxShadow = 'none';
          }}
        />

        {/* Template pickers */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--slate)' }}>Quick fill:</span>
          {JD_TEMPLATES.map(t => (
            <button
              key={t.label}
              onClick={() => setJdText(t.text)}
              style={{
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xs)',
                padding: '3px 10px',
                color: 'var(--slate-dark)',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.borderColor = 'var(--purple-light)';
                (e.target as HTMLElement).style.color = 'var(--purple)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.borderColor = 'var(--border)';
                (e.target as HTMLElement).style.color = 'var(--slate-dark)';
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Dimensions */}
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <label className="section-label" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          Custom Dimensions (Optional)
          <span style={{ fontSize: 11, background: '#F3F4F6', padding: '2px 6px', borderRadius: 4, color: '#4B5563', fontWeight: 500 }}>New</span>
        </label>
        <div style={{
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#92400E', marginBottom: 12,
          fontFamily: 'var(--font-body)', lineHeight: 1.5
        }}>
          <strong>Safety Warning:</strong> Do not include discriminatory categories (age, race, religion, gender, marital status, disability). Reframe nationality as "legal work authorization" and language traits as specific role requirements (e.g., "Mandarin proficiency required for role").
        </div>
        <textarea
          value={customDimensions}
          onChange={e => setCustomDimensions(e.target.value)}
          placeholder="e.g. Customer-facing confidence&#10;Technical architecture skills&#10;Legal work authorization"
          disabled={state === 'scanning' || state === 'qa'}
          rows={3}
          style={{
            width: '100%', border: '1.5px solid #D1D5DB', borderRadius: 10, padding: '14px 16px',
            color: '#0A0C12', fontSize: 14, lineHeight: 1.65, resize: 'vertical', outline: 'none',
            fontFamily: 'inherit', background: '#FFFFFF', transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => {
            e.target.style.borderColor = '#2563EB';
            e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
          }}
          onBlur={e => {
            e.target.style.borderColor = '#D1D5DB';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Pre-Interview Quiz Questions */}
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <label className="section-label" style={{ marginBottom: 4 }}>
          Pre-Interview Quiz Questions (Optional)
        </label>
        <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 12, fontFamily: 'var(--font-body)' }}>
          One question per line. Candidates will answer these before the AI interview.
        </p>
        <textarea
          value={quizQuestions}
          onChange={e => setQuizQuestions(e.target.value)}
          placeholder="e.g. How many years of React experience do you have?&#10;Do you require visa sponsorship?"
          disabled={state === 'scanning' || state === 'qa'}
          rows={3}
          style={{
            width: '100%', border: '1.5px solid #D1D5DB', borderRadius: 10, padding: '14px 16px',
            color: '#0A0C12', fontSize: 14, lineHeight: 1.65, resize: 'vertical', outline: 'none',
            fontFamily: 'inherit', background: '#FFFFFF', transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => {
            e.target.style.borderColor = '#2563EB';
            e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
          }}
          onBlur={e => {
            e.target.style.borderColor = '#D1D5DB';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!jdText.trim() || state === 'scanning' || state === 'qa'}
        className="btn-primary"
        style={{
          width: '100%',
          justifyContent: 'center',
          padding: '14px',
          fontSize: 15,
          marginBottom: 24,
          opacity: (!jdText.trim() || state === 'scanning' || state === 'qa') ? 0.5 : 1,
          cursor: (!jdText.trim() || state === 'scanning' || state === 'qa') ? 'not-allowed' : 'pointer',
        }}
      >
        {state === 'scanning' || state === 'qa' ? (
          <>
            <div className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff' }} />
            Processing...
          </>
        ) : (
          <>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white"/>
            </svg>
            Activate AI — Post This Role
          </>
        )}
      </button>

      {/* Processing Animation */}
      {(state === 'scanning' || state === 'qa') && (
        <div className="card fade-in" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div className="spinner" style={{
              width: 18, height: 18,
              border: '2px solid var(--border)',
              borderTop: '2px solid var(--purple)',
            }} />
            <span style={{ color: 'var(--purple)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
              {state === 'qa' ? 'Dimension QA validating...' : TICKER_MESSAGES[tickerIdx]}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {TICKER_MESSAGES.map((_, i) => (
              <div key={i} style={{
                height: 3, flex: 1,
                background: i <= tickerIdx ? 'var(--purple)' : 'var(--border)',
                borderRadius: 2,
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div className="fade-in" style={{
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          color: 'var(--triage-red-text)',
          fontSize: 14,
          marginBottom: 20,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Result */}
      {state === 'done' && result && (
        <div className="fade-in">
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            {/* QA Pass header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(21,190,83,0.12)',
                border: '1.5px solid rgba(21,190,83,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" stroke="var(--green-text)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--navy)', letterSpacing: -0.2 }}>
                  {result.roleTitle}
                </div>
                <div style={{ fontSize: 13, color: 'var(--slate)', marginTop: 2 }}>
                  Mapped successfully · {result.mapperResult.core_dimensions?.length ?? 5} dimensions extracted
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span className="auth-clean">
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  QA {result.qaStatus}
                </span>
              </div>
            </div>

            {/* Dimensions */}
            <div className="section-label" style={{ marginBottom: 12 }}>Competency Dimensions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(result.mapperResult.core_dimensions ?? []).map((dim: string, i: number) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                    color: 'var(--purple)', minWidth: 20,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--slate-dark)' }}>{dim}</span>
                  <div style={{ marginLeft: 'auto' }}>
                    <span className="auth-clean" style={{ fontSize: 10 }}>QA PASS</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Publish Success */}
          <div className="card" style={{ padding: 24, background: 'rgba(83,58,253,0.02)', border: '1px solid rgba(83,58,253,0.15)' }}>
            <div className="section-label" style={{ marginBottom: 4, color: 'var(--purple)' }}>
              Job is Live — Published to Candidate Portal
            </div>
            <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 16 }}>
              The role is now visible on the Job Board. Candidates can apply and immediately start their AI interview.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/jobs" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                View on Job Board
              </Link>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/jobs/${result.jdId}/apply`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }} 
                className="btn-neutral" 
                style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
              >
                {copied ? '✓ Copied!' : 'Copy Direct Apply Link'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
