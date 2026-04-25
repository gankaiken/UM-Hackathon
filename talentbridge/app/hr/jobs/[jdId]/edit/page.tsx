'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StatusNotice from '@/components/StatusNotice';

function parseTimeslotsForEditor(timeslots: Array<{ start: string; end: string }>) {
  return timeslots.map(slot => `${slot.start.replace('T', ' ').slice(0, 16)} | ${slot.end.replace('T', ' ').slice(0, 16)}`).join('\n');
}

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
      return { start: startDate.toISOString(), end: endDate.toISOString(), available: true };
    })
    .filter(Boolean);
}

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const jdId = params.jdId as string;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [customDimensions, setCustomDimensions] = useState('');
  const [quizQuestions, setQuizQuestions] = useState('');
  const [timeslots, setTimeslots] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [hasApplicants, setHasApplicants] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/hr/jobs/${jdId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load job');

        setTitle(data.title || data.roleTitle || '');
        setDescription(data.description || '');
        setRequirements(data.requirements || '');
        setCustomDimensions(Array.isArray(data.customDimensions) ? data.customDimensions.join('\n') : '');
        setQuizQuestions(Array.isArray(data.quizQuestions) ? data.quizQuestions.join('\n') : '');
        setTimeslots(Array.isArray(data.timeslots) ? parseTimeslotsForEditor(data.timeslots) : '');
        setHasApplicants(data.applicantCount > 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load job details');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [jdId]);

  async function handleSave() {
    setSaving(true);
    setError('');
    setWarnings([]);

    try {
      const res = await fetch(`/api/hr/jobs/${jdId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setWarnings(Array.isArray(data.warnings) ? data.warnings : []);
      router.push('/hr');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <StatusNotice tone="info" title="Loading job">
          Fetching the latest job details for editing.
        </StatusNotice>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F6F9FF 0%, #FFFFFF 100%)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '56px 24px 96px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 800, color: '#0A0C12', marginBottom: 10 }}>
          Edit job
        </h1>
        <p style={{ color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
          Update role details, safe evaluation dimensions, pre-interview questions, and scheduling slots for future candidates.
        </p>

        {hasApplicants ? (
          <div style={{ ...cardStyle, background: '#FFFBEB', borderColor: '#FDE68A' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>
              This job already has applicants. Changes will apply only to future candidates.
            </div>
          </div>
        ) : null}

        {error ? (
          <div style={{ ...cardStyle, background: '#FEF2F2', borderColor: '#FECACA', color: '#B91C1C' }}>{error}</div>
        ) : null}

        {warnings.length > 0 ? (
          <StatusNotice tone="info" title="Safety adjustments" style={cardStyle}>
            {warnings.join(' ')}
          </StatusNotice>
        ) : null}

        <div style={cardStyle}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 8 }}>Role title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
        </div>

        <div style={cardStyle}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 8 }}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={8} style={inputStyle} />
        </div>

        <div style={cardStyle}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 8 }}>Requirements</label>
          <textarea value={requirements} onChange={e => setRequirements(e.target.value)} rows={6} style={inputStyle} />
        </div>

        <div style={cardStyle}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 8 }}>Custom dimensions</label>
          <textarea value={customDimensions} onChange={e => setCustomDimensions(e.target.value)} rows={4} style={inputStyle} />
        </div>

        <div style={cardStyle}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 8 }}>Pre-interview quiz questions</label>
          <textarea value={quizQuestions} onChange={e => setQuizQuestions(e.target.value)} rows={4} style={inputStyle} />
        </div>

        <div style={cardStyle}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 8 }}>Available timeslots</label>
          <textarea value={timeslots} onChange={e => setTimeslots(e.target.value)} rows={4} style={inputStyle} />
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
            Use one `start | end` line per slot, for example `2026-04-28 10:00 | 2026-04-28 11:00`.
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            height: 54,
            border: 'none',
            borderRadius: 14,
            background: '#2563EB',
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 700,
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
