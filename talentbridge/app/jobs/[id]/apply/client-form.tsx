'use client';
// app/jobs/[id]/apply/client-form.tsx — Premium Apply Form v4.0
// Now includes: full name, resume upload, portfolio URL, short bio, LinkedIn

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface FormData {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolioUrl: string;
  bio: string;
  resumeFile: File | null;
}

export default function ApplyForm({ jdId, roleTitle, employer }: { jdId: string; roleTitle: string; employer: string }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    portfolioUrl: '',
    bio: '',
    resumeFile: null,
  });

  const set = (field: keyof FormData, value: string | File | null) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.docx') || file.name.endsWith('.doc'))) {
      set('resumeFile', file);
    } else {
      setError('Please upload a PDF or Word document.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) set('resumeFile', file);
  };

  const proceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Please enter your full name.'); return; }
    if (!form.email.trim() || !form.email.includes('@')) { setError('Please enter a valid email address.'); return; }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jdId,
          candidateName: form.name.trim(),
          candidateEmail: form.email.trim(),
          candidatePhone: form.phone.trim(),
          candidateLinkedin: form.linkedin.trim(),
          candidatePortfolio: form.portfolioUrl.trim(),
          candidateBio: form.bio.trim(),
          hasResume: !!form.resumeFile,
          resumeFileName: form.resumeFile?.name ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create session');
      router.push(`/interview/${data.sessionId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', fontSize: 15,
    border: '1.5px solid #E5E7EB', borderRadius: 12,
    outline: 'none', background: '#FFFFFF', color: '#0A0C12',
    fontFamily: 'var(--font-body)', transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563',
    marginBottom: 8, fontFamily: 'var(--font-body)',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  };

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = '#2563EB';
    e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.08)';
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = '#E5E7EB';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div>
      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, alignItems: 'center' }}>
        {[1, 2].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: step >= s ? '#2563EB' : '#F3F4F6',
              color: step >= s ? '#FFFFFF' : '#9CA3AF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
              transition: 'all 0.3s ease',
            }}>
              {step > s ? '✓' : s}
            </div>
            <span style={{
              fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
              color: step >= s ? '#2563EB' : '#9CA3AF',
            }}>
              {s === 1 ? 'Your Info' : 'Profile & Resume'}
            </span>
            {s === 1 && <div style={{ width: 32, height: 1, background: step > 1 ? '#2563EB' : '#E5E7EB', transition: 'all 0.3s' }} />}
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          padding: '12px 16px', background: 'rgba(239,68,68,0.06)', color: '#DC2626',
          border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, fontSize: 13,
          fontFamily: 'var(--font-body)', fontWeight: 500, marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {/* ── STEP 1: Personal Info ──────────────────────────────────── */}
      {step === 1 && (
        <form onSubmit={proceedToStep2} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input
              type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Aisyah Binti Razali" style={inputStyle}
              onFocus={focusStyle} onBlur={blurStyle} autoFocus
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Email *</label>
              <input
                type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="you@email.com" style={inputStyle}
                onFocus={focusStyle} onBlur={blurStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+60 12 345 6789" style={inputStyle}
                onFocus={focusStyle} onBlur={blurStyle}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>LinkedIn Profile</label>
            <input
              type="url" value={form.linkedin} onChange={e => set('linkedin', e.target.value)}
              placeholder="https://linkedin.com/in/..." style={inputStyle}
              onFocus={focusStyle} onBlur={blurStyle}
            />
          </div>
          <button type="submit" className="btn-accent" style={{
            marginTop: 8, padding: '0 24px', height: 52, fontSize: 16,
            justifyContent: 'center', width: '100%',
          }}>
            Continue → Profile & Resume
          </button>
        </form>
      )}

      {/* ── STEP 2: Resume + Portfolio ─────────────────────────────── */}
      {step === 2 && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Resume Upload */}
          <div>
            <label style={labelStyle}>Resume / CV</label>
            <div
              onDrop={handleFileDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? '#2563EB' : form.resumeFile ? '#10B981' : '#E5E7EB'}`,
                borderRadius: 14, padding: '28px 20px', textAlign: 'center',
                cursor: 'pointer', background: dragOver ? 'rgba(37,99,235,0.04)' : form.resumeFile ? 'rgba(16,185,129,0.04)' : '#FAFAFA',
                transition: 'all 0.2s ease',
              }}
            >
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileSelect} style={{ display: 'none' }} />
              {form.resumeFile ? (
                <div>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>✓</div>
                  <div style={{ fontWeight: 700, color: '#10B981', fontFamily: 'var(--font-body)', fontSize: 14 }}>
                    {form.resumeFile.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                    {(form.resumeFile.size / 1024).toFixed(0)} KB — click to replace
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>📎</div>
                  <div style={{ fontWeight: 600, color: '#374151', fontFamily: 'var(--font-body)', fontSize: 14 }}>
                    Drag &amp; drop or <span style={{ color: '#2563EB' }}>browse</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>PDF, DOC, DOCX · Max 5MB</div>
                </div>
              )}
            </div>
          </div>

          {/* Portfolio URL */}
          <div>
            <label style={labelStyle}>Portfolio / Work Samples</label>
            <input
              type="url" value={form.portfolioUrl} onChange={e => set('portfolioUrl', e.target.value)}
              placeholder="https://behance.net/yourwork or GitHub, Notion, etc."
              style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
            />
          </div>

          {/* Bio */}
          <div>
            <label style={labelStyle}>Short Bio <span style={{ color: '#9CA3AF', textTransform: 'none', fontWeight: 400 }}>(optional, helps the AI personalise your interview)</span></label>
            <textarea
              value={form.bio} onChange={e => set('bio', e.target.value)}
              placeholder="A 2–3 sentence summary of your background, e.g. 'I am a 4-year digital marketing specialist who has grown brand communities from 500 to 50K followers...'"
              rows={4}
              style={{
                ...inputStyle, resize: 'vertical', height: 'auto',
                lineHeight: 1.6,
              } as React.CSSProperties}
              onFocus={focusStyle} onBlur={blurStyle}
            />
          </div>

          {/* Privacy note */}
          <div style={{
            background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)',
            borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 10,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
            <p style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.6, fontFamily: 'var(--font-body)', margin: 0 }}>
              Your data is used solely to personalise this interview. Resume is referenced to tailor questions — it does not influence your score. Bias-stripped, dignity-first.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button" onClick={() => setStep(1)}
              style={{
                background: '#F9FAFB', color: '#374151', border: '1.5px solid #E5E7EB',
                borderRadius: 12, padding: '0 20px', height: 52, fontSize: 15,
                fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer',
                flexShrink: 0, transition: 'all 0.2s',
              }}
            >
              ← Back
            </button>
            <button
              type="submit" className="btn-accent"
              style={{
                flex: 1, padding: '0 24px', height: 52, fontSize: 16,
                justifyContent: 'center', opacity: loading ? 0.7 : 1,
                pointerEvents: loading ? 'none' : 'auto',
              }}
              disabled={loading}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="spinner" style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid #fff' }} />
                  Starting Interview...
                </div>
              ) : 'Begin AI Interview →'}
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
            4-minute structured interview. Every candidate receives a personalised outcome. No ghosting.
          </p>
        </form>
      )}
    </div>
  );
}
