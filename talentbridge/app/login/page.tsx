'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/hr';
  const [email, setEmail] = useState('nexus@talentbridge.local');
  const [password, setPassword] = useState('TalentBridgeDemo123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg,#F6F9FF,#FFFFFF)', padding: 24 }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 420, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 24, padding: 32, boxShadow: '0 16px 50px rgba(15,23,42,0.08)' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#2563EB', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>TalentBridge HR</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0A0C12', marginBottom: 8, fontFamily: 'var(--font-display)' }}>Sign in</h1>
        <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>Use your employer account to manage roles, verdicts, disputes, and scheduling.</p>

        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" style={inputStyle} />

        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', margin: '16px 0 6px' }}>Password</label>
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="current-password" style={inputStyle} />

        {error ? <div style={{ marginTop: 16, color: '#DC2626', fontSize: 13 }}>{error}</div> : null}

        <button disabled={loading} style={{ width: '100%', height: 46, marginTop: 24, border: 'none', borderRadius: 12, background: '#2563EB', color: '#FFFFFF', fontWeight: 800, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <p style={{ color: '#94A3B8', fontSize: 12, marginTop: 16, lineHeight: 1.5 }}>
          Demo accounts: nexus@talentbridge.local or techcorp@talentbridge.local
        </p>
      </form>
    </div>
  );
}

function LoginShell() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg,#F6F9FF,#FFFFFF)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 24, padding: 32, color: '#64748B' }}>
        Loading sign in...
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  border: '1px solid #CBD5E1',
  borderRadius: 10,
  padding: '0 12px',
  color: '#0F172A',
  outline: 'none',
};
