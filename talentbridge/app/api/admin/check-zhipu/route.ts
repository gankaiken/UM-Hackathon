import { NextRequest, NextResponse } from 'next/server';
import { requireHrUser } from '@/lib/hrAuth';
import { getRequestIp, logAuditEvent } from '@/lib/security';
import { runZhipuHealthCheck } from '@/lib/zhipuHealth';

export async function GET(req: NextRequest) {
  const user = requireHrUser(req);
  if (user instanceof NextResponse) return user;
  if (user.id !== 'default') {
    await logAuditEvent({
      actorType: 'hr',
      actorId: user.id,
      action: 'admin.check_zhipu',
      status: 'blocked',
      ipAddress: getRequestIp(req),
      details: { reason: 'admin_only' },
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await runZhipuHealthCheck();
  await logAuditEvent({
    actorType: 'hr',
    actorId: user.id,
    action: 'admin.check_zhipu',
    status: result.ok ? 'success' : 'failure',
    ipAddress: getRequestIp(req),
    details: { status: result.status, latencyMs: result.latencyMs, model: result.model },
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
