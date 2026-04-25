'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { HrResponse, VerdictResult, SentinelData, StrategistResult } from '@/lib/types';
import type { Session, JdCache, Transcript } from '@/lib/db/schema';
import { normalizeSentinelData } from '@/lib/sentinel';

interface Props {
  session: Session;
  jd: JdCache | null;
  transcripts: Transcript[];
}

const RESPONSE_META: Record<HrResponse, { label: string; color: string; bg: string; border: string }> = {
  offer: { label: 'Proceed', color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
  hold: { label: 'Hold', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  reject: { label: 'Pass', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

export default function VerdictCard({ session, jd, transcripts }: Props) {
  const verdict: VerdictResult = JSON.parse(session.verdict!);
  const sentinelData: SentinelData = normalizeSentinelData(JSON.parse(session.sentinelData));
  const [activeTab, setActiveTab] = useState<'overview' | 'trace' | 'sentinel' | 'transcript'>('overview');
  const [hrResponse, setHrResponse] = useState<HrResponse | null>(
    session.hrResponse === 'offer' || session.hrResponse === 'hold' || session.hrResponse === 'reject'
      ? session.hrResponse
      : null
  );
  const [hrRespondedAt, setHrRespondedAt] = useState<Session['hrRespondedAt']>(session.hrRespondedAt);
  const [savingResponse, setSavingResponse] = useState<HrResponse | null>(null);
  const [interviewScheduledAt, setInterviewScheduledAt] = useState<Session['interviewScheduledAt']>(session.interviewScheduledAt);
  const [interviewMeetingLink, setInterviewMeetingLink] = useState(session.interviewMeetingLink ?? '');
  const [interviewScheduleNote, setInterviewScheduleNote] = useState(session.interviewScheduleNote ?? '');
  const [schedulingPreview, setSchedulingPreview] = useState(false);
  const activeHrResponse = hrResponse ?? null;

  const avgScore = verdict.overall_score ?? Math.round(
    Object.values(verdict.dimension_scores).reduce((sum, dimension) => sum + (typeof dimension === 'number' ? dimension : dimension.score), 0) /
    Math.max(1, Object.keys(verdict.dimension_scores).length)
  );
  const triage = verdict.triage_result as 'GREEN' | 'AMBER' | 'RED';
  const isFlagged = sentinelData.integrity_stage === 'stage_2_alert';

  const triageMeta = {
    GREEN: { color: '#059669', bg: 'rgba(16,185,129,0.08)', border: '#BBF7D0', label: 'Fast-Track' },
    AMBER: { color: '#D97706', bg: 'rgba(245,158,11,0.08)', border: '#FDE68A', label: 'Conditional' },
    RED: { color: '#DC2626', bg: 'rgba(239,68,68,0.08)', border: '#FECACA', label: 'Review' },
  }[triage];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'trace', label: 'Agent Trace' },
    { id: 'sentinel', label: 'Sentinel Log' },
    { id: 'transcript', label: 'Transcript' },
  ] as const;

  async function handleHrResponse(response: HrResponse) {
    setSavingResponse(response);
    try {
      const res = await fetch(`/api/hr/session/${session.id}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not save HR response');
        return;
      }
      setHrResponse(data.hrResponse);
      setHrRespondedAt(data.hrRespondedAt);
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSavingResponse(null);
    }
  }

  async function handleSchedulePreview() {
    setSchedulingPreview(true);
    try {
      const res = await fetch(`/api/hr/session/${session.id}/schedule-preview`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not create schedule preview');
        return;
      }
      setInterviewScheduledAt(data.interviewScheduledAt);
      setInterviewMeetingLink(data.interviewMeetingLink);
      setInterviewScheduleNote(data.interviewScheduleNote);
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSchedulingPreview(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '40px 0 100px' }}>
      <div style={{ maxWidth: 840, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <Link
            href="/hr"
            style={{
              color: '#6B7280',
              fontSize: 13,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div style={{
          background: '#FFFFFF',
          border: `1.5px solid ${triageMeta.border}`,
          borderRadius: 24,
          padding: '36px',
          marginBottom: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{
                  background: triageMeta.bg,
                  color: triageMeta.color,
                  border: `1px solid ${triageMeta.border}`,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}>
                  {triageMeta.label}
                </span>
                {isFlagged && (
                  <span style={{
                    background: 'rgba(239,68,68,0.08)',
                    color: '#DC2626',
                    border: '1px solid #FECACA',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}>
                    Sentinel Flag
                  </span>
                )}
              </div>

              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 32,
                fontWeight: 800,
                color: '#0A0C12',
                letterSpacing: '-1px',
                marginBottom: 8,
              }}>
                {session.candidateName}
              </h1>
              <p style={{ color: '#64748B', fontSize: 15, fontFamily: 'var(--font-body)' }}>
                {jd?.roleTitle || 'Untitled Role'} · Turn count: {session.turnCount} ·{' '}
                {new Date(session.createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: triageMeta.color, fontFamily: 'var(--font-display)' }}>
                {Math.round(avgScore)}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                Average Score
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 32,
            padding: '18px 20px',
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: 16,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', marginBottom: 8, textTransform: 'uppercase' }}>
              AI Executive Summary
            </div>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
              {verdict.ai_summary || verdict.summary || 'No summary provided.'}
            </p>
          </div>

          <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              HR Decision
            </span>
            {activeHrResponse ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
                color: RESPONSE_META[activeHrResponse].color,
                background: RESPONSE_META[activeHrResponse].bg,
                border: `1px solid ${RESPONSE_META[activeHrResponse].border}`,
              }}>
                {RESPONSE_META[activeHrResponse].label}
              </span>
            ) : (
              <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'var(--font-body)' }}>
                No HR action recorded yet.
              </span>
            )}
            {hrRespondedAt ? (
              <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'var(--font-body)' }}>
                Saved {new Date(hrRespondedAt).toLocaleString('en-MY')}
              </span>
            ) : null}
            {session.disputeRequestedAt ? (
              <span style={{ fontSize: 12, color: '#D97706', fontFamily: 'var(--font-body)' }}>
                Candidate dispute submitted {new Date(session.disputeRequestedAt).toLocaleString('en-MY')}
              </span>
            ) : null}
          </div>
          {interviewScheduledAt ? (
            <div style={{
              marginTop: 16,
              padding: '14px 16px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: 12,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#047857', fontFamily: 'var(--font-mono)', letterSpacing: '0.7px', textTransform: 'uppercase', marginBottom: 6 }}>
                Scheduling Preview Ready
              </div>
              <div style={{ fontSize: 14, color: '#065F46', fontFamily: 'var(--font-body)', marginBottom: 6 }}>
                {new Date(interviewScheduledAt).toLocaleString('en-MY')}
              </div>
              <div style={{ fontSize: 12, color: '#047857', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                {interviewScheduleNote || 'Demo scheduling preview stored. External email/calendar/Zoom remain simulated.'}
              </div>
              {interviewMeetingLink ? (
                <a
                  href={interviewMeetingLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#047857', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', textDecoration: 'none' }}
                >
                  Open Preview Link
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          {(['offer', 'hold', 'reject'] as HrResponse[]).map(response => {
            const meta = RESPONSE_META[response];
            const isActive = hrResponse === response;
            const isLoading = savingResponse === response;
            return (
              <button
                key={response}
                onClick={() => handleHrResponse(response)}
                style={{
                  height: 48,
                  padding: '0 18px',
                  borderRadius: 10,
                  border: `1px solid ${meta.border}`,
                  background: isActive ? meta.color : meta.bg,
                  color: isActive ? '#FFFFFF' : meta.color,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: isLoading ? 'wait' : 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {isLoading ? 'Saving...' : meta.label}
              </button>
            );
          })}
          <button
            onClick={handleSchedulePreview}
            disabled={activeHrResponse !== 'offer' || schedulingPreview}
            className="btn-secondary"
            style={{ flex: 1, justifyContent: 'center', fontSize: 14, height: 48, cursor: activeHrResponse === 'offer' ? 'pointer' : 'not-allowed', opacity: activeHrResponse === 'offer' ? 1 : 0.55 }}
          >
            {schedulingPreview ? 'Preparing Preview...' : 'Demo Scheduling Preview'}
          </button>
          <button
            onClick={() => alert('Demo only: outbound email is not connected in this build.')}
            className="btn-secondary"
            style={{ flex: 1, justifyContent: 'center', fontSize: 14, height: 48, cursor: 'pointer' }}
          >
            Email Preview
          </button>
          <button
            title="Download Full Transcript PDF"
            onClick={() => alert('Compiling and downloading high-fidelity PDF transcript...')}
            className="btn-secondary"
            style={{ width: 48, height: 48, padding: 0, justifyContent: 'center', cursor: 'pointer' }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 24, marginBottom: 28, borderBottom: '1px solid #E5E7EB', padding: '0 8px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 0',
                fontSize: 14,
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? '#2563EB' : '#64748B',
                borderBottom: `2.5px solid ${activeTab === tab.id ? '#2563EB' : 'transparent'}`,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="fade-in">
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 20, padding: '32px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', marginBottom: 24, textTransform: 'uppercase' }}>
                  Competency Breakdown
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {Object.entries(verdict.dimension_scores).map(([dimension, scoreData]) => {
                    const score = typeof scoreData === 'number' ? scoreData : scoreData.score;
                    const confidence = typeof scoreData === 'object' ? scoreData.confidence : null;
                    const evidence = typeof scoreData === 'object' ? scoreData.key_evidence : null;
                    const barColor = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';

                    return (
                      <div key={dimension}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#0A0C12', fontFamily: 'var(--font-display)' }}>
                              {dimension}
                            </span>
                            {confidence && (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#F1F5F9', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                                {confidence.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#0A0C12', fontFamily: 'var(--font-mono)' }}>
                            {score}
                          </span>
                        </div>
                        <div style={{ height: 6, width: '100%', background: '#F1F5F9', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                          <div style={{ height: '100%', width: `${score}%`, background: barColor, borderRadius: 10 }} />
                        </div>
                        {evidence && (
                          <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, fontFamily: 'var(--font-body)', paddingLeft: 12, borderLeft: '2px solid #E2E8F0' }}>
                            {evidence}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 20, padding: '24px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', marginBottom: 20, textTransform: 'uppercase' }}>
                    Verified Strengths
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(verdict.verified_strengths || verdict.strengths || []).map((strength, index) => (
                      <div key={index} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#374151', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
                        <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span>
                        {strength}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 20, padding: '24px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', marginBottom: 20, textTransform: 'uppercase' }}>
                    Identified Gaps
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(verdict.identified_gaps || verdict.gaps || []).map((gap, index) => (
                      <div key={index} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#374151', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
                        <span style={{ color: '#F59E0B', fontWeight: 900 }}>!</span>
                        {gap}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trace' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {transcripts.filter(t => t.strategistJson).length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', background: '#FFFFFF', color: '#94A3B8', borderRadius: 20, border: '1px solid #E5E7EB' }}>
                  No strategy trace recorded for this session.
                </div>
              ) : (
                transcripts.filter(t => t.strategistJson).map((transcript, index) => {
                  const strategist: StrategistResult = JSON.parse(transcript.strategistJson!);
                  const actionColor = strategist.next_action === 'close_session'
                    ? '#EF4444'
                    : strategist.next_action === 'reality_check'
                      ? '#F59E0B'
                      : '#10B981';

                  return (
                    <div key={index} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                            Turn {strategist.turn_number}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                            background: `${actionColor}15`, color: actionColor,
                            textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
                          }}>
                            {strategist.next_action}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'var(--font-body)' }}>
                          Target: <strong style={{ color: '#0A0C12' }}>{strategist.target_dimension}</strong>
                        </span>
                      </div>
                      <div style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: 12,
                        padding: '16px',
                        fontSize: 13,
                        color: '#334155',
                        lineHeight: 1.6,
                        fontFamily: 'var(--font-mono)',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {strategist.reasoning}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'sentinel' && (
            <div style={{ background: '#FFFFFF', border: isFlagged ? '1.5px solid #FECACA' : '1px solid #E5E7EB', borderRadius: 20, padding: '32px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', marginBottom: 24, textTransform: 'uppercase' }}>
                Behavioural Watchdog Report
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Window Focus Loss', value: sentinelData.focus_loss_events, threshold: 3, unit: ' events' },
                  { label: 'Away Duration', value: Math.round(sentinelData.total_away_duration_seconds), threshold: 60, unit: 's' },
                  { label: 'Clipboard Paste Actions', value: sentinelData.paste_events, threshold: 1, unit: ' events' },
                  { label: 'Tab Swapping Count', value: sentinelData.tab_switches, threshold: 2, unit: ' events' },
                  { label: 'Last Answer Timing', value: Math.round((sentinelData.last_answer_elapsed_ms ?? 0) / 1000), threshold: 120, unit: 's' },
                  { label: 'Timing Anomalies', value: sentinelData.timing_anomaly_count ?? 0, threshold: 0, unit: ' events' },
                ].map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: index === 5 ? 'none' : '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: 14, color: '#4B5563', fontFamily: 'var(--font-body)' }}>{item.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {item.value > item.threshold && (
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#EF4444', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                          Flagged
                        </span>
                      )}
                      <span style={{ fontSize: 16, fontWeight: 700, color: item.value > item.threshold ? '#EF4444' : '#059669', fontFamily: 'var(--font-mono)' }}>
                        {item.value}{item.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'transcript' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {transcripts.map((transcript, index) => (
                <div key={index} style={{ display: 'flex', gap: 12, flexDirection: transcript.role === 'candidate' ? 'row-reverse' : 'row' }}>
                  {transcript.role === 'inquisitor' && (
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
                      </svg>
                    </div>
                  )}
                  <div style={{
                    maxWidth: '80%',
                    padding: '14px 18px',
                    borderRadius: 16,
                    background: transcript.role === 'candidate' ? '#F3F4F6' : '#2563EB',
                    color: transcript.role === 'candidate' ? '#1F2937' : '#FFFFFF',
                    fontSize: 14,
                    lineHeight: 1.6,
                    fontFamily: 'var(--font-body)',
                    border: transcript.role === 'candidate' ? '1px solid #E5E7EB' : 'none',
                    boxShadow: transcript.role === 'candidate' ? 'none' : '0 4px 12px rgba(37,99,235,0.2)',
                  }}>
                    {transcript.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
