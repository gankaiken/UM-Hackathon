// app/api/auth/callback/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleGoogleCallback } from '@/lib/auth';
import { getHrUserFromRequest } from '@/lib/hrAuth';
import { getRequestIp, logAuditEvent } from '@/lib/security';

export async function GET(req: NextRequest) {
  const user = getHrUserFromRequest(req);
  const code = req.nextUrl.searchParams.get('code');
  const employerId = req.nextUrl.searchParams.get('state'); // We passed employerId in state
  
  if (!user || !code || !employerId || employerId !== user.id) {
    await logAuditEvent({ actorType: 'hr', actorId: user?.id, action: 'oauth.google_connect_finish', status: 'failure', ipAddress: getRequestIp(req), details: { reason: 'state_or_session_invalid' } });
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/hr?error=oauth_failed`);
  }

  try {
    await handleGoogleCallback(code, employerId);
    await logAuditEvent({ actorType: 'hr', actorId: user.id, action: 'oauth.google_connect_finish', status: 'success', ipAddress: getRequestIp(req) });
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/hr?success=google_connected`);
  } catch (err) {
    console.error('[OAuth] Callback error:', err);
    await logAuditEvent({ actorType: 'hr', actorId: user.id, action: 'oauth.google_connect_finish', status: 'failure', ipAddress: getRequestIp(req), details: { reason: err instanceof Error ? err.message : 'unknown' } });
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/hr?error=oauth_error`);
  }
}
