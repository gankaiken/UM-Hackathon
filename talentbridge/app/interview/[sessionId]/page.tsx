'use client';
// app/interview/[sessionId]/page.tsx — Premium Interview Interface v3.0
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SentinelTracker from '@/components/candidate/SentinelTracker';
import DebugPanel from '@/components/candidate/DebugPanel';
import { useSentinelStore } from '@/store/sentinelStore';
import type { TranscriptEntry, SentinelData } from '@/lib/types';
import { buildMessageId, getCurrentTimestamp } from '@/lib/utils/runtime';

type ChatState = 'loading' | 'entry' | 'chatting' | 'closing' | 'verdict_pending' | 'done' | 'expired';
interface Message {
  id: string;
  role: 'inquisitor' | 'candidate';
  content: string;
  isStreaming?: boolean;
}

interface SessionPayload {
  candidateName: string;
  mapperResult?: { role_title?: string };
  turnCount: number;
  coverageMap?: Record<string, string>;
  sentinelData?: Partial<SentinelData>;
  transcript: Array<TranscriptEntry & { strategistJson?: { reasoning?: string } }>;
  sessionLifecycleStatus?: string | null;
  status: string;
}

const TIMELINE_STEPS = [
  { id: 'profile',   label: 'Profile submitted' },
  { id: 'mapper',    label: 'JD mapped (Mapper)' },
  { id: 'interview', label: 'Interview in progress' },
  { id: 'auditor',   label: 'Auditor scoring' },
  { id: 'verdict',   label: 'Verdict generated' },
];

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [state, setState] = useState<ChatState>('loading');
  const [candidateName, setCandidateName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [debugMap, setDebugMap] = useState<Record<string, string>>({});
  const [debugReasoning, setDebugReasoning] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const questionPresentedAtRef = useRef<number | null>(null);
  const {
    data: sentinelData,
    hydrate: hydrateSentinel,
    beginQuestionWindow,
    recordAnswerTiming,
  } = useSentinelStore();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  async function sendFirstQuestion(name: string, role: string) {
    setIsWaiting(true);
    await sendMessage('__INTERVIEW_START__', name, role);
    setIsWaiting(false);
  }

  async function handleSend() {
    const text = inputValue.trim();
    if (!text || isWaiting) return;

    const elapsedMs = questionPresentedAtRef.current !== null
      ? getCurrentTimestamp() - questionPresentedAtRef.current
      : 0;
    recordAnswerTiming(elapsedMs, text.length);
    questionPresentedAtRef.current = null;

    setInputValue('');
    const candidateMsg: Message = { id: buildMessageId('candidate'), role: 'candidate', content: text };
    setMessages(prev => [...prev, candidateMsg]);
    setIsWaiting(true);
    await sendMessage(text, candidateName, roleTitle);
    setIsWaiting(false);
  }

  async function sendMessage(message: string, name: string, _role: string, attempt = 1) {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message, sentinelData }),
        signal: abortRef.current.signal,
      });
      if (!res.ok || !res.body) throw new Error('Chat API error');
      
      const aiMsgId = buildMessageId('ai');
      setMessages(prev => {
        // Remove any previous error message if present
        const clean = prev.filter(m => !m.id.startsWith('err-'));
        return [...clean, { id: aiMsgId, role: 'inquisitor', content: '', isStreaming: true }];
      });
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('event:')) continue;
          const eventMatch = line.match(/^event: (\w+)/);
          const dataMatch = line.match(/\ndata: ([\s\S]+)/);
          if (!eventMatch || !dataMatch) continue;
          const event = eventMatch[1];
          let data: unknown;
          try { data = JSON.parse(dataMatch[1]); } catch { continue; }
          if (event === 'chunk') {
            const chunk = (data as { text: string }).text;
            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: m.content + chunk } : m));
          }
          if (event === 'done') {
            const doneData = data as { closing: boolean; turnCount: number; coverageMap?: Record<string, string>; reasoning?: string };
            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isStreaming: false } : m));
            setTurnCount(doneData.turnCount);
            if (doneData.coverageMap) setDebugMap(doneData.coverageMap);
            if (doneData.reasoning) setDebugReasoning(doneData.reasoning);
            if (doneData.closing) {
              setState('closing');
              questionPresentedAtRef.current = null;
              setTimeout(triggerVerdict, 1500);
            } else {
              questionPresentedAtRef.current = getCurrentTimestamp();
              beginQuestionWindow();
            }
          }
        }
      }
      inputRef.current?.focus();
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        if (attempt < 3) {
          setMessages(prev => {
            const clean = prev.filter(m => !m.id.startsWith('err-'));
            return [...clean, { id: buildMessageId('err'), role: 'inquisitor', content: `Connection slow. Reconnecting (attempt ${attempt}/3)...` }];
          });
          setTimeout(() => sendMessage(message, name, _role, attempt + 1), 2500);
        } else {
          setMessages(prev => {
            const clean = prev.filter(m => !m.id.startsWith('err-'));
            return [...clean, { id: buildMessageId('err'), role: 'inquisitor', content: 'Network connection lost. Please refresh the page to resume.' }];
          });
          questionPresentedAtRef.current = getCurrentTimestamp();
        }
      }
    }
  }

  async function triggerVerdict() {
    setState('verdict_pending');
    try {
      await fetch(`/api/verdict/${sessionId}`, { method: 'POST' });
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const res = await fetch(`/api/verdict/${sessionId}`);
        const data = await res.json();
        if (data.ready || attempts > 30) {
          clearInterval(poll);
          setState('done');
          setTimeout(() => router.push(`/result/${sessionId}`), 1200);
        }
      }, 2000);
    } catch { setState('done'); }
  }

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch(`/api/session/${sessionId}`);
        if (!res.ok) { setState('entry'); return; }
        const sessionData = await res.json() as SessionPayload;
        const initialRoleTitle = sessionData.mapperResult?.role_title ?? 'this role';

        setCandidateName(sessionData.candidateName);
        setRoleTitle(initialRoleTitle);
        setTurnCount(sessionData.turnCount);
        setDebugMap(sessionData.coverageMap || {});
        hydrateSentinel(sessionData.sentinelData || {});
        if (sessionData.transcript?.length > 0) {
          const lastInq = sessionData.transcript.filter(t => t.role === 'inquisitor').pop();
          if (lastInq && lastInq.strategistJson?.reasoning) {
            setDebugReasoning(lastInq.strategistJson.reasoning);
          }
        }

        if (sessionData.status === 'completed') { router.push(`/result/${sessionId}`); return; }
        if (sessionData.sessionLifecycleStatus === 'expired') { setState('expired'); return; }
        if (sessionData.candidateName && sessionData.transcript.length > 0) {
          const restored: Message[] = sessionData.transcript.map((t: TranscriptEntry) => ({
            id: `${t.role}-${t.turnNumber}`, role: t.role, content: t.content,
          }));
          setMessages(restored);
          setState('chatting');
          questionPresentedAtRef.current = getCurrentTimestamp();
          beginQuestionWindow();
        } else if (sessionData.candidateName) {
          setState('chatting');
          sendFirstQuestion(sessionData.candidateName, initialRoleTitle);
        } else {
          setState('entry');
        }
      } catch {
        setState('entry');
      }
    }

    loadSession();
  }, [sessionId, router, hydrateSentinel, beginQuestionWindow]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // Active step index
  const activeStepIdx = state === 'entry' ? 0 : state === 'chatting' ? 2 : state === 'verdict_pending' ? 3 : state === 'done' ? 4 : 2;

  // ── Loading state ────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
        <div className="spinner" style={{ width: 32, height: 32, border: '3px solid #F1F5F9', borderTop: '3px solid #2563EB' }} />
      </div>
    );
  }

  // ── Verdict Pending / Done ───────────────────────────────────────────────
  if (state === 'verdict_pending' || state === 'done') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }} className="fade-in">
          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 32px' }}>
            <div className="spinner" style={{ position: 'absolute', inset: 0, border: '4px solid #F1F5F9', borderTop: '4px solid #2563EB' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>⚖️</div>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#0A0C12', marginBottom: 16, letterSpacing: '-0.8px' }}>
            Submission received.
          </h2>
          <p style={{ color: '#64748B', fontSize: 16, lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
            The <strong>Auditor Agent</strong> is currently scoring your session across all competency dimensions. This usually takes <br /> 20-30 seconds.
          </p>
        </div>
      </div>
    );
  }

  // ── Expired / Partial Profile ────────────────────────────────────────────
  if (state === 'expired') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 480, background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 24, padding: 40 }} className="fade-in">
          <div style={{ 
            width: 64, height: 64, borderRadius: 16, background: '#F1F5F9', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 24px', fontSize: 28 
          }}>
            📁
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>
            Partial Profile Saved
          </h2>
          <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.6, fontFamily: 'var(--font-body)', marginBottom: 24 }}>
            It looks like this interview has been inactive for over 7 days. We have safely saved your progress as a <strong>Partial Profile</strong> for the employer to review.
          </p>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '16px', borderRadius: 12, textAlign: 'left', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18 }}>✓</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46', marginBottom: 4 }}>No Action Needed</div>
              <div style={{ fontSize: 12, color: '#047857', lineHeight: 1.5 }}>
                Your existing responses have been successfully submitted. You may close this page.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Chat Interface ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', flexDirection: 'column' }}>
      <SentinelTracker />
      <DebugPanel coverageMap={debugMap} reasoning={debugReasoning} />
      
      {/* ── HEADER ── */}
      <header style={{ 
        height: 64, background: '#FFFFFF', borderBottom: '1.5px solid #E5E7EB', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ 
            width: 36, height: 36, background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0A0C12', fontFamily: 'var(--font-display)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              The Inquisitor
            </div>
            <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10B981' }} />
              Active Session
            </div>
          </div>
        </div>

        <div style={{ 
          background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)',
          borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 700, 
          color: '#2563EB', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' 
        }}>
          SENTINEL MONITORING ENABLED
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* ── LEFT PANEL: Status ── */}
        <aside style={{ 
          width: 300, borderRight: '1.5px solid #E5E7EB', background: '#FFFFFF',
          display: 'flex', flexDirection: 'column', gap: 28, padding: 24,
          overflowY: 'auto'
        }}>
          {/* Role section */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', marginBottom: 12, textTransform: 'uppercase' }}>
              Applying For
            </div>
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 16, padding: '16px' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0A0C12', fontFamily: 'var(--font-display)', lineHeight: 1.3, marginBottom: 4 }}>
                {roleTitle}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)' }}>Nexus Digital Sdn Bhd</div>
            </div>
          </div>

          {/* Progress Timeline */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', marginBottom: 16, textTransform: 'uppercase' }}>
              Interview Status
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {TIMELINE_STEPS.map((step, i) => {
                const isDone = i < activeStepIdx;
                const isActive = i === activeStepIdx;
                return (
                  <div key={step.id} style={{ display: 'flex', gap: 14, minHeight: 48 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ 
                        width: 20, height: 20, borderRadius: '50%',
                        background: isDone ? '#10B981' : isActive ? '#FFFFFF' : '#F1F5F9',
                        border: `2px solid ${isDone ? '#10B981' : isActive ? '#2563EB' : '#E5E7EB'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1
                      }}>
                        {isDone && <svg width="10" height="10" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB' }} />}
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div style={{ width: 2, flex: 1, background: isDone ? '#10B981' : '#E5E7EB', margin: '2px 0' }} />
                      )}
                    </div>
                    <div style={{ 
                      fontSize: 13, fontWeight: (isActive || isDone) ? 700 : 500,
                      color: isDone ? '#10B981' : isActive ? '#0A0C12' : '#9CA3AF',
                      fontFamily: 'var(--font-body)', paddingTop: 1
                    }}>
                      {step.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Turn Stats */}
          {turnCount > 0 && (
            <div style={{ 
              marginTop: 'auto', background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)',
              borderRadius: 16, padding: '16px', textAlign: 'center'
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', fontFamily: 'var(--font-display)', letterSpacing: '-1px' }}>
                {Math.ceil(turnCount / 2)}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Questions Asked
              </div>
            </div>
          )}
        </aside>

        {/* ── CHAT PANEL ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FFFFFF', position: 'relative' }}>
          
          {/* Message List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '40px 60px', display: 'flex', flexDirection: 'column', gap: 32 }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ 
                display: 'flex', 
                flexDirection: msg.role === 'candidate' ? 'row-reverse' : 'row',
                gap: 16,
                alignItems: 'flex-start'
              }}>
                {/* Agent Avatar */}
                {msg.role === 'inquisitor' && (
                  <div style={{ 
                    width: 32, height: 32, borderRadius: 8, background: '#2563EB', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white"/>
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
                    position: 'relative'
                  }}>
                    {msg.content}
                    {msg.isStreaming && (
                      <span style={{
                        display: 'inline-block', width: 2, height: 16,
                        background: '#2563EB', marginLeft: 4, verticalAlign: 'middle',
                        animation: 'cursor-blink 0.8s infinite',
                      }} />
                    )}
                  </div>
                  <div style={{ 
                    fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginTop: 8, 
                    textAlign: msg.role === 'candidate' ? 'right' : 'left',
                    fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.4px'
                  }}>
                    {msg.role === 'candidate' ? candidateName : 'The Inquisitor'} · JUST NOW
                  </div>
                </div>
              </div>
            ))}
            
            {/* Thinking indicator */}
            {isWaiting && messages[messages.length - 1]?.role !== 'inquisitor' && (
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white"/></svg>
                </div>
                <div style={{ display: 'flex', gap: 6, padding: '12px 20px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 20 }}>
                  <div className="typing-dot" />
                  <div className="typing-dot" style={{ animationDelay: '0.2s' }} />
                  <div className="typing-dot" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ 
            padding: '24px 60px 48px', 
            background: 'linear-gradient(180deg, transparent 0%, #FFFFFF 100%)',
            borderTop: '1px solid #E5E7EB'
          }}>
            {state === 'chatting' && (
              <div style={{ 
                position: 'relative',
                background: '#FFFFFF',
                border: '1.5px solid #2563EB40',
                borderRadius: 20,
                padding: '12px 16px',
                boxShadow: '0 10px 40px rgba(37,99,235,0.06)',
                display: 'flex', gap: 12, alignItems: 'flex-end',
                transition: 'all 0.2s ease'
              }} id="input-container">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Share your experience here... (Enter to send)"
                  disabled={isWaiting}
                  rows={1}
                  style={{
                    flex: 1, border: 'none', outline: 'none', resize: 'none', width: '100%',
                    fontSize: 16, lineHeight: 1.5, background: 'transparent',
                    fontFamily: 'var(--font-body)', color: '#0A0C12',
                    minHeight: 24, maxHeight: 120
                  }}
                  onFocus={() => {
                    const el = document.getElementById('input-container');
                    if (el) { el.style.borderColor = '#2563EB'; el.style.boxShadow = '0 10px 40px rgba(37,99,235,0.12)'; }
                  }}
                  onBlur={() => {
                    const el = document.getElementById('input-container');
                    if (el) { el.style.borderColor = '#2563EB40'; el.style.boxShadow = '0 10px 40px rgba(37,99,235,0.06)'; }
                  }}
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isWaiting}
                  style={{ 
                    width: 44, height: 44, borderRadius: 12, border: 'none',
                    background: inputValue.trim() && !isWaiting ? '#2563EB' : '#F1F5F9',
                    color: inputValue.trim() && !isWaiting ? '#FFFFFF' : '#94A3B8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: inputValue.trim() && !isWaiting ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    flexShrink: 0
                  }}
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
            {state === 'closing' && (
              <div style={{ textAlign: 'center', padding: '20px', borderRadius: 20, background: 'rgba(16,185,129,0.05)', color: '#059669', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                Session complete. Finalizing responses...
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, fontWeight: 600, color: '#94A3B8', fontFamily: 'var(--font-body)' }}>
              Interview is recorded for evaluation · Shift + Enter for new line
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .typing-dot { width: 6px; height: 6px; border-radius: 50%; background: #2563EB; animation: typing-bounce 1.2s infinite ease-in-out; }
        @keyframes typing-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      `}</style>
    </div>
  );
}
