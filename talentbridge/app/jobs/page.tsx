// app/jobs/page.tsx — Premium Candidate Portal v3.0
import { db } from '@/lib/db';
import { jdCache, sessions } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import ClientJobsList from './ClientJobsList';
import { buildEmployerReputationMap, normalizeEmployerId } from '@/lib/hrReputation';
import { getCurrentTimestamp } from '@/lib/utils/runtime';

export const dynamic = 'force-dynamic';

export default async function JobsPage() {
  const jobs = await db
    .select()
    .from(jdCache)
    .orderBy(desc(jdCache.createdAt))
    .all();
  const reputationRows = await db
    .select({
      employerId: jdCache.employerId,
      verdict: sessions.verdict,
      completedAt: sessions.completedAt,
      hrRespondedAt: sessions.hrRespondedAt,
    })
    .from(sessions)
    .leftJoin(jdCache, eq(sessions.jdId, jdCache.id))
    .all();
  const reputationByEmployer = buildEmployerReputationMap(reputationRows, getCurrentTimestamp());
  const jobsWithReputation = jobs.map(job => ({
    ...job,
    employerReputationWarning:
      reputationByEmployer.get(normalizeEmployerId(job.employerId))?.candidateWarning ?? false,
  }));

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
            Apply with a 4-minute AI conversation. No resume bias, response tracking built in — 
            every candidate can view their personalised outcome when it is ready.
          </p>
        </div>
      </section>

      {/* ── CONTENT ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 40px 100px' }}>

        <ClientJobsList jobs={jobsWithReputation} />

      </div>
    </div>
  );
}
