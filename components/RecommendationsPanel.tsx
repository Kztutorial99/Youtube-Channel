'use client';

import { useState } from 'react';
import { Lightbulb, Calendar, Clock, Film, Tag, ChevronDown, ChevronUp } from 'lucide-react';

const recommendations = [
  {
    id: 'upload-schedule',
    icon: Calendar,
    color: 'text-brand-green',
    bg: 'bg-brand-green/10 border-brand-green/20',
    title: 'Jadwal Upload Optimal',
    priority: '🔥 Paling Penting',
    body: 'Data dari 27 video channel lu menunjukkan pola yang jelas:',
    points: [
      '📅 Hari terbaik: Minggu (avg 52K views) & Selasa (avg 27K views)',
      '⏰ Jam terbaik: 13:00 WIB (06:00 UTC) — avg 63K views',
      '❌ Hindari: Jumat (avg cuma 7.5K views)',
      '🎯 Target: 2x upload per minggu — Minggu & Selasa jam 13:00 WIB',
    ],
  },
  {
    id: 'video-duration',
    icon: Film,
    color: 'text-brand-blue',
    bg: 'bg-brand-blue/10 border-brand-blue/20',
    title: 'Durasi Video Ideal',
    priority: '🔥 Penting',
    body: 'Analisis durasi vs views dari seluruh video:',
    points: [
      '✅ 3–4 menit: avg 39K views (sweet spot!)',
      '✅ 5–8 menit: avg 24.5K views',
      '⚠️ 8–10 menit: avg 16.2K views',
      '❌ 10+ menit: avg 12K views (drop signifikan)',
      '→ Target durasi 5–8 menit untuk konten baru',
    ],
  },
  {
    id: 'content-ideas',
    icon: Lightbulb,
    color: 'text-brand-yellow',
    bg: 'bg-brand-yellow/10 border-brand-yellow/20',
    title: 'Ide Konten Baru (High Priority)',
    priority: '🎯 Peluang Besar',
    body: 'Keyword dengan kompetisi rendah dan permintaan tinggi:',
    points: [
      '1️⃣ "Termux Mod Version Terbaru 2026 | Free Download No Password" — geser ARYA OFICIAL YT yang videonya dari 2022',
      '2️⃣ "Cara Install Termux 2026 yang Benar (0 Error)" — keyword belum ada pemain kuat',
      '3️⃣ "ZArchiver Pro Android 15 + Shizuku 2026" — kompetisi sangat rendah',
      '4️⃣ "FULL SCRIPT Termux 2026 — Semua Tools Terbaru" — request terbanyak dari komentar',
      '5️⃣ "Recovery Akun Facebook Kena Hack Pakai Termux" — diminta langsung penonton',
    ],
  },
  {
    id: 'thumbnail-tips',
    icon: Tag,
    color: 'text-brand-purple',
    bg: 'bg-brand-purple/10 border-brand-purple/20',
    title: 'Thumbnail & CTR Tips',
    priority: '⚠️ Perlu Perbaikan',
    body: 'CTR rendah = algoritma tidak push video. Tips dari data channel lu:',
    points: [
      '🎨 Pakai template konsisten — warna merah/hitam/kuning yang bold',
      '📝 Teks max 4 kata di thumbnail — besar dan terbaca di mobile',
      '😮 Ekspresi wajah atau visual "wow" meningkatkan CTR 30–40%',
      '🔢 Cantumkan versi/tahun di thumbnail untuk konten update',
      '📱 Preview thumbnail di ukuran 60x40px — test apakah terbaca di HP',
    ],
  },
  {
    id: 'engagement-tips',
    icon: Clock,
    color: 'text-brand-orange',
    bg: 'bg-brand-orange/10 border-brand-orange/20',
    title: 'Boost Engagement Rate',
    priority: '⚠️ Perlu Perhatian',
    body: 'Engagement rate rata-rata channel 1.42% — bisa ditingkatkan ke 2%+:',
    points: [
      '📢 CTA di detik ke-30: "Kalau video ini membantu, like dulu bang!" — sebelum penonton skip',
      '❓ Tanya di akhir video: "Version mana yang kalian pakai? Komen di bawah!"',
      '📌 Pin komentar sendiri dengan link download terbaru — jaga penonton tetap engage',
      '🗂️ Buat pinned comment dengan timestamp section — turunkan bounce, naikkan watch time',
      '💬 Reply semua komentar dalam 24 jam pertama — algoritma YouTube suka ini',
    ],
  },
];

export default function RecommendationsPanel() {
  const [expanded, setExpanded] = useState<string | null>('upload-schedule');

  return (
    <div className="mb-4 animate-fade-in">
      <div className="space-y-2">
        {recommendations.map(rec => {
          const isOpen = expanded === rec.id;
          const Icon = rec.icon;

          return (
            <div key={rec.id} className={`glass rounded-xl border overflow-hidden ${rec.bg}`}>
              <button
                onClick={() => setExpanded(isOpen ? null : rec.id)}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${rec.bg}`}>
                  <Icon className={`w-4 h-4 ${rec.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{rec.title}</p>
                  <p className="text-[10px] text-[#8888bb]">{rec.priority}</p>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-[#555577] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#555577] shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-3 pb-3 border-t border-white/5 pt-3 animate-slide-up">
                  <p className="text-xs text-[#aaaacc] mb-2">{rec.body}</p>
                  <ul className="space-y-1.5">
                    {rec.points.map((point, i) => (
                      <li key={i} className="text-[11px] text-[#ccccee] leading-relaxed pl-2 border-l-2 border-white/10">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
