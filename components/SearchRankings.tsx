'use client';

import { Search, TrendingUp, TrendingDown, Minus, Target, Info } from 'lucide-react';

interface RankItem {
  keyword: string;
  position: number | null;
  change: number | null;
  note?: string;
}

const RANKINGS: RankItem[] = [
  { keyword: 'tutorial android indonesia', position: 3, change: 2, note: 'Video terbaru membantu ranking' },
  { keyword: 'cara setting hp android', position: 7, change: -1 },
  { keyword: 'tips youtube pemula', position: 12, change: 5, note: 'Tren naik signifikan' },
  { keyword: 'review aplikasi android', position: 18, change: 0 },
  { keyword: 'cara edit video hp', position: 25, change: -3 },
  { keyword: 'monetisasi youtube 2024', position: null, change: null, note: 'Belum ada data cukup' },
];

function PositionBadge({ position }: { position: number | null }) {
  if (!position) return (
    <span className="text-[11px] font-bold text-[#555577] px-2 py-0.5 bg-white/5 rounded-lg">-</span>
  );
  if (position <= 3) return (
    <span className="text-[11px] font-bold text-brand-green px-2 py-0.5 bg-brand-green/15 rounded-lg border border-brand-green/20">#{position}</span>
  );
  if (position <= 10) return (
    <span className="text-[11px] font-bold text-brand-blue px-2 py-0.5 bg-brand-blue/15 rounded-lg border border-brand-blue/20">#{position}</span>
  );
  if (position <= 20) return (
    <span className="text-[11px] font-bold text-yellow-400 px-2 py-0.5 bg-yellow-500/15 rounded-lg border border-yellow-500/20">#{position}</span>
  );
  return (
    <span className="text-[11px] font-bold text-[#8888bb] px-2 py-0.5 bg-white/5 rounded-lg">#{position}</span>
  );
}

function ChangeIcon({ change }: { change: number | null }) {
  if (change === null) return <Minus className="w-3 h-3 text-[#555577]" />;
  if (change > 0) return (
    <div className="flex items-center gap-0.5">
      <TrendingUp className="w-3 h-3 text-brand-green" />
      <span className="text-[10px] text-brand-green font-bold">+{change}</span>
    </div>
  );
  if (change < 0) return (
    <div className="flex items-center gap-0.5">
      <TrendingDown className="w-3 h-3 text-red-400" />
      <span className="text-[10px] text-red-400 font-bold">{change}</span>
    </div>
  );
  return <Minus className="w-3 h-3 text-[#555577]" />;
}

export default function SearchRankings() {
  const top3 = RANKINGS.filter(r => r.position && r.position <= 10).length;
  const improving = RANKINGS.filter(r => r.change && r.change > 0).length;

  return (
    <div className="space-y-3 pb-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-xl border border-white/5 p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-green/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-brand-green" />
          </div>
          <div>
            <p className="text-base font-black text-white">{top3}</p>
            <p className="text-[10px] text-[#8888bb]">Top 10</p>
          </div>
        </div>
        <div className="glass rounded-xl border border-white/5 p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-blue/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-brand-blue" />
          </div>
          <div>
            <p className="text-base font-black text-white">{improving}</p>
            <p className="text-[10px] text-[#8888bb]">Naik peringkat</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-brand-blue/8 border border-brand-blue/15">
        <Info className="w-3.5 h-3.5 text-brand-blue shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#8888bb] leading-relaxed">
          Data ranking bersifat estimasi. Untuk data akurat, gunakan YouTube Search Console atau Google Search Console.
        </p>
      </div>

      {/* Rankings */}
      <div className="glass rounded-xl border border-white/5 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-[#8888bb]" />
          <span className="text-[11px] font-bold text-[#8888bb] uppercase tracking-wider">Keyword Rankings</span>
        </div>
        <div className="divide-y divide-white/5">
          {RANKINGS.map((item, idx) => (
            <div key={idx} className="px-4 py-3 flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <span className="text-[9px] text-[#555577] font-bold">{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white truncate">{item.keyword}</p>
                {item.note && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Info className="w-2.5 h-2.5 text-[#555577] shrink-0" />
                    <p className="text-[10px] text-[#555577] truncate">{item.note}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ChangeIcon change={item.change} />
                <PositionBadge position={item.position} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
