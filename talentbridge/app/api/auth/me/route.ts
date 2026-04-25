import { NextRequest, NextResponse } from 'next/server';
import { getHrUserFromRequest } from '@/lib/hrAuth';

export async function GET(req: NextRequest) {
  const user = getHrUserFromRequest(req);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user });
}
