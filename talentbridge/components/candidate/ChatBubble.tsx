'use client';
// components/candidate/ChatBubble.tsx — Updated to use CSS design tokens

interface ChatBubbleProps {
  role: 'inquisitor' | 'candidate';
  content: string;
  isStreaming?: boolean;
}

export default function ChatBubble({ role, content, isStreaming }: ChatBubbleProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: role === 'candidate' ? 'flex-end' : 'flex-start',
      }}
    >
      <div className={role === 'candidate' ? 'bubble-candidate' : 'bubble-ai'}>
        {content}
        {isStreaming && (
          <span style={{
            display: 'inline-block',
            width: 2, height: 14,
            background: role === 'candidate' ? 'rgba(255,255,255,0.7)' : 'var(--purple)',
            marginLeft: 2,
            verticalAlign: 'middle',
            animation: 'cursor-blink 0.8s infinite',
          }} />
        )}
      </div>
      <style>{`@keyframes cursor-blink { 0%,100% { opacity:1; } 50% { opacity:0; } }`}</style>
    </div>
  );
}
