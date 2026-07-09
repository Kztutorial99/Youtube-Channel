import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '@kz.tutorial — YouTube Dashboard',
  description: 'Real-time analytics & channel health monitor untuk @kz.tutorial',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: '@kz.tutorial YouTube Dashboard',
    description: 'Monitor statistik, issues, dan rekomendasi channel YouTube @kz.tutorial secara real-time.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a14',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#0a0a14] text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
