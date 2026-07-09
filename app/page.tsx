'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, AlertTriangle, Video, Search, Lightbulb,
  RefreshCw, Youtube, Wifi, WifiOff
} from 'lucide-react';
import ChannelHeader from '@/components/ChannelHeader';
import StatsGrid from '@/components/StatsGrid';
import IssuesPanel from '@/components/IssuesPanel';
import VideoTable from '@/components/VideoTable';
import SearchRankings from '@/components/SearchRankings';
import RecommendationsPanel from '@/components/RecommendationsPanel';
import SyncButton from '@/components/SyncButton';
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
  total: number;
  fixed: number;
  pending: number;
  warning: number;
  critical: number;
  healthScore: number;
}

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [channel, setChannel] = useState<ChannelStats | null>(null);
  const [videos, setVideos] = useState<VideoStats[]>([]);
  const [issues, setIssues] = useState<IssueCheck[]>([]);
  const [summary, setSummary] = useState<IssueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string>(new Date().toISOString());
  const [online, setOnline] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [chRes, vidRes, issRes] = await Promise.all([
        fetch('/api/channel'),
        fetch('/api/videos'),
        fetch('/api/issues'),
      ]);
      const [chJson, vidJson, issJson] = await Promise.all([
        chRes.json(), vidRes.json(), issRes.json()
      ]);
      if (chJson.success) setChannel(chJson.data);
      if (vidJson.success) setVideos(vidJson.data);
      if (issJson.success) {
        setIssues(issJson.data.issues);
        setSummary(issJson.data.summary);
      }
      setLastSync(new Date().toISOString());
    } catch {
      setError('Gagal memuat data. Periksa koneksi internet.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const handleSynced = (data: { channel: unknown; videos: unknown; issues: unknown; summary: unknown }) => {
    // Validate shape before applying to state to avoid runtime crashes on malformed API responses
    if (data.channel && typeof data.channel === 'object') setChannel(data.channel as ChannelStats);
    if (Array.isArray(data.videos)) setVideos(data.videos as VideoStats[]);
    if (Array.isArray(data.issues)) setIssues(data.issues as IssueCheck[]);
    if (data.summary && typeof data.summary === 'object') setSummary(data.summary as IssueSummary);
    setLastSync(new Date().toISOString());
  };

  const pendingCount = issues.filter(i => i.status === 'pending').length;
  const criticalCount = issues.filter(i => i.severity === 'critical' && i.status !== 'fixed').length;

  if (loading && !channel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0a0a14]">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-brand-red/20 flex items-center justify-center">
            <Youtube className="w-8 h-8 text-brand-red" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-brand-red/40 animate-ping" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold">Memuat Dashboard</p>
          <p className="text-[#8888bb] text-sm mt-1">Mengambil data dari YouTube API...</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-brand-red/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error && !channel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-[#0a0a14]">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold">Gagal Memuat Data</p>
          <p className="text-[#8888bb] text-sm mt-1">{error}</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 bg-brand-red/20 text-brand-red border border-brand-red/30 rounded-xl text-sm font-medium hover:bg-brand-red/30 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] flex flex-col max-w-lg mx-auto">
      {/* Top status bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-1.5">
          <Youtube className="w-4 h-4 text-brand-red" />
          <span className="text-xs font-bold gradient-text">@kz.tutorial Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          {!online && (
            <span className="flex items-center gap-1 text-[10px] text-red-400">
              <WifiOff className="w-3 h-3" /> Offline
            </span>
          )}
          {loading && (
            <RefreshCw className="w-3 h-3 text-[#8888bb] animate-spin" />
          )}
          {summary && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              summary.healthScore >= 70 ? 'bg-brand-green/20 text-brand-green' :
              summary.healthScore >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {summary.healthScore}% Health
            </span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-24">

        {/* Channel header — always visible */}
        {channel && <ChannelHeader channel={channel} lastSync={lastSync} />}

        {/* Sync button — always visible */}
        <SyncButton onSynced={handleSynced} />

        {/* Critical alert banner */}
        {criticalCount > 0 && (
          <div
            className="glass rounded-xl border border-red-500/40 p-3 mb-4 flex items-center gap-3 cursor-pointer"
            onClick={() => setTab('issues')}
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-400">{criticalCount} Isu Kritis Belum Diselesaikan!</p>
              <p className="text-[10px] text-[#8888bb]">Tap untuk lihat detail → Bisa bikin channel kena strike</p>
            </div>
          </div>
        )}

        {/* Tab content */}
        {tab === 'overview' && (
          <>
            {videos.length > 0 && <StatsGrid videos={videos} />}
            {videos.length > 0 && <EngagementChart videos={videos} />}
            {summary && (
              <div
                className="glass rounded-xl border border-white/5 p-4 mb-4 cursor-pointer hover:border-brand-blue/20 transition-colors"
                onClick={() => setTab('issues')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">Channel Health</span>
                  <span className={`text-lg font-black ${summary.healthScore >= 70 ? 'text-brand-green' : summary.healthScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {summary.healthScore}%
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${summary.healthScore}%`,
                      background: summary.healthScore >= 70
                        ? 'linear-gradient(90deg, #00d4aa, #4a9eff)'
                        : summary.healthScore >= 40
                        ? 'linear-gradient(90deg, #ffd700, #ff7c3e)'
                        : 'linear-gradient(90deg, #ff0000, #ff7c3e)',
                    }}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-500/20 text-green-400 border border-green-500/20">✅ {summary.fixed} Fixed</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/20">❌ {summary.pending} Pending</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">⚠️ {summary.warning} Warning</span>
                </div>
                <p className="text-[10px] text-brand-blue mt-2">Tap untuk lihat semua issues →</p>
              </div>
            )}
            {/* Quick stats summary */}
            {videos.length > 0 && (
              <div className="glass rounded-xl border border-white/5 p-4 mb-4">
                <p className="text-sm font-semibold text-white mb-3">📊 Ringkasan Channel</p>
                <div className="space-y-2">
                  {[
                    { label: 'Video terpopuler', value: videos[0]?.title?.slice(0, 35) + '…', sub: `${videos[0]?.views?.toLocaleString('id-ID')} views` },
                    { label: 'Engagement terbaik', value: [...videos].sort((a, b) => b.engagementRate - a.engagementRate)[0]?.title?.slice(0, 35) + '…', sub: `${[...videos].sort((a, b) => b.engagementRate - a.engagementRate)[0]?.engagementRate}%` },
                    { label: 'Upload terakhir', value: `${Math.min(...videos.map(v => v.daysSinceUpload))} hari yang lalu`, sub: videos.find(v => v.daysSinceUpload === Math.min(...videos.map(v => v.daysSinceUpload)))?.title?.slice(0, 30) + '…' || '' },
                    { label: 'Video dengan issues', value: `${videos.filter(v => v.isEngagementDisabled || !v.hasTags || !v.hasLanguage).length} video`, sub: 'Tap tab Issues untuk detail' },
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

        {tab === 'issues' && issues.length > 0 && summary && (
          <IssuesPanel issues={issues} summary={summary} />
        )}

        {tab === 'videos' && videos.length > 0 && (
          <VideoTable videos={videos} />
        )}

        {tab === 'rankings' && (
          <SearchRankings />
        )}

        {tab === 'tips' && (
          <RecommendationsPanel />
        )}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto pb-safe">
        <div className="glass border-t border-white/5 px-2 pt-2 pb-3">
          <div className="flex justify-around">
            {TABS.map(t => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              const badge = t.id === 'issues' && pendingCount > 0 ? pendingCount : null;

              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                    isActive
                      ? 'text-brand-red'
                      : 'text-[#555577] hover:text-[#8888bb]'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-brand-red/10 rounded-xl border border-brand-red/20" />
                  )}
                  <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-brand-red' : ''}`} />
                  <span className={`text-[9px] font-medium relative z-10 ${isActive ? 'text-brand-red' : ''}`}>{t.label}</span>
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
