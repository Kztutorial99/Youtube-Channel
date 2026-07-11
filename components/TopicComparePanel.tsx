'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Eye, ThumbsUp, MessageSquare, TrendingUp,
  ChevronDown, ChevronUp, Zap, Trophy, ExternalLink
} from 'lucide-react';
import type { VideoStats } from '@/lib/youtube';

interface TopicGroup {
  id: string;
  label: string;
  emoji: string;
  color: string;
  gradient: string;
  border: string;
  bg: string;
  videos: VideoStats[];
}

function categorize(videos: VideoStats[]): TopicGroup[] {
  const groups: TopicGroup[] = [
    {
      id: 'zarchiver',
      label: 'ZArchiver Pro',
      emoji: '📦',
      color: '#00d4aa',
      gradient: 'from-[#00d4aa] to-[#4a9eff]',
      border: 'border-[#00d4aa]/25',
      bg: 'bg-[#00d4aa]/8',
      videos: videos.filter(v => v.title.toLowerCase().includes('zarchiver')),
    },
    {
      id: 'termux',
      label: 'Termux Mod',
      emoji: '💻',
      color: '#4a9eff',
      gradient: 'from-[#4a9eff] to-[#b667f1]',
      border: 'border-[#4a9eff]/25',
      bg: 'bg-[#4a9eff]/8',
      videos: videos.filter(v =>
        v.title.toLowerCase().includes('termux') &&
        !v.title.toLowerCase().includes('zarchiver')
      ),
    },
    {
      id: 'others',
      label: 'Lainnya',
      emoji: '🎯',
      color: '#b667f1',
      gradient: 'from-[#b667f1] to-[#ff7c3e]',
      border: 'border-[#b667f1]/25',
      bg: 'bg-[#b667f1]/8',
      videos: videos.filter(v =>
        !v.title.toLowerCase().includes('zarchiver') &&
        !v.title.toLowerCase().includes('termux')
      ),
    },
  ];
  return groups.filter(g => g.videos.length > 0);
}

