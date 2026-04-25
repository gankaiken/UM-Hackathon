'use client';
// app/jobs/[id]/apply/client-form.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ApplyForm({ jdId, roleTitle, employer }: { jdId: string, roleTitle: string, employer: string }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name to proceed.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdId, candidateName: name.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create session');

      // Redirect instantly to the AI Interview
      router.push(`/interview/${data.sessionId}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', color: 'var(--red)', borderRadius: 'var(--radius-xs)', fontSize: 14 }}>
          {error}
        </div>
      )}
      
      <div>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--navy)', marginBottom: 8 }}>
          Full Name
        </label>
        <input 
          type="text" 
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Aisyah Binti Razali"
          style={{
            width: '100%', padding: '12px 16px', fontSize: 16,
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            outline: 'none', background: '#fff',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
          }}
          disabled={loading}
          autoFocus
        />
      </div>

      <button 
        type="submit" 
        className="btn-primary" 
        style={{ 
          marginTop: 8, padding: '14px', fontSize: 16, 
          justifyContent: 'center', opacity: loading ? 0.7 : 1,
          pointerEvents: loading ? 'none' : 'auto'
        }}
        disabled={loading}
      >
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="spinner" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff' }} />
            Starting Session...
          </div>
        ) : (
          'Begin AI Interview'
        )}
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--slate)', marginTop: 8 }}>
        By continuing, you agree to an AI-moderated skills assessment. Camera access may be required for integrity checks.
      </p>
    </form>
  );
}
