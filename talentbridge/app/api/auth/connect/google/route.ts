// app/api/auth/connect/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/auth';

export async function GET(req: NextRequest) {
  // In a real app, we would get the employerId from the session.
  // For the demo, we'll use 'default' or a query param.
  const employerId = req.nextUrl.searchParams.get('employerId') || 'default';
  
  const url = getGoogleAuthUrl(employerId);
  return NextResponse.redirect(url);
}
