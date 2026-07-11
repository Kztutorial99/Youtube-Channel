'use client';

import { Target, Flame, AlertTriangle, ChevronDown, ChevronUp, CheckCircle2, Lightbulb } from 'lucide-react';
import { useState } from 'react';

interface Recommendation {
  id: string; title: string; description: string;
  priority: string; category: string; points: string[];
}

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: '1', title: 'Optimalkan Judul Video', priority: 'high',
    category: 'SEO',
    description: 'Judul yang kuat dengan keyword target bisa meningkatkan CTR 2-3x lipat.',
    points: [
      'Taruh keyword utama di 30 karakter pertama',
      'Gunakan angka: "5 Cara", "10 Tips" lebih klik',
      'Hindari clickbait — YouTube bisa penalti channel',
      'Cek search volume keyword sebelum pakai',
    ],
  },
  {
    id: '2', title: 'Konsistensi Upload', priority: 'high',
    category: 'Pertumbuhan',
    description: 'Algoritma YouTube sangat menyukai konsistensi. Channel aktif dapat lebih banyak distribusi.',
    points: [
      'Minimal 1x upload per minggu',
      'Umumkan jadwal upload di Community Post',
      'Buat konten batch — rekam 4 video sekaligus',
      'Gunakan YouTube Scheduler untuk auto-publish',
    ],
  },
  {
    id: '3', title: 'Perbaiki Thumbnail', priority: 'critical',
    category: 'CTR',
    description: 'Thumbnail adalah iklan video kamu. CTR rendah = YouTube berhenti mempromosikan video.',
    points: [
      'Ukuran ideal: 1280x720px (16:9)',
      'Gunakan teks max 6 kata yang kontras',
      'Wajah dengan ekspresi jelas terbukti meningkatkan CTR',
      'A/B test thumbnail berbeda di video baru',
    ],
  },
  {
    id: '4', title: 'Tingkatkan Retention', priority: 'medium',
    category: 'Watch Time',
    description: 'Audience retention di atas 50% adalah kunci video masuk rekomendasi.',
    points: [
      'Langsung masuk ke inti di 30 detik pertama',
      'Gunakan pattern interrupt setiap 2-3 menit',
      'Tambahkan end screen di 20 detik terakhir',
      'Analisis drop-off point di YouTube Analytics',
    ],
  },
  {
    id: '5', title: 'Aktifkan Community Post', priority: 'medium',
    category: 'Engagement',
    description: 'Community Post bisa menjaga engagement antara jadwal upload dan membangun hubungan dengan subscriber.',
    points: [
      'Post 2-3x per minggu di antara jadwal video',
      'Gunakan polling — dapat respons 5x lebih tinggi',
      'Share behind the scene konten upcoming',
      'Reply komentar Community Post dalam 1 jam pertama',
    ],
  },
];

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === 'critical') return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/25">
      <Flame className="w-2.5 h-2.5" /> Kritis
    </span>
  );
  if (priority === 'high') return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/25">
      <Target className="w-2.5 h-2.5" /> Penting
    </span>
  );
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/25">
      <AlertTriangle className="w-2.5 h-2.5" /> Normal
    </span>
  );
}

export default function RecommendationsPanel() {
  const [expanded, setExpanded] = useState<string | null>('3');

  const sorted = [...RECOMMENDATIONS].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.priority as keyof typeof order] ?? 9) - (order[b.priority as keyof typeof order] ?? 9);
  });

  return (
    <div className="space-y-3 pb-4">
      <div className="glass rounded-xl border border-white/5 p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-blue/20 flex items-center justify-center shrink-0">
          <Lightbulb className="w-4.5 h-4.5 text-brand-blue" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Tips Optimasi Channel</p>
          <p className="text-[11px] text-[#8888bb] mt-0.5 leading-relaxed">
            Praktik umum YouTube SEO/growth — bukan hasil analisis otomatis dari data channel kamu.
            Cek tab Issues untuk temuan yang dihitung langsung dari data channel.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {sorted.map((rec, idx) => {
          const isOpen = expanded === rec.id;
          return (
            <div key={rec.id} className={`glass rounded-xl border overflow-hidden transition-all ${rec.priority === 'critical' ? 'border-red-500/25' : 'border-white/5'}`}>
              <button className="w-full text-left p-3.5 flex items-center gap-3"
                onClick={() => setExpanded(isOpen ? null : rec.id)}>
                <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[11px] font-bold text-[#8888bb] shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-xs font-semibold text-white">{rec.title}</p>
                    <PriorityBadge priority={rec.priority} />
                  </div>
                  <span className="text-[10px] text-[#555577] font-medium px-1.5 py-0.5 bg-white/5 rounded">{rec.category}</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-[#555577] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#555577] shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-3.5 pb-3.5 space-y-3 border-t border-white/5 pt-3">
                  <p className="text-[11px] text-[#8888bb] leading-relaxed">{rec.description}</p>
                  <div className="space-y-2">
                    {rec.points.map((point, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-brand-blue/20 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-brand-blue" />
                        </div>
                        <p className="text-[11px] text-[#aaaacc] leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
