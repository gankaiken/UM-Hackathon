'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface PreInterviewPayload {
  roleTitle: string;
  companyName: string;
  candidateName: string;
  jobDescription: string;
  requirements: string;
  quizQuestions: string[];
  quizAnswers: Array<{ question: string; answer: string }>;
  preScreeningContext: Record<string, string>;
}

export default function PreInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<PreInterviewPayload | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [preScreeningContext, setPreScreeningContext] = useState({
    interest: '',
    availability: '',
    workAuth: '',
    communicationContext: '',
  });

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/session/${sessionId}/pre-interview`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load session');

        setData(json);
        const restoredAnswers: Record<number, string> = {};
        (json.quizAnswers || []).forEach((entry: { question: string; answer: string }, index: number) => {
          restoredAnswers[index] = entry.answer || '';
        });
        setQuizAnswers(restoredAnswers);
        setPreScreeningContext({
          interest: json.preScreeningContext?.interest || '',
          availability: json.preScreeningContext?.availability || '',
          workAuth: json.preScreeningContext?.workAuth || '',
          communicationContext: json.preScreeningContext?.communicationContext || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [sessionId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setError('');

    const answersArray = data.quizQuestions.map((question, index) => ({
      question,
      answer: quizAnswers[index] || '',
    }));

    try {
      const res = await fetch(`/api/session/${sessionId}/pre-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizAnswers: answersArray,
          preScreeningContext,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save');

      router.push(`/interview/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save answers');
      setSaving(false);
    }
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid #D1D5DB',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'var(--font-body)',
    background: '#FFFFFF',
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading...</div>;
  if (!data) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>{error || 'Session not found.'}</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F6F9FF 0%, #FFFFFF 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'center' }}>
          {['Apply', 'Pre-Interview', 'Formal AI Interview', 'Result'].map((label, index) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: index < 1 ? '#10B981' : index === 1 ? '#2563EB' : '#E5E7EB',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
              }}>
                {index < 1 ? '✓' : index + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: index <= 1 ? '#0A0C12' : '#94A3B8' }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 24, padding: 32 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
              Pre-interview
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#0A0C12', marginBottom: 8 }}>
              Welcome, {data.candidateName}
            </h1>
            <p style={{ color: '#6B7280', lineHeight: 1.7 }}>
              Before the formal AI interview for <strong>{data.roleTitle}</strong> at <strong>{data.companyName}</strong>, we’ll collect a little context and any recruiter-defined screening answers.
            </p>
          </div>

          {error ? (
            <div style={{ marginBottom: 18, background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 14, padding: 14 }}>
              {error}
            </div>
          ) : null}

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Role summary</div>
            <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: data.requirements ? 14 : 0 }}>
              {data.jobDescription || 'No additional role summary provided.'}
            </div>
            {data.requirements ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Key requirements</div>
                <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{data.requirements}</div>
              </>
            ) : null}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0A0C12', marginBottom: 14 }}>Context questions</h2>

              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>What interests you most about this role?</label>
              <textarea
                rows={3}
                style={{ ...inputStyle, marginBottom: 14 }}
                value={preScreeningContext.interest}
                onChange={e => setPreScreeningContext(prev => ({ ...prev, interest: e.target.value }))}
              />

              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>What is your current notice period or availability?</label>
              <input
                style={{ ...inputStyle, marginBottom: 14 }}
                value={preScreeningContext.availability}
                onChange={e => setPreScreeningContext(prev => ({ ...prev, availability: e.target.value }))}
              />

              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Do you have legal work authorization for this role location?</label>
              <select
                style={{ ...inputStyle, marginBottom: 14 }}
                value={preScreeningContext.workAuth}
                onChange={e => setPreScreeningContext(prev => ({ ...prev, workAuth: e.target.value }))}
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Need Sponsorship">No, I need sponsorship</option>
              </select>

              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                Anything about language, timezone, or work setup that helps with interview context?
              </label>
              <input
                style={inputStyle}
                value={preScreeningContext.communicationContext}
                onChange={e => setPreScreeningContext(prev => ({ ...prev, communicationContext: e.target.value }))}
              />
            </div>

            {data.quizQuestions.length > 0 ? (
              <div style={{ marginBottom: 28, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 16, padding: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0A0C12', marginBottom: 16 }}>Recruiter questions</h2>
                {data.quizQuestions.map((question, index) => (
                  <div key={question + index} style={{ marginBottom: index === data.quizQuestions.length - 1 ? 0 : 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{question}</label>
                    <input
                      style={inputStyle}
                      value={quizAnswers[index] || ''}
                      onChange={e => setQuizAnswers(prev => ({ ...prev, [index]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 14, padding: 14, marginBottom: 22 }}>
              <div style={{ fontSize: 12, color: '#1D4ED8', lineHeight: 1.6 }}>
                <strong>Context only:</strong> These answers are shown to HR in the verdict view and may guide conversation flow, but they are not formal Auditor scoring criteria unless explicitly discussed in the interview itself.
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 14,
                border: 'none',
                background: '#2563EB',
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: 700,
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Continue to Formal AI Interview'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
