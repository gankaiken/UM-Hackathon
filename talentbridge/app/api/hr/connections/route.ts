// app/api/hr/connections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getConnectionStatus } from '@/lib/auth';
import { requireHrUser } from '@/lib/hrAuth';
import { env, hasZoomCreds } from '@/lib/env';
import { getAiRuntimeStatus } from '@/lib/aiStatus';

export async function GET(req: NextRequest) {
  try {
    const user = requireHrUser(req);
    if (user instanceof NextResponse) return user;

    const [status, ai] = await Promise.all([
      getConnectionStatus(user.id),
      getAiRuntimeStatus(),
    ]);

    const smtpConfigured = Boolean(process.env.SMTP_HOST);
    const smtpAuthConfigured = Boolean(process.env.EMAIL && process.env.EMAIL_PASSWORD);
    const emailStatus = smtpConfigured && smtpAuthConfigured
      ? 'Live'
      : smtpConfigured || smtpAuthConfigured
        ? 'Failed'
        : 'Missing';
    const zoomStatus = hasZoomCreds()
      ? 'Live'
      : env.ZOOM_ACCOUNT_ID || env.ZOOM_CLIENT_ID || env.ZOOM_CLIENT_SECRET
        ? 'Failed'
        : 'Missing';

    return NextResponse.json({
      ...status,
      integrationHealth: {
        email: emailStatus,
        zoom: zoomStatus,
        calendar: status.google?.connected ? 'Connected' : 'Not Connected',
        ai: ai.status,
        aiDetail: ai.detail,
      },
      aiComponents: ai.components,
    });
  } catch (err) {
    console.error('[HrConnections] Failed to fetch integration health', {
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Failed to fetch connection status' }, { status: 500 });
  }
}
