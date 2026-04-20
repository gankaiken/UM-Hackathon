import { db } from '@/lib/db';
import { jdCache } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ApplyForm from './client-form';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function JobApplyPage({ params }: { params: { id: string } }) {
  const jdId = params.id;
  const job = await db.select().from(jdCache).where(eq(jdCache.id, jdId)).get();

  if (!job) {
    notFound();
  }

  const employerName = job.employerId === 'default' ? 'Nexus Digital Sdn Bhd' : job.employerId;

  return (
    <div className="fade-in" style={{ 
      minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', background: 'var(--bg-subtle)'
    }}>
      
      <div style={{ maxWidth: 480, width: '100%' }}>
        <Link href="/jobs" style={{ 
          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, 
          color: 'var(--slate)', textDecoration: 'none', marginBottom: 24,
          transition: 'color 0.2s'
        }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Jobs
        </Link>

        <div className="card" style={{ padding: '32px 40px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ 
              width: 56, height: 56, background: 'var(--brand-dark)', color: '#fff',
              borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 600, margin: '0 auto 16px', letterSpacing: -1,
              boxShadow: 'var(--shadow-sm)'
            }}>
              {employerName.charAt(0)}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--navy)', marginBottom: 4, letterSpacing: -0.5 }}>
              Apply for {job.roleTitle || 'Role'}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--slate)' }}>
              at {employerName}
            </p>
          </div>

          <div style={{ 
            background: 'rgba(83,58,253,0.04)', border: '1px solid rgba(83,58,253,0.1)',
            borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 32,
            display: 'flex', gap: 12, alignItems: 'flex-start'
          }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--purple)', flexShrink: 0, marginTop: 2 }}>
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div style={{ fontSize: 13, color: 'var(--slate-dark)', lineHeight: 1.5 }}>
              This is a structured, 4-minute AI interview. You will chat via text. Your answers will be verified against competency dimensions.
            </div>
          </div>

          <ApplyForm jdId={job.id} roleTitle={job.roleTitle || 'Role'} employer={employerName} />
        </div>
      </div>
    </div>
  );
}
