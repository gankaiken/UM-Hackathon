'use client';
// app/result/[sessionId]/page.tsx
// Candidate-facing result reveal page — shows verdicts with dignity.
// Candidates NEVER see GREEN/AMBER/RED labels.

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { VerdictResult } from '@/lib/types';

export default function ResultPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [verdict, setVerdict] = useState<VerdictResult | null>(null);
  const [candidateName, setCandidateName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Load session for name
      const sessionRes = await fetch(`/api/session/${sessionId}`);
      if (sessionRes.ok) {
        const s = await sessionRes.json();
        setCandidateName(s.candidateName);
      }

      // Poll for verdict
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const res = await fetch(`/api/verdict/${sessionId}`);
        const data = await res.json();
        if (data.ready) {
          setVerdict(data.verdict);
          setLoading(false);
          clearInterval(poll);
        }
        if (attempts > 30) {
          clearInterval(poll);
          setLoading(false);
        }
      }, 2000);

      return () => clearInterval(poll);
    }
    load();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="warm-canvas min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div style={{
            width: 56, height: 56, margin: '0 auto 20px',
            borderRadius: '50%',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #22c55e',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: '#717171', fontSize: 15 }}>Preparing your feedback...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!verdict) {
    return (
      <div className="warm-canvas min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p style={{ fontSize: 18, color: '#222', marginBottom: 8 }}>Thank you, {candidateName}!</p>
          <p style={{ color: '#717171' }}>Your results are being processed. Please check back soon.</p>
        </div>
      </div>
    );
  }

  const isGreen = verdict.triage_result === 'GREEN';
  const isAmber = verdict.triage_result === 'AMBER';

  return (
    <div className="warm-canvas min-h-screen" style={{ background: '#f7f7f7' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '32px 16px 64px' }}>
        {/* Header card */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: '32px 28px',
          marginBottom: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: isGreen ? 'linear-gradient(135deg, #3ecf8e, #00c573)' : isAmber ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'linear-gradient(135deg, #60a5fa, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 28,
            }}>
              {isGreen ? '🌟' : isAmber ? '🚀' : '💡'}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#222', marginBottom: 8 }}>
              {isGreen ? `Great news, ${candidateName}!` : isAmber ? `Thanks for sharing, ${candidateName}!` : `Thank you, ${candidateName}!`}
            </h1>
            <p style={{ color: '#717171', fontSize: 15, lineHeight: 1.6 }}>
              {verdict.ai_summary}
            </p>
          </div>
        </div>

        {/* Strengths */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '24px 28px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#222', marginBottom: 16 }}>
            ✅ Your Strengths
          </h2>
          {verdict.verified_strengths.map((s, i) => (
            <div key={i} style={{
              padding: '10px 14px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 10,
              marginBottom: 8,
              fontSize: 14,
              color: '#166534',
              lineHeight: 1.5,
            }}>
              {s}
            </div>
          ))}
        </div>

        {/* Upskill path (AMBER only) */}
        {isAmber && verdict.upskill_path && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px 28px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#222', marginBottom: 8 }}>
              📚 Your 3-Week Growth Path
            </h2>
            <p style={{ color: '#717171', fontSize: 13, marginBottom: 16 }}>
              One specific area to develop to strengthen your profile.
            </p>
            {verdict.upskill_path.map((step, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, marginBottom: 12,
                padding: '12px 14px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: 10,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#f59e0b', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                  W{step.week}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#222' }}>{step.topic}</div>
                  <div style={{ fontSize: 12, color: '#717171', marginTop: 2 }}>{step.resource}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Career orientation (RED only) */}
        {!isGreen && !isAmber && verdict.career_orientation && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px 28px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#222', marginBottom: 12 }}>
              🧭 Career Direction
            </h2>
            <p style={{ color: '#444', fontSize: 14, lineHeight: 1.7 }}>
              {verdict.career_orientation}
            </p>
          </div>
        )}

        {/* Footer note */}
        <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 24, lineHeight: 1.6 }}>
          📋 Our team will be reviewing your application and will be in touch soon.
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
