'use client';

import useSWR from 'swr';
import {
  BarChart2, AlertTriangle, Video, Search, Lightbulb,
  Youtube, WifiOff, RefreshCw, Activity
} from 'lucide-react';
import ChannelHeader from '@/components/ChannelHeader';
import StatsGrid from '@/components/StatsGrid';
import IssuesPanel from '@/components/IssuesPanel';
import VideoTable from '@/components/VideoTable';
import SearchRankings from '@/components/SearchRankings';
import RecommendationsPanel from '@/components/RecommendationsPanel';
import EngagementChart from '@/components/EngagementChart';
import type { ChannelStats, VideoStats, IssueCheck } from '@/lib/youtube';

type Tab = 'overview' | 'issues' | 'videos' | 'rankings' | 'tips';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'issues', label: 'Issues', icon: AlertTriangle },
  { id: 'videos', label: 'Video', icon: Video },
  { id: 'rankings', label: 'Ranking', icon: Search },
  { id: 'tips', label: 'Tips', icon: Lightbulb },
];

interface IssueSummary {
  total: number; fixed: number; pending: number;
  warning: number; critical: number; healthScore: number;
}
interface DashboardData {
  channel: ChannelStats; videos: VideoStats[];
  issues: IssueCheck[]; summary: IssueSummary;
}

const fetcher = (url: string) => fetch(url).then(r => r.json()).then(r => r.data as DashboardData);

