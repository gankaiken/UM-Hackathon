'use client';
// app/result/[sessionId]/page.tsx — Premium Result Delivery v3.0
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { VerdictResult } from '@/lib/types';
import { hashStringToRange } from '@/lib/utils/runtime';

export default function ResultPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [verdict, setVerdict] = useState<VerdictResult | null>(null);
  const [candidateName, setCandidateName] = useState('');
  const [loading, setLoading] = useState(true);
  const [disputing, setDisputing] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeRequestedAt, setDisputeRequestedAt] = useState<number | null>(null);
  const [foundJob, setFoundJob] = useState(false);
  const [foundJobLoading, setFoundJobLoading] = useState(false);
  const [interviewScheduledAt, setInterviewScheduledAt] = useState<number | null>(null);
  const [interviewMeetingLink, setInterviewMeetingLink] = useState('');
  const [interviewScheduleNote, setInterviewScheduleNote] = useState('');

  // AI Roadmap Generation States
  const [generatingPath, setGeneratingPath] = useState(false);
  const [pathGenerated, setPathGenerated] = useState(false);
  const [aiLogs, setAiLogs] = useState<string[]>([]);

  const handleGeneratePath = async () => {
    setGeneratingPath(true);
    setAiLogs(['[AI] Analyzing your verified strengths and identified gaps from this interview...']);
    
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    
    await delay(1200);
    setAiLogs(prev => [...prev, '[AI] Building a tailored demo roadmap from the stored verdict data...']);
    await delay(1500);
    setAiLogs(prev => [...prev, `[AI] Mapping focused practice resources to gap: ${verdict?.identified_gaps?.[0] || 'Technical tooling'}`]);
    await delay(1000);
    setAiLogs(prev => [...prev, '[AI] Structuring 3-week intensive roadmap...']);
    await delay(800);
    setAiLogs(prev => [...prev, '[AI] Roadmap generated successfully.']);
    
    await delay(1000);
    setGeneratingPath(false);
    setPathGenerated(true);
  };

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
        setFoundJob(Boolean(s.foundJob));
        setDisputeRequestedAt(s.disputeRequestedAt ?? null);
        setInterviewScheduledAt(s.interviewScheduledAt ?? null);
        setInterviewMeetingLink(s.interviewMeetingLink ?? '');
        setInterviewScheduleNote(s.interviewScheduleNote ?? '');
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
                (() => {
                  const strengthWidth = hashStringToRange(`${s}-${i}`, 75, 95);
                  return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#065F46', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                      {s}
                    </div>
                  </div>
                  <div style={{ height: 6, background: '#D1FAE5', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${strengthWidth}%`, 
                      background: 'linear-gradient(90deg, #10B981, #34D399)',
                      borderRadius: 3
                    }} />
                  </div>
                </div>
                  );
                })()
              ))}
            </div>
          </div>

          {/* Conditional Path: Upskill (AMBER) */}
          {isAmber && verdict.upskill_path && (
            <div style={{ 
              background: '#FFFFFF', 
              border: '1.5px solid rgba(245, 158, 11, 0.3)', 
              borderRadius: 24, 
              padding: '36px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(245, 158, 11, 0.05)'
            }}>
              {/* Subtle background glow */}
              <div style={{
                position: 'absolute', top: -100, right: -100, width: 250, height: 250,
                background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, rgba(255,255,255,0) 70%)',
                borderRadius: '50%', pointerEvents: 'none'
              }} />

              <h3 style={{ 
                fontSize: 13, fontWeight: 800, color: '#D97706', 
                fontFamily: 'var(--font-mono)', letterSpacing: '1.2px', textTransform: 'uppercase', 
                marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 
              }}>
                <span style={{ fontSize: 20 }}>🚀</span> Custom Growth Plan
              </h3>

              {!pathGenerated && !generatingPath ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ color: '#92400E', fontSize: 14, marginBottom: 24, fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
                    You have strong foundational qualities, but we identified a specific gap in <strong>{verdict.identified_gaps?.[0] || 'technical tooling'}</strong>. Generate a tailored demo learning path based on your interview evidence and saved roadmap data.
                  </p>
                  <button 
                    onClick={handleGeneratePath}
                    style={{
                      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                      color: '#FFFFFF', padding: '12px 24px', borderRadius: 12, border: 'none',
                      fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                      boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
                    }}>
                    Generate Demo Learning Path
                  </button>
                </div>
              ) : generatingPath ? (
                <div style={{ 
                  background: '#0A0C12', borderRadius: 16, padding: '24px', 
                  fontFamily: 'var(--font-mono)', fontSize: 12, color: '#10B981', lineHeight: 1.8 
                }}>
                  {aiLogs.map((log, idx) => (
                    <div key={idx} className="fade-in">{log}</div>
                  ))}
                  <div className="blink" style={{ color: '#475569', marginTop: 8 }}>_</div>
                </div>
              ) : (
                <div className="fade-in">
                  <p style={{ color: '#92400E', fontSize: 14, marginBottom: 32, fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
                    This demo roadmap shows how a guided 3-week path could be structured from your interview result. Complete it and you can return for a fresh evaluation.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
                    {/* Vertical timeline connecting line */}
                    <div style={{
                      position: 'absolute', left: 24, top: 20, bottom: 40, width: 2,
                      background: 'linear-gradient(180deg, #FCD34D 0%, rgba(252, 211, 77, 0) 100%)',
                      zIndex: 0
                    }} />

                    {verdict.upskill_path.map((step, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: 20, position: 'relative', zIndex: 1,
                        paddingBottom: i === verdict.upskill_path!.length - 1 ? 0 : 28
                      }}>
                        {/* Week Indicator */}
                        <div style={{
                          width: 48, height: 48, borderRadius: 14, 
                          background: '#FFFBEB', color: '#D97706',
                          border: '2px solid #FDE68A',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 800, flexShrink: 0, fontFamily: 'var(--font-mono)',
                          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.1)',
                          position: 'relative'
                        }}>
                          W{step.week}
                        </div>
                        
                        {/* Content Card */}
                        <div style={{
                          flex: 1, background: '#FFFFFF', border: '1px solid #FEF3C7',
                          borderRadius: 16, padding: '20px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 16, color: '#78350F', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                                {step.topic}
                              </div>
                              <div style={{ fontSize: 13, color: '#B45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                {step.resource}
                              </div>
                            </div>
                            <button style={{
                              background: '#FFFBEB', color: '#D97706', border: 'none', borderRadius: 8,
                              padding: '8px 14px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
                              cursor: 'pointer', whiteSpace: 'nowrap'
                            }}>
                              Start →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <button style={{
                      background: 'transparent', color: '#D97706', border: '1px solid #FDE68A', borderRadius: 8,
                      padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                    }}>
                      Re-apply for this role
                    </button>
                  </div>
                </div>
              )}
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

              {/* Red Flow Next Steps */}
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8, fontFamily: 'var(--font-display)' }}>Next Steps</h4>
                <p style={{ fontSize: 13, color: '#64748B', fontFamily: 'var(--font-body)' }}>
                  Our AI has redirected your profile to matching roles in our network based on your verified strengths. You will be automatically notified if an employer wishes to connect.
                </p>
              </div>
            </div>
          )}

          {/* Conditional Path: Green Next Steps */}
          {isGreen && (
            <div style={{ background: '#FFFFFF', border: '1.5px solid #BBF7D0', borderRadius: 24, padding: '32px' }}>
              <h3 style={{ 
                fontSize: 12, fontWeight: 800, color: '#059669', 
                fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase', 
                marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 
              }}>
                <span style={{ fontSize: 18 }}>📅</span> Next Steps
              </h3>
              <p style={{ color: '#065F46', fontSize: 14, lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                {interviewScheduledAt
                  ? 'The employer has moved you forward and a scheduling preview has been prepared for the next interview step.'
                  : 'Your verified profile has been prioritized for the employer. If they choose to proceed, the next step in the hiring workflow will be arranged directly by the employer team.'}
              </p>
              <div style={{ marginTop: 16, background: '#F0FDF4', padding: '12px 16px', borderRadius: 12, border: '1px solid #A7F3D0', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#047857', fontFamily: 'var(--font-mono)' }}>
                  {interviewScheduledAt ? 'Scheduling preview ready' : 'Expect an update within 48 hours'}
                </span>
              </div>
              {interviewScheduledAt ? (
                <div style={{ marginTop: 16, background: '#FFFFFF', border: '1px solid #BBF7D0', borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#059669', marginBottom: 8, fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    Interview Preview
                  </div>
                  <div style={{ fontSize: 14, color: '#065F46', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                    {new Date(interviewScheduledAt).toLocaleString('en-MY')}
                  </div>
                  <div style={{ fontSize: 12, color: '#047857', fontFamily: 'var(--font-body)', marginBottom: 10 }}>
                    {interviewScheduleNote || 'Demo scheduling preview is ready. External services remain simulated.'}
                  </div>
                  {interviewMeetingLink ? (
                    <a
                      href={interviewMeetingLink}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#ECFDF5',
                        color: '#047857',
                        border: '1px solid #A7F3D0',
                        borderRadius: 10,
                        padding: '8px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: 'none',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      Open Preview Link
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}

          {/* Dispute Flow */}
          {!disputeSuccess && !disputeRequestedAt ? (
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
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    style={{ 
                      width: '100%', padding: 16, borderRadius: 12, border: '1px solid #E5E7EB',
                      fontFamily: 'var(--font-body)', fontSize: 14, minHeight: 100, resize: 'vertical'
                    }}
                  />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button 
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/session/${sessionId}/dispute`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ reason: disputeReason }),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            alert(data.error || 'Could not submit dispute.');
                            return;
                          }
                          setDisputeRequestedAt(data.disputeRequestedAt);
                          setDisputeSuccess(true);
                          setDisputing(false);
                        } catch {
                          alert('Network error. Please try again.');
                        }
                      }}
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
                <div style={{ color: '#047857', fontSize: 13 }}>
                  Our human review team will review this session within 72 hours.
                  {disputeRequestedAt ? ` Submitted ${new Date(disputeRequestedAt).toLocaleString('en-MY')}.` : ''}
                </div>
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
