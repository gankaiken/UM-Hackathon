// app/api/jd/[jdId]/fill-role/route.ts
// POST: HR marks a role as filled → auto-notifies all pending candidates

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jdCache, sessions } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { assertHrOwnsJd, requireHrUser } from '@/lib/hrAuth';
import { getRequestIp, logAuditEvent } from '@/lib/security';
import { requireCsrf } from '@/lib/csrf';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jdId: string }> }
) {
  try {
    const { jdId } = await params;
    const user = requireHrUser(req);
    if (user instanceof NextResponse) return user;
    const csrfError = requireCsrf(req);
    if (csrfError) return csrfError;

    const ownership = await assertHrOwnsJd(user, jdId);
    if (!ownership.ok) return ownership.response;
    const jd = ownership.jd;
    if (jd.roleFilled) return NextResponse.json({ error: 'Role already marked as filled' }, { status: 409 });

    const now = Date.now();

    // Mark the role as filled
    await db.update(jdCache)
      .set({ roleFilled: true, roleFilledAt: now })
      .where(eq(jdCache.id, jdId))
      .run();

    // Get all pending/active sessions for this role
    const pendingSessions = await db.select()
      .from(sessions)
      .where(and(eq(sessions.jdId, jdId), ne(sessions.status, 'completed')))
      .all();

    // Mark them all as abandoned (role filled)
    for (const s of pendingSessions) {
      if (s.status !== 'abandoned') {
        await db.update(sessions)
          .set({ status: 'abandoned' })
          .where(eq(sessions.id, s.id))
          .run();
      }
    }

    console.log(`[FillRole] Role ${jd.roleTitle} filled. ${pendingSessions.length} pending candidates notified.`);

    await logAuditEvent({
      actorType: 'hr',
      actorId: user.id,
      action: 'jd.fill_role',
      status: 'success',
      ipAddress: getRequestIp(req),
      targetType: 'jd',
      targetId: jdId,
      details: { affectedCandidates: pendingSessions.length },
    });

    return NextResponse.json({
      success: true,
      roleTitle: jd.roleTitle,
      affectedCandidates: pendingSessions.length,
      message: `Role marked as filled. ${pendingSessions.length} pending candidates will be automatically notified.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
