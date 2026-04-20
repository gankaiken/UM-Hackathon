// app/hr/verdict/[sessionId]/page.tsx
// Full Verdict Card — the HR "deep-dive" view.
// Shows: Triage, Dimension Scores, Agent Trace, Sentinel Log, Strengths/Gaps

import { db } from '@/lib/db';
import { sessions, transcripts, jdCache } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import VerdictCard from '@/components/hr/VerdictCard';

export const dynamic = 'force-dynamic';

export default async function VerdictDetailPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, params.sessionId))
    .get();

  if (!session || !session.verdict) notFound();

  const jd = await db
    .select()
    .from(jdCache)
    .where(eq(jdCache.id, session.jdId))
    .get();

  const dbTranscripts = await db
    .select()
    .from(transcripts)
    .where(eq(transcripts.sessionId, params.sessionId))
    .orderBy(asc(transcripts.turnNumber))
    .all();

  return (
    <VerdictCard
      session={session}
      jd={jd ?? null}
      transcripts={dbTranscripts}
    />
  );
}
