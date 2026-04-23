// app/schedule/[sessionId]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';

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

  useEffect(() => {
    fetch(`/api/schedule/${sessionId}/slots`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
        } else {
          setSession(data.session);
          setJd(data.jd);
          setSlots(data.slots);
          if (data.session.scheduledSlot) setConfirmed(true);
        }
        setLoading(false);
      });
  }, [sessionId]);

  async function handleConfirm() {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/schedule/${sessionId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: selectedSlot }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfirmed(true);
      } else {
        alert(data.error || 'Failed to confirm schedule');
      }
    } catch {
      alert('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>Loading...</div>;

  if (confirmed) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 480, width: '100%', background: 'white', padding: 40, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#10B981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'white', fontSize: 32 }}>✓</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0A0C12', marginBottom: 12 }}>Interview Confirmed!</h1>
          <p style={{ color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
            We&apos;ve saved your selected time and sent a confirmation to <strong>{session?.candidateEmail}</strong>. Meeting details will be shared by the hiring team.
          </p>
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
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0A0C12', letterSpacing: '-1px', marginBottom: 12 }}>Schedule Your Interview</h1>
          <p style={{ color: '#64748B', fontSize: 16 }}>Hi {session?.candidateName}, please select a convenient time to meet with the {jd?.employerId === 'default' ? 'Team' : jd?.employerId} for the {jd?.roleTitle} role.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 40 }}>
          {slots.length === 0 && <div style={{ textAlign: 'center', color: '#94A3B8', padding: 40 }}>No slots available. Please contact the recruiter.</div>}
          {slots.map((slot, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedSlot(slot)}
              disabled={!slot.available}
              style={{
                background: selectedSlot === slot ? '#2563EB' : 'white',
                border: `1.5px solid ${selectedSlot === slot ? '#2563EB' : '#E5E7EB'}`,
                borderRadius: 16,
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: slot.available ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                opacity: slot.available ? 1 : 0.5,
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: selectedSlot === slot ? 'white' : '#1F2937' }}>
                  {new Date(slot.start).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'short' })}
                </div>
                <div style={{ fontSize: 14, color: selectedSlot === slot ? 'rgba(255,255,255,0.8)' : '#64748B' }}>
                  {new Date(slot.start).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.end).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {selectedSlot === slot && <div style={{ color: 'white', fontSize: 20 }}>✓</div>}
            </button>
          ))}
        </div>

        <div style={{ position: 'sticky', bottom: 40, background: 'white', padding: 20, borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Selected Time</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>
              {selectedSlot ? new Date(selectedSlot.start).toLocaleString('en-MY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'None'}
            </div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!selectedSlot || submitting}
            style={{
              background: '#0A0C12', color: 'white', border: 'none', padding: '12px 32px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', opacity: (!selectedSlot || submitting) ? 0.5 : 1
            }}
          >
            {submitting ? 'Confirming...' : 'Confirm Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
