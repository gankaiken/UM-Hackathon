import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, normalizeEmail, setHrSessionCookie, verifyPassword } from '@/lib/hrAuth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = findUserByEmail(normalizeEmail(email));
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const res = NextResponse.json({ user: { id: user.id, email: user.email } });
    setHrSessionCookie(res, { id: user.id, email: user.email });
    return res;
  } catch {
    return NextResponse.json({ error: 'Could not log in' }, { status: 500 });
  }
}
