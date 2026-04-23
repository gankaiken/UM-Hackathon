// app/api/hr/connections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getConnectionStatus } from '@/lib/auth';
import { requireHrUser } from '@/lib/hrAuth';

export async function GET(req: NextRequest) {
  try {
    const user = requireHrUser(req);
    if (user instanceof NextResponse) return user;

    const status = await getConnectionStatus(user.id);
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch connection status' }, { status: 500 });
  }
}