function groupStats(videos: VideoStats[]) {
  if (!videos.length) return null;
  const totalViews   = videos.reduce((s, v) => s + v.views, 0);
  const totalLikes   = videos.reduce((s, v) => s + v.likes, 0);
  const totalComments = videos.reduce((s, v) => s + v.comments, 0);
  const avgEng       = videos.reduce((s, v) => s + v.engagementRate, 0) / videos.length;
  const best         = [...videos].sort((a, b) => b.views - a.views)[0];
  return {
    totalViews,
    totalLikes,
    totalComments,
    avgViews: Math.round(totalViews / videos.length),
    avgEng: avgEng.toFixed(2),
    best,
  };
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/* ── Bar chart row ── */
function BarRow({
  label, value, max, color, suffix = '',
}: { label: string; value: number; max: number; color: string; suffix?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-[#8888bb]">{label}</span>
        <span className="font-bold text-white">{fmt(value)}{suffix}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

/* ── Head-to-head comparison row ── */
function CompareRow({
  metricLabel, groups, getValue, suffix = '', higher = 'better',
}: {
  metricLabel: string;
  groups: { group: TopicGroup; stats: ReturnType<typeof groupStats> }[];
  getValue: (s: NonNullable<ReturnType<typeof groupStats>>) => number;
  suffix?: string;
  higher?: 'better' | 'lower';
}) {
  const values = groups.map(g => (g.stats ? getValue(g.stats) : 0));
  const best   = higher === 'better' ? Math.max(...values) : Math.min(...values);

  return (
    <div className="flex gap-2 items-center py-2 border-b border-white/5 last:border-0">
      <span className="text-[10px] text-[#8888bb] w-20 shrink-0">{metricLabel}</span>
      {groups.map((g, i) => {
        const val    = values[i];
        const isWinner = val === best;
        return (
          <div
            key={g.group.id}
            className={`flex-1 text-center py-1 rounded-lg text-[11px] font-bold transition-all ${
              isWinner
                ? 'text-white'
                : 'text-[#555577]'
            }`}
            style={isWinner ? { background: `${g.group.color}22`, color: g.group.color } : {}}
          >
            {fmt(val)}{suffix}
            {isWinner && <span className="ml-0.5 text-[8px]">👑</span>}
          </div>
        );
      })}
    </div>
  );
}

/* ── Single video row inside topic card ── */
function VideoRow({ video, rank }: { video: VideoStats; rank: number }) {
  const ytUrl = `https://www.youtube.com/watch?v=${video.id}`;
  return (
    <a
      href={ytUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-2 items-center p-2 rounded-lg bg-white/3 hover:bg-white/6 transition-colors"
    >
      <span className="text-[9px] font-bold text-[#555577] w-4 shrink-0">#{rank}</span>
      <div className="relative w-12 h-7 rounded-md overflow-hidden bg-white/5 shrink-0">
        {video.thumbnail ? (
          <Image src={video.thumbnail} alt={video.title} fill className="object-cover" sizes="48px" />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-white font-medium leading-tight line-clamp-1">{video.title}</p>
        <div className="flex gap-2 mt-0.5 text-[9px] text-[#555577]">
          <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{fmt(video.views)}</span>
          <span className="flex items-center gap-0.5"><ThumbsUp className="w-2.5 h-2.5" />{fmt(video.likes)}</span>
          <span className="flex items-center gap-0.5"><TrendingUp className="w-2.5 h-2.5" />{video.engagementRate}%</span>
        </div>
      </div>
      <ExternalLink className="w-3 h-3 text-[#555577] shrink-0" />
    </a>
  );
}

/* ── Topic card ── */
function TopicCard({
  group,
  stats,
  maxViews,
  maxLikes,
  maxComments,
  rank,
}: {
  group: TopicGroup;
  stats: NonNullable<ReturnType<typeof groupStats>>;
  maxViews: number;
  maxLikes: number;
  maxComments: number;
  rank: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...group.videos].sort((a, b) => b.views - a.views);

  return (
    <div className={`glass rounded-2xl border ${group.border} overflow-hidden`}>
      {/* Card header */}
      <div className={`p-3 ${group.bg}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {rank === 1 && <Trophy className="w-3.5 h-3.5 text-yellow-400" />}
            <span className="text-xs font-bold text-white">{group.emoji} {group.label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-[#8888bb] font-medium">
              {group.videos.length} video
            </span>
            {rank === 1 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: `${group.color}22`, color: group.color }}>
                #1 🏆
              </span>
            )}
          </div>
        </div>

        {/* Big stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { icon: Eye, val: stats.totalViews, label: 'Total Views' },
            { icon: ThumbsUp, val: stats.totalLikes, label: 'Total Likes' },
            { icon: MessageSquare, val: stats.totalComments, label: 'Komentar' },
          ].map(({ icon: Icon, val, label }) => (
            <div key={label} className="bg-white/5 rounded-xl p-2 text-center">
              <Icon className="w-3 h-3 mx-auto mb-0.5" style={{ color: group.color }} />
              <p className="text-[11px] font-black text-white">{fmt(val)}</p>
              <p className="text-[8px] text-[#555577]">{label}</p>
            </div>
          ))}
        </div>

        {/* Bar chart rows */}
        <div className="space-y-2">
          <BarRow label="Views" value={stats.totalViews} max={maxViews} color={group.color} />
          <BarRow label="Likes" value={stats.totalLikes} max={maxLikes} color={group.color} />
          <BarRow label="Komentar" value={stats.totalComments} max={maxComments} color={group.color} />
        </div>

        {/* Avg stats */}
        <div className="flex gap-2 mt-3">
          <div className="flex-1 bg-white/5 rounded-lg p-2">
            <p className="text-[8px] text-[#555577]">Avg Views</p>
            <p className="text-[11px] font-bold text-white">{fmt(stats.avgViews)}</p>
          </div>
          <div className="flex-1 bg-white/5 rounded-lg p-2">
            <p className="text-[8px] text-[#555577]">Avg Eng</p>
            <p className="text-[11px] font-bold" style={{ color: group.color }}>{stats.avgEng}%</p>
          </div>
          <div className="flex-1 bg-white/5 rounded-lg p-2">
            <p className="text-[8px] text-[#555577]">Best Video</p>
            <p className="text-[11px] font-bold text-white">{fmt(stats.best.views)}</p>
          </div>
        </div>
      </div>

      {/* Video list toggle */}
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] text-[#8888bb] hover:text-white hover:bg-white/3 transition-colors border-t border-white/5"
        onClick={() => setExpanded(e => !e)}
      >
        <span>Lihat {group.videos.length} Video</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-white/5 pt-2">
          {sorted.map((v, i) => (
            <VideoRow key={v.id} video={v} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   Main export
═══════════════════════════════════ */
export default function TopicComparePanel({ videos }: { videos: VideoStats[] }) {
  const groups  = categorize(videos);
  const allStats = groups.map(g => ({ group: g, stats: groupStats(g.videos)! }));

  const maxViews    = Math.max(...allStats.map(g => g.stats.totalViews));
  const maxLikes    = Math.max(...allStats.map(g => g.stats.totalLikes));
  const maxComments = Math.max(...allStats.map(g => g.stats.totalComments));

  // Sort by total views for ranking
  const ranked = [...allStats].sort((a, b) => b.stats.totalViews - a.stats.totalViews);

  return (
    <div className="space-y-4 pb-4">

      {/* Live badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00d4aa]/10 border border-[#00d4aa]/20">
          <Zap className="w-3 h-3 text-[#00d4aa]" />
          <span className="text-[10px] font-semibold text-[#00d4aa]">Real-time • Auto refresh 30s</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse" />
        </div>
      </div>

      {/* Head-to-head table */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-3 pt-3 pb-1">
          <p className="text-xs font-bold text-white mb-1">⚔️ Head-to-Head</p>

          {/* Column headers */}
          <div className="flex gap-2 items-center py-1.5 border-b border-white/10">
            <span className="text-[10px] text-[#555577] w-20 shrink-0">Metrik</span>
            {ranked.map(g => (
              <div key={g.group.id} className="flex-1 text-center">
                <span className="text-[10px] font-bold" style={{ color: g.group.color }}>
                  {g.group.emoji} {g.group.label}
                </span>
              </div>
            ))}
          </div>

          <CompareRow metricLabel="Total Views"    groups={ranked} getValue={s => s.totalViews} />
          <CompareRow metricLabel="Total Likes"    groups={ranked} getValue={s => s.totalLikes} />
          <CompareRow metricLabel="Total Komen"    groups={ranked} getValue={s => s.totalComments} />
          <CompareRow metricLabel="Avg Views"      groups={ranked} getValue={s => s.avgViews} />
          <CompareRow metricLabel="Avg Engagement" groups={ranked} getValue={s => parseFloat(s.avgEng)} suffix="%" />
          <CompareRow metricLabel="Jumlah Video"   groups={ranked} getValue={s => allStats.find(a => a.stats === s)?.group.videos.length ?? 0} />
          <CompareRow metricLabel="Best Video"     groups={ranked} getValue={s => s.best.views} />
        </div>
      </div>

      {/* Topic cards */}
      {ranked.map((g, i) => (
        <TopicCard
          key={g.group.id}
          group={g.group}
          stats={g.stats}
          maxViews={maxViews}
          maxLikes={maxLikes}
          maxComments={maxComments}
          rank={i + 1}
        />
      ))}
    </div>
  );
}
