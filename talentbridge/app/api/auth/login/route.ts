import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, normalizeEmail, setHrSessionCookie, verifyPassword } from '@/lib/hrAuth';
import { checkLoginRateLimit, clearLoginRateLimit, getRequestIp, logAuditEvent } from '@/lib/security';
import { createCsrfToken, setCsrfCookie } from '@/lib/csrf';

export async function POST(req: NextRequest) {
  try {
    const ip = getRequestIp(req);
    const rateLimit = checkLoginRateLimit(ip);
    if (!rateLimit.allowed) {
      await logAuditEvent({ actorType: 'system', action: 'auth.login', status: 'blocked', ipAddress: ip, details: { reason: 'rate_limited', retryAfterMs: rateLimit.retryAfterMs } });
      return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
    }

    const { email, password } = await req.json();
    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = findUserByEmail(normalizeEmail(email));
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      await logAuditEvent({ actorType: 'system', action: 'auth.login', status: 'failure', ipAddress: ip, details: { email: normalizeEmail(email) } });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    clearLoginRateLimit(ip);
    const res = NextResponse.json({ user: { id: user.id, email: user.email } });
    setHrSessionCookie(res, { id: user.id, email: user.email });
    setCsrfCookie(res, createCsrfToken());
    await logAuditEvent({ actorType: 'hr', actorId: user.id, action: 'auth.login', status: 'success', ipAddress: ip });
    return res;
  } catch {
    return NextResponse.json({ error: 'Could not log in' }, { status: 500 });
  }
}
