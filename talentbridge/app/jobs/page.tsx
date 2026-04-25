// app/jobs/page.tsx — Premium JobStreet-style Candidate Portal

import { db } from '@/lib/db';
import { jdCache } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function JobsPage() {
  const jobs = await db
    .select()
    .from(jdCache)
    .orderBy(desc(jdCache.createdAt))
    .all();

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }} className="fade-in">
      
      {/* Header */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1 className="display-lg" style={{ marginBottom: 12 }}>Open Roles</h1>
        <p style={{ color: 'var(--slate)', fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
          Apply with a 4-minute AI interview. No resume screens, no bias, just pure competency evaluation.
        </p>
      </div>

      {/* Filters/Search (Mock) */}
      <div style={{ 
        display: 'flex', gap: 12, marginBottom: 32, 
        padding: '16px', background: '#fff', borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate)' }}>
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search by role title..." 
            style={{ 
              width: '100%', padding: '10px 16px 10px 42px', 
              border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)',
              fontSize: 14, outline: 'none', background: '#f8fafc'
            }} 
            disabled
          />
        </div>
        <button className="btn-primary" style={{ padding: '0 24px' }}>Search</button>
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
          <h2 style={{ color: 'var(--navy)', fontSize: 20, fontWeight: 400, marginBottom: 8 }}>No open roles yet</h2>
          <p style={{ color: 'var(--slate)', fontSize: 14 }}>Check back later for new opportunities.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {jobs.map(job => {
            // Safe parse mapper output
            let skills: string[] = [];
            try {
              const mapper = JSON.parse(job.mapperOutput);
              skills = mapper.core_dimensions || [];
            } catch (e) {
              // ignore
            }

            return (
              <div 
                key={job.id} 
                className="card" 
                style={{ 
                  display: 'flex', flexDirection: 'column', gap: 16,
                  padding: 24, transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>
                      {job.roleTitle || 'Untitled Role'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--slate)' }}>
                      <span style={{ fontWeight: 500, color: 'var(--slate-dark)' }}>
                        {job.employerId === 'default' ? 'Nexus Digital Sdn Bhd' : job.employerId}
                      </span>
                      <span>•</span>
                      <span>Full Time</span>
                      <span>•</span>
                      <span>Remote / Hybrid</span>
                    </div>
                  </div>
                  <Link 
                    href={`/jobs/${job.id}/apply`} 
                    className="btn-primary"
                    style={{ padding: '10px 20px', fontSize: 14 }}
                  >
                    Apply with AI
                  </Link>
                </div>

                {/* Tags / Dimensions */}
                {skills.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    {skills.slice(0, 4).map(s => (
                      <span key={s} className="skill-tag">
                        {s}
                      </span>
                    ))}
                    {skills.length > 4 && (
                      <span className="skill-tag" style={{ background: 'transparent', border: 'none', color: 'var(--slate)' }}>
                        +{skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}
                
                <div style={{ 
                  fontSize: 14, color: 'var(--slate)', lineHeight: 1.6,
                  marginTop: 8, display: '-webkit-box', WebkitLineClamp: 2, 
                  WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                  {job.rawJd}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
