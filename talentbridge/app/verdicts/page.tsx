// app/verdicts/page.tsx — Premium Verdict Cards Grid
// Shows all completed AI-generated candidate assessments in a premium card layout

import { db } from '@/lib/db';
import { sessions, jdCache } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import type { VerdictResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

function DotIndicator({ active }: { active: boolean }) {
  return (
    <span style={{
      width: 7, height: 7, borderRadius: '50%',
      background: active ? 'var(--green)' : '#d1d9e8',
      display: 'inline-block', flexShrink: 0,
    }} />
  );
}

export default async function VerdictsPage() {
  const allSessions = await db
    .select({ session: sessions, roleTitle: jdCache.roleTitle })
    .from(sessions)
    .leftJoin(jdCache, eq(sessions.jdId, jdCache.id))
    .orderBy(desc(sessions.createdAt))
    .all();

  const completed = allSessions.filter(s => s.session.verdict);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36 }}>
        <div>
          <p className="label-mono" style={{ marginBottom: 8 }}>AI Assessment Output</p>
          <h1 className="display-lg">Generated Verdict Cards</h1>
          <p style={{ color: 'var(--slate)', fontSize: 15, marginTop: 6 }}>
            {completed.length} cards · filtered: all
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {['All', 'GREEN', 'AMBER', 'RED'].map(f => (
            <span key={f} style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-xs)',
              fontSize: 13,
              fontWeight: f === 'All' ? 500 : 400,
              background: f === 'All' ? 'var(--purple)' : '#fff',
              color: f === 'All' ? '#fff' : 'var(--slate-dark)',
              cursor: 'pointer',
              border: `1px solid ${f === 'All' ? 'var(--purple)' : 'var(--border)'}`,
              boxShadow: 'var(--shadow-sm)',
            }}>
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* ── Cards Grid ─────────────────────────────────────────────────── */}
      {completed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <h2 style={{ color: 'var(--navy)', fontSize: 20, fontWeight: 400, marginBottom: 8 }}>No verdicts yet</h2>
          <p style={{ color: 'var(--slate)', fontSize: 14 }}>
            Post a job and complete interviews to see AI-generated verdict cards.
          </p>
          <Link href="/hr/upload" className="btn-primary" style={{ display: 'inline-flex', marginTop: 20 }}>
            Post a Role
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
          gap: 20,
        }}>
          {completed.map(({ session, roleTitle }) => {
            let verdict: VerdictResult | null = null;
            try { verdict = JSON.parse(session.verdict!); } catch { return null; }
            if (!verdict) return null;

            const sentinel = JSON.parse(session.sentinelData);
            const isFlagged = sentinel.focus_loss_events > 3 && sentinel.paste_events > 1;
            const avgScore = verdict.overall_score ?? Math.round(
              Object.values(verdict.dimension_scores).reduce((s, d) => s + d.score, 0) /
              Math.max(1, Object.keys(verdict.dimension_scores).length)
            );
            const triage = verdict.triage_result;
            const initials = session.candidateName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

            return (
              <div
                key={session.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  cursor: 'pointer',
                }}
              >
                {/* Card header */}
                <div style={{
                  padding: '20px 20px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: triage === 'GREEN' ? 'linear-gradient(135deg, rgba(21,190,83,0.04) 0%, rgba(255,255,255,0) 60%)' :
                             triage === 'AMBER' ? 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(255,255,255,0) 60%)' :
                             'linear-gradient(135deg, rgba(239,68,68,0.05) 0%, rgba(255,255,255,0) 60%)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: triage === 'GREEN' ? 'rgba(21,190,83,0.12)' : triage === 'AMBER' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                        border: `1.5px solid ${triage === 'GREEN' ? 'rgba(21,190,83,0.3)' : triage === 'AMBER' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 600,
                        color: triage === 'GREEN' ? 'var(--green-text)' : triage === 'AMBER' ? '#92650a' : 'var(--triage-red-text)',
                        flexShrink: 0,
                      }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--navy)', letterSpacing: -0.2, lineHeight: 1.2 }}>
                          {session.candidateName}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>
                          {roleTitle ?? 'Unknown Role'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span className={`triage-badge triage-${triage}`}>{triage}</span>
                      <span style={{
                        fontSize: 22, fontWeight: 300, letterSpacing: -0.8,
                        color: triage === 'GREEN' ? 'var(--green-text)' : triage === 'AMBER' ? '#92650a' : 'var(--triage-red-text)',
                      }}>
                        {avgScore}
                      </span>
                    </div>
                  </div>

                  {/* Authenticity badge */}
                  <div className={isFlagged ? 'auth-flagged' : 'auth-clean'} style={{ display: 'inline-flex' }}>
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      {isFlagged
                        ? <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        : <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      }
                    </svg>
                    {isFlagged ? 'Anomaly flags detected — review required' : 'Authenticity: Clean — no anomaly flags'}
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: '16px 20px' }}>
                  {/* Verified Strengths */}
                  {verdict.strengths && verdict.strengths.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div className="section-label" style={{ marginBottom: 8 }}>Verified Strengths</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {verdict.strengths.map((s: string) => (
                          <span key={s} className="skill-tag">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Identified Gaps */}
                  {verdict.gaps && verdict.gaps.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div className="section-label" style={{ marginBottom: 8 }}>Identified Gap</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {verdict.gaps.map((g: string) => (
                          <span key={g} className="skill-tag skill-tag-gap">{g}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Summary */}
                  {verdict.summary && (
                    <div style={{ marginBottom: 16 }}>
                      <div className="section-label" style={{ marginBottom: 8 }}>AI Summary</div>
                      <p style={{ fontSize: 13, color: 'var(--slate-dark)', lineHeight: 1.6 }}>
                        {verdict.summary}
                      </p>
                    </div>
                  )}

                  {/* Competency Signals */}
                  <div>
                    <div className="section-label" style={{ marginBottom: 10 }}>Competency Signals</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(verdict.dimension_scores).map(([key, dim]) => {
                        const score = dim.score;
                        const barColor = score >= 75 ? 'score-bar-green' : score >= 50 ? 'score-bar-amber' : 'score-bar-red';
                        return (
                          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 12, color: 'var(--slate)', width: 160, flexShrink: 0 }}>
                              {dim.label ?? key}
                            </span>
                            <div className="score-bar-track">
                              <div className={`score-bar-fill ${barColor}`} style={{ width: `${score}%` }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--navy)', minWidth: 28, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                              {score}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card footer — action buttons */}
                <div style={{
                  padding: '12px 20px',
                  borderTop: '1px solid var(--border)',
                  background: 'var(--bg-subtle)',
                  display: 'flex',
                  gap: 8,
                }}>
                  {triage === 'GREEN' && (
                    <Link href={`/hr/verdict/${session.id}`} className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '8px' }}>
                      Fast-Track to Interview
                    </Link>
                  )}
                  {triage === 'AMBER' && (
                    <Link href={`/hr/verdict/${session.id}`} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '8px' }}>
                      Schedule + Upskill Path
                    </Link>
                  )}
                  {triage === 'RED' && (
                    <Link href={`/hr/verdict/${session.id}`} className="btn-neutral" style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '8px' }}>
                      Review Details
                    </Link>
                  )}
                  <Link href={`/hr/verdict/${session.id}`} className="btn-neutral" style={{ fontSize: 13, padding: '8px 14px' }}>
                    View Transcript
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
