// app/verdicts/layout.tsx — Unified Verdicts Layout v3.0
export default function VerdictsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#080A0F', color: '#F9FAFB' }}>
      <main style={{ minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
