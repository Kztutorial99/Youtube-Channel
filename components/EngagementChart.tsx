'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { VideoStats } from '@/lib/youtube';

interface Props {
  videos: VideoStats[];
}

function shortTitle(title: string): string {
  const words = title.split(' ');
  // Try to get the most identifying part
  const versionMatch = title.match(/\d+\.\d+[\.\d]*/);
  if (versionMatch) return 'v' + versionMatch[0];
  if (words.length > 3) return words.slice(0, 2).join(' ') + '...';
  return title;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: VideoStats & { shortTitle: string } }> }) => {
  if (active && payload && payload.length) {
    const v = payload[0].payload;
    return (
      <div className="bg-[#161630] border border-white/10 rounded-lg p-3 text-xs max-w-48">
        <p className="text-white font-medium mb-1 break-words">{v.title}</p>
        <p className="text-brand-blue">{v.views.toLocaleString('id-ID')} views</p>
        <p className={v.isEngagementDisabled ? 'text-red-400' : 'text-brand-green'}>{v.engagementRate}% engagement</p>
        <p className="text-[#8888bb]">{v.duration}</p>
      </div>
    );
  }
  return null;
};

export default function EngagementChart({ videos }: Props) {
  const top12 = [...videos]
    .filter(v => v.status === 'public')
    .sort((a, b) => b.views - a.views)
    .slice(0, 12)
    .map(v => ({ ...v, shortTitle: shortTitle(v.title) }));

  const getColor = (v: VideoStats) => {
    if (v.isEngagementDisabled) return '#ef4444';
    if (v.engagementRate >= 2) return '#00d4aa';
    if (v.engagementRate >= 1.5) return '#4a9eff';
    if (v.engagementRate >= 1) return '#ffd700';
    return '#ff7c3e';
  };

  return (
    <div className="glass rounded-2xl p-4 border border-white/5 mb-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Views per Video</h3>
          <p className="text-[10px] text-[#8888bb]">Top 12 video publik · warna = engagement rate</p>
        </div>
        <div className="flex gap-1.5 text-[9px] flex-col items-end">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00d4aa] inline-block"/>≥2%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4a9eff] inline-block"/>≥1.5%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ffd700] inline-block"/>≥1%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444] inline-block"/>Penalti</span>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top12} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
            <XAxis
              dataKey="shortTitle"
              tick={{ fontSize: 9, fill: '#666688' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#666688' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="views" radius={[4, 4, 0, 0]}>
              {top12.map((v, i) => (
                <Cell key={i} fill={getColor(v)} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
