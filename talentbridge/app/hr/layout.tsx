// app/hr/layout.tsx — Unified HR Workspace Layout v3.0
// No sidebar — uses unified GlobalNav for navigation.
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';

export default async function HRLayout({ children }: { children: React.ReactNode }) {
  // We'll keep the DB fetch for telemetry/stats if needed later, 
  // but now navigation is handled globally.
  
  return (
    <div style={{ minHeight: '100vh', background: '#080A0F', color: '#F9FAFB' }}>
      <main style={{ minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
