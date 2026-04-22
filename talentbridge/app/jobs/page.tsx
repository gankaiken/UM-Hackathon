// app/jobs/page.tsx — Premium Candidate Portal v3.0
import { db } from '@/lib/db';
import { jdCache } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function JobsPage() {
  const jobs = await db
    .select()
    .from(jdCache)
    .orderBy(desc(jdCache.createdAt))
    .all();

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      <style>{`
        .job-card:hover { border-color: rgba(37,99,235,0.3) !important; box-shadow: 0 10px 36px rgba(37,99,235,0.1) !important; transform: translateY(-2px); }
        .job-card { transition: all 0.25s ease !important; }
      `}</style>
      
      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(180deg, #F6F9FF 0%, #FFFFFF 100%)',
        padding: '80px 40px 60px',
        borderBottom: '1px solid #E5E7EB',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(37,99,235,0.06) 1px, transparent 1px)',
          backgroundSize: '36px 36px', pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.18)',
            borderRadius: 40, padding: '6px 14px', marginBottom: 24,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: '#10B981',
              display: 'inline-block', boxShadow: '0 0 8px rgba(16,185,129,0.7)',
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', fontFamily: 'var(--font-body)' }}>
              No resume screening · Apply in 4 minutes
            </span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 4.5vw, 56px)',
            fontWeight: 800, lineHeight: 1.08, letterSpacing: '-1.5px',
            color: '#0A0C12', marginBottom: 16,
          }}>
            Open Roles
          </h1>
          <p style={{
            fontSize: 18, lineHeight: 1.65, color: '#6B7280',
            maxWidth: 560, fontFamily: 'var(--font-body)',
          }}>
            Apply with a 4-minute AI conversation. No resume bias, no ghosting — 
            every candidate receives a personalised outcome and feedback.
          </p>
        </div>
      </section>

      {/* ── CONTENT ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 40px 100px' }}>

        {/* Search bar */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 48,
          background: '#FFFFFF', borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '1.5px solid #E5E7EB', padding: '8px 8px 8px 20px',
          alignItems: 'center',
        }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" style={{ color: '#9CA3AF', flexShrink: 0 }}>
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search by role, skill, or company..."
            disabled
            style={{
              flex: 1,
              border: 'none !important',
              outline: 'none',
              fontSize: 15,
              background: 'transparent !important',
              color: '#0A0C12',
              height: '40px !important',
              padding: '0 !important',
              borderRadius: '0 !important',
              boxShadow: 'none !important',
            }}
          />
          <button
            className="btn-primary"
            style={{ height: 40, padding: '0 24px', fontSize: 14, borderRadius: 10, flexShrink: 0 }}
          >
            Search
          </button>
        </div>

        {/* Info badges */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
          {[
            { label: '✓ No resume required', color: '#059669', bg: 'rgba(16,185,129,0.08)' },
            { label: '✓ AI interview (4 min)', color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
            { label: '✓ Personalised feedback', color: '#D97706', bg: 'rgba(245,158,11,0.08)' },
            { label: '✓ 48-hour response guarantee', color: '#7C3AED', bg: 'rgba(139,92,246,0.08)' },
          ].map((badge) => (
            <span key={badge.label} style={{
              fontSize: 12, fontWeight: 600, color: badge.color,
              background: badge.bg, padding: '5px 12px', borderRadius: 20,
              fontFamily: 'var(--font-body)',
            }}>
              {badge.label}
            </span>
          ))}
        </div>

        {/* Jobs list */}
        {jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24,
              background: 'rgba(37,99,235,0.08)',
              border: '1.5px solid rgba(37,99,235,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', fontSize: 32,
            }}>
              💼
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
              color: '#0A0C12', marginBottom: 10,
            }}>
              No open roles yet
            </h2>
            <p style={{ fontSize: 15, color: '#6B7280', fontFamily: 'var(--font-body)', marginBottom: 28 }}>
              Check back later, or let employers know you&apos;re looking.
            </p>
            <Link href="/" className="btn-primary" style={{ padding: '0 28px' }}>
              Back to Home →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {jobs.map((job) => {
              let skills: string[] = [];
              try {
                const mapper = JSON.parse(job.mapperOutput);
                skills = mapper.core_dimensions || [];
              } catch {
                // ignore
              }

              return (
                <div
                  key={job.id}
                  className="job-card"
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #E5E7EB',
                    borderRadius: 20,
                    padding: '28px 32px',
                    cursor: 'pointer',
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      {/* Company badge */}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        marginBottom: 10,
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 9,
                          background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                          border: '1px solid #BFDBFE',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, flexShrink: 0,
                        }}>
                          🏢
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', fontFamily: 'var(--font-body)' }}>
                          {job.employerId === 'default' ? 'Nexus Digital Sdn Bhd' : job.employerId}
                        </span>
                      </div>

                      <h3 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 20, fontWeight: 700,
                        color: '#0A0C12', letterSpacing: '-0.4px',
                        marginBottom: 8,
                      }}>
                        {job.roleTitle || 'Untitled Role'}
                      </h3>

                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>
                        <span>📍 Kuala Lumpur</span>
                        <span style={{ color: '#D1D5DB' }}>·</span>
                        <span>Full Time</span>
                        <span style={{ color: '#D1D5DB' }}>·</span>
                        <span>Remote / Hybrid</span>
                      </div>
                    </div>

                    <Link
                      href={`/jobs/${job.id}/apply`}
                      className="btn-accent"
                      style={{ flexShrink: 0, padding: '0 24px', height: 44, fontSize: 14 }}
                    >
                      Apply with AI
                      <svg style={{ marginLeft: 4 }} width="14" height="14" fill="none" viewBox="0 0 24 24">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </div>

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                      {skills.slice(0, 4).map((s) => (
                        <span key={s} style={{
                          background: 'rgba(37,99,235,0.08)',
                          color: '#2563EB',
                          padding: '4px 12px', borderRadius: 20,
                          fontSize: 12, fontWeight: 600,
                          fontFamily: 'var(--font-body)',
                        }}>
                          {s}
                        </span>
                      ))}
                      {skills.length > 4 && (
                        <span style={{ padding: '4px 8px', fontSize: 12, color: '#9CA3AF' }}>
                          +{skills.length - 4} more competencies
                        </span>
                      )}
                    </div>
                  )}

                  {/* JD preview */}
                  <p style={{
                    fontSize: 14, color: '#6B7280', lineHeight: 1.65,
                    fontFamily: 'var(--font-body)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    borderTop: '1px solid #F3F4F6',
                    paddingTop: 14,
                    marginTop: 4,
                  }}>
                    {job.rawJd}
                  </p>

                  {/* Footer row */}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 16 }}>
                    <span style={{
                      display: 'inline-flex', gap: 5, alignItems: 'center',
                      fontSize: 12, fontWeight: 600, color: '#059669',
                      background: 'rgba(16,185,129,0.08)', padding: '3px 10px', borderRadius: 5,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                      AI Interview Ready
                    </span>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>• 4-minute structured assessment</span>
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
