'use client';
// app/interview/[sessionId]/history/page.tsx — Interview History (Read-Only)
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { TranscriptEntry } from '@/lib/types';

interface Message {
    id: string;
    role: 'inquisitor' | 'candidate';
    content: string;
}

interface SessionPayload {
    candidateName: string;
    roleTitle?: string;
    companyName?: string;
    mapperResult?: { role_title?: string };
    turnCount: number;
    transcript: Array<TranscriptEntry>;
    status: string;
}

const TIMELINE_STEPS = [
    { id: 'profile', label: 'Profile submitted' },
    { id: 'mapper', label: 'Application reviewed' },
    { id: 'interview', label: 'Interview completed' },
    { id: 'auditor', label: 'Answers evaluated' },
    { id: 'verdict', label: 'Results ready' },
];

export default function InterviewHistoryPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [isLoading, setIsLoading] = useState(true);
    const [candidateName, setCandidateName] = useState('');
    const [roleTitle, setRoleTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [turnCount, setTurnCount] = useState(0);
    const [sessionStatus, setSessionStatus] = useState('');
    const [notFound, setNotFound] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);
    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    useEffect(() => {
        async function loadSession() {
            try {
                const res = await fetch(`/api/session/${sessionId}`);
                if (!res.ok) { setNotFound(true); setIsLoading(false); return; }
                const sessionData = await res.json() as SessionPayload;

                setCandidateName(sessionData.candidateName);
                setRoleTitle(sessionData.roleTitle ?? sessionData.mapperResult?.role_title ?? 'this role');
                setCompanyName(sessionData.companyName ?? '');
                setTurnCount(sessionData.turnCount);
                setSessionStatus(sessionData.status);

                if (sessionData.transcript?.length > 0) {
                    const restored: Message[] = sessionData.transcript
                        .filter((t: TranscriptEntry) => t.content !== '__INTERVIEW_START__')
                        .map((t: TranscriptEntry) => ({
                            id: `${t.role}-${t.turnNumber}`,
                            role: t.role,
                            content: t.content,
                        }));
                    setMessages(restored);
                }
            } catch {
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        }
        loadSession();
    }, [sessionId]);

    // ── Loading ──────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
                <div className="spinner" style={{ width: 32, height: 32, border: '3px solid #F1F5F9', borderTop: '3px solid #2563EB' }} />
            </div>
        );
    }

    // ── Not Found ────────────────────────────────────────────────────────────
    if (notFound) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: 24 }}>
                <div style={{ textAlign: 'center', maxWidth: 400, background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 24, padding: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>
                        Session not found
                    </h2>
                    <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, fontFamily: 'var(--font-body)', marginBottom: 24 }}>
                        This interview session does not exist or you do not have access to it.
                    </p>
                    <button
                        onClick={() => router.back()}
                        style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#FFFFFF', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                    >
                        Go back
                    </button>
                </div>
            </div>
        );
    }

    const questionCount = Math.ceil(turnCount / 2);
    const isCompleted = sessionStatus === 'completed';

    // ── Main View ────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', flexDirection: 'column' }}>

            {/* ── HEADER ── */}
            <header style={{
                height: 64, background: '#FFFFFF', borderBottom: '1.5px solid #E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
                position: 'sticky', top: 0, zIndex: 100,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 36, height: 36, background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
                        borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
                        </svg>
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0A0C12', fontFamily: 'var(--font-display)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                            The Inquisitor
                        </div>
                        <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                            Interview History
                        </div>
                    </div>
                </div>

                {/* Read-only badge */}
                <div style={{
                    background: '#F1F5F9', border: '1px solid #E2E8F0',
                    borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 700,
                    color: '#64748B', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px',
                    display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2.5" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    Read-only
                </div>
            </header>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* ── LEFT PANEL ── */}
                <aside style={{
                    width: 300, borderRight: '1.5px solid #E5E7EB', background: '#FFFFFF',
                    display: 'flex', flexDirection: 'column', gap: 28, padding: 24,
                    overflowY: 'auto',
                }}>
                    {/* Role */}
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', marginBottom: 12, textTransform: 'uppercase' }}>
                            Applied For
                        </div>
                        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 16, padding: 16 }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0A0C12', fontFamily: 'var(--font-display)', lineHeight: 1.3, marginBottom: 4 }}>
                                {roleTitle}
                            </div>
                            <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)' }}>
                                {companyName || 'Company'}
                            </div>
                        </div>
                    </div>

                    {/* Timeline — all completed */}
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', marginBottom: 16, textTransform: 'uppercase' }}>
                            Interview Status
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {TIMELINE_STEPS.map((step, i) => {
                                const isDone = isCompleted ? true : i <= 2;
                                return (
                                    <div key={step.id} style={{ display: 'flex', gap: 14, minHeight: 48 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div style={{
                                                width: 20, height: 20, borderRadius: '50%',
                                                background: isDone ? '#10B981' : '#F1F5F9',
                                                border: `2px solid ${isDone ? '#10B981' : '#E5E7EB'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                zIndex: 1,
                                            }}>
                                                {isDone && (
                                                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24">
                                                        <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                            </div>
                                            {i < TIMELINE_STEPS.length - 1 && (
                                                <div style={{ width: 2, flex: 1, background: isDone ? '#10B981' : '#E5E7EB', margin: '2px 0' }} />
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: 13, fontWeight: isDone ? 700 : 500,
                                            color: isDone ? '#10B981' : '#9CA3AF',
                                            fontFamily: 'var(--font-body)', paddingTop: 1,
                                        }}>
                                            {step.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Stats */}
                    {questionCount > 0 && (
                        <div style={{
                            marginTop: 'auto', background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)',
                            borderRadius: 16, padding: 16, textAlign: 'center',
                        }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', fontFamily: 'var(--font-display)', letterSpacing: '-1px' }}>
                                {questionCount}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Questions Asked
                            </div>
                        </div>
                    )}

                    {/* Back button */}
                    <button
                        onClick={() => router.back()}
                        style={{
                            width: '100%', padding: '10px 0', borderRadius: 12, border: '1.5px solid #E5E7EB',
                            background: '#FFFFFF', color: '#374151', fontSize: 13, fontWeight: 700,
                            fontFamily: 'var(--font-body)', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF'; }}
                    >
                        ← Back to Dashboard
                    </button>
                </aside>

                {/* ── CHAT PANEL (read-only) ── */}
                <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FFFFFF' }}>

                    {/* Read-only notice banner */}
                    <div style={{
                        padding: '10px 60px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A',
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <span style={{ fontSize: 14 }}>📋</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#92400E', fontFamily: 'var(--font-body)' }}>
                            You are viewing a read-only transcript of <strong>{candidateName}&apos;s</strong> interview session.
                        </span>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '40px 60px', display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {messages.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, fontFamily: 'var(--font-body)', marginTop: 60 }}>
                                No interview transcript available.
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div
                                    key={msg.id}
                                    style={{
                                        display: 'flex',
                                        flexDirection: msg.role === 'candidate' ? 'row-reverse' : 'row',
                                        gap: 16, alignItems: 'flex-start',
                                        opacity: 0,
                                        animation: `fadeSlideIn 0.35s ease forwards`,
                                        animationDelay: `${idx * 40}ms`,
                                    }}
                                >
                                    {msg.role === 'inquisitor' && (
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 8, background: '#2563EB',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
                                            </svg>
                                        </div>
                                    )}

                                    <div style={{ maxWidth: '75%' }}>
                                        <div style={{
                                            padding: '16px 20px', borderRadius: 20,
                                            background: msg.role === 'candidate' ? '#F3F4F6' : '#FFFFFF',
                                            color: '#0A0C12',
                                            border: msg.role === 'candidate' ? '1.5px solid #E5E7EB' : '1.5px solid #2563EB20',
                                            fontSize: 15, lineHeight: 1.6, fontFamily: 'var(--font-body)',
                                            boxShadow: msg.role === 'inquisitor' ? '0 4px 20px rgba(37,99,235,0.03)' : 'none',
                                        }}>
                                            {msg.content}
                                        </div>
                                        <div style={{
                                            fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginTop: 8,
                                            textAlign: msg.role === 'candidate' ? 'right' : 'left',
                                            fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.4px',
                                        }}>
                                            {msg.role === 'candidate' ? candidateName : 'The Inquisitor'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer — no input */}
                    <div style={{
                        padding: '20px 60px 32px',
                        borderTop: '1px solid #E5E7EB',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                            <rect x="3" y="11" width="18" height="11" rx="2" stroke="#9CA3AF" strokeWidth="2.5" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>
                            This is a read-only view — responses cannot be modified
                        </span>
                    </div>
                </main>
            </div>

            <style>{`
            @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
            }
            `}    
            </style>
        </div>
    );
}