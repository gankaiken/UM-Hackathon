'use client';
// components/hr/VerdictCard.tsx — Full HR verdict deep-dive view v3.0
import { useState } from 'react';
import Link from 'next/link';
import type { VerdictResult, SentinelData, StrategistResult } from '@/lib/types';
import type { Session, JdCache, Transcript } from '@/lib/db/schema';

interface Props {
  session: Session;
  jd: JdCache | null;
  transcripts: Transcript[];
}

export default function VerdictCard({ session, jd, transcripts }: Props) {
  const verdict: VerdictResult = JSON.parse(session.verdict!);
  const sentinelData: SentinelData = JSON.parse(session.sentinelData);
  const [activeTab, setActiveTab] = useState<'overview' | 'trace' | 'sentinel' | 'transcript'>('overview');

  const avgScore = verdict.overall_score ?? Math.round(
    Object.values(verdict.dimension_scores).reduce((s, d) => s + (typeof d === 'number' ? d : d.score), 0) /
    Math.max(1, Object.keys(verdict.dimension_scores).length)
  );
  const triage = verdict.triage_result as 'GREEN' | 'AMBER' | 'RED';
  const isFlagged = sentinelData.focus_loss_events > 3 && sentinelData.paste_events > 1;

  const triageMeta = {
    GREEN: { color: '#059669', bg: 'rgba(16,185,129,0.08)', border: '#BBF7D0', icon: '✓', label: 'Fast-Track' },
    AMBER: { color: '#D97706', bg: 'rgba(245,158,11,0.08)', border: '#FDE68A', icon: '⚠', label: 'Conditional' },
    RED:   { color: '#DC2626', bg: 'rgba(239,68,68,0.08)',  border: '#FECACA', icon: '✕', label: 'Review' },
  }[triage] || { color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB', icon: '•', label: 'Unknown' };

  const circumference = 2 * Math.PI * 34;
  const dashOffset = circumference * (1 - avgScore / 100);

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'trace', label: 'Agent Trace' },
    { id: 'sentinel', label: 'Sentinel Log' },
    { id: 'transcript', label: 'Transcript' },
  ] as const;

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '40px 0 100px' }}>
      <div style={{ maxWidth: 840, margin: '0 auto', padding: '0 24px' }}>
        
        {/* Back link */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/hr" style={{ 
            color: '#6B7280', fontSize: 13, textDecoration: 'none', 
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontWeight: 500, fontFamily: 'var(--font-body)',
            transition: 'color 0.15s'
          }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* ── Main Header Card ────────────────────────────────────────── */}
        <div style={{
          background: '#FFFFFF',
          border: `1.5px solid ${triageMeta.border}`,
          borderRadius: 24,
          padding: '36px',
          marginBottom: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle background glow based on triage */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: `linear-gradient(135deg, ${triageMeta.bg} 0%, transparent 40%)`,
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{
                  background: triageMeta.bg, color: triageMeta.color,
                  border: `1px solid ${triageMeta.border}`,
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.5px', textTransform: 'uppercase',
                }}>
                  {triageMeta.label}
                </span>
                {isFlagged && (
                  <span style={{
                    background: 'rgba(239,68,68,0.08)', color: '#DC2626',
                    border: '1px solid #FECACA',
                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                    fontFamily: 'var(--font-mono)', letterSpacing: '0.5px', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    ⚠ Sentinel Flag
                  </span>
                )}
              </div>

              <h1 style={{ 
                fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, 
                color: '#0A0C12', letterSpacing: '-1px', marginBottom: 8 
              }}>
                {session.candidateName}
              </h1>
              <p style={{ color: '#64748B', fontSize: 15, fontFamily: 'var(--font-body)' }}>
                {jd?.roleTitle || 'Untitled Role'} · Turn count: {session.turnCount} · 
                {' '}{new Date(session.createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            {/* Score Ring */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative' }}>
                <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#F1F5F9" strokeWidth="8"/>
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={triageMeta.color}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference * (42/34)}
                    strokeDashoffset={circumference * (42/34) * (1 - avgScore / 100)}
                    style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ 
                    fontSize: 28, fontWeight: 800, color: triageMeta.color, 
                    fontFamily: 'var(--font-display)', letterSpacing: '-1px' 
                  }}>
                    {Math.round(avgScore)}
                  </span>
                </div>
              </div>
              <div style={{ 
                fontSize: 10, fontWeight: 700, color: '#94A3B8', 
                fontFamily: 'var(--font-mono)', letterSpacing: '0.8px',
                marginTop: 8, textTransform: 'uppercase'
              }}>
                Average Score
              </div>
            </div>
          </div>

          <div style={{ 
            marginTop: 32, padding: '18px 20px', 
            background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 16,
            position: 'relative', zIndex: 1
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', marginBottom: 8, textTransform: 'uppercase' }}>
              AI Executive Summary
            </div>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
              {verdict.ai_summary || verdict.summary || 'No summary provided.'}
            </p>
          </div>
        </div>

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          {triage === 'GREEN' && (
            <button onClick={() => alert('Syncing verdict to ATS and auto-sending offer/next-round email...')} className="btn-primary" style={{ flex: 2, justifyContent: 'center', fontSize: 14, height: 48, cursor: 'pointer' }}>
              Fast-Track to Final Interview →
            </button>
          )}
          {triage === 'AMBER' && (
            <button onClick={() => alert('Opening internal Calendar scheduling system...')} className="btn-accent" style={{ flex: 2, justifyContent: 'center', fontSize: 14, height: 48, cursor: 'pointer' }}>
              Schedule Technical Review
            </button>
          )}
          {triage === 'RED' && (
            <button onClick={() => alert('Sending polite AI-generated feedback and decline email to candidate.')} className="btn-secondary" style={{ flex: 2, justifyContent: 'center', fontSize: 14, height: 48, color: '#EF4444', borderColor: '#FECACA', cursor: 'pointer' }}>
              Decline Candidate
            </button>
          )}
          <button onClick={() => alert('Opening candidate mail thread...')} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 14, height: 48, cursor: 'pointer' }}>
            Email
          </button>
          <button title="Download Full Transcript PDF" onClick={() => alert('Compiling and downloading high-fidelity PDF transcript...')} className="btn-secondary" style={{ width: 48, height: 48, padding: 0, justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* ── Sub-navigation Tabs ────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 28, borderBottom: '1px solid #E5E7EB', padding: '0 8px' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none', border: 'none', padding: '12px 0',
                fontSize: 14, fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? '#2563EB' : '#64748B',
                borderBottom: `2.5px solid ${activeTab === tab.id ? '#2563EB' : 'transparent'}`,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'all 0.15s ease', marginBottom: -1.25,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ──────────────────────────────────────────────── */}
        <div className="fade-in">
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Scores Card */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 20, padding: '32px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', marginBottom: 24, textTransform: 'uppercase' }}>
                  Competency Breakdown
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {Object.entries(verdict.dimension_scores).map(([dim, scoreData]) => {
                    const score = typeof scoreData === 'number' ? scoreData : scoreData.score;
                    const confidence = typeof scoreData === 'object' ? scoreData.confidence : null;
                    const evidence = typeof scoreData === 'object' ? scoreData.key_evidence : null;
                    const barColor = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
                    
                    return (
                      <div key={dim}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#0A0C12', fontFamily: 'var(--font-display)' }}>{dim}</span>
                            {confidence && (
                              <span style={{ 
                                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, 
                                background: '#F1F5F9', color: '#64748B', fontFamily: 'var(--font-mono)' 
                              }}>
                                {confidence.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#0A0C12', fontFamily: 'var(--font-mono)' }}>{score}</span>
                        </div>
                        <div style={{ height: 6, width: '100%', background: '#F1F5F9', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                          <div style={{ height: '100%', width: `${score}%`, background: barColor, borderRadius: 10 }} />
                        </div>
                        {evidence && (
                          <div style={{ 
                            fontSize: 13, color: '#64748B', lineHeight: 1.6, 
                            fontFamily: 'var(--font-body)', paddingLeft: 12, borderLeft: '2px solid #E2E8F0' 
                          }}>
                            {evidence}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths & Gaps */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Strengths */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 20, padding: '24px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', marginBottom: 20, textTransform: 'uppercase' }}>
                    Verified Strengths
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(verdict.verified_strengths || verdict.strengths || []).map((s: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#374151', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
                        <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Gaps */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 20, padding: '24px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', marginBottom: 20, textTransform: 'uppercase' }}>
                    Identified Gaps
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(verdict.identified_gaps || verdict.gaps || []).map((g: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#374151', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
                        <span style={{ color: '#F59E0B', fontWeight: 900 }}>!</span>
                        {g}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upskill Path */}
              {verdict.upskill_path && verdict.upskill_path.length > 0 && (
                <div style={{ background: '#FFFFFF', border: '1.5px solid #FDE68A', borderRadius: 20, padding: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <div style={{ fontSize: 24 }}>🚀</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#B45309', fontFamily: 'var(--font-display)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Auto-Generated Growth Path
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {verdict.upskill_path.map((step, i) => (
                      <div key={i} style={{ 
                        background: '#FFFBEB', border: '1px solid #FEF3C7', 
                        borderRadius: 14, padding: '16px 20px',
                        display: 'flex', gap: 16, alignItems: 'center'
                      }}>
                        <div style={{ 
                          width: 32, height: 32, borderRadius: 8, background: '#F59E0B', 
                          color: '#fff', fontSize: 11, fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          fontFamily: 'var(--font-mono)'
                        }}>
                          W{step.week}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E', fontFamily: 'var(--font-body)' }}>{step.topic}</div>
                          <div style={{ fontSize: 12, color: '#B45309', opacity: 0.8 }}>{step.resource}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'trace' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {transcripts.filter(t => t.strategistJson).length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', background: '#FFFFFF', color: '#94A3B8', borderRadius: 20, border: '1px solid #E5E7EB' }}>
                  No strategy trace recorded for this session.
                </div>
              ) : (
                transcripts.filter(t => t.strategistJson).map((t, i) => {
                  const s: StrategistResult = JSON.parse(t.strategistJson!);
                  const actionColor = s.next_action === 'close_session' ? '#EF4444' : s.next_action === 'reality_check' ? '#F59E0B' : '#10B981';
                  return (
                    <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Turn {s.turn_number}</span>
                          <span style={{ 
                            fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4, 
                            background: actionColor + '15', color: actionColor, 
                            textTransform: 'uppercase', fontFamily: 'var(--font-mono)' 
                          }}>{s.next_action}</span>
                        </div>
                        <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'var(--font-body)' }}>
                          Target: <strong style={{ color: '#0A0C12' }}>{s.target_dimension}</strong>
                        </span>
                      </div>
                      <div style={{ 
                        background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px',
                        fontSize: 13, color: '#334155', lineHeight: 1.6, fontFamily: 'var(--font-mono)',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {s.reasoning}
                      </div>
                    </div>
                  )
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
                ].map((item, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', justifyContent: 'space-between', padding: '16px 0',
                    borderBottom: idx === 3 ? 'none' : '1px solid #F1F5F9'
                  }}>
                    <span style={{ fontSize: 14, color: '#4B5563', fontFamily: 'var(--font-body)' }}>{item.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {item.value > item.threshold && <span style={{ fontSize: 9, fontWeight: 800, color: '#EF4444', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Flagged</span>}
                      <span style={{ 
                        fontSize: 16, fontWeight: 700, color: item.value > item.threshold ? '#EF4444' : '#059669',
                        fontFamily: 'var(--font-mono)' 
                      }}>{item.value}{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ 
                marginTop: 24, padding: '16px', borderRadius: 12,
                background: isFlagged ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)',
                border: `1px solid ${isFlagged ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}`,
                color: isFlagged ? '#B91C1C' : '#065F46',
                fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', textAlign: 'center'
              }}>
                {isFlagged ? '⚠ STAGE 2 ALERT: Elevated risk of automated tool usage detected' : '✓ CLEAN: Behavioural profile consistent with human interaction'}
              </div>
            </div>
          )}

          {activeTab === 'transcript' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {transcripts.map((t, i) => (
                <div key={i} style={{ 
                  display: 'flex', gap: 12, 
                  flexDirection: t.role === 'candidate' ? 'row-reverse' : 'row' 
                }}>
                  {/* Icon for AI */}
                  {t.role === 'inquisitor' && (
                    <div style={{ 
                      width: 32, height: 32, borderRadius: 8, background: '#2563EB', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white"/>
                      </svg>
                    </div>
                  )}
                  <div style={{ 
                    maxWidth: '80%', padding: '14px 18px', borderRadius: 16,
                    background: t.role === 'candidate' ? '#F3F4F6' : '#2563EB',
                    color: t.role === 'candidate' ? '#1F2937' : '#FFFFFF',
                    fontSize: 14, lineHeight: 1.6, fontFamily: 'var(--font-body)',
                    border: t.role === 'candidate' ? '1px solid #E5E7EB' : 'none',
                    boxShadow: t.role === 'candidate' ? 'none' : '0 4px 12px rgba(37,99,235,0.2)'
                  }}>
                    {t.content}
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
