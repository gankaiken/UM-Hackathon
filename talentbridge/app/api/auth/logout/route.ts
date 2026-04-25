import { NextResponse } from 'next/server';
import { clearHrSessionCookie } from '@/lib/hrAuth';

export async function POST() {
  const res = NextResponse.json({ success: true });
  clearHrSessionCookie(res);
  return res;
}
