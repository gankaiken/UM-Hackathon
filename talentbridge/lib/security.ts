import { NextRequest } from 'next/server';
import { db } from './db';
import { auditLogs } from './db/schema';
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

type LoginBucket = { count: number; resetAt: number };
const loginAttempts = new Map<string, LoginBucket>();

export function checkLoginRateLimit(ip: string) {
  const now = Date.now();
  const bucket = loginAttempts.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return { allowed: true, remaining: LOGIN_MAX_ATTEMPTS - 1 };
  }
  if (bucket.count >= LOGIN_MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count += 1;
  loginAttempts.set(ip, bucket);
  return { allowed: true, remaining: LOGIN_MAX_ATTEMPTS - bucket.count };
}

export function clearLoginRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

export function getRequestIp(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

export async function logAuditEvent(event: {
  actorType: 'hr' | 'candidate' | 'system';
  actorId?: string | null;
  action: string;
  status: 'success' | 'failure' | 'blocked';
  ipAddress?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  details?: unknown;
}) {
  try {
    await db.insert(auditLogs).values({
      actorType: event.actorType,
      actorId: event.actorId ?? null,
      action: event.action,
      status: event.status,
      ipAddress: event.ipAddress ?? null,
      targetType: event.targetType ?? null,
      targetId: event.targetId ?? null,
      details: event.details ? JSON.stringify(event.details) : null,
      createdAt: Date.now(),
    }).run();
  } catch (error) {
    console.error('[AuditLog] Failed to save audit event:', error);
  }
}
