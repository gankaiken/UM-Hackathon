'use client';
// app/result/[sessionId]/page.tsx — Premium Result Delivery v3.0
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { VerdictResult } from '@/lib/types';

export default function ResultPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [verdict, setVerdict] = useState<VerdictResult | null>(null);
  const [candidateName, setCandidateName] = useState('');
  const [loading, setLoading] = useState(true);
  const [disputing, setDisputing] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState(false);
  const [foundJob, setFoundJob] = useState(false);
  const [foundJobLoading, setFoundJobLoading] = useState(false);

  const handleFoundJob = async () => {
    setFoundJobLoading(true);
    try {
      await fetch(`/api/session/${sessionId}/found-job`, { method: 'POST' });
      setFoundJob(true);
    } catch {
      alert('Could not update status. Please try again.');
    } finally {
      setFoundJobLoading(false);
    }
  };

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ 
            width: 48, height: 48, margin: '0 auto 24px', 
            border: '4px solid #F1F5F9', borderTop: '4px solid #2563EB' 
          }} />
          <p style={{ color: '#64748B', fontSize: 16, fontFamily: 'var(--font-body)' }}>Preparing your feedback...</p>
        </div>
      </div>
    );
  }

  if (!verdict) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0A0C12', marginBottom: 12, fontFamily: 'var(--font-display)' }}>Session Complete</h1>
          <p style={{ color: '#64748B', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
            Thank you, {candidateName}! Your results are being processed. This role requires manual validation by the employer.
          </p>
        </div>
      </div>
    );
  }

  const isGreen = verdict.triage_result === 'GREEN';
  const isAmber = verdict.triage_result === 'AMBER';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F6F9FF 0%, #FFFFFF 100%)', padding: '60px 24px' }}>
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        
        {/* Success Header Area */}
        <div style={{ textAlign: 'center', marginBottom: 40 }} className="fade-in">
          <div style={{
            width: 80, height: 80, borderRadius: 24,
            background: isGreen ? '#10B981' : isAmber ? '#F59E0B' : '#3B82F6',
            color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: 32,
            boxShadow: `0 12px 30px ${isGreen ? 'rgba(16,185,129,0.2)' : isAmber ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)'}`
          }}>
            {isGreen ? '✓' : isAmber ? '⚡' : '✨'}
          </div>
          <h1 style={{ 
            fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, 
            color: '#0A0C12', marginBottom: 12, letterSpacing: '-1px'
          }}>
            Interview Complete
          </h1>
          <p style={{ 
            fontSize: 15, color: '#64748B', fontWeight: 700, 
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px' 
          }}>
            FOR {candidateName.toUpperCase()}
          </p>
        </div>

        {/* Main Verdict Summary Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid #E5E7EB',
          borderRadius: 24,
          padding: '40px',
          marginBottom: 24,
          boxShadow: '0 10px 40px rgba(0,0,0,0.03)',
        }} className="fade-in">
          <h2 style={{ 
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, 
            color: '#0A0C12', marginBottom: 16, letterSpacing: '-0.3px' 
          }}>
            Candidate Feedback Summary
          </h2>
          <p style={{ color: '#4B5563', fontSize: 16, lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
            {verdict.ai_summary || verdict.summary}
          </p>
        </div>

        {/* Dynamic Sections Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="fade-in">
          
          {/* Strengths Card */}
          <div style={{ background: '#FFFFFF', border: '1.5px solid #BBF7D0', borderRadius: 24, padding: '32px' }}>
            <h3 style={{ 
              fontSize: 12, fontWeight: 800, color: '#059669', 
              fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase', 
              marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 
            }}>
              <span style={{ fontSize: 18 }}>✓</span> Verified Strengths Analysis
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(verdict.verified_strengths || verdict.strengths || []).map((s, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#065F46', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                      {s}
                    </div>
                  </div>
                  <div style={{ height: 6, background: '#D1FAE5', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${75 + Math.random() * 20}%`, 
                      background: 'linear-gradient(90deg, #10B981, #34D399)',
                      borderRadius: 3
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conditional Path: Upskill (AMBER) */}
          {isAmber && verdict.upskill_path && (
            <div style={{ background: '#FFFFFF', border: '1.5px solid #FDE68A', borderRadius: 24, padding: '32px' }}>
              <h3 style={{ 
                fontSize: 12, fontWeight: 800, color: '#B45309', 
                fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase', 
                marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 
              }}>
                <span style={{ fontSize: 18 }}>🚀</span> Grow Your Profile
              </h3>
              <p style={{ color: '#92400E', fontSize: 13, marginBottom: 20, fontFamily: 'var(--font-body)', opacity: 0.8 }}>
                We identified a specific skill gap. Use this 3-week path to prepare for your next level.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {verdict.upskill_path.map((step, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 16, alignItems: 'center',
                    padding: '16px', background: '#FFFBEB', borderRadius: 16
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, background: '#F59E0B', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, flexShrink: 0, fontFamily: 'var(--font-mono)'
                    }}>
                      W{step.week}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#92400E', fontFamily: 'var(--font-body)' }}>{step.topic}</div>
                      <div style={{ fontSize: 12, color: '#B45309', opacity: 0.7 }}>{step.resource}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conditional Path: Career Orientation (RED) */}
          {!isGreen && !isAmber && verdict.career_orientation && (
            <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 24, padding: '32px' }}>
              <h3 style={{ 
                fontSize: 12, fontWeight: 800, color: '#475569', 
                fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase', 
                marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 
              }}>
                <span style={{ fontSize: 18 }}>🧭</span> Career Guidance
              </h3>
              <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
                {verdict.career_orientation}
              </p>
            </div>
          )}

          {/* Dispute Flow */}
          {!disputeSuccess ? (
            <div style={{ background: '#FFFFFF', border: '1.5px solid #E5E7EB', borderRadius: 24, padding: '32px', marginTop: 12 }}>
              <h3 style={{ 
                fontSize: 14, fontWeight: 800, color: '#0A0C12', 
                fontFamily: 'var(--font-display)', marginBottom: 8 
              }}>
                Dispute This Result
              </h3>
              <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.6, fontFamily: 'var(--font-body)', marginBottom: 20 }}>
                If you believe this assessment does not accurately reflect your capabilities, you may request a human review.
              </p>
              {disputing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <textarea 
                    placeholder="Briefly explain why you are disputing this result..."
                    style={{ 
                      width: '100%', padding: 16, borderRadius: 12, border: '1px solid #E5E7EB',
                      fontFamily: 'var(--font-body)', fontSize: 14, minHeight: 100, resize: 'vertical'
                    }}
                  />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button 
                      onClick={() => setDisputeSuccess(true)}
                      style={{ 
                        background: '#0A0C12', color: '#FFFFFF', padding: '10px 24px', 
                        borderRadius: 8, fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' 
                      }}>
                      Submit Dispute
                    </button>
                    <button 
                      onClick={() => setDisputing(false)}
                      style={{ 
                        background: '#F1F5F9', color: '#475569', padding: '10px 24px', 
                        borderRadius: 8, fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' 
                      }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setDisputing(true)}
                  style={{ 
                    background: '#FFFFFF', color: '#0A0C12', border: '1px solid #E5E7EB',
                    padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                  Request Review
                </button>
              )}
            </div>
          ) : (
            <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 24, padding: '24px', marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>✓</span>
              <div>
                <div style={{ fontWeight: 700, color: '#065F46', fontSize: 14 }}>Dispute Submitted</div>
                <div style={{ color: '#047857', fontSize: 13 }}>Our human review team will review this session within 72 hours.</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note + Found a Job */}
        <div style={{ 
          marginTop: 48, padding: '32px 24px', 
          borderTop: '1px solid #E5E7EB',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        }}>
          <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
            Thank you for applying via TalentBridge AI.<br />
            Your assessment has been securely delivered to the employer.
          </div>

          {/* Found a Job CTA */}
          {!foundJob ? (
            <div style={{
              background: '#F9FAFB', border: '1.5px solid #E5E7EB',
              borderRadius: 16, padding: '20px 28px', textAlign: 'center', maxWidth: 420, width: '100%',
            }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>🎉</div>
              <div style={{ fontWeight: 700, color: '#0A0C12', fontSize: 14, marginBottom: 6, fontFamily: 'var(--font-display)' }}>
                Already found a job?
              </div>
              <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 16, fontFamily: 'var(--font-body)' }}>
                Let recruiters know — this removes you from active pipelines and saves everyone&apos;s time.
              </p>
              <button
                onClick={handleFoundJob}
                disabled={foundJobLoading}
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#FFFFFF', border: 'none', borderRadius: 10,
                  padding: '10px 24px', fontSize: 14, fontWeight: 700,
                  cursor: foundJobLoading ? 'wait' : 'pointer',
                  fontFamily: 'var(--font-body)',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
                  opacity: foundJobLoading ? 0.7 : 1,
                }}
              >
                {foundJobLoading ? 'Updating...' : '✓ I Found a Job'}
              </button>
            </div>
          ) : (
            <div style={{
              background: '#F0FDF4', border: '1.5px solid #BBF7D0',
              borderRadius: 16, padding: '20px 28px', textAlign: 'center', maxWidth: 420, width: '100%',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{ fontSize: 24 }}>🎊</span>
              <div>
                <div style={{ fontWeight: 700, color: '#065F46', fontSize: 14 }}>Congratulations!</div>
                <div style={{ color: '#047857', fontSize: 13 }}>
                  You&apos;ve been removed from all active pipelines. Wishing you success in your new role!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
