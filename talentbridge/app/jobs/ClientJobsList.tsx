'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building, MapPin, Briefcase, Search } from 'lucide-react';
import type { JdCache } from '@/lib/db/schema';

type JobListItem = Pick<JdCache, 'id' | 'roleTitle' | 'employerId' | 'mapperOutput' | 'rawJd'> & {
  employerReputationWarning?: boolean;
};

export default function ClientJobsList({ jobs }: { jobs: JobListItem[] }) {
  const [search, setSearch] = useState('');
  const router = useRouter();

  const filteredJobs = jobs.filter(job => {
    if (!search) return true;
    const s = search.toLowerCase();
    const title = (job.roleTitle || '').toLowerCase();
    const company = (job.employerId || '').toLowerCase();
    
    // safe parse skills
    let skillsString = '';
    try {
      const mapper = JSON.parse(job.mapperOutput);
      skillsString = (mapper.core_dimensions || []).join(' ').toLowerCase();
    } catch { }

    return title.includes(s) || company.includes(s) || skillsString.includes(s);
  });

  return (
    <>
      {/* Search bar */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 48,
        background: '#FFFFFF', borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1.5px solid #E5E7EB', padding: '8px 8px 8px 20px',
        alignItems: 'center',
      }}>
        <Search size={18} style={{ color: '#9CA3AF', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search by role, skill, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClick={() => {
            if (!search) {
              // Just a subtle hint if they click it the first time
            }
          }}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 15,
            background: 'transparent',
            color: '#0A0C12',
            height: '40px',
            padding: '0',
            boxShadow: 'none',
          }}
        />
        <button
          className="btn-primary"
          onClick={() => {
            if (!search) alert('Advanced AI Semantic Search module is booting up... For now, type to instantly filter the list below!');
          }}
          style={{ height: 40, padding: '0 24px', fontSize: 14, borderRadius: 10, flexShrink: 0 }}
        >
          Search
        </button>
      </div>

      {/* Jobs list */}
      {filteredJobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24,
            background: 'rgba(37,99,235,0.08)',
            border: '1.5px solid rgba(37,99,235,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: 32,
          }}>
            <Briefcase size={32} color="#2563EB" />
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
            color: '#0A0C12', marginBottom: 10,
          }}>
            {search ? 'No roles match your search' : 'No open roles yet'}
          </h2>
          <p style={{ fontSize: 15, color: '#6B7280', fontFamily: 'var(--font-body)', marginBottom: 28 }}>
            Try refining your keywords, or check back later.
          </p>
          {search ? (
            <button className="btn-neutral" onClick={() => setSearch('')} style={{ padding: '0 28px' }}>
              Clear Search
            </button>
          ) : (
            <Link href="/" className="btn-primary" style={{ padding: '0 28px' }}>
              Back to Home →
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredJobs.map((job) => {
            let skills: string[] = [];
            try {
              const mapper = JSON.parse(job.mapperOutput);
              skills = mapper.core_dimensions || [];
            } catch {
              // ignore
            }

            return (
              <div
                key={job.id}
                className="job-card"
                onClick={() => router.push(`/jobs/${job.id}/apply`)}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #E5E7EB',
                  borderRadius: 20,
                  padding: '28px 32px',
                  cursor: 'pointer',
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      marginBottom: 10,
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                        border: '1px solid #BFDBFE',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, flexShrink: 0,
                      }}>
                        <Building size={16} color="#2563EB" />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', fontFamily: 'var(--font-body)' }}>
                        {job.employerId === 'default' ? 'Nexus Digital Sdn Bhd' : job.employerId}
                      </span>
                      {job.employerReputationWarning && (
                        <span
                          title="This employer has a low recent response rate on completed verdict cards."
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#B45309',
                            background: '#FFFBEB',
                            border: '1px solid #FDE68A',
                            borderRadius: 999,
                            padding: '3px 8px',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          Low Response Rate
                        </span>
                      )}
                    </div>

                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 20, fontWeight: 700,
                      color: '#0A0C12', letterSpacing: '-0.4px',
                      marginBottom: 8,
                    }}>
                      {job.roleTitle || 'Untitled Role'}
                    </h3>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> Kuala Lumpur</span>
                      <span style={{ color: '#D1D5DB' }}>·</span>
                      <span>Full Time</span>
                      <span style={{ color: '#D1D5DB' }}>·</span>
                      <span>Remote / Hybrid</span>
                    </div>
                  </div>

                  <Link
                    href={`/jobs/${job.id}/apply`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn-accent"
                    style={{ flexShrink: 0, padding: '0 24px', height: 44, fontSize: 14 }}
                  >
                    Apply with AI
                    <svg style={{ marginLeft: 4 }} width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>

                {/* Skills */}
                {skills.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    {skills.slice(0, 4).map((s) => (
                      <span key={s} style={{
                        background: 'rgba(37,99,235,0.08)',
                        color: '#2563EB',
                        padding: '4px 12px', borderRadius: 20,
                        fontSize: 12, fontWeight: 600,
                        fontFamily: 'var(--font-body)',
                      }}>
                        {s}
                      </span>
                    ))}
                    {skills.length > 4 && (
                      <span style={{ padding: '4px 8px', fontSize: 12, color: '#9CA3AF' }}>
                        +{skills.length - 4} more competencies
                      </span>
                    )}
                  </div>
                 )}

                {/* JD preview */}
                <p style={{
                  fontSize: 14, color: '#6B7280', lineHeight: 1.65,
                  fontFamily: 'var(--font-body)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  borderTop: '1px solid #F3F4F6',
                  paddingTop: 14,
                  marginTop: 4,
                }}>
                  {job.rawJd}
                </p>

                {/* Footer row */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 16 }}>
                  <span style={{
                    display: 'inline-flex', gap: 5, alignItems: 'center',
                    fontSize: 12, fontWeight: 600, color: '#059669',
                    background: 'rgba(16,185,129,0.08)', padding: '3px 10px', borderRadius: 5,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                    AI Interview Ready
                  </span>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>• 4-minute structured assessment</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
