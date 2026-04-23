// app/api/auth/connect/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/auth';
import { requireHrUser } from '@/lib/hrAuth';

export async function GET(req: NextRequest) {
  const user = requireHrUser(req);
  if (user instanceof NextResponse) return user;
  
  const url = getGoogleAuthUrl(user.id);
  return NextResponse.redirect(url);
}
