'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface StoredApp {
  sessionId: string;
  role: string;
  company: string;
  appliedAt: number;
}

interface SessionStatus {
  sessionId: string;
  role: string;
  company: string;
  appliedAt: number;
  status: 'active' | 'completed' | string;
  verdict: string | null;
  hrResponse: string | null;
  scheduledSlot: string | null;
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (mins > 0) return `${mins} min ago`;
  return 'Just now';
}

export default function MyApplicationsPage() {
  const [apps, setApps] = useState<SessionStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const stored: StoredApp[] = JSON.parse(localStorage.getItem('tb_my_applications') || '[]');
        if (stored.length === 0) { setLoading(false); return; }

        const results = await Promise.all(
          stored.map(async (app) => {
            try {
              const res = await fetch(`/api/session/${app.sessionId}`);
              if (!res.ok) return { ...app, status: 'active', verdict: null, hrResponse: null, scheduledSlot: null };
              const data = await res.json();
              return {
                ...app,
                status: data.status,
                verdict: data.verdict ?? null,
                hrResponse: data.hrResponse ?? null,
                scheduledSlot: data.scheduledSlot ?? null,
              };
            } catch {
              return { ...app, status: 'active', verdict: null, hrResponse: null, scheduledSlot: null };
            }
          })
        );
        setApps(results as SessionStatus[]);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  function getStatusBadge(app: SessionStatus) {
    if (app.scheduledSlot) return { label: 'Interview Scheduled', color: '#059669', bg: '#ECFDF5' };
    if (app.hrResponse === 'offer') return { label: 'You have been shortlisted', color: '#2563EB', bg: '#EFF6FF' };
    if (app.hrResponse === 'reject') return { label: 'Not selected this time', color: '#64748B', bg: '#F1F5F9' };
    if (app.verdict) return { label: 'Under Review', color: '#F59E0B', bg: '#FFFBEB' };
    if (app.status === 'active') return { label: 'Interview in progress', color: '#8B5CF6', bg: '#F5F3FF' };
    return { label: 'Submitted', color: '#64748B', bg: '#F1F5F9' };
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 80 }}>
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', marginBottom: 8 }}>
            My Applications
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#64748B' }}>
            Track your TalentBridge interviews, view feedback, and manage upcoming schedules.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '40px auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Loading your applications...</div>
          )}
          {!loading && apps.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, background: '#FFFFFF', borderRadius: 20, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>No applications yet</h3>
              <p style={{ color: '#64748B', fontSize: 14, marginBottom: 20 }}>Apply for a role to see your applications here.</p>
              <Link href="/jobs" style={{ background: '#2563EB', color: '#FFFFFF', padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Browse Roles
              </Link>
            </div>
          )}
          {apps.map((app) => {
            const badge = getStatusBadge(app);
            return (
              <div key={app.sessionId} style={{
                background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, padding: 24,
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'all 0.2s ease',
              }}>
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 800, color: '#1D4ED8', fontFamily: 'var(--font-display)',
                  }}>
                    {(app.company || 'C').charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#0F172A' }}>{app.role}</h2>
                      <div style={{ background: badge.bg, color: badge.color, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', marginLeft: 12 }}>
                        {badge.label}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                      {app.company} · Applied {timeAgo(app.appliedAt)}
                    </div>

                    {app.scheduledSlot && (() => {
                      try {
                        const slot = JSON.parse(app.scheduledSlot);
                        return (
                          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Upcoming Interview</div>
                              <div style={{ fontSize: 14, color: '#065F46', fontWeight: 600 }}>
                                {new Date(slot.start).toLocaleString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        );
                      } catch { return null; }
                    })()}

                    {!app.scheduledSlot && (
                      <div style={{ display: 'flex', gap: 10 }}>
                        {app.verdict ? (
                          <Link href={`/result/${app.sessionId}`} style={{
                            background: '#F1F5F9', color: '#334155', padding: '8px 16px', borderRadius: 8,
                            fontSize: 13, fontWeight: 600, textDecoration: 'none',
                          }}>
                            View Feedback Report
                          </Link>
                        ) : app.status === 'active' ? (
                          <Link href={`/interview/${app.sessionId}`} style={{
                            background: 'linear-gradient(135deg,#2563EB,#0EA5E9)', color: '#FFFFFF',
                            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                          }}>
                            Continue Interview →
                          </Link>
                        ) : (
                          <span style={{ background: '#F8FAFC', color: '#94A3B8', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                            Result Pending
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <div style={{
            background: 'linear-gradient(135deg, #0A0C12 0%, #1E293B 100%)',
            borderRadius: 20, padding: 24, color: '#FFFFFF', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, fontSize: 100, opacity: 0.05 }}>🤖</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', color: '#94A3B8' }}>
                AI SCHEDULING AGENT
              </div>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
              Automated Scheduling
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#94A3B8', lineHeight: 1.6, marginBottom: 20 }}>
              When you are shortlisted, our AI will send you a scheduling link to book your interview at a time that works for you.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-body)', color: '#94A3B8' }}>Gmail Notification</div>
              <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-body)', color: '#94A3B8' }}>Calendar Invite</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
