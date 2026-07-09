'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Eye, ThumbsUp, MessageSquare, Clock, Tag, Globe } from 'lucide-react';
import type { VideoStats } from '@/lib/youtube';

function StatPill({ icon: Icon, value, label }: { icon: React.ElementType; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1.5">
      <Icon className="w-3 h-3 text-[#8888bb]" />
      <div>
        <p className="text-[10px] font-bold text-white">{value}</p>
        <p className="text-[9px] text-[#555577]">{label}</p>
      </div>
    </div>
  );
}

function BadgeRow({ video }: { video: VideoStats }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {video.isEngagementDisabled ? (
        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-medium">
          <AlertTriangle className="w-2.5 h-2.5" /> Engagement Disabled
        </span>
      ) : (
        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-brand-green/15 text-brand-green border border-brand-green/20 font-medium">
          <CheckCircle2 className="w-2.5 h-2.5" /> Engagement OK
        </span>
      )}
      {!video.hasTags && (
        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 font-medium">
          <Tag className="w-2.5 h-2.5" /> No Tags
        </span>
      )}
      {!video.hasLanguage && (
        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 font-medium">
          <Globe className="w-2.5 h-2.5" /> No Language
        </span>
      )}
      {video.ctr !== undefined && video.ctr === 0 && (
        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 font-medium">
          <AlertTriangle className="w-2.5 h-2.5" /> CTR 0%
        </span>
      )}
      {video.ctr !== undefined && video.ctr > 0 && (
        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-brand-green/15 text-brand-green border border-brand-green/20 font-medium">
          <CheckCircle2 className="w-2.5 h-2.5" /> CTR {video.ctr}%
        </span>
      )}
    </div>
  );
}

export default function VideoTable({ videos }: { videos: VideoStats[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'views' | 'engagement' | 'date'>('views');

  const sorted = [...videos].sort((a, b) => {
    if (sortBy === 'views') return b.views - a.views;
    if (sortBy === 'engagement') return b.engagementRate - a.engagementRate;
    return a.daysSinceUpload - b.daysSinceUpload;
  });

  return (
    <div className="space-y-3 pb-4">
      {/* Sort */}
      <div className="flex gap-2">
        {(['views','engagement','date'] as const).map(s => (
          <button key={s} onClick={() => setSortBy(s)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all border ${sortBy === s ? 'bg-brand-red/20 text-brand-red border-brand-red/30' : 'bg-white/5 text-[#8888bb] border-white/5'}`}>
            {s === 'views' ? 'Views' : s === 'engagement' ? 'Engagement' : 'Terbaru'}
          </button>
        ))}
      </div>

      {/* Video list */}
      <div className="space-y-2">
        {sorted.map((video, idx) => {
          const isOpen = expanded === video.id;
          const hasIssue = video.isEngagementDisabled || !video.hasTags || !video.hasLanguage;
          return (
            <div key={video.id}
              className={`glass rounded-xl border overflow-hidden transition-all ${hasIssue ? 'border-yellow-500/15' : 'border-white/5'}`}>
              <button className="w-full text-left p-3 flex gap-3" onClick={() => setExpanded(isOpen ? null : video.id)}>
                {/* Thumbnail */}
                <div className="relative shrink-0 w-[72px] h-[41px] rounded-lg overflow-hidden bg-white/5">
                  {video.thumbnail ? (
                    <Image src={video.thumbnail} alt={video.title} fill className="object-cover" sizes="72px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Eye className="w-4 h-4 text-[#555577]" />
                    </div>
                  )}
                  <span className="absolute bottom-0.5 left-0.5 bg-black/80 text-[8px] text-white px-1 py-0.5 rounded font-medium">
                    #{idx + 1}
                  </span>
                  {hasIssue && (
                    <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-2.5 h-2.5 text-yellow-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white leading-tight line-clamp-2 mb-1.5">{video.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-[#555577]">
                    <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" /> {video.views >= 1000 ? `${(video.views/1000).toFixed(1)}k` : video.views}</span>
                    <span className="flex items-center gap-0.5"><ThumbsUp className="w-2.5 h-2.5" /> {video.likes >= 1000 ? `${(video.likes/1000).toFixed(1)}k` : video.likes}</span>
                    <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {video.daysSinceUpload}h lalu</span>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#555577] shrink-0 mt-1" /> : <ChevronDown className="w-3.5 h-3.5 text-[#555577] shrink-0 mt-1" />}
              </button>

              {isOpen && (
                <div className="px-3 pb-3 border-t border-white/5 pt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <StatPill icon={Eye} value={video.views.toLocaleString('id-ID')} label="Views" />
                    <StatPill icon={ThumbsUp} value={video.likes.toLocaleString('id-ID')} label="Likes" />
                    <StatPill icon={MessageSquare} value={video.comments.toLocaleString('id-ID')} label="Komentar" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white/5 rounded-lg p-2">
                      <p className="text-[9px] text-[#555577] mb-1">Engagement Rate</p>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-green"
                            style={{ width: `${Math.min(video.engagementRate * 10, 100)}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-white">{video.engagementRate}%</span>
                      </div>
                    </div>
                    {video.duration && (
                      <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-[9px] text-[#555577] mb-0.5">Durasi</p>
                        <p className="text-[11px] font-bold text-white">{video.duration}</p>
                      </div>
                    )}
                  </div>
                  <BadgeRow video={video} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
