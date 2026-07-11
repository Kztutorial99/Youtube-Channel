'use client';

import { Eye, ThumbsUp, MessageSquare, TrendingUp, Clock, Video } from 'lucide-react';
import type { VideoStats } from '@/lib/youtube';

interface Props {
  videos: VideoStats[];
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString('id-ID');
}

export default function StatsGrid({ videos }: Props) {
  const pub = videos.filter(v => v.status === 'public');
  const totalViews = pub.reduce((s, v) => s + v.views, 0);
  const totalLikes = pub.reduce((s, v) => s + v.likes, 0);
  const totalComments = pub.reduce((s, v) => s + v.comments, 0);
  const avgEng = pub.length > 0 ? pub.reduce((s, v) => s + v.engagementRate, 0) / pub.length : 0;
  const topVideo = [...pub].sort((a, b) => b.views - a.views)[0];
  const avgViews = pub.length > 0 ? totalViews / pub.length : 0;

  const stats = [
    {
      label: 'Total Views',
      value: formatNum(totalViews),
      icon: Eye,
      color: 'text-brand-blue',
      bg: 'bg-brand-blue/10 border-brand-blue/20',
      glow: 'glow-blue',
    },
    {
      label: 'Total Likes',
      value: formatNum(totalLikes),
      icon: ThumbsUp,
      color: 'text-brand-red',
      bg: 'bg-brand-red/10 border-brand-red/20',
      glow: 'glow-red',
    },
    {
      label: 'Total Komentar',
      value: formatNum(totalComments),
      icon: MessageSquare,
      color: 'text-brand-purple',
      bg: 'bg-brand-purple/10 border-brand-purple/20',
      glow: 'glow-purple',
    },
    {
      label: 'Avg Engagement',
      value: avgEng.toFixed(2) + '%',
      icon: TrendingUp,
      color: 'text-brand-green',
      bg: 'bg-brand-green/10 border-brand-green/20',
      glow: 'glow-green',
    },
    {
      label: 'Avg Views/Video',
      value: formatNum(Math.round(avgViews)),
      icon: Video,
      color: 'text-brand-yellow',
      bg: 'bg-brand-yellow/10 border-brand-yellow/20',
      glow: 'glow-yellow',
    },
    {
      label: 'Video Terbaik',
      value: formatNum(topVideo?.views || 0),
      sub: topVideo ? topVideo.title.slice(0, 28) + '…' : '',
      icon: Clock,
      color: 'text-brand-orange',
      bg: 'bg-brand-orange/10 border-brand-orange/20',
      glow: '',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-4 animate-fade-in">
      {stats.map((s) => (
        <div key={s.label} className={`glass rounded-xl p-4 border ${s.bg} ${s.glow}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-[#8888bb] font-medium">{s.label}</span>
            <s.icon className={`w-4 h-4 ${s.color}`} />
          </div>
          <p className={`text-xl font-bold counter ${s.color}`}>{s.value}</p>
          {s.sub && <p className="text-[10px] text-[#555577] mt-1 truncate">{s.sub}</p>}
        </div>
      ))}
    </div>
  );
}
