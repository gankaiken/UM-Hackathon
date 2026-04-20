// app/hr/page.tsx  — Premium HR Dashboard (fixed card rendering)
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
  const reputationScore = 61;
  const responseRate = 61;
  const thisMonthCount = completed.filter(s => Date.now() - s.session.createdAt < 30 * 24 * 3600 * 1000).length;

  const pendingResponse = completed
    .filter(s => { try { const v: VerdictResult = JSON.parse(s.session.verdict!); return v.triage_result !== 'RED'; } catch { return false; } })
    .slice(0, 2);

  const circumference = 2 * Math.PI * 38;
  const dashOffset = circumference * (1 - reputationScore / 100);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36 }}>
        <div>
          <p style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#64748d', marginBottom: 8 }}>
            Employer Hub
          </p>
          <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 300, letterSpacing: '-0.8px', color: '#061b31', lineHeight: 1.12, margin: 0 }}>
            Recruitment Dashboard
          </h1>
          <p style={{ color: '#64748d', fontSize: 15, marginTop: 6 }}>
            {completed.length} verdicts issued · {active.length} interviews in progress
          </p>
        </div>
        <Link href="/hr/upload" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '10px 20px', background: '#533afd', color: '#fff',
          borderRadius: 4, fontSize: 14, fontWeight: 500, textDecoration: 'none',
        }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12l7-7 7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Post New Role
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { value: completed.length, label: 'Verdict Cards this month', delta: `+${thisMonthCount} vs last month`, deltaClass: 'pos' },
          { value: `${responseRate}%`, label: 'Response rate (48hr)', delta: 'Below threshold: 80%', deltaClass: 'neg' },
          { value: ghostingEvents, label: 'Ghosting events logged', delta: 'Affects reputation score', deltaClass: 'warn' },
          { value: `${Math.max(1, completed.length * 4.5)} hrs`, label: 'HR Time Saved', delta: 'vs manual screening', deltaClass: 'pos' },
        ].map((kpi, i) => (
          <div key={i} style={{
            background: '#fff',
            border: '1px solid #e5edf5',
            borderRadius: 12,
            boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px, rgba(0,0,0,0.05) 0px 2px 6px',
            padding: '20px 24px',
          }}>
            <div style={{ fontSize: 32, fontWeight: 300, letterSpacing: '-1px', color: '#061b31', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 13, color: '#64748d', marginTop: 4 }}>{kpi.label}</div>
            <div style={{
              fontSize: 12, fontWeight: 500, marginTop: 8, display: 'flex', alignItems: 'center', gap: 4,
              color: kpi.deltaClass === 'pos' ? '#108c3d' : kpi.deltaClass === 'neg' ? '#ef4444' : kpi.deltaClass === 'warn' ? '#f59e0b' : '#64748d',
            }}>
              {kpi.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Reputation + Pending */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Reputation Score */}
        <div style={{
          background: '#fff', border: '1px solid #e5edf5', borderRadius: 12,
          boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px, rgba(0,0,0,0.05) 0px 2px 6px',
          padding: 28,
        }}>
          <p style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#64748d', marginBottom: 16 }}>
            HR Reputation Score
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="38" fill="none" stroke="#eef2f7" strokeWidth="8"/>
                <circle cx="50" cy="50" r="38" fill="none"
                  stroke="#f59e0b"
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 24, fontWeight: 300, color: '#061b31', lineHeight: 1 }}>{reputationScore}</span>
                <span style={{ fontSize: 10, color: '#64748d', marginTop: 2 }}>/100</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: '#273951', fontWeight: 500 }}>Nexus Digital Sdn Bhd</span>
                <span style={{ fontSize: 28, fontWeight: 300, color: '#f59e0b', letterSpacing: -0.5 }}>{reputationScore}</span>
              </div>
              <div style={{ background: '#eef2f7', borderRadius: 3, height: 5, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ width: `${reputationScore}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: 3 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: '#64748d' }}>0 — Low</span>
                <span style={{ fontSize: 11, color: '#64748d' }}>Threshold: 80</span>
                <span style={{ fontSize: 11, color: '#64748d' }}>100 — Excellent</span>
              </div>
              <div style={{
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#92650a', lineHeight: 1.5,
              }}>
                {ghostingEvents} ghosting events in the last 30 days. Respond to pending Amber/Green cards within 48 hours to recover your score.
              </div>
            </div>
          </div>
        </div>

        {/* Pending Actions */}
        <div style={{
          background: '#fff', border: '1px solid #e5edf5', borderRadius: 12,
          boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px, rgba(0,0,0,0.05) 0px 2px 6px',
          padding: 28,
        }}>
          <p style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#64748d', marginBottom: 16 }}>
            Pending Action Required
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Aisyah Binti Razali', triage: 'AMBER', hours: 43, id: 'seed-session-aisyah' },
              { name: 'Siti Norzahira Mohd', triage: 'GREEN', hours: 6, id: 'seed-session-siti' },
            ].map(p => (
              <div key={p.id} style={{
                background: p.triage === 'GREEN' ? 'rgba(21,190,83,0.04)' : 'rgba(245,158,11,0.04)',
                border: `1px solid ${p.triage === 'GREEN' ? 'rgba(21,190,83,0.2)' : 'rgba(245,158,11,0.2)'}`,
                borderRadius: 8, padding: '12px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#061b31', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {p.name}
                    <span style={{
                      padding: '1px 7px', borderRadius: 3, fontSize: 10, fontWeight: 600,
                      fontFamily: 'monospace', letterSpacing: '0.4px', textTransform: 'uppercase',
                      background: p.triage === 'GREEN' ? 'rgba(21,190,83,0.12)' : 'rgba(245,158,11,0.12)',
                      color: p.triage === 'GREEN' ? '#108c3d' : '#92650a',
                      border: `1px solid ${p.triage === 'GREEN' ? 'rgba(21,190,83,0.35)' : 'rgba(245,158,11,0.35)'}`,
                    }}>
                      {p.triage}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748d' }}>{p.hours} hours remaining to respond</div>
                </div>
                <Link href={`/hr/verdict/${p.id}`} style={{
                  padding: '5px 12px', fontSize: 12, borderRadius: 4,
                  background: '#fff', border: '1px solid #e5edf5',
                  color: '#273951', textDecoration: 'none',
                  boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px',
                }}>
                  Respond
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline Table */}
      <div style={{
        background: '#fff', border: '1px solid #e5edf5', borderRadius: 12,
        boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px, rgba(0,0,0,0.05) 0px 2px 6px',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5edf5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#64748d', marginBottom: 4 }}>
              All Candidates — Pipeline View
            </p>
            <div style={{ fontSize: 13, color: '#64748d' }}>{completed.length} candidates · filtered: all</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['All', 'GREEN', 'AMBER', 'RED'].map(f => (
              <span key={f} style={{
                padding: '4px 12px', borderRadius: 4, fontSize: 12,
                fontWeight: f === 'All' ? 600 : 400, cursor: 'pointer',
                background: f === 'All' ? 'rgba(83,58,253,0.06)' : 'transparent',
                color: f === 'All' ? '#533afd' : '#64748d',
                border: `1px solid ${f === 'All' ? 'rgba(83,58,253,0.2)' : 'transparent'}`,
              }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Candidate', 'Role', 'Verdict', 'Score', 'Responded', 'Action'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.6px',
                  textTransform: 'uppercase', color: '#64748d', padding: '10px 16px',
                  borderBottom: '1px solid #e5edf5', background: '#f8fafc',
                  fontFamily: 'monospace',
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
              const sentinel = JSON.parse(session.sentinelData);
              const isFlagged = sentinel.focus_loss_events > 3 && sentinel.paste_events > 1;
              const triage = verdict.triage_result;
              const triageColor = triage === 'GREEN' ? '#108c3d' : triage === 'AMBER' ? '#92650a' : '#b91c1c';
              const triageBg = triage === 'GREEN' ? 'rgba(21,190,83,0.12)' : triage === 'AMBER' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
              const triageBorder = triage === 'GREEN' ? 'rgba(21,190,83,0.35)' : triage === 'AMBER' ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)';
              const initials = session.candidateName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              const barColor = avgScore >= 75 ? '#15be53' : avgScore >= 50 ? '#f59e0b' : '#ef4444';

              return (
                <tr key={session.id} style={{ borderBottom: '1px solid #e5edf5' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(83,58,253,0.06)', border: '1px solid rgba(83,58,253,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 600, color: '#533afd', flexShrink: 0,
                      }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#061b31' }}>{session.candidateName}</div>
                        {isFlagged && <div style={{ fontSize: 11, color: '#ef4444' }}>⚠ Anomaly flag</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748d' }}>{roleTitle ?? 'Unknown'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 9px', borderRadius: 3,
                      fontSize: 10, fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase',
                      fontFamily: 'monospace', background: triageBg, color: triageColor, border: `1px solid ${triageBorder}`,
                    }}>
                      {triage}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ background: '#eef2f7', borderRadius: 3, height: 5, width: 80, overflow: 'hidden' }}>
                        <div style={{ width: `${avgScore}%`, height: '100%', background: barColor, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#061b31', fontVariantNumeric: 'tabular-nums', minWidth: 24 }}>{avgScore}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: verdict.human_review_required ? '#ef4444' : '#64748d', fontWeight: verdict.human_review_required ? 500 : 400 }}>
                    {verdict.human_review_required ? 'Pending Review' : 'Pending'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Link href={`/hr/verdict/${session.id}`} style={{
                      fontSize: 12, padding: '5px 12px', borderRadius: 4,
                      background: '#fff', border: '1px solid #e5edf5',
                      color: '#273951', textDecoration: 'none',
                      boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px',
                    }}>
                      {triage === 'RED' ? 'Review' : 'View Card'}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {completed.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ color: '#64748d', fontSize: 14 }}>
              No completed interviews yet.{' '}
              <Link href="/hr/upload" style={{ color: '#533afd', textDecoration: 'none', fontWeight: 500 }}>
                Post your first role →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
