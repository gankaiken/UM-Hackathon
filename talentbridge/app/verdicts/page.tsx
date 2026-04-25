// app/verdicts/page.tsx — Premium Verdict Cards Grid v3.0
import { db } from '@/lib/db';
import { sessions, jdCache } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import type { VerdictResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function VerdictsPage() {
  const allSessions = await db
    .select({ session: sessions, roleTitle: jdCache.roleTitle })
    .from(sessions)
    .leftJoin(jdCache, eq(sessions.jdId, jdCache.id))
    .orderBy(desc(sessions.createdAt))
    .all();

  const completed = allSessions.filter(s => s.session.verdict);

  const triageConfig = {
    GREEN: {
      color: '#059669', bg: 'rgba(16,185,129,0.08)', border: '#BBF7D0',
      headerBg: 'linear-gradient(135deg, rgba(16,185,129,0.05), transparent 60%)',
      label: 'Fast Track',
    },
    AMBER: {
      color: '#D97706', bg: 'rgba(245,158,11,0.08)', border: '#FDE68A',
      headerBg: 'linear-gradient(135deg, rgba(245,158,11,0.06), transparent 60%)',
      label: 'Conditional',
    },
    RED: {
      color: '#DC2626', bg: 'rgba(239,68,68,0.08)', border: '#FECACA',
      headerBg: 'linear-gradient(135deg, rgba(239,68,68,0.06), transparent 60%)',
      label: 'Review',
    },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>

      {/* ── Hero header ───────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(180deg, #F6F9FF 0%, #FFFFFF 100%)',
        padding: '64px 40px 48px',
        borderBottom: '1px solid #E5E7EB',
      }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 12 }}>
                AI Assessment Output
              </div>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(30px, 4vw, 48px)',
                fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.5px',
                color: '#0A0C12', marginBottom: 8,
              }}>
                Verdict Cards
              </h1>
              <p style={{ fontSize: 15, color: '#6B7280', fontFamily: 'var(--font-body)' }}>
                {completed.length} AI-generated assessments · Bias-stripped · Schema-validated
              </p>
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {['All', 'GREEN', 'AMBER', 'RED'].map((f, i) => (
                <span key={f} style={{
                  padding: '7px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  background: i === 0 ? '#2563EB' : f === 'GREEN' ? 'rgba(16,185,129,0.1)' : f === 'AMBER' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                  color: i === 0 ? '#fff' : f === 'GREEN' ? '#059669' : f === 'AMBER' ? '#D97706' : '#DC2626',
                  cursor: 'pointer',
                  border: i === 0 ? 'none' : `1px solid ${f === 'GREEN' ? '#BBF7D0' : f === 'AMBER' ? '#FDE68A' : '#FECACA'}`,
                  fontFamily: 'var(--font-body)',
                }}>
                  {f}
                </span>
              ))}
              <Link href="/hr/upload" className="btn-primary" style={{ padding: '0 20px', height: 40, fontSize: 14 }}>
                + Post Role
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cards ────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '48px 40px 100px' }}>
        {completed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24,
              background: 'rgba(37,99,235,0.08)', border: '1.5px solid rgba(37,99,235,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', fontSize: 32,
            }}>
              🎯
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
              color: '#0A0C12', marginBottom: 10,
            }}>
              No verdicts generated yet
            </h2>
            <p style={{ fontSize: 15, color: '#6B7280', fontFamily: 'var(--font-body)', marginBottom: 28 }}>
              Post a job and complete interviews to see AI-generated verdict cards.
            </p>
            <Link href="/hr/upload" className="btn-accent" style={{ padding: '0 32px' }}>
              Post a Role →
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
            gap: 24,
          }}>
            {completed.map(({ session, roleTitle }) => {
              let verdict: VerdictResult | null = null;
              try { verdict = JSON.parse(session.verdict!); } catch { return null; }
              if (!verdict) return null;

              let isFlagged = false;
              try {
                const sentinel = JSON.parse(session.sentinelData);
                isFlagged = sentinel.focus_loss_events > 3 && sentinel.paste_events > 1;
              } catch { /* ignore */ }

              const avgScore = verdict.overall_score ?? Math.round(
                Object.values(verdict.dimension_scores).reduce((s, d) => s + (typeof d === 'number' ? d : d.score), 0) /
                Math.max(1, Object.keys(verdict.dimension_scores).length)
              );
              const triage = verdict.triage_result as 'GREEN' | 'AMBER' | 'RED';
              const config = triageConfig[triage] ?? triageConfig.GREEN;
              const initials = session.candidateName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

              return (
                <div
                  key={session.id}
                  style={{
                    background: '#FFFFFF',
                    border: `1.5px solid ${config.border}`,
                    borderRadius: 20,
                    overflow: 'hidden',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {/* Card header */}
                  <div style={{
                    padding: '24px 24px 20px',
                    borderBottom: '1px solid #F3F4F6',
                    background: config.headerBg,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Avatar */}
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: config.bg,
                          border: `1.5px solid ${config.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 700, color: config.color, flexShrink: 0,
                          fontFamily: 'var(--font-display)',
                        }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#0A0C12', letterSpacing: '-0.3px', lineHeight: 1.2, fontFamily: 'var(--font-display)' }}>
                            {session.candidateName}
                          </div>
                          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2, fontFamily: 'var(--font-body)' }}>
                            {roleTitle ?? 'Unknown Role'}
                          </div>
                        </div>
                      </div>

                      {/* Triage badge + score */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: config.bg, color: config.color,
                          border: `1px solid ${config.border}`,
                          fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)',
                          padding: '4px 10px', borderRadius: 6,
                          letterSpacing: '0.5px', textTransform: 'uppercase',
                        }}>
                          {triage}
                        </span>
                        <span style={{
                          fontSize: 28, fontWeight: 800, letterSpacing: '-1px',
                          color: config.color, lineHeight: 1,
                          fontFamily: 'var(--font-display)',
                        }}>
                          {avgScore}
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#9CA3AF', marginLeft: 2 }}>/100</span>
                        </span>
                      </div>
                    </div>

                    {/* Authenticity badge */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 12, fontWeight: 600,
                      color: isFlagged ? '#D97706' : '#059669',
                      background: isFlagged ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                      border: `1px solid ${isFlagged ? '#FDE68A' : '#BBF7D0'}`,
                      padding: '4px 10px', borderRadius: 6,
                      fontFamily: 'var(--font-body)',
                    }}>
                      {isFlagged ? '⚠' : '✓'}
                      {isFlagged ? ' Anomaly flags — review required' : ' Authenticity: Clean'}
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '20px 24px' }}>

                    {/* Verified Strengths */}
                    {verdict.strengths && verdict.strengths.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.6px', textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                          Verified Strengths
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {verdict.strengths.map((s: string) => (
                            <span key={s} style={{
                              background: 'rgba(37,99,235,0.08)', color: '#2563EB',
                              fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                              fontFamily: 'var(--font-body)',
                            }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Gaps */}
                    {verdict.gaps && verdict.gaps.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.6px', textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                          Identified Gap
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {verdict.gaps.map((g: string) => (
                            <span key={g} style={{
                              background: 'rgba(245,158,11,0.08)', color: '#D97706',
                              fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                              fontFamily: 'var(--font-body)',
                            }}>
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {verdict.summary && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.6px', textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                          AI Summary
                        </div>
                        <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65, fontFamily: 'var(--font-body)' }}>
                          {verdict.summary}
                        </p>
                      </div>
                    )}

                    {/* Competency Score Bars */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.6px', textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 10 }}>
                        Competency Signals
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {Object.entries(verdict.dimension_scores).map(([key, dim]) => {
                          const score = typeof dim === 'number' ? dim : dim.score;
                          const barColor = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
                          return (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 12, color: '#6B7280', width: 140, flexShrink: 0, fontFamily: 'var(--font-body)', lineHeight: 1.3 }}>
                                {(typeof dim === 'object' && dim !== null && 'label' in dim && typeof dim.label === 'string') ? dim.label : key}
                              </span>
                              <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                                <div style={{ width: `${score}%`, height: '100%', background: barColor, borderRadius: 4 }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#0A0C12', minWidth: 28, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                {score}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div style={{
                    padding: '14px 24px',
                    borderTop: '1px solid #F3F4F6',
                    background: '#FAFAFA',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                  }}>
                    <Link
                      href={`/hr/verdict/${session.id}`}
                      className="btn-primary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 13, height: 38 }}
                    >
                      {triage === 'GREEN' ? 'Fast-Track →' : triage === 'AMBER' ? 'View Upskill Path' : 'Review Details'}
                    </Link>
                    <Link
                      href={`/hr/verdict/${session.id}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        fontSize: 13, height: 38, padding: '0 14px',
                        background: '#F3F4F6', color: '#6B7280',
                        borderRadius: 8, textDecoration: 'none',
                        fontFamily: 'var(--font-body)', fontWeight: 500,
                        border: '1px solid #E5E7EB', transition: 'all 0.15s',
                      }}
                    >
                      Transcript
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
