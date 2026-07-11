'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileArchive, Download, BookOpen, HelpCircle, List } from 'lucide-react';
import { clsx } from 'clsx';

const NAV = [
  { href: '/',          label: 'Home',      icon: FileArchive },
  { href: '/download',  label: 'Download',  icon: Download },
  { href: '/tutorial',  label: 'Tutorial',  icon: BookOpen },
  { href: '/changelog', label: 'Changelog', icon: List },
  { href: '/faq',       label: 'FAQ',       icon: HelpCircle },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center justify-between px-8 py-4 border-b border-white/5 glass">
        <Link href="/" className="flex items-center gap-2 font-black text-lg">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#00d4aa] to-[#4a9eff]">
            <FileArchive className="w-4 h-4 text-white" />
          </span>
          <span className="text-gradient">ZArchiver Pro</span>
        </Link>
        <div className="flex items-center gap-1">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                path === href
                  ? 'bg-white/10 text-white'
                  : 'text-[#8888bb] hover:text-white hover:bg-white/5'
              )}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/download"
            className="ml-4 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#00d4aa,#4a9eff)' }}
          >
            Download APK
          </Link>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/5 glass">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex-1 flex flex-col items-center gap-0.5 py-2 text-[9px] font-medium transition-all',
                active ? 'text-[#00d4aa]' : 'text-[#555577]'
              )}
            >
              <Icon className={clsx('w-5 h-5', active && 'drop-shadow-[0_0_6px_#00d4aa]')} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Spacer desktop */}
      <div className="hidden md:block h-[65px]" />
    </>
  );
}
