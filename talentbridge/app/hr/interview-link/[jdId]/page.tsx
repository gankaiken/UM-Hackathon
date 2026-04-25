// app/hr/interview-link/[jdId]/page.tsx
// Redirect page — HR shares this link with candidates.
// When a candidate opens this link, it creates a fresh session automatically.

'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function InterviewLinkPage() {
  const params = useParams();
  const router = useRouter();
  const jdId = params.jdId as string;
  const [status, setStatus] = useState('Redirecting to the application flow...');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace(`/jobs/${jdId}/apply`);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [jdId, router]);

  return (
    <div className="warm-canvas min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div style={{
          width: 40, height: 40, margin: '0 auto 20px',
          borderRadius: '50%',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #22c55e',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#717171', fontSize: 15 }}>{status}</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
