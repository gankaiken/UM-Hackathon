import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users, sessions, jdCache } from './db/schema';
import { eq } from 'drizzle-orm';
import { createCsrfToken, setCsrfCookie } from './csrf';

export const HR_SESSION_COOKIE = 'talentbridge_hr_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface HrSessionUser {
  id: string;
  email: string;
}

interface CookiePayload extends HrSessionUser {
  exp: number;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function createHrSessionCookie(user: HrSessionUser) {
  const payload: CookiePayload = {
    id: user.id,
    email: user.email,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${body}.${sign(body)}`;
}

export async function getCurrentHrUser(): Promise<HrSessionUser | null> {
  const cookieStore = await cookies();
  return verifyHrSessionCookie(cookieStore.get(HR_SESSION_COOKIE)?.value);
}

export function getHrUserFromRequest(req: NextRequest): HrSessionUser | null {
  return verifyHrSessionCookie(req.cookies.get(HR_SESSION_COOKIE)?.value);
}

export function requireHrUser(req: NextRequest): HrSessionUser | NextResponse {
  const user = getHrUserFromRequest(req);
  if (!user) {
    const res = NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    clearHrSessionCookie(res);
    setCsrfCookie(res, createCsrfToken());
    return res;
  }
  return user;
}

export function setHrSessionCookie(res: NextResponse, user: HrSessionUser) {
  res.cookies.set(HR_SESSION_COOKIE, createHrSessionCookie(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
    priority: 'high',
  });
}

export function clearHrSessionCookie(res: NextResponse) {
  res.cookies.set(HR_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
    priority: 'high',
  });
}

export function findUserByEmail(email: string) {
  return db
    .select()
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .get();
}

export async function assertHrOwnsSession(user: HrSessionUser, sessionId: string) {
  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  if (!session) return { ok: false as const, response: NextResponse.json({ error: 'Session not found' }, { status: 404 }) };
  if (session.employerId !== user.id) {
    return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true as const, session };
}

export async function assertHrOwnsJd(user: HrSessionUser, jdId: string) {
  const jd = db.select().from(jdCache).where(eq(jdCache.id, jdId)).get();
  if (!jd) return { ok: false as const, response: NextResponse.json({ error: 'JD not found' }, { status: 404 }) };
  if (jd.employerId !== user.id) {
    return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true as const, jd };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function verifyHrSessionCookie(value: string | undefined): HrSessionUser | null {
  if (!value) return null;
  const [body, signature] = value.split('.');
  const expected = body ? sign(body) : '';
  if (
    !body ||
    !signature ||
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as CookiePayload;
    if (!payload.id || !payload.email || payload.exp < Date.now()) return null;
    const user = db.select().from(users).where(eq(users.id, payload.id)).get();
    if (!user || user.email !== payload.email) return null;
    return { id: user.id, email: user.email };
  } catch (error) {
    console.warn('[HrAuth] Rejected malformed HR session cookie', {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function sign(value: string) {
  return crypto
    .createHmac('sha256', getAuthSecret())
    .update(value)
    .digest('base64url');
}

function getAuthSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'talentbridge-local-demo-auth-secret';
}
