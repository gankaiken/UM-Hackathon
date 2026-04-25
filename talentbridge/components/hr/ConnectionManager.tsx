'use client';

import { useEffect, useState } from 'react';

interface Props {
  employerId: string;
}

interface ConnectionStatus {
  google?: {
    connected?: boolean;
    updatedAt?: number;
    needsReconnect?: boolean;
  };
  integrationHealth?: {
    email: string;
    zoom: string;
    calendar: string;
    ai: string;
    aiDetail?: string;
  };
  aiComponents?: Record<string, string>;
}

function statusColors(status: string) {
  if (status === 'Live' || status === 'Connected' || status === 'Live AI') return { bg: '#10B98115', color: '#10B981' };
  if (status === 'Fallback' || status === 'Fallback Mock' || status === 'Preset Demo Only') return { bg: '#F59E0B15', color: '#F59E0B' };
  if (status === 'Invalid Key' || status === 'Failed' || status === 'Missing' || status === 'Not Connected') return { bg: '#EF444415', color: '#EF4444' };
  return { bg: '#64748B15', color: '#94A3B8' };
}

export default function ConnectionManager({ employerId }: Props) {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/hr/connections?employerId=${employerId}`)
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      });
  }, [employerId]);

  if (loading) return <div style={{ color: '#64748B', fontSize: 12 }}>Loading integration health...</div>;

  const rows = [
    { label: 'Email', value: status?.integrationHealth?.email || 'Missing' },
    { label: 'Zoom', value: status?.integrationHealth?.zoom || 'Missing' },
    { label: 'Calendar', value: status?.integrationHealth?.calendar || 'Not Connected' },
    { label: 'AI', value: status?.integrationHealth?.ai || 'Fallback' },
  ];

  return (
    <div style={{
      background: '#141820',
      border: '1.5px solid #1E2433',
      borderRadius: 20,
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB' }}>Integration Health</h3>
        <span style={{ fontSize: 11, color: '#64748B' }}>Do not overclaim</span>
      </div>

      {rows.map(row => {
        const colors = statusColors(row.value);
        return (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#F9FAFB' }}>{row.label}</div>
              {row.label === 'AI' && status?.integrationHealth?.aiDetail ? (
                <div style={{ fontSize: 12, color: '#64748B', maxWidth: 260 }}>{status.integrationHealth.aiDetail}</div>
              ) : null}
              {row.label === 'Calendar' && status?.google?.connected ? (
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  Google connected{status.google.updatedAt ? ` • updated ${new Date(status.google.updatedAt).toLocaleDateString('en-MY')}` : ''}
                </div>
              ) : null}
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              padding: '4px 8px',
              borderRadius: 6,
              background: colors.bg,
              color: colors.color,
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
            }}>
              {row.value}
            </span>
          </div>
        );
      })}

      {!status?.google?.connected ? (
        <a
          href={`/api/auth/connect/google?employerId=${employerId}`}
          style={{
            marginTop: 8,
            background: '#2563EB',
            color: 'white',
            textDecoration: 'none',
            padding: '10px 16px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          Connect Google Calendar
        </a>
      ) : null}

      <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid #1E2433' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          AI component audit
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(status?.aiComponents || {}).map(([name, mode]) => {
            const colors = statusColors(mode);
            return (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#CBD5E1' }}>{name}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: colors.color }}>{mode}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
