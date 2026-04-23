import { getCurrentHrUser } from '@/lib/hrAuth';
import { redirect } from 'next/navigation';

export default async function HRLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentHrUser();
  if (!user) redirect('/login?next=/hr');

  return (
    <div style={{ minHeight: '100vh', background: '#080A0F', color: '#F9FAFB' }}>
      <main style={{ minHeight: '100vh' }}>{children}</main>
    </div>
  );
}