export default function Dashboard() {
  const [tab, setTab] = useSWRTab();

  const { data, error, isLoading, isValidating, mutate } = useSWR<DashboardData>(
    '/api/data',
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5_000,
    }
  );

  const channel = data?.channel ?? null;
  const videos = data?.videos ?? [];
  const issues = data?.issues ?? [];
  const summary = data?.summary ?? null;

  const pendingCount = issues.filter(i => i.status === 'pending').length;
  const criticalCount = issues.filter(i => i.severity === 'critical' && i.status !== 'fixed').length;

  if (isLoading && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0a0a14]">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-brand-red/20 flex items-center justify-center">
            <Youtube className="w-8 h-8 text-brand-red" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-brand-red/40 animate-ping" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-sm">Memuat Dashboard</p>
          <p className="text-[#8888bb] text-xs mt-1">Mengambil data dari YouTube API...</p>
        </div>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-brand-red/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-[#0a0a14]">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-sm">Gagal Memuat Data</p>
          <p className="text-[#8888bb] text-xs mt-1">Periksa koneksi internet atau YouTube API key.</p>
        </div>
        <button onClick={() => mutate()}
          className="flex items-center gap-2 px-4 py-2 bg-brand-red/20 text-brand-red border border-brand-red/30 rounded-xl text-sm font-medium hover:bg-brand-red/30 transition-colors">
          <RefreshCw className="w-4 h-4" /> Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-3 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Youtube className="w-4 h-4 text-brand-red" />
          <span className="text-xs font-bold gradient-text">@kz.tutorial</span>
        </div>
        <div className="flex items-center gap-2">
          {isValidating && <RefreshCw className="w-3 h-3 text-[#555577] animate-spin" />}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-brand-green/10 border border-brand-green/20">
            <Activity className="w-3 h-3 text-brand-green" />
            <span className="text-[10px] font-semibold text-brand-green">LIVE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
          </div>
          {summary && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              summary.healthScore >= 70 ? 'bg-brand-green/20 text-brand-green' :
              summary.healthScore >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'}`}>
              {summary.healthScore}%
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24">
        {channel && <ChannelHeader channel={channel} isValidating={isValidating} />}

        {criticalCount > 0 && (
          <button onClick={() => setTab('issues')}
            className="w-full glass rounded-xl border border-red-500/40 p-3 mb-4 flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-400">{criticalCount} Isu Kritis Belum Selesai</p>
              <p className="text-[10px] text-[#8888bb]">Tap untuk lihat detail — bisa bikin channel kena strike</p>
            </div>
          </button>
        )}

        {tab === 'overview' && (
          <>
            {videos.length > 0 && <StatsGrid videos={videos} />}
            {videos.length > 0 && <EngagementChart videos={videos} />}
            {summary && (
              <button onClick={() => setTab('issues')}
                className="w-full glass rounded-xl border border-white/5 p-4 mb-4 hover:border-brand-blue/20 transition-colors text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">Channel Health</span>
                  <span className={`text-lg font-black ${summary.healthScore >= 70 ? 'text-brand-green' : summary.healthScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {summary.healthScore}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${summary.healthScore}%`,
                      background: summary.healthScore >= 70 ? 'linear-gradient(90deg,#00d4aa,#4a9eff)' :
                        summary.healthScore >= 40 ? 'linear-gradient(90deg,#ffd700,#ff7c3e)' :
                        'linear-gradient(90deg,#ff0000,#ff7c3e)' }} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-500/20 text-green-400 border border-green-500/20">{summary.fixed} Fixed</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/20">{summary.pending} Pending</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">{summary.warning} Warning</span>
                </div>
              </button>
            )}
            {videos.length > 0 && (
              <div className="glass rounded-xl border border-white/5 p-4 mb-4">
                <p className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                  <BarChart2 className="w-3.5 h-3.5 text-brand-blue" /> Ringkasan Channel
                </p>
                <div className="space-y-2">
                  {[
                    { label: 'Video terpopuler', value: videos[0]?.title?.slice(0,35)+'…', sub: `${videos[0]?.views?.toLocaleString('id-ID')} views` },
                    { label: 'Engagement terbaik', value: [...videos].sort((a,b)=>b.engagementRate-a.engagementRate)[0]?.title?.slice(0,35)+'…', sub: `${[...videos].sort((a,b)=>b.engagementRate-a.engagementRate)[0]?.engagementRate}%` },
                    { label: 'Upload terakhir', value: `${Math.min(...videos.map(v=>v.daysSinceUpload))} hari lalu`, sub: videos.find(v=>v.daysSinceUpload===Math.min(...videos.map(v=>v.daysSinceUpload)))?.title?.slice(0,30)+'…' || '' },
                    { label: 'Video ada issues', value: `${videos.filter(v=>v.isEngagementDisabled||!v.hasTags||!v.hasLanguage).length} video`, sub: 'Tap tab Issues untuk detail' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-[11px] text-[#8888bb]">{item.label}</span>
                      <div className="text-right max-w-[55%]">
                        <p className="text-[11px] text-white font-medium truncate">{item.value}</p>
                        <p className="text-[10px] text-[#555577] truncate">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'issues' && issues.length > 0 && summary && <IssuesPanel issues={issues} summary={summary} />}
        {tab === 'videos' && videos.length > 0 && <VideoTable videos={videos} />}
        {tab === 'rankings' && <SearchRankings />}
        {tab === 'tips' && <RecommendationsPanel />}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto">
        <div className="glass border-t border-white/5 px-2 pt-2 pb-safe pb-3">
          <div className="flex justify-around">
            {TABS.map(t => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              const badge = t.id === 'issues' && pendingCount > 0 ? pendingCount : null;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive ? 'text-brand-red' : 'text-[#555577]'}`}>
                  {isActive && <div className="absolute inset-0 bg-brand-red/10 rounded-xl border border-brand-red/20" />}
                  <Icon className="w-5 h-5 relative z-10" />
                  <span className="text-[9px] font-medium relative z-10">{t.label}</span>
                  {badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-red text-white text-[9px] font-bold flex items-center justify-center z-20">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function useSWRTab() {
  const [tab, setTab] = useSWRState<Tab>('overview');
  return [tab, setTab] as const;
}

function useSWRState<T>(initial: T) {
  const { useState } = require('react');
  return useState<T>(initial);
}
