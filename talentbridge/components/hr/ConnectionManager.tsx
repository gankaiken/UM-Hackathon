// components/hr/ConnectionManager.tsx
'use client';

import { useState, useEffect } from 'react';

interface Props {
  employerId: string;
}

interface ConnectionStatus {
  google?: {
    connected?: boolean;
  };
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

  if (loading) return <div style={{ color: '#64748B', fontSize: 12 }}>Loading connections...</div>;

  const isConnected = status?.google?.connected;

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
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB' }}>Integrations</h3>
        <span style={{
          fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
          background: isConnected ? '#10B98115' : '#EF444415',
          color: isConnected ? '#10B981' : '#EF4444',
          textTransform: 'uppercase', fontFamily: 'var(--font-mono)'
        }}>
          {isConnected ? 'LIVE MODE' : 'TRACE MODE'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#FFFFFF10',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
          }}>
            G
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F9FAFB' }}>Google (Gmail & Calendar)</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              {isConnected ? 'Connected' : 'Not connected'}
            </div>
          </div>
        </div>
        
        {!isConnected ? (
          <a
            href={`/api/auth/connect/google?employerId=${employerId}`}
            style={{
              background: '#2563EB', color: 'white', textDecoration: 'none',
              padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700
            }}
          >
            Connect
          </a>
        ) : (
          <button
            onClick={() => alert('Disconnecting not yet implemented in demo.')}
            style={{
              background: 'transparent', color: '#64748B', border: '1px solid #1E2433',
              padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}
          >
            Manage
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#FFFFFF10',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
          }}>
            Z
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F9FAFB' }}>Zoom</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Scaffolded</div>
          </div>
        </div>
        <button disabled style={{ background: '#1E2433', color: '#4B5563', padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
          Soon
        </button>
      </div>
    </div>
  );
}
