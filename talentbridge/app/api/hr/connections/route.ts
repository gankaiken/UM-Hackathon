// app/api/hr/connections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getConnectionStatus } from '@/lib/auth';

export async function GET(req: NextRequest) {
  // In a real app, employerId comes from auth middleware.
  const employerId = req.nextUrl.searchParams.get('employerId') || 'default';
  
  try {
    const status = await getConnectionStatus(employerId);
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch connection status' }, { status: 500 });
  }
}
