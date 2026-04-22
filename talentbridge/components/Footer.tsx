'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  const isHidden =
    pathname?.startsWith('/hr') ||
    pathname?.startsWith('/verdicts') ||
    pathname?.startsWith('/interview/') ||
    pathname?.startsWith('/result/') ||
    pathname?.includes('/apply');

  if (isHidden) return null;

  return (
    <footer style={{
      background: '#FFFFFF',
      borderTop: '1px solid #E5E7EB',
      padding: '48px 24px',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 32
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0A0C12', fontFamily: 'var(--font-display)', marginBottom: 16 }}>
            TalentBridge<span style={{ color: '#2563EB' }}>.ai</span>
          </div>
          <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
            The authentic talent verification platform.<br />
            Powered by the Agentic Workflow.
          </p>
        </div>
        
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0C12', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>Platform</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/jobs" style={{ color: '#64748B', fontSize: 14, textDecoration: 'none' }}>Job Search</Link>
            <Link href="/how-it-works" style={{ color: '#64748B', fontSize: 14, textDecoration: 'none' }}>How it Works</Link>
            <Link href="/hr" style={{ color: '#64748B', fontSize: 14, textDecoration: 'none' }}>Employer Site</Link>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0C12', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>Legal</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="#" style={{ color: '#64748B', fontSize: 14, textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="#" style={{ color: '#64748B', fontSize: 14, textDecoration: 'none' }}>Terms of Service</Link>
            <Link href="#" style={{ color: '#64748B', fontSize: 14, textDecoration: 'none' }}>Security</Link>
          </div>
        </div>
      </div>
      <div style={{
        maxWidth: 1200,
        margin: '48px auto 0',
        paddingTop: 24,
        borderTop: '1px solid #F1F5F9',
        color: '#94A3B8',
        fontSize: 13,
        textAlign: 'center',
        fontFamily: 'var(--font-body)'
      }}>
        © {new Date().getFullYear()} TalentBridge AI. Hackathon Demo.
      </div>
    </footer>
  );
}
