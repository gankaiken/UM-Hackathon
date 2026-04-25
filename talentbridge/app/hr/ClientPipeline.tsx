'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { HrResponse, VerdictResult, DimensionScore, SentinelData } from '@/lib/types';
import type { Session } from '@/lib/db/schema';
import { getCurrentTimestamp } from '@/lib/utils/runtime';

const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
const RESPONSE_META: Record<HrResponse, { label: string; color: string; bg: string; border: string }> = {
  offer: { label: 'Proceed', color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.22)' },
  hold: { label: 'Hold', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.22)' },
  reject: { label: 'Pass', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.22)' },
};

interface CompletedSessionItem {
  session: Session;
  roleTitle: string | null;
  company: string | null;
}

interface ResponseOverride {
  hrResponse: HrResponse;
  hrRespondedAt: number;
}

interface ScheduleOverride {
  interviewScheduledAt: number;
  interviewMeetingLink: string;
  interviewScheduleNote: string;
}

function getAverageVerdictScore(verdict: VerdictResult): number {
  const scores = Object.values(verdict.dimension_scores || {});
  return verdict.overall_score ?? Math.round(
    scores.reduce<number>((sum, dimension) => sum + (typeof dimension === 'number' ? dimension : (dimension as DimensionScore).score), 0) /
    Math.max(1, scores.length)
  );
}

