'use client';
import { useState } from 'react';
import Link from 'next/link';

const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

export default function ClientPipeline({ completed }: { completed: any[] }) {
  const [filter, setFilter] = useState('All');
  const [filledRoles, setFilledRoles] = useState<Set<string>>(new Set());
  const [filling, setFilling] = useState<string | null>(null);

  // Detect candidates that have been waiting > 48 hours without HR response
  const ghostingCandidates = completed.filter(item => {
    if (!item.session?.completedAt) return false;
    const elapsed = Date.now() - item.session.completedAt;
    const responded = item.session?.hrRespondedAt;
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

  // Parse verdicts to allow filtering
  const parsedCompleted = completed.map((item) => {
    let verdict: any = null;
    let avgScore = 0;
    let isFlagged = false;
    let triage = 'RED';
    const elapsed = item.session?.completedAt ? Date.now() - item.session.completedAt : 0;
    const isOverdue = elapsed > FORTY_EIGHT_HOURS && !item.session?.hrRespondedAt;

    try {
      if (item.session?.verdict) {
        verdict = JSON.parse(item.session.verdict);
        const scores = Object.values(verdict.dimension_scores || {});
        avgScore = verdict.overall_score ?? Math.round(
          scores.reduce<number>((s, d: any) => s + (typeof d === 'number' ? d : d.score), 0) /
          Math.max(1, scores.length)
        );
        triage = verdict.triage_result;
      }
      if (item.session?.sentinelData) {
        const sentinel = JSON.parse(item.session.sentinelData);
        isFlagged = (sentinel.focus_loss_events > 3 && sentinel.paste_events > 1) || sentinel.ai_paste_detected;
      }
    } catch { }

    return { ...item, verdict, avgScore, isFlagged, triage, isOverdue };
  }).filter(item => item.verdict !== null);

  const filteredData = parsedCompleted.filter(item => filter === 'All' || item.triage === filter);

  return (
    <>
      {/* ── 48-HOUR GHOSTING ALERT BANNER ───────────────────────────── */}
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
              Delayed responses will penalise your <strong style={{ color: '#F9FAFB' }}>HR Reputation Score</strong>. Please act now.
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

      {/* ── REPUTATION + PENDING ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>

        {/* System health */}
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
                <circle cx="50" cy="50" r="38" fill="none" stroke="#1E2433" strokeWidth="8"/>
                <circle cx="50" cy="50" r="38" fill="none"
                  stroke="#10B981"
                  strokeWidth="8" strokeLinecap="round"
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
                  width: `98%`, height: '100%',
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
                The 7-agent pipeline is firing globally across all active roles with no latency anomalies.
              </div>
            </div>
          </div>
        </div>

        {/* Pending overrides */}
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
            {[
              {
                name: 'Aisyah Binti Razali', triage: 'AMBER',
                flag: 'Language Style Mismatch', id: 'seed-session-aisyah',
                color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)',
              },
              {
                name: 'Julian Doe', triage: 'RED',
                flag: 'Sentinel Focus Trace Failed', id: 'seed-session-siti',
                color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)',
              },
            ].map(p => (
              <div
                key={p.id}
                style={{
                  background: p.bg, border: `1.5px solid ${p.border}`,
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
                    {p.name}
                    <span style={{
                      padding: '2px 7px', borderRadius: 4, fontSize: 10,
                      fontWeight: 700, fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.5px', textTransform: 'uppercase',
                      background: p.color + '25', color: p.color,
                    }}>
                      {p.triage}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'var(--font-body)' }}>
                    ⚠ {p.flag}
                  </div>
                </div>
                <button
                  onClick={() => alert(`Redirecting to advanced manual review for ${p.name}...`)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 12, fontWeight: 600, color: p.color,
                    background: p.color + '15', border: `1px solid ${p.color}40`,
                    padding: '6px 14px', borderRadius: 8, textDecoration: 'none',
                    transition: 'all 0.15s ease', whiteSpace: 'nowrap', cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Respond
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PIPELINE TABLE ──────────────────────────────────────────── */}
      <div style={{
        background: '#141820', border: '1.5px solid #1E2433',
        borderRadius: 24, overflow: 'hidden',
      }}>
        {/* Table header */}
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
              {parsedCompleted.length} total candidates routed through 7-agent pipeline
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{
            display: 'flex', gap: 4,
            background: '#0F1117', padding: '4px', borderRadius: 10,
          }}>
            {['All', 'GREEN', 'AMBER', 'RED'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '6px 14px', borderRadius: 7, fontSize: 12, border: 'none',
                fontWeight: filter === f ? 700 : 500, cursor: 'pointer',
                background: filter === f ? '#1E2433' : 'transparent',
                color: filter === f ? '#F9FAFB'
                  : f === 'GREEN' ? '#10B981'
                  : f === 'AMBER' ? '#F59E0B'
                  : f === 'RED'   ? '#EF4444'
                  : '#64748B',
                transition: 'all 0.15s ease',
                fontFamily: 'var(--font-body)',
              }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              {['Candidate', 'Role', 'Triage', 'Dimension Score', 'Status', 'Action'].map(h => (
                <th key={h} style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.5px',
                  textTransform: 'uppercase', color: '#475569',
                  padding: '14px 20px',
                  borderBottom: '1px solid #1E2433',
                  fontFamily: 'var(--font-body)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map(({ session, roleTitle, verdict, avgScore, isFlagged, triage, isOverdue }) => {
              const triageMeta = {
                GREEN: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', text: '#F9FAFB' },
                AMBER: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', text: '#F9FAFB' },
                RED:   { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  text: '#F9FAFB' },
              }[triage as 'GREEN' | 'AMBER' | 'RED'] ?? { color: '#64748B', bg: 'rgba(100,116,139,0.12)', text: '#F9FAFB' };

              const initials = session.candidateName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
              const barColorClass = avgScore >= 75 ? '#10B981' : avgScore >= 50 ? '#F59E0B' : '#EF4444';

              return (
                <tr
                  key={session.id}
                  className="hr-table-row"
                  style={{
                    borderBottom: '1px solid #1E2433',
                  }}
                >
                  <td style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: 'linear-gradient(135deg, #1E2D60, #1E3A5F)',
                        border: '1px solid #2D3748',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: '#93C5FD', flexShrink: 0,
                        fontFamily: 'var(--font-display)',
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
                          background: barColorClass, borderRadius: 3,
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
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: verdict.human_review_required ? '#F59E0B' : '#10B981',
                      fontFamily: 'var(--font-body)',
                    }}>
                      {verdict.human_review_required ? '⚠ Review Required' : '✓ Cleared'}
                    </span>
                  </td>
                  <td style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Link
                        href={`/hr/verdict/${session.id}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 12, fontWeight: 600,
                          color: '#93C5FD',
                          background: 'rgba(37,99,235,0.1)',
                          border: '1px solid rgba(37,99,235,0.2)',
                          padding: '6px 14px', borderRadius: 8,
                          textDecoration: 'none', transition: 'all 0.15s ease',
                          fontFamily: 'var(--font-body)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        View
                      </Link>
                      {/* Overdue response indicator */}
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
                      {/* Mark role as filled */}
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
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>🗄️</div>
            <div style={{ fontSize: 15, color: '#475569', fontFamily: 'var(--font-body)' }}>
              No automated workflows matched this filter.{' '}
              <button onClick={() => setFilter('All')} style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', fontWeight: 600 }}>
                Clear Filters →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
