'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import {
  BarChart2, AlertTriangle, Video, Lightbulb,
  Youtube, WifiOff, RefreshCw, Activity
} from 'lucide-react';
import ChannelHeader from '@/components/ChannelHeader';
import StatsGrid from '@/components/StatsGrid';
import IssuesPanel from '@/components/IssuesPanel';
import VideoTable from '@/components/VideoTable';
import RecommendationsPanel from '@/components/RecommendationsPanel';
import EngagementChart from '@/components/EngagementChart';
import NotificationManager from '@/components/NotificationManager';
import TopicComparePanel from '@/components/TopicComparePanel';
import type { ChannelStats, VideoStats, IssueCheck, IssueSummary } from '@/lib/youtube';

type Tab = 'overview' | 'issues' | 'videos' | 'topik' | 'tips';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'issues',   label: 'Issues',   icon: AlertTriangle },
  { id: 'videos',   label: 'Video',    icon: Video },
  { id: 'topik',    label: 'Topik',    icon: Activity },
  { id: 'tips',     label: 'Tips',     icon: Lightbulb },
];

interface DashboardData {
  channel: ChannelStats; videos: VideoStats[];
  issues: IssueCheck[]; summary: IssueSummary;
  timestamp: string;
}

const fetcher = (url: string) =>
  fetch(url).then(r => r.json()).then(r => {
    const d = r as { data: DashboardData; timestamp: string };
    return { ...d.data, timestamp: d.timestamp } as DashboardData;
  });

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncMsg, setLastSyncMsg] = useState('');

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

  // Force sync — bypass server cache, ambil fresh dari YouTube
  const forceSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setLastSyncMsg('');
    try {
      await mutate(
        fetch('/api/data?refresh=1').then(r => r.json()).then(r => {
          const d = r as { data: DashboardData; timestamp: string };
          return { ...d.data, timestamp: d.timestamp } as DashboardData;
        }),
        { revalidate: false }
      );
      setLastSyncMsg('Data berhasil diperbarui!');
      setTimeout(() => setLastSyncMsg(''), 3000);
    } catch {
      setLastSyncMsg('Sync gagal, coba lagi');
      setTimeout(() => setLastSyncMsg(''), 3000);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, mutate]);

  const channel = data?.channel ?? null;
  const videos = data?.videos ?? [];
  const issues = data?.issues ?? [];
  const summary = data?.summary ?? null;
  const lastSync = data?.timestamp ?? new Date().toISOString();

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
          className="flex items-center gap-2 px-4 py-2 bg-brand-red/20 text-brand-red border border-brand-red/30 rounded-xl text-sm font-medium">
          <RefreshCw className="w-4 h-4" /> Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] flex flex-col max-w-lg mx-auto">
      <NotificationManager issues={issues} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Youtube className="w-4 h-4 text-brand-red" />
          <span className="text-xs font-bold text-white">@kz.tutorial</span>
        </div>
        <div className="flex items-center gap-2">
          {/* LIVE indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#00d4aa]/10 border border-[#00d4aa]/20">
            <Activity className="w-3 h-3 text-[#00d4aa]" />
            <span className="text-[10px] font-semibold text-[#00d4aa]">LIVE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse" />
          </div>

          {/* Force Sync button — tap ini kalau sudah fix issue di YouTube */}
          <button
            onClick={forceSync}
            disabled={isSyncing}
            title="Sync sekarang — ambil data terbaru dari YouTube"
            className="flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all disabled:opacity-50
              bg-white/5 border-white/10 text-[#8888bb] hover:bg-white/10 hover:text-white active:scale-95">
            <RefreshCw className={`w-3 h-3 ${isSyncing || isValidating ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>

          {summary && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              summary.healthScore >= 70 ? 'bg-[#00d4aa]/20 text-[#00d4aa]' :
              summary.healthScore >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'}`}>
              {summary.healthScore}%
            </span>
          )}
        </div>
      </div>

      {/* Sync success/error toast */}
      {lastSyncMsg && (
        <div className={`mx-4 mt-2 px-3 py-2 rounded-lg text-[11px] font-medium text-center ${
          lastSyncMsg.includes('berhasil') ? 'bg-[#00d4aa]/15 text-[#00d4aa] border border-[#00d4aa]/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
          {lastSyncMsg}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24">
        {channel && <ChannelHeader channel={channel} lastSync={lastSync} />}

        {criticalCount > 0 && (
          <button onClick={() => setTab('issues')}
            className="w-full rounded-xl border border-red-500/40 bg-red-500/5 p-3 mb-4 flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-400">{criticalCount} Isu Kritis Belum Selesai</p>
              <p className="text-[10px] text-[#8888bb]">Tap untuk lihat detail</p>
            </div>
          </button>
        )}

        {tab === 'overview' && (
          <>
            {videos.length > 0 && <StatsGrid videos={videos} />}
            {videos.length > 0 && <EngagementChart videos={videos} />}
            {summary && (
              <button onClick={() => setTab('issues')}
                className="w-full rounded-xl border border-white/5 bg-white/3 p-4 mb-4 hover:border-white/10 transition-colors text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">Channel Health</span>
                  <span className={`text-lg font-black ${summary.healthScore >= 70 ? 'text-[#00d4aa]' : summary.healthScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {summary.healthScore}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${summary.healthScore}%`,
                      background: summary.healthScore >= 70
                        ? 'linear-gradient(90deg,#00d4aa,#4a9eff)'
                        : summary.healthScore >= 40
                        ? 'linear-gradient(90deg,#ffd700,#ff7c3e)'
                        : 'linear-gradient(90deg,#ff0000,#ff7c3e)' }} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-500/20 text-green-400 border border-green-500/20">{summary.fixed} Fixed</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/20">{summary.pending} Pending</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">{summary.warning} Warning</span>
                </div>
              </button>
            )}
          </>
        )}

        {tab === 'issues'   && issues.length > 0 && summary && <IssuesPanel issues={issues} summary={summary} />}
        {tab === 'videos'   && videos.length > 0 && <VideoTable videos={videos} />}
        {tab === 'topik'    && videos.length > 0 && <TopicComparePanel videos={videos} />}
        {tab === 'tips' && <RecommendationsPanel />}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto">
        <div className="border-t border-white/5 bg-[#0a0a14]/95 backdrop-blur-xl px-2 pt-2 pb-6">
          <div className="flex justify-around">
            {TABS.map(t => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              const badge = t.id === 'issues' && pendingCount > 0 ? pendingCount : null;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive ? 'text-red-500' : 'text-[#555577]'}`}>
                  {isActive && <div className="absolute inset-0 bg-red-500/10 rounded-xl border border-red-500/20" />}
                  <Icon className="w-5 h-5 relative z-10" />
                  <span className="text-[9px] font-medium relative z-10">{t.label}</span>
                  {badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center z-20">
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
