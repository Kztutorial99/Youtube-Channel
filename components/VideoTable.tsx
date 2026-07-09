'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ExternalLink, ChevronUp, ChevronDown, Tag, Globe, Lock, EyeOff } from 'lucide-react';
import type { VideoStats } from '@/lib/youtube';

interface Props {
  videos: VideoStats[];
}

type SortKey = 'views' | 'engagementRate' | 'likes' | 'comments' | 'publishedAt';

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString('id-ID');
}

function engColor(rate: number, disabled: boolean): string {
  if (disabled) return 'text-red-500 font-bold';
  if (rate >= 2) return 'text-brand-green';
  if (rate >= 1.5) return 'text-brand-blue';
  if (rate >= 1) return 'text-brand-yellow';
  return 'text-brand-orange';
}

export default function VideoTable({ videos }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('views');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<'all' | 'public' | 'private' | 'issues'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = videos.filter(v => {
    if (filter === 'public') return v.status === 'public';
    if (filter === 'private') return v.status !== 'public';
    if (filter === 'issues') return v.isEngagementDisabled || !v.hasTags || !v.hasLanguage || v.engagementRate < 1;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let av = sortKey === 'publishedAt' ? new Date(a[sortKey]).getTime() : (a[sortKey] as number);
    let bv = sortKey === 'publishedAt' ? new Date(b[sortKey]).getTime() : (b[sortKey] as number);
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => toggleSort(k)} className="flex items-center gap-0.5 text-[10px] text-[#8888bb] hover:text-white transition-colors">
      {label}
      {sortKey === k ? (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />) : null}
    </button>
  );

  return (
    <div className="mb-4 animate-fade-in">
      {/* Filter tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {(['all', 'public', 'private', 'issues'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              filter === f ? 'bg-white/15 text-white border border-white/20' : 'bg-white/5 text-[#8888bb] border border-white/5'
            }`}
          >
            {f === 'all' ? `Semua (${videos.length})` : f === 'public' ? `Publik (${videos.filter(v => v.status === 'public').length})` : f === 'private' ? `Private (${videos.filter(v => v.status !== 'public').length})` : `Ada Isu (${videos.filter(v => v.isEngagementDisabled || !v.hasTags || v.engagementRate < 1).length})`}
          </button>
        ))}
      </div>

      {/* Sort bar */}
      <div className="flex gap-3 px-1 mb-2 flex-wrap">
        <span className="text-[10px] text-[#555577]">Sort:</span>
        <SortBtn k="views" label="Views" />
        <SortBtn k="engagementRate" label="Engagement" />
        <SortBtn k="likes" label="Likes" />
        <SortBtn k="publishedAt" label="Tanggal" />
      </div>

      {/* Video list */}
      <div className="space-y-2">
        {sorted.map((v, idx) => {
          const isOpen = expanded === v.id;
          const hasIssue = v.isEngagementDisabled || !v.hasTags || !v.hasLanguage;

          return (
            <div
              key={v.id}
              className={`glass rounded-xl border overflow-hidden transition-all ${
                v.isEngagementDisabled ? 'border-red-500/40' :
                hasIssue ? 'border-yellow-500/20' :
                'border-white/5'
              }`}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : v.id)}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                {/* Rank */}
                <span className="text-[11px] text-[#555577] w-5 text-center shrink-0 font-mono">
                  {filter === 'all' || filter === 'issues' ? idx + 1 : idx + 1}
                </span>

                {/* Thumbnail */}
                <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5">
                  {v.thumbnail ? (
                    <Image src={v.thumbnail} alt={v.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5" />
                  )}
                  {v.status !== 'public' && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <Lock className="w-3 h-3 text-red-400" />
                    </div>
                  )}
                  {v.isEngagementDisabled && (
                    <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                      <EyeOff className="w-3 h-3 text-red-300" />
                    </div>
                  )}
                  <span className="absolute bottom-0.5 right-0.5 text-[9px] bg-black/80 text-white px-0.5 rounded">
                    {v.duration}
                  </span>
                </div>

                {/* Title + stats */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white line-clamp-2 leading-tight mb-1">{v.title}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-[10px] text-brand-blue">{formatNum(v.views)} views</span>
                    <span className={`text-[10px] ${engColor(v.engagementRate, v.isEngagementDisabled)}`}>
                      {v.isEngagementDisabled ? '⚠️ 0%' : `${v.engagementRate}%`}
                    </span>
                  </div>
                </div>

                {/* Expand */}
                {isOpen ? <ChevronUp className="w-4 h-4 text-[#555577] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#555577] shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-3 pb-3 border-t border-white/5 pt-3 animate-slide-up">
                  {/* Detailed stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: 'Views', value: formatNum(v.views) },
                      { label: 'Likes', value: formatNum(v.likes) },
                      { label: 'Komentar', value: formatNum(v.comments) },
                      { label: 'Engagement', value: v.isEngagementDisabled ? '⚠️ 0%' : `${v.engagementRate}%` },
                      { label: 'Durasi', value: v.duration },
                      { label: 'Hari lalu', value: `${v.daysSinceUpload}d` },
                    ].map(s => (
                      <div key={s.label} className="bg-white/5 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-[#666688] mb-0.5">{s.label}</p>
                        <p className="text-xs font-semibold text-white">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Flags */}
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    {!v.hasTags && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">
                        <Tag className="w-3 h-3" /> No Tags
                      </span>
                    )}
                    {!v.hasLanguage && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/20">
                        <Globe className="w-3 h-3" /> No Lang
                      </span>
                    )}
                    {v.isEngagementDisabled && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-red-600/30 text-red-300 border border-red-600/30 font-semibold">
                        <EyeOff className="w-3 h-3" /> Engagement Dimatikan!
                      </span>
                    )}
                    {v.status !== 'public' && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/20">
                        <Lock className="w-3 h-3" /> {v.status}
                      </span>
                    )}
                    {v.hasTags && v.hasLanguage && !v.isEngagementDisabled && v.status === 'public' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-500/20 text-green-400 border border-green-500/20">
                        ✅ OK
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {v.tags.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] text-[#555577] mb-1">Tags ({v.tags.length}):</p>
                      <div className="flex gap-1 flex-wrap">
                        {v.tags.slice(0, 8).map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-[#8888bb] border border-white/5">{t}</span>
                        ))}
                        {v.tags.length > 8 && <span className="text-[9px] text-[#555577]">+{v.tags.length - 8}</span>}
                      </div>
                    </div>
                  )}

                  {/* Open in YouTube */}
                  <a
                    href={`https://youtube.com/watch?v=${v.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[11px] text-brand-red hover:text-red-300 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Buka di YouTube
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
