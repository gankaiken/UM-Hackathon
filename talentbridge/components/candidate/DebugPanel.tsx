'use client';
import { useState } from 'react';

interface DebugPanelProps {
  coverageMap: Record<string, string>;
  reasoning: string;
}

export default function DebugPanel({ coverageMap, reasoning }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: 24,
      zIndex: 9999,
      width: isOpen ? 380 : 48,
      height: isOpen ? 480 : 48,
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: isOpen ? 16 : 24,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      color: '#F8FAFC',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      fontFamily: 'var(--font-mono)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isOpen ? 'space-between' : 'center',
          padding: isOpen ? '0 16px' : 0,
          background: 'transparent',
          border: 'none',
          color: '#38BDF8',
          cursor: 'pointer',
          borderBottom: isOpen ? '1px solid rgba(255,255,255,0.1)' : 'none',
          flexShrink: 0,
        }}
      >
        {isOpen ? (
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '1px' }}>🛠️ STRATEGIST STATE</span>
        ) : (
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {isOpen && (
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {isOpen && (
        <div style={{ padding: 16, overflowY: 'auto', flex: 1, fontSize: 12 }}>
          
          {/* Reasoning Section */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#94A3B8', fontWeight: 700, marginBottom: 8, letterSpacing: '1px' }}>
              REASONING LOG:
            </div>
            <div style={{ 
              background: 'rgba(0,0,0,0.3)', 
              padding: 12, 
              borderRadius: 8, 
              color: '#34D399',
              lineHeight: 1.5,
              wordWrap: 'break-word'
            }}>
              {reasoning || 'Waiting for first turn...'}
            </div>
          </div>

          {/* Coverage Map Section */}
          <div>
            <div style={{ color: '#94A3B8', fontWeight: 700, marginBottom: 8, letterSpacing: '1px' }}>
              COVERAGE MAP:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(coverageMap || {}).map(([dim, state]) => {
                const color = 
                  state === 'SUFFICIENT' ? '#34D399' : // green
                  state === 'DEVELOPING' ? '#FBBF24' : // yellow
                  state === 'TOUCHED'    ? '#60A5FA' : // blue
                                           '#475569';  // gray
                
                return (
                  <div key={dim} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '8px 10px',
                    borderRadius: 6,
                    alignItems: 'center'
                  }}>
                    <div style={{ 
                      maxWidth: 200, 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      opacity: 0.9
                    }} title={dim}>
                      {dim}
                    </div>
                    <div style={{ 
                      color, 
                      fontSize: 10, 
                      fontWeight: 700,
                      background: `${color}20`,
                      padding: '2px 6px',
                      borderRadius: 4
                    }}>
                      {state}
                    </div>
                  </div>
                );
              })}
              {Object.keys(coverageMap || {}).length === 0 && (
                <div style={{ color: '#475569', fontStyle: 'italic' }}>Map initializing...</div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
