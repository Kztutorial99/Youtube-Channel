'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'Apakah ZArchiver Pro ini aman?',
    a: 'Iya, 100% aman. APK sudah di-sign ulang menggunakan MT Manager dan sudah dicek tidak ada malware, spyware, atau script berbahaya. Kami tidak memodifikasi fungsi utama app, hanya membuka fitur Pro.',
  },
  {
    q: 'Apakah perlu root untuk install?',
    a: 'Tidak perlu root sama sekali. Install seperti APK biasa — download, aktifkan sumber tidak dikenal, lalu install.',
  },
  {
    q: 'Kenapa perlu aktifkan "Sumber Tidak Dikenal"?',
    a: 'Android secara default hanya mengizinkan install dari Play Store. APK yang didownload langsung butuh izin ini. Ini setting normal dan bisa dinonaktifkan lagi setelah install.',
  },
  {
    q: 'Bisa update otomatis lewat Play Store?',
    a: 'Tidak. APK mod tidak bisa di-update lewat Play Store. Tapi kamu bisa install langsung versi baru dari halaman Download kami — cukup install di atas versi lama, data tidak hilang.',
  },
  {
    q: 'Format arsip apa saja yang didukung?',
    a: 'ZArchiver Pro mendukung: ZIP, 7z, RAR (extract), TAR, GZ, BZ2, XZ, LZ4, ZSTD, ISO, APK, dan masih banyak lagi. Hampir semua format populer didukung.',
  },
  {
    q: 'Apakah ada iklan di dalam app?',
    a: 'Tidak ada iklan. Versi Pro menghilangkan semua iklan yang ada di versi gratis.',
  },
  {
    q: 'Apakah data saya aman? Apakah app ini akses internet?',
    a: 'ZArchiver tidak butuh koneksi internet untuk berfungsi. App hanya membaca dan menulis file lokal di HP kamu.',
  },
  {
    q: 'Support Android versi berapa?',
    a: 'Android 5.0 (Lollipop) ke atas. Optimal di Android 8.0+.',
  },
  {
    q: 'Kalau ada masalah, bisa tanya di mana?',
    a: 'Kamu bisa komen di video YouTube channel @kz.tutorial. Kami rutin cek dan balas komentar.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`glass rounded-2xl border transition-all ${open ? 'border-[#00d4aa]/25' : 'border-white/5'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <span className={`font-medium text-sm transition-colors ${open ? 'text-white' : 'text-[#ccccdd]'}`}>{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-[#00d4aa] shrink-0" />
          : <ChevronDown className="w-4 h-4 text-[#555577] shrink-0" />
        }
      </button>
      {open && (
        <div className="px-4 pb-4 text-[12px] text-[#8888bb] leading-relaxed border-t border-white/5 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen px-4 pb-28 md:pb-12 max-w-2xl mx-auto">
      <div className="pt-8 md:pt-12 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#00d4aa22,#4a9eff22)', border: '1px solid #00d4aa33' }}>
            <HelpCircle className="w-5 h-5 text-[#00d4aa]" />
          </div>
          <h1 className="text-2xl font-black text-white">FAQ</h1>
        </div>
        <p className="text-[#8888bb] text-sm">Pertanyaan yang sering ditanyakan. Kalau belum ada jawabannya, tanya di YouTube!</p>
      </div>

      <div className="space-y-2">
        {FAQS.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}
      </div>

      {/* Contact */}
      <div className="mt-8 glass rounded-2xl border border-white/5 p-4 text-center">
        <p className="text-[#8888bb] text-sm mb-3">Pertanyaan lain? Tanya langsung di YouTube!</p>
        <a
          href="https://youtube.com/@kz.tutorial"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-red-500/80 hover:bg-red-500 transition-all"
        >
          @kz.tutorial
        </a>
      </div>
    </div>
  );
}
