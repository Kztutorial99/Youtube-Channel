import Link from 'next/link';
import { Download, Shield, Zap, Archive, Lock, Star, ArrowRight, CheckCircle2, Smartphone } from 'lucide-react';

const FEATURES = [
  { icon: Archive, title: 'Full ZArchiver Pro', desc: 'Semua fitur Pro terbuka tanpa beli. Extract, compress, view — semua bisa.' },
  { icon: Shield, title: 'Aman & Bersih', desc: 'APK sudah di-sign ulang dengan MT Manager. Tidak ada malware atau iklan tersembunyi.' },
  { icon: Zap, title: 'Selalu Update', desc: 'Kami update setiap ada versi baru dari developer resmi. Tinggal download.' },
  { icon: Lock, title: 'No Root Needed', desc: 'Tidak perlu root. Install langsung dari APK seperti biasa.' },
  { icon: Star, title: 'Tutorial Lengkap', desc: 'Ada tutorial cara pakai, tips & trik dari channel @kz.tutorial.' },
  { icon: Smartphone, title: 'Android 5.0+', desc: 'Support Android 5.0 ke atas. Ringan dan stabil di semua HP.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen pb-24 md:pb-0">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 pt-16 pb-20 md:pt-28 md:pb-32 overflow-hidden">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#00d4aa]/30 bg-[#00d4aa]/10 text-[#00d4aa] text-[10px] font-bold mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse" />
          GRATIS · AMAN · TERPERCAYA
        </div>

        {/* Logo */}
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 glow-accent"
          style={{ background: 'linear-gradient(135deg,#00d4aa22,#4a9eff22)', border: '1px solid #00d4aa44' }}>
          <Archive className="w-10 h-10 text-[#00d4aa]" />
        </div>

        <h1 className="text-4xl md:text-6xl font-black mb-4">
          <span className="text-gradient">ZArchiver Pro</span>
          <br />
          <span className="text-white/90 text-3xl md:text-5xl">APK Mod Terbaik</span>
        </h1>

        <p className="text-[#8888bb] text-sm md:text-base max-w-md mb-8 leading-relaxed">
          Download ZArchiver Pro APK terbaru. Semua fitur premium terbuka, gratis, tanpa root, aman 100%.
          Update otomatis setiap ada versi baru.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/download"
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:scale-105 active:scale-95 glow-accent"
            style={{ background: 'linear-gradient(135deg,#00d4aa,#4a9eff)' }}
          >
            <Download className="w-4 h-4" />
            Download Sekarang
          </Link>
          <Link
            href="/tutorial"
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-[#8888bb] text-sm border border-white/10 hover:text-white hover:border-white/20 transition-all"
          >
            Cara Install <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-10 text-center">
          {[
            { label: 'Total Download', value: '10K+' },
            { label: 'Rating', value: '5.0 ⭐' },
            { label: 'Versi Terbaru', value: 'v1.0.0' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-lg font-black text-white">{s.value}</p>
              <p className="text-[9px] text-[#555577]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-16 max-w-4xl mx-auto">
        <h2 className="text-center text-2xl font-black text-white mb-2">Kenapa ZArchiver Pro?</h2>
        <p className="text-center text-[#8888bb] text-sm mb-8">Semua yang kamu butuhkan, gratis.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-2xl border border-white/5 p-4 hover:border-[#00d4aa]/20 transition-all group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 border border-white/10 group-hover:border-[#00d4aa]/30 transition-all"
                style={{ background: 'linear-gradient(135deg,#00d4aa15,#4a9eff15)' }}>
                <Icon className="w-4 h-4 text-[#00d4aa]" />
              </div>
              <p className="font-bold text-white text-sm mb-1">{title}</p>
              <p className="text-[#8888bb] text-[11px] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-4 pb-16 max-w-2xl mx-auto">
        <div className="glass rounded-3xl border border-[#00d4aa]/20 p-6 text-center glow-accent"
          style={{ background: 'linear-gradient(135deg,#00d4aa0d,#4a9eff0d)' }}>
          <CheckCircle2 className="w-8 h-8 text-[#00d4aa] mx-auto mb-3" />
          <h3 className="text-xl font-black text-white mb-2">Siap Download?</h3>
          <p className="text-[#8888bb] text-sm mb-4">File APK langsung, tanpa iklan, tanpa shortlink.</p>
          <Link
            href="/download"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
            style={{ background: 'linear-gradient(135deg,#00d4aa,#4a9eff)' }}
          >
            <Download className="w-4 h-4" /> Ke Halaman Download
          </Link>
        </div>
      </section>
    </div>
  );
}
