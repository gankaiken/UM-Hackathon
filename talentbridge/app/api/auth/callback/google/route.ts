// app/api/auth/callback/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleGoogleCallback } from '@/lib/auth';
import { getHrUserFromRequest } from '@/lib/hrAuth';

export async function GET(req: NextRequest) {
  const user = getHrUserFromRequest(req);
  const code = req.nextUrl.searchParams.get('code');
  const employerId = req.nextUrl.searchParams.get('state'); // We passed employerId in state
  
  if (!user || !code || !employerId || employerId !== user.id) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/hr?error=oauth_failed`);
  }

  try {
    await handleGoogleCallback(code, employerId);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/hr?success=google_connected`);
  } catch (err) {
    console.error('[OAuth] Callback error:', err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/hr?error=oauth_error`);
  }
}
