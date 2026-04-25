import { NextRequest, NextResponse } from 'next/server';
import { clearHrSessionCookie } from '@/lib/hrAuth';
import { getRequestIp, logAuditEvent } from '@/lib/security';
import { getHrUserFromRequest } from '@/lib/hrAuth';
import { createCsrfToken, setCsrfCookie } from '@/lib/csrf';

export async function POST(req: NextRequest) {
  const user = getHrUserFromRequest(req);
  const res = NextResponse.json({ success: true });
  clearHrSessionCookie(res);
  setCsrfCookie(res, createCsrfToken());
  await logAuditEvent({ actorType: 'hr', actorId: user?.id, action: 'auth.logout', status: 'success', ipAddress: getRequestIp(req) });
  return res;
}
