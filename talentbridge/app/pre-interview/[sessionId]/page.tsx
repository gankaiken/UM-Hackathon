'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function PreInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [preScreeningContext, setPreScreeningContext] = useState({
    interest: '',
    availability: '',
    workAuth: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/session/${sessionId}/pre-interview`);
        if (!res.ok) throw new Error('Failed to load session');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [sessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Convert quizAnswers object to array matching questions
    const answersArray = data.quizQuestions.map((q: string, idx: number) => ({
      question: q,
      answer: quizAnswers[idx] || ''
    }));

    try {
      const res = await fetch(`/api/session/${sessionId}/pre-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizAnswers: answersArray,
          preScreeningContext
        })
      });

      if (!res.ok) throw new Error('Failed to save');
      
      // Proceed to formal interview
      router.push(`/interview/${sessionId}`);
    } catch (err) {
      console.error(err);
      alert('Could not save answers. Please try again.');
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: 'center' }}>Error loading data.</div>;

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #D1D5DB',
    fontSize: 14, outline: 'none', marginBottom: 16, fontFamily: 'var(--font-body)'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F6F9FF', padding: '40px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', background: '#FFFFFF', borderRadius: 16, padding: 32, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        
        {/* Progress header */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#10B981', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>✓</div>
          <div style={{ width: 32, height: 2, background: '#10B981' }} />
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2563EB', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>2</div>
          <div style={{ width: 32, height: 2, background: '#E5E7EB' }} />
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F3F4F6', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>3</div>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Welcome, {data.candidateName}</h1>
        <p style={{ color: '#6B7280', textAlign: 'center', marginBottom: 32, fontSize: 14 }}>
          Before we begin the formal AI interview for <strong>{data.roleTitle}</strong>, let's capture some quick context.
        </p>

        <form onSubmit={handleSubmit}>
          
          {/* Pre-Screening Chatbox Context */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#111827' }}>Basic Context</h2>
            
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
              What interests you most about this role?
            </label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical' }}
              rows={2}
              value={preScreeningContext.interest}
              onChange={e => setPreScreeningContext({ ...preScreeningContext, interest: e.target.value })}
            />

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
              What is your current notice period / availability?
            </label>
            <input
              type="text"
              style={inputStyle}
              value={preScreeningContext.availability}
              onChange={e => setPreScreeningContext({ ...preScreeningContext, availability: e.target.value })}
            />

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
              Do you have legal work authorization for this role location?
            </label>
            <select
              style={inputStyle}
              value={preScreeningContext.workAuth}
              onChange={e => setPreScreeningContext({ ...preScreeningContext, workAuth: e.target.value })}
            >
              <option value="">Select option...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Need Sponsorship">No, I need visa sponsorship</option>
            </select>
          </div>

          {/* Dynamic Quiz Questions from HR */}
          {data.quizQuestions && data.quizQuestions.length > 0 && (
            <div style={{ marginBottom: 32, padding: 20, background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#111827' }}>Role Requirements Checklist</h2>
              
              {data.quizQuestions.map((q: string, idx: number) => (
                <div key={idx} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                    {q}
                  </label>
                  <input
                    type="text"
                    style={{ ...inputStyle, marginBottom: 0 }}
                    value={quizAnswers[idx] || ''}
                    onChange={e => setQuizAnswers({ ...quizAnswers, [idx]: e.target.value })}
                    required
                  />
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: 12, background: 'rgba(37,99,235,0.05)', borderRadius: 8, marginBottom: 24 }}>
            <span style={{ fontSize: 12, color: '#2563EB', lineHeight: 1.5 }}>
              <strong>Context Only:</strong> These answers help the hiring team understand your situation. They do not negatively impact your core competency score in the upcoming AI interview.
            </span>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%', background: '#2563EB', color: 'white', padding: '14px',
              borderRadius: 10, fontSize: 16, fontWeight: 600, border: 'none', cursor: saving ? 'wait' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Continue to Formal AI Interview →'}
          </button>

        </form>
      </div>
    </div>
  );
}
