'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { getCsrfTokenFromCookie } from '@/lib/clientSecurity';
import StatusNotice from '@/components/StatusNotice';

interface ScheduleSession {
  candidateEmail: string;
  candidateName: string;
  scheduledSlot: string | null;
}

interface ScheduleJd {
  employerId: string;
  roleTitle: string;
}

interface ScheduleSlot {
  start: string;
  end: string;
  available: boolean;
}

export default function CandidateSchedulingPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<ScheduleSession | null>(null);
  const [jd, setJd] = useState<ScheduleJd | null>(null);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    async function loadSchedule() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/schedule/${sessionId}/slots`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load scheduling details.');

        setSession(data.session);
        setJd(data.jd);
        setSlots(Array.isArray(data.slots) ? data.slots : []);
        if (data.session.scheduledSlot) setConfirmed(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load scheduling details.');
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, [sessionId]);

  async function handleConfirm() {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/schedule/${sessionId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfTokenFromCookie() },
        body: JSON.stringify({ slot: selectedSlot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm schedule.');

      setSession(prev => prev ? { ...prev, scheduledSlot: JSON.stringify(selectedSlot) } : prev);
      setConfirmed(true);
      setNotice('Your interview time has been confirmed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>Loading scheduling details...</div>;
  }

  if (error && !session) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ maxWidth: 520, width: '100%' }}>
          <StatusNotice tone="error" title="Scheduling unavailable">
            {error}
          </StatusNotice>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 480, width: '100%', background: 'white', padding: 40, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'white', fontSize: 32 }}>✓</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0A0C12', marginBottom: 12 }}>Interview confirmed</h1>
          <p style={{ color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
            We&apos;ve saved your selected time and sent a confirmation to <strong>{session?.candidateEmail}</strong>. Meeting details will be shared by the hiring team.
          </p>
          {notice ? <StatusNotice tone="success" style={{ marginBottom: 20 }}>{notice}</StatusNotice> : null}
          <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>Time Slot</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#334155' }}>
              {session?.scheduledSlot ? new Date(JSON.parse(session.scheduledSlot).start).toLocaleString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'Confirmed'}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '80px 24px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0A0C12', letterSpacing: '-1px', marginBottom: 12 }}>Schedule Your Interview</h1>
          <p style={{ color: '#64748B', fontSize: 16, lineHeight: 1.6 }}>
            Hi {session?.candidateName}, please select a convenient time to meet with the {jd?.employerId === 'default' ? 'Team' : jd?.employerId} for the {jd?.roleTitle} role.
          </p>
        </div>

        {error ? <StatusNotice tone="error" style={{ marginBottom: 20 }}>{error}</StatusNotice> : null}
        {notice ? <StatusNotice tone="success" style={{ marginBottom: 20 }}>{notice}</StatusNotice> : null}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 40 }}>
          {slots.length === 0 ? (
            <StatusNotice tone="warning">
              No interview slots are available right now. Please check back later or contact the hiring team.
            </StatusNotice>
          ) : null}
          {slots.map((slot, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedSlot(slot)}
              disabled={!slot.available}
              aria-pressed={selectedSlot?.start === slot.start && selectedSlot?.end === slot.end}
              style={{
                background: selectedSlot?.start === slot.start && selectedSlot?.end === slot.end ? '#2563EB' : 'white',
                border: `1.5px solid ${(selectedSlot?.start === slot.start && selectedSlot?.end === slot.end) ? '#2563EB' : '#E5E7EB'}`,
                borderRadius: 16,
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: slot.available ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                opacity: slot.available ? 1 : 0.5,
                minHeight: 76,
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: selectedSlot?.start === slot.start && selectedSlot?.end === slot.end ? 'white' : '#1F2937' }}>
                  {new Date(slot.start).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'short' })}
                </div>
                <div style={{ fontSize: 14, color: selectedSlot?.start === slot.start && selectedSlot?.end === slot.end ? 'rgba(255,255,255,0.8)' : '#64748B' }}>
                  {new Date(slot.start).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.end).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {selectedSlot?.start === slot.start && selectedSlot?.end === slot.end ? <div style={{ color: 'white', fontSize: 20 }}>✓</div> : null}
            </button>
          ))}
        </div>

        <div style={{ position: 'sticky', bottom: 24, background: 'white', padding: 20, borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Selected Time</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>
              {selectedSlot ? new Date(selectedSlot.start).toLocaleString('en-MY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Choose a slot above'}
            </div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!selectedSlot || submitting}
            style={{
              background: '#0A0C12', color: 'white', border: 'none', padding: '12px 32px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', opacity: (!selectedSlot || submitting) ? 0.5 : 1, minHeight: 48
            }}
          >
            {submitting ? 'Confirming...' : 'Confirm Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
