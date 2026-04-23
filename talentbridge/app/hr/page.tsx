// app/hr/page.tsx — Premium Agentic Dark Dashboard v3.0 (Server Component)
import { db } from '@/lib/db';
import { sessions, jdCache } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { getCurrentTimestamp } from '@/lib/utils/runtime';
import { calculateAggregateEmployerReputation } from '@/lib/hrReputation';

import ClientPipeline from './ClientPipeline';
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
  const now = getCurrentTimestamp();

  const reputation = calculateAggregateEmployerReputation(
    allSessions.map(item => ({
      employerId: item.company,
      verdict: item.session.verdict,
      completedAt: item.session.completedAt,
      hrRespondedAt: item.session.hrRespondedAt,
    })),
    now
  );
  const responseRate = reputation.responseRate48h === null ? null : Math.round(reputation.responseRate48h * 100);
  const thisMonthCount = completed.filter(s => now - s.session.createdAt < 30 * 24 * 3600 * 1000).length;
  const reputationLabel = {
    cold_start: 'Grace Period',
    excellent: 'Excellent',
    healthy: 'Healthy',
    watchlist: 'Watchlist',
    low_response: 'Low Response',
  }[reputation.status];
  const reputationColor = reputation.status === 'low_response'
    ? '#EF4444'
    : reputation.status === 'watchlist'
      ? '#F59E0B'
      : reputation.status === 'cold_start'
        ? '#60A5FA'
        : '#10B981';
  const ghostingEvents = reputation.overdueGhostingEvents;

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
              {completed.length} verdicts issued · {active.length} sessions active · {ghostingEvents} overdue HR responses
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
              tooltip: 'Number of candidates fully processed by the Auditor'
            },
            {
              value: responseRate === null ? 'Grace' : `${responseRate}%`,
              label: 'Response Rate (48hr)',
              sub: reputation.active ? 'Based on real HR responses' : `${reputation.totalCompletedVerdicts}/5 verdicts before scoring`,
              subColor: reputation.active ? reputationColor : '#60A5FA',
              icon: '⚡',
              tooltip: 'Percentage of released verdict cards that received an HR response within 48 hours'
            },
            {
              value: ghostingEvents.toString(),
              label: 'Overdue Responses',
              sub: reputation.active ? 'No HR response after 48h' : 'Grace period active',
              subColor: reputation.overdueGhostingEvents > 0 ? '#F59E0B' : '#10B981',
              icon: '🛡',
              tooltip: 'Completed verdict cards without HR response after 48 hours'
            },
            {
              value: reputation.score === null ? '--' : reputation.score.toString(),
              label: 'HR Reputation',
              sub: reputationLabel,
              subColor: reputationColor,
              icon: '⏱',
              tooltip: 'Private operational metric derived from completed verdict cards and HR response timing'
            },
          ].map((kpi, i) => (
            <div
              key={i}
              title={kpi.tooltip}
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

<ClientPipeline completed={completed} /></div></div>); }