export default function ClientPipeline({ completed }: { completed: CompletedSessionItem[] }) {
  const [filter, setFilter] = useState('All');
  const [filledRoles, setFilledRoles] = useState<Set<string>>(new Set());
  const [filling, setFilling] = useState<string | null>(null);
  const [schedulingFor, setSchedulingFor] = useState<string | null>(null);
  const [scheduleLogs, setScheduleLogs] = useState<string[]>([]);
  const [responseOverrides, setResponseOverrides] = useState<Record<string, ResponseOverride>>({});
  const [scheduleOverrides, setScheduleOverrides] = useState<Record<string, ScheduleOverride>>({});
  const [respondingSession, setRespondingSession] = useState<string | null>(null);
  const now = getCurrentTimestamp();

  const ghostingCandidates = completed.filter(item => {
    if (!item.session?.completedAt) return false;
    const elapsed = now - item.session.completedAt;
    const responded = responseOverrides[item.session.id]?.hrRespondedAt ?? item.session?.hrRespondedAt;
    return elapsed > FORTY_EIGHT_HOURS && !responded;
  });

  const handleFillRole = async (jdId: string, roleTitle: string) => {
    if (!confirm(`Mark "${roleTitle}" as filled? All pending candidates will be automatically notified.`)) return;
    setFilling(jdId);
    try {
      const res = await fetch(`/api/jd/${jdId}/fill-role`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setFilledRoles(prev => new Set([...prev, jdId]));
        alert(`✓ ${data.message}`);
      } else {
        alert(data.error || 'Failed to mark role as filled');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setFilling(null);
    }
  };

  const handleAutoSchedule = async (sessionId: string, candidateName: string) => {
    setSchedulingFor(candidateName);
    setScheduleLogs(['[Demo Scheduling] Preparing a sample follow-up workflow...']);
    try {
      const res = await fetch(`/api/hr/session/${sessionId}/schedule-preview`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setScheduleLogs(prev => [...prev, `[System] ${data.error || 'Could not create schedule preview.'}`]);
        return;
      }

      setScheduleOverrides(prev => ({
        ...prev,
        [sessionId]: {
          interviewScheduledAt: data.interviewScheduledAt,
          interviewMeetingLink: data.interviewMeetingLink,
          interviewScheduleNote: data.interviewScheduleNote,
        },
      }));

      setScheduleLogs(prev => [
        ...prev,
        '[Demo Scheduling] Drafting a sample interview invitation...',
        '[Demo Scheduling] Preparing candidate-facing schedule details...',
        `[Demo Scheduling] Preview slot reserved: ${new Date(data.interviewScheduledAt).toLocaleString('en-MY')}`,
        `[Demo Scheduling] Preview meeting link ready: ${data.interviewMeetingLink}`,
        '[System] Demo workflow finished. No live external services were called.',
      ]);
    } catch {
      setScheduleLogs(prev => [...prev, '[System] Network error while creating the scheduling preview.']);
    } finally {
      setTimeout(() => {
        setSchedulingFor(null);
        setScheduleLogs([]);
      }, 3000);
    }
  };

  const handleHrResponse = async (sessionId: string, response: HrResponse) => {
    setRespondingSession(`${sessionId}:${response}`);
    try {
      const res = await fetch(`/api/hr/session/${sessionId}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Could not save HR response');
        return;
      }

      setResponseOverrides(prev => ({
        ...prev,
        [sessionId]: {
          hrResponse: data.hrResponse,
          hrRespondedAt: data.hrRespondedAt,
        },
      }));
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setRespondingSession(null);
    }
  };

  const parsedCompleted = completed.map(item => {
    let verdict: VerdictResult | null = null;
    let avgScore = 0;
    let isFlagged = false;
    let triage = 'RED';

    const override = responseOverrides[item.session.id];
    const scheduleOverride = scheduleOverrides[item.session.id];
    const hrRespondedAt = override?.hrRespondedAt ?? item.session?.hrRespondedAt;
    const hrResponse = override?.hrResponse ?? item.session?.hrResponse;
    const interviewScheduledAt = scheduleOverride?.interviewScheduledAt ?? item.session?.interviewScheduledAt;
    const interviewMeetingLink = scheduleOverride?.interviewMeetingLink ?? item.session?.interviewMeetingLink;
    const interviewScheduleNote = scheduleOverride?.interviewScheduleNote ?? item.session?.interviewScheduleNote;
    const elapsed = item.session?.completedAt ? now - item.session.completedAt : 0;
    const isOverdue = elapsed > FORTY_EIGHT_HOURS && !hrRespondedAt;

    try {
      if (item.session?.verdict) {
        verdict = JSON.parse(item.session.verdict) as VerdictResult;
        avgScore = getAverageVerdictScore(verdict);
        triage = (verdict.triage_result || 'RED').toUpperCase();
      }
      if (item.session?.sentinelData) {
        const sentinel = JSON.parse(item.session.sentinelData) as SentinelData;
        isFlagged = (sentinel.focus_loss_events > 3 && sentinel.paste_events > 1) || Boolean(sentinel.ai_paste_detected);
      }
    } catch {
      // Keep the row visible even if a malformed seed payload slips through.
    }

    return {
      ...item,
      verdict,
      avgScore,
      isFlagged,
      triage,
      isOverdue,
      hrRespondedAt,
      hrResponse,
      interviewScheduledAt,
      interviewMeetingLink,
      interviewScheduleNote,
    };
  }).filter(item => item.verdict !== null);

  const filteredData = parsedCompleted.filter(item => filter === 'All' || item.triage.toUpperCase() === filter.toUpperCase());

  return (
    <>
      {ghostingCandidates.length > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)',
          borderRadius: 16, padding: '16px 24px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18,
          }}>
            ⏰
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FCA5A5', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
              {ghostingCandidates.length} candidate{ghostingCandidates.length > 1 ? 's' : ''} awaiting response for over 48 hours
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'var(--font-body)' }}>
              Delayed responses are tracked in the dashboard&apos;s response score. Please act now.
            </div>
          </div>
          <Link href="/verdicts" style={{
            background: 'rgba(239,68,68,0.15)', color: '#FCA5A5',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 600,
            textDecoration: 'none', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
          }}>
            Review Now →
          </Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
        <div style={{
          background: '#141820', border: '1.5px solid #1E2433',
          borderRadius: 24, padding: '28px',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#475569',
            fontFamily: 'var(--font-mono)', letterSpacing: '0.8px',
            textTransform: 'uppercase', marginBottom: 24,
          }}>
            System Integrity Health
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="38" fill="none" stroke="#1E2433" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={(2 * Math.PI * 38) * (1 - 0.98)}
                  style={{ transition: 'stroke-dashoffset 1.2s ease-in-out' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontSize: 22, fontWeight: 800, color: '#F9FAFB',
                  fontFamily: 'var(--font-display)', letterSpacing: '-0.5px',
                }}>
                  98%
                </span>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 16, fontWeight: 700, color: '#F9FAFB',
                fontFamily: 'var(--font-display)', marginBottom: 8,
              }}>
                Optimal Operation
              </div>
              <div style={{
                background: '#1E2433', borderRadius: 6, height: 6, overflow: 'hidden', marginBottom: 16,
              }}>
                <div style={{
                  width: '98%', height: '100%',
                  background: 'linear-gradient(90deg, #059669, #10B981)', borderRadius: 6,
                }} />
              </div>
              <div style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 10, padding: '12px 14px',
                fontSize: 13, color: '#34D399', lineHeight: 1.5,
                fontFamily: 'var(--font-body)',
              }}>
                Current demo sessions are flowing through the interview pipeline with persisted state and verdict output.
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: '#141820', border: '1.5px solid #1E2433',
          borderRadius: 24, padding: '28px',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#475569',
            fontFamily: 'var(--font-mono)', letterSpacing: '0.8px',
            textTransform: 'uppercase', marginBottom: 24,
          }}>
            Pending Action Required
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {parsedCompleted
              .filter(item => item.verdict?.human_review_required && !item.hrResponse)
              .slice(0, 2)
              .map(item => {
                if (!item.verdict) return null;
                const flagColor = item.triage === 'RED' ? '#EF4444' : '#F59E0B';
                return (
                  <div
                    key={item.session.id}
                    style={{
                      background: flagColor === '#EF4444' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                      border: `1.5px solid ${flagColor}33`,
                      borderRadius: 14, padding: '14px 18px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{
                        fontSize: 14, fontWeight: 600, color: '#F9FAFB',
                        marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8,
                        fontFamily: 'var(--font-body)',
                      }}>
                        {item.session.candidateName}
                        <span style={{
                          padding: '2px 7px', borderRadius: 4, fontSize: 10,
                          fontWeight: 700, fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.5px', textTransform: 'uppercase',
                          background: `${flagColor}25`, color: flagColor,
                        }}>
                          {item.triage}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'var(--font-body)' }}>
                        ⚠ Review required before employer action.
                      </div>
                    </div>
                    <Link
                      href={`/hr/verdict/${item.session.id}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: 12, fontWeight: 600, color: flagColor,
                        background: `${flagColor}15`, border: `1px solid ${flagColor}40`,
                        padding: '6px 14px', borderRadius: 8, textDecoration: 'none',
                        whiteSpace: 'nowrap', fontFamily: 'var(--font-body)',
                      }}
                    >
                      Review
                    </Link>
                  </div>
                );
              })}
            {parsedCompleted.filter(item => item.verdict?.human_review_required && !item.hrResponse).length === 0 && (
              <div style={{
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)',
                borderRadius: 14, padding: '16px 18px', color: '#34D399',
                fontSize: 13, fontFamily: 'var(--font-body)',
              }}>
                No unresolved human-review items are waiting right now.
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{
        background: '#141820', border: '1.5px solid #1E2433',
        borderRadius: 24, overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 28px', borderBottom: '1px solid #1E2433',
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20, fontWeight: 700,
              color: '#F9FAFB', letterSpacing: '-0.4px', marginBottom: 4,
            }}>
              All Candidates — Pipeline View
            </h2>
            <div style={{ fontSize: 13, color: '#475569', fontFamily: 'var(--font-body)' }}>
              {parsedCompleted.length} total candidates routed through the current interview pipeline
            </div>
          </div>

          <div style={{
            display: 'flex', gap: 4,
            background: '#0F1117', padding: '4px', borderRadius: 10,
          }}>
            {['All', 'GREEN', 'AMBER', 'RED'].map(value => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                style={{
                  padding: '6px 14px', borderRadius: 7, fontSize: 12, border: 'none',
                  fontWeight: filter === value ? 700 : 500, cursor: 'pointer',
                  background: filter === value ? '#1E2433' : 'transparent',
                  color: filter === value ? '#F9FAFB'
                    : value === 'GREEN' ? '#10B981'
                    : value === 'AMBER' ? '#F59E0B'
                    : value === 'RED' ? '#EF4444'
                    : '#64748B',
                  transition: 'all 0.15s ease',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              {['Candidate', 'Role', 'Triage', 'Dimension Score', 'Status', 'Action'].map(header => (
                <th
                  key={header}
                  style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.5px',
                    textTransform: 'uppercase', color: '#475569',
                    padding: '14px 20px',
                    borderBottom: '1px solid #1E2433',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map(({ session, roleTitle, verdict, avgScore, isFlagged, triage, isOverdue, hrResponse, hrRespondedAt, interviewScheduledAt, interviewMeetingLink }) => {
              if (!verdict) return null;

              const triageMeta = {
                GREEN: { color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
                AMBER: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
                RED: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
              }[triage as 'GREEN' | 'AMBER' | 'RED'] ?? { color: '#64748B', bg: 'rgba(100,116,139,0.12)' };

              const responseMeta = hrResponse ? RESPONSE_META[hrResponse as HrResponse] : null;
              const initials = session.candidateName.split(' ').map((word: string) => word[0]).join('').slice(0, 2).toUpperCase();
              const barColor = avgScore >= 75 ? '#10B981' : avgScore >= 50 ? '#F59E0B' : '#EF4444';

              return (
                <tr key={session.id} className="hr-table-row" style={{ borderBottom: '1px solid #1E2433' }}>
                  <td style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: 'linear-gradient(135deg, #1E2D60, #1E3A5F)',
                        border: '1px solid #2D3748',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: '#93C5FD',
                        flexShrink: 0, fontFamily: 'var(--font-display)',
                      }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#F9FAFB', fontFamily: 'var(--font-body)' }}>
                          {session.candidateName}
                        </div>
                        {isFlagged && (
                          <div style={{ fontSize: 11, color: '#F59E0B', marginTop: 2, fontFamily: 'var(--font-body)' }}>
                            ⚠ Sentinel flag
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '18px 20px', fontSize: 13, color: '#64748B', fontFamily: 'var(--font-body)' }}>
                    {roleTitle ?? 'Unknown'}
                  </td>
                  <td style={{ padding: '18px 20px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '4px 10px', borderRadius: 6,
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
                      textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
                      background: triageMeta.bg, color: triageMeta.color,
                      border: `1px solid ${triageMeta.color}30`,
                    }}>
                      {triage}
                    </span>
                  </td>
                  <td style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        height: 5, width: 80, borderRadius: 3,
                        background: '#1E2433', overflow: 'hidden', flexShrink: 0,
                      }}>
                        <div style={{
                          width: `${avgScore}%`, height: '100%',
                          background: barColor, borderRadius: 3,
                        }} />
                      </div>
                      <span style={{
                        fontSize: 13, fontWeight: 700, color: '#F9FAFB',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {avgScore}/100
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: verdict.human_review_required ? '#F59E0B' : '#10B981',
                        fontFamily: 'var(--font-body)',
                      }}>
                        {verdict.human_review_required ? '⚠ Review Required' : '✓ Cleared'}
                      </span>
                      {responseMeta ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', width: 'fit-content',
                          padding: '4px 8px', borderRadius: 6,
                          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                          fontFamily: 'var(--font-mono)', letterSpacing: '0.4px',
                          color: responseMeta.color, background: responseMeta.bg,
                          border: `1px solid ${responseMeta.border}`,
                        }}>
                          {responseMeta.label}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'var(--font-body)' }}>
                          Awaiting HR action
                        </span>
                      )}
                      {interviewScheduledAt ? (
                        <span style={{ fontSize: 10, color: '#34D399', fontFamily: 'var(--font-body)' }}>
                          Interview scheduled preview ready
                        </span>
                      ) : null}
                      {session.disputeRequestedAt ? (
                        <span style={{ fontSize: 10, color: '#F59E0B', fontFamily: 'var(--font-body)' }}>
                          Candidate dispute pending review
                        </span>
                      ) : null}
                      {hrRespondedAt ? (
                        <span style={{ fontSize: 10, color: '#64748B', fontFamily: 'var(--font-body)' }}>
                          {new Date(hrRespondedAt).toLocaleString('en-MY')}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {(triage === 'GREEN' || triage === 'AMBER') && (
                        <button
                          onClick={() => handleAutoSchedule(session.id, session.candidateName)}
                          disabled={hrResponse !== 'offer'}
                          style={{
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontFamily: 'var(--font-mono)',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                            opacity: hrResponse === 'offer' ? 1 : 0.45,
                          }}
                        >
                          <span>⚡</span> Demo Schedule
                        </button>
                      )}
                      {(['offer', 'hold', 'reject'] as HrResponse[]).map(response => {
                        const meta = RESPONSE_META[response];
                        const isActive = hrResponse === response;
                        const isLoading = respondingSession === `${session.id}:${response}`;
                        return (
                          <button
                            key={response}
                            onClick={() => handleHrResponse(session.id, response)}
                            disabled={isLoading}
                            style={{
                              fontSize: 11, fontWeight: 700, cursor: isLoading ? 'wait' : 'pointer',
                              color: isActive ? '#F9FAFB' : meta.color,
                              background: isActive ? meta.color : meta.bg,
                              border: `1px solid ${meta.border}`, borderRadius: 8,
                              padding: '6px 10px', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
                              opacity: isLoading ? 0.7 : 1,
                            }}
                          >
                            {isLoading ? 'Saving...' : meta.label}
                          </button>
                        );
                      })}
                      <Link
                        href={`/hr/verdict/${session.id}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 12, fontWeight: 600,
                          color: '#93C5FD',
                          background: 'rgba(37,99,235,0.1)',
                          border: '1px solid rgba(37,99,235,0.2)',
                          padding: '6px 14px', borderRadius: 8,
                          textDecoration: 'none',
                          fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
                        }}
                      >
                        View
                      </Link>
                      {interviewMeetingLink ? (
                        <a
                          href={interviewMeetingLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontSize: 11, fontWeight: 700,
                            color: '#34D399',
                            background: 'rgba(16,185,129,0.08)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            padding: '6px 10px', borderRadius: 8,
                            textDecoration: 'none',
                            fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
                          }}
                        >
                          Preview Link
                        </a>
                      ) : null}
                      {isOverdue && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: '#FCA5A5',
                          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                          padding: '4px 8px', borderRadius: 6,
                          fontFamily: 'var(--font-mono)', letterSpacing: '0.3px',
                        }}>
                          48hr OVERDUE
                        </span>
                      )}
                      {!filledRoles.has(session.jdId) && triage === 'GREEN' && (
                        <button
                          onClick={() => handleFillRole(session.jdId, roleTitle ?? 'this role')}
                          disabled={filling === session.jdId}
                          style={{
                            fontSize: 11, fontWeight: 600, color: '#34D399',
                            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                            padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                            fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', opacity: filling === session.jdId ? 0.6 : 1,
                          }}
                        >
                          {filling === session.jdId ? '...' : 'Mark Filled ✓'}
                        </button>
                      )}
                      {filledRoles.has(session.jdId) && (
                        <span style={{ fontSize: 11, color: '#10B981', fontFamily: 'var(--font-mono)' }}>Role Filled</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div style={{
            padding: '80px 24px', textAlign: 'center',
            borderTop: '1px solid #1E2433',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>🗂️</div>
            <div style={{ fontSize: 15, color: '#475569', fontFamily: 'var(--font-body)' }}>
              No candidate rows matched this filter.{' '}
              <button
                onClick={() => setFilter('All')}
                style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', fontWeight: 600 }}
              >
                Clear Filters →
              </button>
            </div>
          </div>
        )}
      </div>

      {schedulingFor && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{
            width: 600, background: '#0A0C12', border: '1px solid #1E2433', borderRadius: 16,
            overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              background: '#141820', padding: '16px 24px', borderBottom: '1px solid #1E2433',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
                <span style={{ color: '#F9FAFB', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 14 }}>
                  Scheduling Demo (Agent 8 Preview)
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                Target: {schedulingFor}
              </div>
            </div>
            <div style={{ padding: '24px', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.8, minHeight: 300 }}>
              {scheduleLogs.map((log, index) => (
                <div
                  key={index}
                  style={{
                    color: log.includes('ready') || log.includes('finished') || log.includes('complete')
                      ? '#10B981'
                      : '#60A5FA',
                    opacity: index === scheduleLogs.length - 1 ? 1 : 0.7,
                    marginBottom: 8,
                  }}
                  className="fade-in"
                >
                  <span style={{ color: '#475569', marginRight: 12 }}>{new Date().toISOString().split('T')[1].slice(0, 8)}</span>
                  {log}
                </div>
              ))}
              {scheduleLogs.length > 0 && !scheduleLogs[scheduleLogs.length - 1].includes('finished') && (
                <div style={{ color: '#475569', marginTop: 12 }} className="blink">_</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
