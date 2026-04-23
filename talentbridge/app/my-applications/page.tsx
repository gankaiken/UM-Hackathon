'use client';

import Link from 'next/link';

export default function MyApplicationsPage() {
  const applications = [
    {
      id: 'app-1',
      role: 'Junior Marketing Executive',
      company: 'Acme Corp',
      appliedAt: '2 days ago',
      status: 'Under HR Review',
      statusColor: '#F59E0B',
      statusBg: '#FFFBEB',
      resultLink: '/result/seed-session-aisyah',
      icon: '📊',
    },
    {
      id: 'app-2',
      role: 'Frontend Developer',
      company: 'TechFlow Solutions',
      appliedAt: '1 week ago',
      status: 'Demo-Scheduled Preview',
      statusColor: '#10B981',
      statusBg: '#ECFDF5',
      resultLink: null,
      icon: '💻',
      interviewDetails: {
        time: 'Tomorrow, 10:00 AM',
        link: 'https://zoom.us/j/123456789',
      }
    },
    {
      id: 'app-3',
      role: 'Customer Support Lead',
      company: 'Nexus Connect',
      appliedAt: '2 weeks ago',
      status: 'Career Redirected',
      statusColor: '#64748B',
      statusBg: '#F1F5F9',
      resultLink: '/result/seed-session-siti',
      icon: '🎧',
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', marginBottom: 8 }}>
            My Applications
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#64748B' }}>
            Track your TalentBridge interviews, view feedback, and manage upcoming schedules.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '40px auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
        
        {/* Left Column: Applications List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {applications.map((app) => (
            <div key={app.id} style={{ 
              background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, padding: 24,
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'all 0.2s ease'
            }} className="fade-in">
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ 
                  width: 56, height: 56, borderRadius: 16, background: '#F1F5F9', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 
                }}>
                  {app.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
                      {app.role}
                    </h2>
                    <div style={{ 
                      background: app.statusBg, color: app.statusColor, padding: '6px 12px', 
                      borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' 
                    }}>
                      {app.status}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#64748B', marginBottom: 20 }}>
                    {app.company} • Applied {app.appliedAt}
                  </div>

                  {app.interviewDetails ? (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Upcoming Interview</div>
                        <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 600 }}>{app.interviewDetails.time}</div>
                      </div>
                      <a href={app.interviewDetails.link} target="_blank" rel="noreferrer" style={{ 
                        background: '#2563EB', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, 
                        fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6
                      }}>
                        Join Zoom
                      </a>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 12 }}>
                      {app.resultLink ? (
                        <Link href={app.resultLink} style={{ 
                          background: '#F1F5F9', color: '#334155', padding: '8px 16px', borderRadius: 8, 
                          fontSize: 13, fontWeight: 600, textDecoration: 'none' 
                        }}>
                          View Feedback Report
                        </Link>
                      ) : (
                        <button disabled style={{ 
                          background: '#F8FAFC', color: '#94A3B8', padding: '8px 16px', borderRadius: 8, 
                          fontSize: 13, fontWeight: 600, border: 'none' 
                        }}>
                          Result Pending
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Integration Agent Notice */}
        <div>
          <div style={{ 
            background: 'linear-gradient(135deg, #0A0C12 0%, #1E293B 100%)', 
            borderRadius: 20, padding: 24, color: '#FFFFFF', position: 'relative', overflow: 'hidden' 
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, fontSize: 100, opacity: 0.05 }}>🤖</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, letterSpacing: '1px', color: '#94A3B8' }}>
                AI AGENT ACTIVE
              </div>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
              Scheduling Preview
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#94A3B8', lineHeight: 1.6, marginBottom: 20 }}>
              This panel previews how the <strong>Integration Coordinator Agent</strong> could streamline employer follow-up and interview scheduling in a fuller production build.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>Workflow Demo</div>
              <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>Calendar Preview</div>
              <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>Meeting Link Preview</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
