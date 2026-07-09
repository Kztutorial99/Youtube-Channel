'use client';

import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const rankings = [
  {
    keyword: 'new update termux mod terbaru version free tools',
    positions: [1, 2, 10, 11, 15],
    status: 'dominant' as const,
    note: 'Dominasi #1 & #2',
  },
  {
    keyword: 'termux mod terbaru',
    positions: [3, 8, 9, 13, 18],
    status: 'good' as const,
    note: '#3 terbaik, 5 video ranking',
  },
  {
    keyword: 'termux mod apk terbaru',
    positions: [4, 13, 15, 17],
    status: 'good' as const,
    note: '#4 terbaik',
  },
  {
    keyword: 'termux full script terbaru',
    positions: [],
    status: 'missing' as const,
    note: 'Tidak ada video yang ranking',
  },
  {
    keyword: 'termux update terbaru 2025',
    positions: [],
    status: 'missing' as const,
    note: 'Keyword belum dikover',
  },
  {
    keyword: 'zarchiver pro terbaru 2024',
    positions: [1],
    status: 'dominant' as const,
    note: 'Video 116K views masih #1',
  },
  {
    keyword: 'zarchiver android 15 shizuku',
    positions: [],
    status: 'opportunity' as const,
    note: '🎯 Peluang besar — kompetisi rendah',
  },
  {
    keyword: 'cara install termux 2026 tanpa error',
    positions: [],
    status: 'opportunity' as const,
    note: '🎯 Keyword belum ada pemain kuat',
  },
];

const statusConfig = {
  dominant: { color: 'text-brand-green', bg: 'bg-brand-green/10 border-brand-green/20', icon: TrendingUp, label: 'Dominan' },
  good: { color: 'text-brand-blue', bg: 'bg-brand-blue/10 border-brand-blue/20', icon: TrendingUp, label: 'Bagus' },
  missing: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: TrendingDown, label: 'Tidak Ranking' },
  opportunity: { color: 'text-brand-yellow', bg: 'bg-brand-yellow/10 border-brand-yellow/20', icon: Minus, label: 'Peluang' },
};

export default function SearchRankings() {
  return (
    <div className="mb-4 animate-fade-in">
      <div className="space-y-2">
        {rankings.map(r => {
          const cfg = statusConfig[r.status];
          const Icon = cfg.icon;

          return (
            <div key={r.keyword} className={`glass rounded-xl p-3 border ${cfg.bg}`}>
              <div className="flex items-start gap-2 mb-2">
                <Search className="w-3.5 h-3.5 text-[#8888bb] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium break-words">"{r.keyword}"</p>
                  <p className="text-[10px] text-[#8888bb] mt-0.5">{r.note}</p>
                </div>
                <div className={`flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.color} bg-white/5`}>
                  <Icon className="w-3 h-3" />
                  <span>{cfg.label}</span>
                </div>
              </div>

              {r.positions.length > 0 && (
                <div className="flex gap-1.5 flex-wrap pl-5">
                  {r.positions.map(pos => (
                    <span
                      key={pos}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        pos <= 3
                          ? 'bg-brand-green/20 text-brand-green border-brand-green/30'
                          : pos <= 10
                          ? 'bg-brand-blue/20 text-brand-blue border-brand-blue/30'
                          : 'bg-white/10 text-[#8888bb] border-white/10'
                      }`}
                    >
                      #{pos}
                    </span>
                  ))}
                  <span className="text-[10px] text-[#555577] self-center">
                    @kz.tutorial
                  </span>
                </div>
              )}

              {r.status === 'opportunity' && (
                <div className="ml-5 mt-1 text-[10px] text-brand-yellow">
                  → Buat video untuk keyword ini sekarang!
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-[#444466] text-center mt-2">
        * Data ranking berdasarkan analisis manual Juli 2026. Bukan real-time API.
      </p>
    </div>
  );
}
