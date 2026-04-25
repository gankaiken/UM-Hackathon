'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const jdId = params.jdId as string;
  
  const [jdText, setJdText] = useState('');
  const [customDimensions, setCustomDimensions] = useState('');
  const [quizQuestions, setQuizQuestions] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasApplicants, setHasApplicants] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/hr/jobs/${jdId}`);
        if (!res.ok) throw new Error('Failed to load job');
        const data = await res.json();
        
        setJdText(data.rawJd || '');
        setCustomDimensions(Array.isArray(data.customDimensions) ? data.customDimensions.join('\n') : '');
        setQuizQuestions(Array.isArray(data.quizQuestions) ? data.quizQuestions.join('\n') : '');
        setHasApplicants(data.applicantCount > 0);
      } catch (err) {
        setError('Could not load job details');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [jdId]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/hr/jobs/${jdId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jdText: jdText.trim(),
          customDimensions: customDimensions.trim() ? customDimensions.split('\n').filter(Boolean) : [],
          quizQuestions: quizQuestions.trim() ? quizQuestions.split('\n').filter(Boolean) : []
        })
      });
      
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save');
      }
      
      alert('Job updated successfully');
      router.push('/hr');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', padding: '40px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 20 }}>Edit Job Post</h1>
        
        {hasApplicants && (
          <div style={{
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 8, padding: '16px', color: '#92400E', marginBottom: 24,
          }}>
            <strong>Warning:</strong> This job already has applicants. Changes will apply only to future candidates.
          </div>
        )}

        {error && <div style={{ color: 'red', marginBottom: 20 }}>{error}</div>}

        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <label className="section-label" style={{ marginBottom: 12, display: 'block' }}>Job Description</label>
          <textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            rows={12}
            style={{
              width: '100%', border: '1.5px solid #D1D5DB', borderRadius: 10, padding: '14px 16px',
              fontSize: 14, lineHeight: 1.65, resize: 'vertical', outline: 'none'
            }}
          />
        </div>

        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <label className="section-label" style={{ marginBottom: 8, display: 'block' }}>Custom Dimensions (Optional)</label>
          <div style={{
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#92400E', marginBottom: 12,
          }}>
            <strong>Safety Warning:</strong> Do not include discriminatory categories (age, race, religion, gender, marital status, disability).
          </div>
          <textarea
            value={customDimensions}
            onChange={e => setCustomDimensions(e.target.value)}
            rows={3}
            style={{
              width: '100%', border: '1.5px solid #D1D5DB', borderRadius: 10, padding: '14px 16px',
              fontSize: 14, lineHeight: 1.65, resize: 'vertical', outline: 'none'
            }}
          />
        </div>

        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <label className="section-label" style={{ marginBottom: 8, display: 'block' }}>Pre-Interview Quiz Questions (Optional)</label>
          <textarea
            value={quizQuestions}
            onChange={e => setQuizQuestions(e.target.value)}
            rows={3}
            style={{
              width: '100%', border: '1.5px solid #D1D5DB', borderRadius: 10, padding: '14px 16px',
              fontSize: 14, lineHeight: 1.65, resize: 'vertical', outline: 'none'
            }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', background: '#2563EB', color: 'white', padding: '14px',
            borderRadius: 10, fontSize: 16, fontWeight: 600, border: 'none', cursor: saving ? 'wait' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
