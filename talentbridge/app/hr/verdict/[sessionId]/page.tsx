// app/hr/verdict/[sessionId]/page.tsx
// Full Verdict Card — the HR "deep-dive" view.
// Shows: Triage, Dimension Scores, Agent Trace, Sentinel Log, Strengths/Gaps

import { db } from '@/lib/db';
import { sessions, transcripts, jdCache, agentLogs } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import VerdictCard from '@/components/hr/VerdictCard';

export const dynamic = 'force-dynamic';

export default async function VerdictDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .get();

  if (!session) notFound();
  if (!session.verdict && session.sessionLifecycleStatus !== 'expired') notFound();

  const jd = await db
    .select()
    .from(jdCache)
    .where(eq(jdCache.id, session.jdId))
    .get();

  const dbTranscripts = await db
    .select()
    .from(transcripts)
    .where(eq(transcripts.sessionId, sessionId))
    .orderBy(asc(transcripts.turnNumber))
    .all();

  const dbAgentLogs = await db
    .select()
    .from(agentLogs)
    .where(eq(agentLogs.sessionId, sessionId))
    .orderBy(asc(agentLogs.createdAt))
    .all();

  if (session.sessionLifecycleStatus === 'expired') {
    return (
      <div style={{ minHeight: '100vh', background: '#080A0F', color: '#F9FAFB', padding: '40px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)',
            borderRadius: 16, padding: '32px', marginBottom: 24, textAlign: 'center'
          }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              Partial Profile: {session.candidateName || 'Unknown Candidate'}
            </h1>
            <div style={{ color: '#94A3B8', fontSize: 14 }}>
              This interview was inactive for over 7 days and expired on {session.sessionExpiredAt ? new Date(session.sessionExpiredAt).toLocaleString('en-US') : 'unknown date'}.
              <br/>
              <strong>No Final Verdict was generated.</strong>
            </div>
          </div>

          <div style={{ background: '#141820', border: '1px solid #1E2433', borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB', marginBottom: 16, borderBottom: '1px solid #1E2433', paddingBottom: 12 }}>
              Transcript History ({dbTranscripts.length} turns)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {dbTranscripts.length === 0 ? (
                <div style={{ color: '#64748B', fontStyle: 'italic', fontSize: 14 }}>No messages recorded.</div>
              ) : (
                dbTranscripts.map(t => (
                  <div key={t.id} style={{
                    padding: 16, borderRadius: 12,
                    background: t.role === 'inquisitor' ? 'rgba(37,99,235,0.05)' : '#1A2030',
                    border: `1px solid ${t.role === 'inquisitor' ? 'rgba(37,99,235,0.1)' : '#2A3241'}`
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: t.role === 'inquisitor' ? '#60A5FA' : '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>
                      {t.role === 'inquisitor' ? 'The Inquisitor' : session.candidateName || 'Candidate'}
                    </div>
                    <div style={{ fontSize: 14, color: '#E2E8F0', lineHeight: 1.6 }}>
                      {t.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <VerdictCard
      session={session}
      jd={jd ?? null}
      transcripts={dbTranscripts}
      agentLogs={dbAgentLogs}
    />
  );
}
