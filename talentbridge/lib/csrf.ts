import { NextRequest, NextResponse } from 'next/server';
import { CSRF_COOKIE } from './securityShared';

export { CSRF_COOKIE };

export function createCsrfToken() {
  return globalThis.crypto.randomUUID().replace(/-/g, '');
}

export function setCsrfCookie(res: NextResponse, token: string) {
  res.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function requireCsrf(req: NextRequest) {
  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = req.headers.get('x-csrf-token');
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }
  return null;
}
