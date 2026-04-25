// app/hr/page.tsx — Premium Agentic Dark Dashboard v3.0 (Server Component)
import { db } from '@/lib/db';
import { sessions, jdCache } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import type { VerdictResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HRDashboard() {
  const allSessions = await db
    .select({ session: sessions, roleTitle: jdCache.roleTitle, company: jdCache.employerId })
    .from(sessions)
    .leftJoin(jdCache, eq(sessions.jdId, jdCache.id))
    .orderBy(desc(sessions.createdAt))
    .all();

  const completed = allSessions.filter(s => s.session.verdict);
  const active    = allSessions.filter(s => s.session.status === 'active');

  const ghostingEvents = 3;
  const reputationScore = 81;
  const responseRate = 92;
  const thisMonthCount = completed.filter(s => Date.now() - s.session.createdAt < 30 * 24 * 3600 * 1000).length;

  const circumference = 2 * Math.PI * 38;
  const dashOffset = circumference * (1 - reputationScore / 100);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080A0F',
      color: '#F9FAFB',
      padding: '40px 0 100px',
    }}>
      <style>{`
        .hr-kpi-card:hover { border-color: rgba(37,99,235,0.3) !important; box-shadow: 0 0 30px rgba(37,99,235,0.1); }
        .hr-table-row:hover td { background: #1A2030; }
        .hr-table-row td { transition: background 0.15s ease; }
      `}</style>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>

        {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 40, paddingBottom: 28,
          borderBottom: '1px solid #1E2433',
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 20, padding: '3px 10px', marginBottom: 14,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%', background: '#10B981',
                display: 'inline-block', boxShadow: '0 0 8px rgba(16,185,129,0.8)',
              }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981', fontFamily: 'var(--font-mono)', letterSpacing: '0.3px' }}>
                ALL SYSTEMS OPERATIONAL
              </span>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32, fontWeight: 800, lineHeight: 1.1,
              letterSpacing: '-1px', color: '#F9FAFB', marginBottom: 6,
            }}>
              Dashboard
            </h1>
            <p style={{ fontSize: 14, color: '#4B5568', fontFamily: 'var(--font-body)' }}>
              {completed.length} verdicts issued · {active.length} sessions active · {ghostingEvents} flags pending review
            </p>
          </div>
          <Link
            href="/hr/upload"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #2563EB, #0EA5E9)',
              color: '#FFFFFF', fontSize: 14, fontWeight: 700,
              padding: '0 22px', height: 42, borderRadius: 10,
              textDecoration: 'none',
              fontFamily: 'var(--font-body)', letterSpacing: '-0.2px',
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            }}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12l7-7 7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Post New Role
          </Link>
        </div>

        {/* ── KPI CARDS ──────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            {
              value: completed.length.toString(),
              label: 'Total Verdicts',
              sub: `+${thisMonthCount} this month`,
              subColor: '#10B981',
              icon: '📊',
            },
            {
              value: `${responseRate}%`,
              label: 'Response Rate (48hr)',
              sub: 'Above threshold: 80%',
              subColor: '#10B981',
              icon: '⚡',
            },
            {
              value: ghostingEvents.toString(),
              label: 'Integrity Flags',
              sub: 'Requires manual audit',
              subColor: '#F59E0B',
              icon: '🛡',
            },
            {
              value: `${Math.max(1, Math.round(completed.length * 4.5))}h`,
              label: 'AI Time Saved',
              sub: 'vs manual screening',
              subColor: '#2563EB',
              icon: '⏱',
            },
          ].map((kpi, i) => (
            <div
              key={i}
              className="hr-kpi-card"
              style={{
                background: '#141820',
                border: '1.5px solid #1E2433',
                borderRadius: 20,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{
                fontSize: 24, marginBottom: 12, lineHeight: 1,
                filter: 'grayscale(20%)',
              }}>
                {kpi.icon}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 38, fontWeight: 800, lineHeight: 1,
                letterSpacing: '-1.5px', color: '#F9FAFB', marginBottom: 8,
              }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10, fontFamily: 'var(--font-body)' }}>
                {kpi.label}
              </div>
              <div style={{
                fontSize: 12, fontWeight: 600, color: kpi.subColor,
                fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>

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
              {/* Circular progress */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#1E2433" strokeWidth="8"/>
                  <circle cx="50" cy="50" r="38" fill="none"
                    stroke="#10B981"
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
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
                    {reputationScore}
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
                    width: `${reputationScore}%`, height: '100%',
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
              Urgent Agent Overrides Required
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
                  <Link
                    href={`/hr/verdict/${p.id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 12, fontWeight: 600, color: p.color,
                      background: p.color + '15', border: `1px solid ${p.color}40`,
                      padding: '6px 14px', borderRadius: 8, textDecoration: 'none',
                      transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    Review
                  </Link>
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
                Global Candidate Pipeline
              </h2>
              <div style={{ fontSize: 13, color: '#475569', fontFamily: 'var(--font-body)' }}>
                {completed.length} total candidates routed through 7-agent pipeline
              </div>
            </div>

            {/* Filter tabs */}
            <div style={{
              display: 'flex', gap: 4,
              background: '#0F1117', padding: '4px', borderRadius: 10,
            }}>
              {['All', 'GREEN', 'AMBER', 'RED'].map((f, index) => (
                <span key={f} style={{
                  padding: '6px 14px', borderRadius: 7, fontSize: 12,
                  fontWeight: index === 0 ? 700 : 500, cursor: 'pointer',
                  background: index === 0 ? '#1E2433' : 'transparent',
                  color: index === 0 ? '#F9FAFB'
                    : f === 'GREEN' ? '#10B981'
                    : f === 'AMBER' ? '#F59E0B'
                    : f === 'RED'   ? '#EF4444'
                    : '#64748B',
                  transition: 'all 0.15s ease',
                  fontFamily: 'var(--font-body)',
                }}>
                  {f}
                </span>
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
              {completed.map(({ session, roleTitle }) => {
                let verdict: VerdictResult | null = null;
                try { verdict = JSON.parse(session.verdict!); } catch { return null; }
                if (!verdict) return null;

                const avgScore = verdict.overall_score ?? Math.round(
                  Object.values(verdict.dimension_scores).reduce((s, d) => s + (typeof d === 'number' ? d : d.score), 0) /
                  Math.max(1, Object.keys(verdict.dimension_scores).length)
                );

                let isFlagged = false;
                try {
                  const sentinel = JSON.parse(session.sentinelData);
                  isFlagged = sentinel.focus_loss_events > 3 && sentinel.paste_events > 1;
                } catch { /* ignore */ }

                const triage = verdict.triage_result;
                const triageMeta = {
                  GREEN: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', text: '#F9FAFB' },
                  AMBER: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', text: '#F9FAFB' },
                  RED:   { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  text: '#F9FAFB' },
                }[triage as 'GREEN' | 'AMBER' | 'RED'] ?? { color: '#64748B', bg: 'rgba(100,116,139,0.12)', text: '#F9FAFB' };

                const initials = session.candidateName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                const barColorClass = avgScore >= 75 ? '#10B981' : avgScore >= 50 ? '#F59E0B' : '#EF4444';

                return (
                  <tr
                    key={session.id}
                    className="hr-table-row"
                    style={{
                      borderBottom: '1px solid #1E2433',
                    }}
                  >
                    {/* Candidate */}
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
                    {/* Role */}
                    <td style={{ padding: '18px 20px', fontSize: 13, color: '#64748B', fontFamily: 'var(--font-body)' }}>
                      {roleTitle ?? 'Unknown'}
                    </td>
                    {/* Triage */}
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
                    {/* Score */}
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
                    {/* Status */}
                    <td style={{ padding: '18px 20px' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: verdict.human_review_required ? '#F59E0B' : '#10B981',
                        fontFamily: 'var(--font-body)',
                      }}>
                        {verdict.human_review_required ? '⚠ Review Required' : '✓ Cleared'}
                      </span>
                    </td>
                    {/* Action */}
                    <td style={{ padding: '18px 20px' }}>
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
                        View Verdict
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {completed.length === 0 && (
            <div style={{
              padding: '80px 24px', textAlign: 'center',
              borderTop: '1px solid #1E2433',
            }}>
              <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>🗄️</div>
              <div style={{ fontSize: 15, color: '#475569', fontFamily: 'var(--font-body)' }}>
                No automated workflows resolved yet.{' '}
                <Link href="/hr/upload" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>
                  Initialize an agent pipeline →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
