'use client';

import Image from 'next/image';
import { ExternalLink, Youtube, MapPin, Calendar } from 'lucide-react';
import type { ChannelStats } from '@/lib/youtube';

interface Props {
  channel: ChannelStats;
  lastSync: string;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ChannelHeader({ channel, lastSync }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl glass p-5 mb-4">
      {/* Animated gradient background strip */}
      <div className="absolute inset-x-0 top-0 h-1 animated-border" />

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-brand-red/40 glow-red">
            {channel.thumbnail ? (
              <Image src={channel.thumbnail} alt={channel.title} width={64} height={64} className="object-cover" />
            ) : (
              <div className="w-full h-full bg-brand-red/20 flex items-center justify-center">
                <Youtube className="w-8 h-8 text-brand-red" />
              </div>
            )}
          </div>
          {/* Live dot */}
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0a0a14] rounded-full flex items-center justify-center">
            <span className="pulse-dot" />
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-white truncate">{channel.title}</h1>
            <a
              href={`https://youtube.com/${channel.customUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-brand-red hover:text-red-300 transition-colors shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
              <span>{channel.customUrl}</span>
            </a>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-[#8888bb]">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {channel.country || 'ID'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDate(channel.publishedAt)}
            </span>
          </div>

          {/* Stat pills */}
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-red/20 text-brand-red border border-brand-red/30">
              {formatNumber(channel.subscribers)} Subs
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-blue/20 text-brand-blue border border-brand-blue/30">
              {formatNumber(channel.views)} Views
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
              {channel.videoCount} Video
            </span>
          </div>
        </div>
      </div>

      {/* Last sync */}
      <p className="mt-3 text-[10px] text-[#555577] text-right">
        Sync terakhir: {new Date(lastSync).toLocaleTimeString('id-ID')}
      </p>
    </div>
  );
}
