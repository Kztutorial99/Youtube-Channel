import { ArrowRight, Download, Settings, Package, CheckCircle2, Youtube, PlayCircle } from 'lucide-react';
import Link from 'next/link';

const STEPS = [
  {
    no: 1,
    icon: Download,
    title: 'Download APK',
    desc: 'Pergi ke halaman Download dan tap tombol "Download" di versi terbaru.',
    detail: 'File akan tersimpan di folder Downloads HP kamu secara otomatis.',
  },
  {
    no: 2,
    icon: Settings,
    title: 'Aktifkan Sumber Tidak Dikenal',
    desc: 'Buka Pengaturan → Keamanan → aktifkan "Install aplikasi dari sumber tidak dikenal".',
    detail: 'Di Android 8+: saat install, langsung ada popup untuk izinkan. Di Android 7 ke bawah, aktifkan manual di Pengaturan.',
  },
  {
    no: 3,
    icon: Package,
    title: 'Install APK',
    desc: 'Buka file APK dari notifikasi atau folder Downloads, lalu tap "Install".',
    detail: 'Proses install hanya beberapa detik. Jika ada ZArchiver versi lama, otomatis ter-replace.',
  },
  {
    no: 4,
    icon: CheckCircle2,
    title: 'Selesai! Nikmati Pro',
    desc: 'Buka ZArchiver. Semua fitur Pro sudah aktif otomatis — tidak perlu aktivasi.',
    detail: 'Kamu bisa extract, compress ZIP/RAR/7z, lihat isi arsip, dan masih banyak lagi.',
  },
];

const TIPS = [
  { title: 'Extract File Besar', desc: 'ZArchiver Pro bisa handle file arsip sampai beberapa GB tanpa lag.' },
  { title: 'Buat Arsip Terenkripsi', desc: 'Gunakan password AES-256 untuk melindungi file ZIP/7z kamu.' },
  { title: 'Multi-Select File', desc: 'Tap dan tahan file untuk mode seleksi, lalu pilih beberapa file sekaligus.' },
  { title: 'Extract Sebagian', desc: 'Kamu bisa extract hanya file tertentu dari arsip besar — hemat storage.' },
];

export default function TutorialPage() {
  return (
    <div className="min-h-screen px-4 pb-28 md:pb-12 max-w-2xl mx-auto">
      <div className="pt-8 md:pt-12 mb-8">
        <h1 className="text-2xl font-black text-white mb-1">Cara Install & Pakai</h1>
        <p className="text-[#8888bb] text-sm">Tutorial lengkap dari nol sampai bisa pakai ZArchiver Pro.</p>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-10">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.no} className="glass rounded-2xl border border-white/5 p-4 flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg,#00d4aa22,#4a9eff22)', border: '1px solid #00d4aa33' }}>
                  <Icon className="w-5 h-5 text-[#00d4aa]" />
                </div>
                {i < STEPS.length - 1 && <div className="w-px flex-1 mt-2 bg-white/10" />}
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-bold text-[#00d4aa] bg-[#00d4aa]/10 px-2 py-0.5 rounded-full">STEP {step.no}</span>
                </div>
                <p className="font-bold text-white text-sm mb-1">{step.title}</p>
                <p className="text-[#8888bb] text-xs leading-relaxed mb-1">{step.desc}</p>
                <p className="text-[#555577] text-[10px] leading-relaxed">{step.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <h2 className="text-lg font-black text-white mb-3">Tips & Trik</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        {TIPS.map(t => (
          <div key={t.title} className="glass rounded-xl border border-white/5 p-3">
            <p className="font-bold text-white text-sm mb-1">{t.title}</p>
            <p className="text-[#8888bb] text-[11px] leading-relaxed">{t.desc}</p>
          </div>
        ))}
      </div>

      {/* YouTube CTA */}
      <div className="glass rounded-2xl border border-red-500/20 p-4 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg,#ff000010,#ff450010)' }}>
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
          <Youtube className="w-5 h-5 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">Tonton Tutorial Video</p>
          <p className="text-[10px] text-red-300/70">Tutorial lengkap dengan video di channel @kz.tutorial</p>
        </div>
        <a
          href="https://youtube.com/@kz.tutorial"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-500/20 text-red-400 text-[11px] font-bold shrink-0 hover:bg-red-500/30 transition-all"
        >
          <PlayCircle className="w-3.5 h-3.5" /> Tonton
        </a>
      </div>

      {/* Download CTA */}
      <div className="mt-6 text-center">
        <Link href="/download"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
          style={{ background: 'linear-gradient(135deg,#00d4aa,#4a9eff)' }}>
          <Download className="w-4 h-4" /> Download APK Sekarang <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
