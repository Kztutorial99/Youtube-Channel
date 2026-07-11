import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ZArchiver Pro — Download APK Mod Terbaik',
  description: 'Download ZArchiver Pro APK terbaru. Gratis, aman, dan selalu update. Tutorial lengkap tersedia.',
  keywords: ['ZArchiver Pro', 'APK Mod', 'ZArchiver Mod', 'Download APK', 'ZArchiver Tutorial'],
  openGraph: {
    title: 'ZArchiver Pro — Download APK Mod Terbaik',
    description: 'Download ZArchiver Pro APK terbaru. Gratis, aman, dan selalu update.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>

        {/* Background orbs */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#00d4aa]/6 blur-[120px]" />
          <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-[#4a9eff]/6 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-[#a855f7]/4 blur-[100px]" />
        </div>
      </body>
    </html>
  );
}
