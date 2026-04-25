// app/jobs/[id]/apply/page.tsx — Premium Apply Portal v3.0
import { db } from '@/lib/db';
import { jdCache } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ApplyForm from './client-form';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function JobApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jdId } = await params;
  const job = await db.select().from(jdCache).where(eq(jdCache.id, jdId)).get();

  if (!job) {
    notFound();
  }

  const employerName = job.employerId === 'default' ? 'Nexus Digital Sdn Bhd' : job.employerId;

  return (
    <div className="fade-in" style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '60px 24px', background: 'linear-gradient(180deg, #F6F9FF 0%, #FFFFFF 100%)'
    }}>
      
      <div style={{ maxWidth: 520, width: '100%' }}>
        <Link href="/jobs" style={{ 
          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, 
          color: '#6B7280', textDecoration: 'none', marginBottom: 28,
          fontWeight: 600, fontFamily: 'var(--font-body)',
          transition: 'color 0.2s'
        }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Roles
        </Link>

        <div style={{ 
          background: '#FFFFFF', border: '1.5px solid #E5E7EB', 
          borderRadius: 24, padding: '48px', boxShadow: '0 20px 50px rgba(0,0,0,0.04)' 
        }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ 
              width: 64, height: 64, 
              background: 'linear-gradient(135deg, #2563EB, #0EA5E9)', 
              color: '#fff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, margin: '0 auto 20px', letterSpacing: -1,
              boxShadow: '0 8px 16px rgba(37,99,235,0.15)',
              fontFamily: 'var(--font-display)'
            }}>
              {employerName.charAt(0)}
            </div>
            <h1 style={{ 
              fontSize: 26, fontWeight: 800, color: '#0A0C12', marginBottom: 8, 
              letterSpacing: -0.8, fontFamily: 'var(--font-display)', lineHeight: 1.2
            }}>
              Apply for {job.roleTitle || 'Role'}
            </h1>
            <p style={{ fontSize: 15, color: '#6B7280', fontFamily: 'var(--font-body)' }}>
              at {employerName}
            </p>
          </div>

          <div style={{ 
            background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.1)',
            borderRadius: 16, padding: 20, marginBottom: 40,
            display: 'flex', gap: 14, alignItems: 'flex-start'
          }}>
            <div style={{ 
              width: 32, height: 32, borderRadius: 8, background: '#2563EB', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 
            }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8v4l3 3" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
              This is a structured, <strong>4-minute AI interview</strong>. Every candidate receives a response. No resume required.
            </div>
          </div>

          <ApplyForm jdId={job.id} roleTitle={job.roleTitle || 'Role'} employer={employerName} />
        </div>
      </div>
    </div>
  );
}
