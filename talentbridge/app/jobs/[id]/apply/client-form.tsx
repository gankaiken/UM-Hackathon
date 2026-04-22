'use client';
// app/jobs/[id]/apply/client-form.tsx — Premium Apply Form v3.0
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
    <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error && (
        <div style={{ 
          padding: '12px 16px', background: 'rgba(239,68,68,0.06)', color: '#DC2626', 
          border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, fontSize: 13,
          fontFamily: 'var(--font-body)', fontWeight: 500
        }}>
          {error}
        </div>
      )}
      
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#4B5563', marginBottom: 10, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Full Name
        </label>
        <input 
          type="text" 
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Aisyah Binti Razali"
          style={{
            width: '100%', padding: '14px 18px', fontSize: 16,
            border: '1.5px solid #E5E7EB', borderRadius: 14,
            outline: 'none', background: '#FFFFFF',
            color: '#0A0C12',
            fontFamily: 'var(--font-body)',
            transition: 'all 0.2s ease',
          }}
          onFocus={e => {
            e.target.style.borderColor = '#2563EB';
            e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.08)';
          }}
          onBlur={e => {
            e.target.style.borderColor = '#E5E7EB';
            e.target.style.boxShadow = 'none';
          }}
          disabled={loading}
          autoFocus
        />
      </div>

      <button 
        type="submit" 
        className="btn-accent" 
        style={{ 
          marginTop: 8, padding: '0 24px', height: 52, fontSize: 16, 
          justifyContent: 'center', opacity: (loading || !name.trim()) ? 0.6 : 1,
          pointerEvents: (loading || !name.trim()) ? 'none' : 'auto',
          width: '100%'
        }}
        disabled={loading || !name.trim()}
      >
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="spinner" style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid #fff' }} />
            Starting Session...
          </div>
        ) : (
          'Begin AI Interview'
        )}
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 12, lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
        By continuing, you agree to an AI-moderated skills assessment. Camera access may be required for integrity checks.
      </p>
    </form>
  );
}
