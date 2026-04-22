import type { Metadata } from 'next';
import './globals.css';
import GlobalNav from '@/components/GlobalNav';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'TalentBridge AI — Authentic Talent Verification Platform',
  description: "Malaysia's first AI recruitment platform where no one gets ghosted, every shortlisting decision is explainable, and every \"No\" comes with a \"Here's how.\"",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%232563EB'/><path d='M17 5L7 17h9l-1 10 10-12h-9l1-10z' fill='white'/></svg>",
        type: 'image/svg+xml',
      }
    ],
    shortcut: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%232563EB'/><path d='M17 5L7 17h9l-1 10 10-12h-9l1-10z' fill='white'/></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/*
          GlobalNav is a client component that self-suppresses on:
          - /hr routes (HR has its own sidebar via hr/layout.tsx)
          - /interview (fullscreen)
          - /result (fullscreen)
          - application/apply routes (fullscreen form)
        */}
        <GlobalNav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
