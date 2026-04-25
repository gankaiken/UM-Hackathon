'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import type { JdUploadResponse } from '@/lib/types';
import { getCsrfTokenFromCookie } from '@/lib/clientSecurity';

type UploadState = 'idle' | 'working' | 'done' | 'error';

function parseTimeslotLines(value: string) {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [start, end] = line.split('|').map(part => part.trim());
      if (!start || !end) return null;
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();
      return { start: startIso, end: endIso, available: true };
    })
    .filter(Boolean);
}

export default function PostJobPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [customDimensions, setCustomDimensions] = useState('');
  const [quizQuestions, setQuizQuestions] = useState('');
  const [timeslots, setTimeslots] = useState('');
  const [state, setState] = useState<UploadState>('idle');
  const [result, setResult] = useState<JdUploadResponse | null>(null);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  async function handleUpload() {
    if (!description.trim() || state === 'working') return;
    setState('working');
    setError('');
    setWarnings([]);

    try {
      const res = await fetch('/api/jd/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfTokenFromCookie() },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          requirements: requirements.trim(),
          customDimensions: customDimensions.split('\n').map(line => line.trim()).filter(Boolean),
          quizQuestions: quizQuestions.split('\n').map(line => line.trim()).filter(Boolean),
          timeslots: parseTimeslotLines(timeslots),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');

      setResult(data);
      setWarnings(Array.isArray(data.warnings) ? data.warnings : []);
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
    }
  }

  const cardStyle: CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 20,
    padding: 24,
    marginBottom: 18,
  };

  const inputStyle: CSSProperties = {
    width: '100%',
    border: '1.5px solid #D1D5DB',
    borderRadius: 12,
    padding: '14px 16px',
    fontSize: 14,
    lineHeight: 1.6,
    outline: 'none',
    fontFamily: 'var(--font-body)',
    background: '#FFFFFF',
  };

  const applyLink = result && typeof window !== 'undefined'
    ? `${window.location.origin}/jobs/${result.jdId}/apply`
    : '';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F6F9FF 0%, #FFFFFF 100%)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '56px 24px 96px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
            Employer Tools
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, color: '#0A0C12', marginBottom: 10 }}>
            Post a Role
          </h1>
          <p style={{ maxWidth: 620, color: '#6B7280', lineHeight: 1.7 }}>
            Add the role brief, safe hiring dimensions, pre-interview questions, and candidate scheduling slots in one place.
          </p>
        </div>

        <div style={{ ...cardStyle, background: '#FFFBEB', borderColor: '#FDE68A' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>Safety & compliance</div>
          <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>
            Avoid age, race, ethnicity, religion, gender, marital status, disability, and nationality-based screening.
            Nationality will be reframed to legal work authorization. Mandarin/Chinese requirements are reframed to role communication proficiency.
            MBTI or personality prompts are marked optional context-only and cannot be used for scoring or rejection.
          </div>
        </div>

        {error ? (
          <div style={{ ...cardStyle, background: '#FEF2F2', borderColor: '#FECACA', color: '#B91C1C' }}>{error}</div>
        ) : null}

        {warnings.length > 0 ? (
          <div style={{ ...cardStyle, background: '#EFF6FF', borderColor: '#BFDBFE' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', marginBottom: 8 }}>Safety adjustments applied</div>
            {warnings.map(warning => (
              <div key={warning} style={{ fontSize: 13, color: '#1E40AF', lineHeight: 1.5 }}>{warning}</div>
            ))}
          </div>
        ) : null}

        <div style={cardStyle}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 8 }}>Role title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Senior Frontend Developer" style={inputStyle} />
        </div>

        <div style={cardStyle}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 8 }}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={8} placeholder="Role summary, responsibilities, and context..." style={inputStyle} />
        </div>

        <div style={cardStyle}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 8 }}>Requirements</label>
          <textarea value={requirements} onChange={e => setRequirements(e.target.value)} rows={6} placeholder="Required capabilities, tools, and role-specific expectations..." style={inputStyle} />
        </div>

        <div style={cardStyle}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 8 }}>Custom dimensions</label>
          <textarea value={customDimensions} onChange={e => setCustomDimensions(e.target.value)} rows={4} placeholder="One per line, for example: stakeholder management" style={inputStyle} />
        </div>

        <div style={cardStyle}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 8 }}>Pre-interview quiz questions</label>
          <textarea value={quizQuestions} onChange={e => setQuizQuestions(e.target.value)} rows={4} placeholder="One per line, for example: What is your notice period?" style={inputStyle} />
        </div>

        <div style={cardStyle}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 8 }}>Available timeslots</label>
          <textarea
            value={timeslots}
            onChange={e => setTimeslots(e.target.value)}
            rows={4}
            placeholder="One slot per line: 2026-04-28 10:00 | 2026-04-28 11:00"
            style={inputStyle}
          />
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
            Use `start | end` per line. These slots appear in candidate scheduling if the candidate is eligible.
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={!description.trim() || state === 'working'}
          style={{
            width: '100%',
            height: 54,
            border: 'none',
            borderRadius: 14,
            background: '#2563EB',
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 700,
            cursor: state === 'working' ? 'wait' : 'pointer',
            opacity: !description.trim() || state === 'working' ? 0.6 : 1,
          }}
        >
          {state === 'working' ? 'Publishing...' : 'Publish job'}
        </button>

        {state === 'done' && result ? (
          <div style={{ ...cardStyle, marginTop: 20, background: '#F0FDF4', borderColor: '#A7F3D0' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#166534', marginBottom: 8 }}>{result.roleTitle} is live</div>
            <div style={{ fontSize: 14, color: '#166534', lineHeight: 1.6, marginBottom: 16 }}>
              Candidates will now follow: apply, pre-interview, formal AI interview, result, then scheduling if eligible.
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/jobs" style={{ textDecoration: 'none', background: '#2563EB', color: '#FFF', padding: '10px 18px', borderRadius: 10, fontWeight: 700 }}>
                View on job board
              </Link>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(applyLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{ background: '#FFFFFF', color: '#166534', border: '1px solid #A7F3D0', padding: '10px 18px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
              >
                {copied ? 'Copied' : 'Copy apply link'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
