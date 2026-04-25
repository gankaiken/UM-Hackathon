// app/api/auth/connect/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/auth';
import { requireHrUser } from '@/lib/hrAuth';
import { getRequestIp, logAuditEvent } from '@/lib/security';

export async function GET(req: NextRequest) {
  const user = requireHrUser(req);
  if (user instanceof NextResponse) return user;
  
  await logAuditEvent({ actorType: 'hr', actorId: user.id, action: 'oauth.google_connect_start', status: 'success', ipAddress: getRequestIp(req) });
  const url = getGoogleAuthUrl(user.id);
  return NextResponse.redirect(url);
}
