import { NextRequest, NextResponse } from 'next/server';
import { createCsrfToken, CSRF_COOKIE, setCsrfCookie } from '@/lib/csrf';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (!req.cookies.get(CSRF_COOKIE)?.value) {
    setCsrfCookie(res, createCsrfToken());
  }
  return res;
}

export const config = {
  matcher: ['/login', '/hr/:path*', '/schedule/:path*'],
};
