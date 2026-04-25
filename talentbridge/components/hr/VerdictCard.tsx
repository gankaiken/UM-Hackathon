'use client';
// components/hr/VerdictCard.tsx — Full HR verdict deep-dive view (Stripe-themed)

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
    Object.values(verdict.dimension_scores).reduce((s, d) => s + d.score, 0) /
    Math.max(1, Object.keys(verdict.dimension_scores).length)
  );
  const triage = verdict.triage_result;
  const isFlagged = sentinelData.focus_loss_events > 3 && sentinelData.paste_events > 1;

  const triageColor = triage === 'GREEN' ? 'var(--green-text)' : triage === 'AMBER' ? '#92650a' : 'var(--triage-red-text)';
  const triageBorder = triage === 'GREEN' ? 'rgba(21,190,83,0.25)' : triage === 'AMBER' ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)';
  const triageBg = triage === 'GREEN' ? 'rgba(21,190,83,0.05)' : triage === 'AMBER' ? 'rgba(245,158,11,0.05)' : 'rgba(239,68,68,0.05)';

  const circumference = 2 * Math.PI * 34;
  const dashOffset = circumference * (1 - avgScore / 100);

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'trace', label: 'Agent Trace' },
    { id: 'sentinel', label: 'Sentinel Log' },
    { id: 'transcript', label: 'Transcript' },
  ] as const;

  return (
    <div className="page-container-narrow fade-in">
      {/* Back nav */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/verdicts" style={{ color: 'var(--slate)', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          All Verdict Cards
        </Link>
      </div>

      {/* ── Triage Header ──────────────────────────────────────────────── */}
      <div className="card" style={{
        padding: 28, marginBottom: 20,
        background: triageBg,
        borderColor: triageBorder,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            {/* Badges row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span className={`triage-badge triage-${triage}`}>{triage}</span>
              {isFlagged && (
                <span className="auth-flagged">
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24">
                    <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Sentinel Stage 2 Alert
                </span>
              )}
              {verdict.human_review_required && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 4,
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  color: '#92650a',
                }}>
                  Human Review Required
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 400, color: 'var(--navy)', letterSpacing: -0.4, marginBottom: 6 }}>
              {session.candidateName}
            </h1>
            <p style={{ color: 'var(--slate)', fontSize: 13 }}>
              {jd?.roleTitle ?? 'Unknown role'} · {session.turnCount} turns ·{' '}
              {new Date(session.createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          {/* Score ring */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative' }}>
              <svg width="88" height="88" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="44" cy="44" r="34" fill="none" stroke="#eef2f7" strokeWidth="7"/>
                <circle
                  cx="44" cy="44" r="34" fill="none"
                  stroke={triage === 'GREEN' ? 'var(--green)' : triage === 'AMBER' ? 'var(--amber)' : 'var(--red)'}
                  strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 22, fontWeight: 300, color: triageColor, letterSpacing: -0.5 }}>{Math.round(avgScore)}</span>
              </div>
            </div>
            <div className="label-mono" style={{ marginTop: 6, fontSize: 9 }}>AVG SCORE</div>
          </div>
        </div>

        {/* AI Summary */}
        <div style={{
          padding: '14px 16px',
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--slate-dark)',
          fontSize: 14,
          lineHeight: 1.65,
        }}>
          {verdict.ai_summary ?? verdict.summary ?? 'No summary provided.'}
        </div>
      </div>

      {/* ── HR Actions ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {triage === 'GREEN' && (
          <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 14, padding: '10px' }}>
            ✓ Fast-Track to Final Interview
          </button>
        )}
        {triage === 'AMBER' && (
          <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 14, padding: '10px' }}>
            Schedule Technical + Upskill Path
          </button>
        )}
        {triage === 'RED' && (
          <button className="btn-neutral" style={{ flex: 1, justifyContent: 'center', fontSize: 14, padding: '10px', color: 'var(--red)' }}>
            Reject with AI-drafted feedback
          </button>
        )}
        <button className="btn-neutral" style={{ fontSize: 14, padding: '10px 18px' }}>
          Email Candidate
        </button>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--purple)' : 'transparent'}`,
              color: activeTab === tab.id ? 'var(--purple)' : 'var(--slate)',
              fontSize: 14,
              fontWeight: activeTab === tab.id ? 500 : 400,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ──────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Dimension scores */}
          <div className="card" style={{ padding: 24 }}>
            <div className="section-label" style={{ marginBottom: 16 }}>Competency Scores</div>
            {Object.entries(verdict.dimension_scores).map(([dim, scoreData]) => {
              const score = typeof scoreData === 'number' ? scoreData : scoreData.score;
              const barColor = score >= 75 ? 'score-bar-green' : score >= 50 ? 'score-bar-amber' : 'score-bar-red';
              const confidence = typeof scoreData === 'object' ? scoreData.confidence : null;
              const evidence = typeof scoreData === 'object' ? scoreData.key_evidence : null;
              return (
                <div key={dim} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--slate-dark)', fontWeight: 500 }}>{dim}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {confidence && (
                        <span style={{
                          fontSize: 10, fontFamily: 'var(--font-mono)',
                          padding: '1px 6px', borderRadius: 3,
                          background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                          color: 'var(--slate)',
                          textTransform: 'uppercase', letterSpacing: 0.4,
                        }}>
                          {confidence}
                        </span>
                      )}
                      <span style={{ fontSize: 15, fontWeight: 400, color: 'var(--navy)', fontVariantNumeric: 'tabular-nums' }}>
                        {score}
                      </span>
                    </div>
                  </div>
                  <div className="score-bar-track">
                    <div className={`score-bar-fill ${barColor}`} style={{ width: `${score}%` }} />
                  </div>
                  {evidence && (
                    <p style={{ fontSize: 11, color: 'var(--slate)', marginTop: 4, fontStyle: 'italic', lineHeight: 1.5 }}>
                      {evidence}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Strengths */}
          {(verdict.verified_strengths ?? verdict.strengths ?? []).length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <div className="section-label" style={{ marginBottom: 14 }}>Verified Strengths</div>
              {(verdict.verified_strengths ?? verdict.strengths ?? []).map((s: string, i: number) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, marginBottom: 8,
                  padding: '10px 14px',
                  background: 'rgba(21,190,83,0.04)',
                  border: '1px solid rgba(21,190,83,0.2)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <span style={{ color: 'var(--green-text)', flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: 'var(--slate-dark)', lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
          )}

          {/* Gaps */}
          {(verdict.identified_gaps ?? verdict.gaps ?? []).length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <div className="section-label" style={{ marginBottom: 14 }}>Identified Gaps</div>
              {(verdict.identified_gaps ?? verdict.gaps ?? []).map((g: string, i: number) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, marginBottom: 8,
                  padding: '10px 14px',
                  background: 'rgba(245,158,11,0.04)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <span style={{ color: '#d97706', flexShrink: 0 }}>△</span>
                  <span style={{ fontSize: 13, color: 'var(--slate-dark)', lineHeight: 1.5 }}>{g}</span>
                </div>
              ))}
            </div>
          )}

          {/* Upskill path */}
          {verdict.upskill_path && verdict.upskill_path.length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <div className="section-label" style={{ marginBottom: 14 }}>Auto-Generated Upskill Path</div>
              {verdict.upskill_path.map((step: { week: number; topic: string; resource: string }, i: number) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, marginBottom: 10,
                  padding: '12px 14px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--amber)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, flexShrink: 0,
                    fontFamily: 'var(--font-mono)',
                  }}>
                    W{step.week}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--navy)' }}>{step.topic}</div>
                    <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>{step.resource}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Agent Trace Tab ────────────────────────────────────────────── */}
      {activeTab === 'trace' && (
        <div className="fade-in">
          <p style={{ color: 'var(--slate)', fontSize: 13, marginBottom: 16 }}>
            Strategist reasoning chain — internal turn-by-turn decision log.
          </p>
          {transcripts.filter(t => t.strategistJson).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--slate)' }}>
              No agent trace data for this session.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {transcripts.filter(t => t.strategistJson).map((t, i) => {
                const s: StrategistResult = JSON.parse(t.strategistJson!);
                const actionColor = s.next_action === 'close_session' ? 'var(--red)' : s.next_action === 'reality_check' ? 'var(--amber)' : 'var(--green)';
                const actionBg = s.next_action === 'close_session' ? 'rgba(239,68,68,0.08)' : s.next_action === 'reality_check' ? 'rgba(245,158,11,0.08)' : 'rgba(21,190,83,0.08)';
                return (
                  <div key={i} className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                      <span className="label-mono">Turn {s.turn_number}</span>
                      <span style={{
                        padding: '2px 8px', fontSize: 10, borderRadius: 4,
                        fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                        background: actionBg, color: actionColor, letterSpacing: 0.4,
                      }}>
                        {s.next_action}
                      </span>
                      {s.sentinel_override && (
                        <span style={{ fontSize: 10, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>⚠ SENTINEL</span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--slate-dark)', marginBottom: 8 }}>
                      <span style={{ color: 'var(--slate)' }}>Target: </span>{s.target_dimension}
                    </p>
                    <div style={{
                      padding: '10px 14px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--slate)',
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}>
                      {s.reasoning}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Sentinel Log Tab ──────────────────────────────────────────── */}
      {activeTab === 'sentinel' && (
        <div className="fade-in">
          <div className="card" style={{ padding: 24, borderColor: isFlagged ? 'rgba(239,68,68,0.3)' : 'var(--border)' }}>
            <div className="section-label" style={{ marginBottom: 16 }}>Behavioural Monitoring Report</div>
            {([
              { label: 'Focus Loss Events', value: sentinelData.focus_loss_events, threshold: 3, unit: '' },
              { label: 'Total Away Duration', value: Math.round(sentinelData.total_away_duration_seconds), threshold: 60, unit: 's' },
              { label: 'Paste Events', value: sentinelData.paste_events, threshold: 1, unit: '' },
              { label: 'Tab Switches', value: sentinelData.tab_switches, threshold: 2, unit: '' },
            ] as const).map(({ label, value, threshold, unit }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 13, color: 'var(--slate-dark)' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {value > threshold && (
                    <span style={{ fontSize: 10, color: 'var(--red)', fontFamily: 'var(--font-mono)', background: 'rgba(239,68,68,0.08)', padding: '1px 6px', borderRadius: 3 }}>
                      ↑ FLAGGED
                    </span>
                  )}
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 400,
                    color: value > threshold ? 'var(--red)' : 'var(--green-text)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {value}{unit}
                  </span>
                </div>
              </div>
            ))}

            <div style={{
              marginTop: 16, padding: '14px 16px',
              background: isFlagged ? 'rgba(239,68,68,0.05)' : 'rgba(21,190,83,0.05)',
              border: `1px solid ${isFlagged ? 'rgba(239,68,68,0.2)' : 'rgba(21,190,83,0.2)'}`,
              borderRadius: 'var(--radius-sm)',
            }}>
              <div className={isFlagged ? 'auth-flagged' : 'auth-clean'}>
                {isFlagged
                  ? '⚠ Stage 2 Alert — Elevated risk of AI proxy use detected'
                  : '✓ Clean behavioural profile — no anomaly flags'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Transcript Tab ────────────────────────────────────────────── */}
      {activeTab === 'transcript' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {transcripts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--slate)' }}>
              No transcript recorded.
            </div>
          ) : (
            transcripts.map((t, i) => (
              <div key={i} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: t.role === 'candidate' ? 'flex-end' : 'flex-start',
              }}>
                {t.role === 'inquisitor' && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--purple)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 2,
                    }}>
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white"/>
                      </svg>
                    </div>
                    <div className="bubble-ai" style={{ maxWidth: '80%' }}>{t.content}</div>
                  </div>
                )}
                {t.role === 'candidate' && (
                  <div className="bubble-candidate" style={{ maxWidth: '80%' }}>{t.content}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
