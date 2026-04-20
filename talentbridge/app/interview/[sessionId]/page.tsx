'use client';
// app/interview/[sessionId]/page.tsx
// Candidate-facing AI interview — professional dual-pane layout
// Left: role + timeline | Right: conversational chat

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SentinelTracker from '@/components/candidate/SentinelTracker';
import { useSentinelStore } from '@/store/sentinelStore';
import type { TranscriptEntry } from '@/lib/types';

type ChatState = 'loading' | 'entry' | 'chatting' | 'closing' | 'verdict_pending' | 'done';
interface Message {
  id: string;
  role: 'inquisitor' | 'candidate';
  content: string;
  isStreaming?: boolean;
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
  const [nameInput, setNameInput] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [turnCount, setTurnCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { data: sentinelData } = useSentinelStore();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch(`/api/session/${sessionId}`);
        if (!res.ok) { setState('entry'); return; }
        const sessionData = await res.json();
        setCandidateName(sessionData.candidateName);
        setRoleTitle(sessionData.mapperResult?.role_title ?? 'this role');
        setTurnCount(sessionData.turnCount);
        if (sessionData.status === 'completed') { router.push(`/result/${sessionId}`); return; }
        if (sessionData.candidateName && sessionData.transcript.length > 0) {
          const restored: Message[] = sessionData.transcript.map((t: TranscriptEntry) => ({
            id: `${t.role}-${t.turnNumber}`, role: t.role, content: t.content,
          }));
          setMessages(restored);
          setState('chatting');
        } else if (sessionData.candidateName) {
          setState('chatting');
          sendFirstQuestion(sessionData.candidateName, sessionData.mapperResult?.role_title);
        } else {
          setState('entry');
        }
      } catch { setState('entry'); }
    }
    loadSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function sendFirstQuestion(name: string, role: string) {
    setIsWaiting(true);
    await sendMessage('__INTERVIEW_START__', name, role);
    setIsWaiting(false);
  }

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameInput.trim()) return;
    const name = nameInput.trim();
    setCandidateName(name);
    setState('chatting');
    try {
      const sessionRes = await fetch(`/api/session/${sessionId}`);
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setRoleTitle(sessionData.mapperResult?.role_title ?? 'this role');
        await sendFirstQuestion(name, sessionData.mapperResult?.role_title ?? '');
      }
    } catch (err) { console.error('Failed to start session:', err); }
  }

  async function handleSend() {
    const text = inputValue.trim();
    if (!text || isWaiting) return;
    setInputValue('');
    const candidateMsg: Message = { id: `candidate-${Date.now()}`, role: 'candidate', content: text };
    setMessages(prev => [...prev, candidateMsg]);
    setIsWaiting(true);
    await sendMessage(text, candidateName, roleTitle);
    setIsWaiting(false);
  }

  async function sendMessage(message: string, name: string, _role: string) {
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
      const aiMsgId = `ai-${Date.now()}`;
      setMessages(prev => [...prev, { id: aiMsgId, role: 'inquisitor', content: '', isStreaming: true }]);
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
          const dataMatch = line.match(/\ndata: (.+)/s);
          if (!eventMatch || !dataMatch) continue;
          const event = eventMatch[1];
          let data: unknown;
          try { data = JSON.parse(dataMatch[1]); } catch { continue; }
          if (event === 'chunk') {
            const chunk = (data as { text: string }).text;
            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: m.content + chunk } : m));
          }
          if (event === 'done') {
            const doneData = data as { closing: boolean; turnCount: number };
            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isStreaming: false } : m));
            setTurnCount(doneData.turnCount);
            if (doneData.closing) { setState('closing'); setTimeout(triggerVerdict, 1500); }
          }
        }
      }
      inputRef.current?.focus();
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'inquisitor', content: 'Something went wrong. Please try again.' }]);
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
          setTimeout(() => router.push(`/result/${sessionId}`), 1500);
        }
      }, 2000);
    } catch { setState('done'); }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // ── Active step ──────────────────────────────────────────────────────────────
  const activeStepIdx = state === 'entry' ? 0 :
    state === 'chatting' ? 2 :
    state === 'verdict_pending' ? 3 :
    state === 'done' ? 4 : 2;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div className="spinner" style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTop: '3px solid var(--purple)' }} />
      </div>
    );
  }

  // ── Verdict Pending ──────────────────────────────────────────────────────────
  if (state === 'verdict_pending' || state === 'done') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div className="spinner" style={{ width: 52, height: 52, border: '4px solid var(--border)', borderTop: '4px solid var(--purple)', margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 400, color: 'var(--navy)', marginBottom: 8, letterSpacing: -0.3 }}>
            Reviewing your answers...
          </h2>
          <p style={{ color: 'var(--slate)', fontSize: 15 }}>The Auditor is processing your session. This takes less than a minute.</p>
        </div>
      </div>
    );
  }

  // ── Name Entry ───────────────────────────────────────────────────────────────
  if (state === 'entry') {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 440, width: '100%' }} className="fade-in">
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: 'var(--purple)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
          }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 400, color: 'var(--navy)', letterSpacing: -0.4, marginBottom: 8 }}>
            Welcome to TalentBridge
          </h1>
          <p style={{ color: 'var(--slate)', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            This is a conversational interview about your real experience.
            There are no trick questions — just share your story naturally.
          </p>
          <form onSubmit={handleNameSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--slate-dark)', marginBottom: 8 }}>
                What&apos;s your name?
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="E.g. Aisyah, Raj, Wei Ming..."
                autoFocus
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                  fontSize: 15, color: 'var(--navy)', outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  fontFamily: 'inherit',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--purple)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(83,58,253,0.08)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!nameInput.trim()}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, opacity: nameInput.trim() ? 1 : 0.5 }}
            >
              Begin Interview →
            </button>
          </form>
          <p style={{ textAlign: 'center', color: 'var(--slate)', fontSize: 12, marginTop: 24 }}>
            🔒 Your conversation is private and used only for this application.
          </p>
        </div>
      </div>
    );
  }

  // ── Main Chat Layout ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <SentinelTracker />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', maxHeight: 'calc(100vh - 60px)' }}>

        {/* ── Left Panel: Role + Timeline ────────────────────────────── */}
        <div style={{
          width: 280, flexShrink: 0,
          borderRight: '1px solid var(--border)',
          padding: 24,
          display: 'flex', flexDirection: 'column', gap: 24,
          overflowY: 'auto',
          background: 'var(--bg-subtle)',
        }}>
          {/* Active Role */}
          <div>
            <p className="section-label" style={{ marginBottom: 12 }}>Active Role</p>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)', lineHeight: 1.3, marginBottom: 6 }}>
                {roleTitle}
              </div>
              <div style={{ fontSize: 12, color: 'var(--slate)' }}>
                AI Interview · Live session
              </div>
              <div style={{ marginTop: 10 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 11, color: 'var(--green-text)',
                  background: 'rgba(21,190,83,0.1)', border: '1px solid rgba(21,190,83,0.25)',
                  borderRadius: 4, padding: '2px 8px',
                }}>
                  <span className="pulse-dot" style={{ width: 5, height: 5 }} />
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* Candidate */}
          <div>
            <p className="section-label" style={{ marginBottom: 12 }}>Candidate</p>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--purple-soft)',
                  border: '1.5px solid var(--purple-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600, color: 'var(--purple)',
                  flexShrink: 0,
                }}>
                  {candidateName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--navy)' }}>{candidateName}</div>
                  <div style={{ fontSize: 11, color: 'var(--slate)' }}>In interview</div>
                </div>
              </div>
              {/* Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {TIMELINE_STEPS.map((step, i) => (
                  <div key={step.id} className="timeline-step" style={{ color: i < activeStepIdx ? 'var(--green-text)' : i === activeStepIdx ? 'var(--navy)' : 'var(--slate)' }}>
                    <div className={`timeline-dot ${i < activeStepIdx ? 'timeline-dot-done' : i === activeStepIdx ? 'timeline-dot-active' : 'timeline-dot-pending'}`} />
                    <span style={{ fontSize: 12 }}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Agent info */}
          <div>
            <p className="section-label" style={{ marginBottom: 12 }}>Current Agent</p>
            <div className="card-sm">
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--navy)', marginBottom: 4 }}>
                The Inquisitor
              </div>
              <div style={{ fontSize: 11, color: 'var(--slate)', lineHeight: 1.5 }}>
                conversational, non-evaluative
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--slate)', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: 3, border: '1px solid var(--border)' }}>
                  inquisitor_v2
                </span>
              </div>
            </div>
          </div>

          {/* Turn counter */}
          {turnCount > 0 && (
            <div style={{ textAlign: 'center', padding: '10px', background: 'var(--purple-soft)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--purple-light)' }}>
              <div style={{ fontSize: 20, fontWeight: 300, color: 'var(--purple)', letterSpacing: -0.5 }}>
                {Math.ceil(turnCount / 2)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--purple)', opacity: 0.7 }}>questions asked</div>
            </div>
          )}
        </div>

        {/* ── Right Panel: Chat ──────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Chat header */}
          <div style={{
            padding: '14px 24px',
            borderBottom: '1px solid var(--border)',
            background: '#fff',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--purple)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--navy)' }}>The Inquisitor</div>
              <div style={{ fontSize: 12, color: isWaiting ? 'var(--purple)' : 'var(--green-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: isWaiting ? 'var(--purple)' : 'var(--green)', display: 'inline-block' }} />
                {isWaiting ? 'Thinking...' : 'Online'}
              </div>
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--slate)', background: 'var(--bg-subtle)', padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border)' }}>
              BM / EN / Manglish
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.length === 0 && !isWaiting && (
              <div style={{ textAlign: 'center', color: 'var(--slate)', marginTop: 40, fontSize: 14 }}>
                Starting your interview...
              </div>
            )}

            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'candidate' ? 'flex-end' : 'flex-start',
                }}
              >
                {msg.role === 'inquisitor' && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--purple)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 2,
                    }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white"/>
                      </svg>
                    </div>
                    <div>
                      <div className="bubble-ai">
                        {msg.content || (msg.isStreaming ? '' : '')}
                        {msg.isStreaming && (
                          <span style={{
                            display: 'inline-block', width: 2, height: 14,
                            background: 'var(--purple)', marginLeft: 2, verticalAlign: 'middle',
                            animation: 'cursor-blink 0.8s infinite',
                          }} />
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--slate)', marginTop: 4, marginLeft: 2 }}>
                        The Inquisitor · now
                      </div>
                    </div>
                  </div>
                )}

                {msg.role === 'candidate' && (
                  <div>
                    <div className="bubble-candidate">{msg.content}</div>
                    <div style={{ fontSize: 11, color: 'var(--slate)', marginTop: 4, textAlign: 'right' }}>
                      {candidateName} · now
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isWaiting && messages[messages.length - 1]?.role !== 'inquisitor' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--purple)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white"/>
                  </svg>
                </div>
                <div className="bubble-ai" style={{ display: 'flex', gap: 5, padding: '12px 16px' }}>
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Zone */}
          {state === 'chatting' && (
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              background: '#fff',
            }}>
              <div style={{
                display: 'flex', gap: 12, alignItems: 'flex-end',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '10px 14px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
                onFocusCapture={e => {
                  const parent = (e.target as HTMLElement).closest('div') as HTMLElement;
                  if (parent) { parent.style.borderColor = 'var(--purple)'; parent.style.boxShadow = '0 0 0 3px rgba(83,58,253,0.08)'; }
                }}
                onBlurCapture={e => {
                  const parent = (e.target as HTMLElement).closest('div') as HTMLElement;
                  if (parent) { parent.style.borderColor = 'var(--border)'; parent.style.boxShadow = 'var(--shadow-sm)'; }
                }}
              >
                <textarea
                  ref={inputRef}
                  id="answer-input"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your answer... (Enter to send)"
                  disabled={isWaiting}
                  rows={1}
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    resize: 'none', background: 'transparent',
                    fontSize: 15, color: 'var(--navy)',
                    lineHeight: 1.5, minHeight: 24, maxHeight: 120,
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isWaiting}
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: inputValue.trim() && !isWaiting ? 'var(--purple)' : 'var(--border)',
                    border: 'none',
                    cursor: inputValue.trim() && !isWaiting ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'background 0.15s',
                  }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--slate)', textAlign: 'center', marginTop: 8 }}>
                Press Enter to send · Shift+Enter for new line
              </div>
            </div>
          )}

          {state === 'closing' && (
            <div style={{
              padding: '14px 24px', borderTop: '1px solid var(--border)',
              textAlign: 'center', color: 'var(--slate)', fontSize: 14, background: '#fff',
            }}>
              Interview complete. Generating your verdict...
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
