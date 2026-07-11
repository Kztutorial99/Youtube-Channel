'use client';

import {
  Clock, AlertTriangle, AlertCircle, Lightbulb,
  ChevronDown, ChevronUp, ExternalLink, CheckCircle2,
  Youtube, Copy, Check, Pencil, SquareCheckBig, Square, ExternalLink as OpenAll
} from 'lucide-react';
import { useState, useCallback } from 'react';
import type { IssueCheck } from '@/lib/youtube';

interface IssueSummary {
  total: number; fixed: number; pending: number;
  warning: number; critical: number; healthScore: number;
}

interface Props { issues: IssueCheck[]; summary: IssueSummary; }

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'critical') return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
  if (severity === 'high') return <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />;
  if (severity === 'medium') return <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />;
  return <AlertTriangle className="w-4 h-4 text-[#555577] shrink-0" />;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'warning') return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
      <AlertTriangle className="w-2.5 h-2.5" /> Perlu Dicek
    </span>
  );
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/25">
      <Clock className="w-2.5 h-2.5" /> Belum Fix
    </span>
  );
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try { await navigator.clipboard.writeText(text); }
    catch {
      const el = document.createElement('textarea');
      el.value = text; document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button onClick={handleCopy}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border shrink-0 ${
        copied
          ? 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30'
          : 'bg-white/8 text-[#8888bb] border-white/10 hover:bg-white/15 hover:text-white'
      }`}>
      {copied ? <><Check className="w-3 h-3" /> Tersalin!</> : <><Copy className="w-3 h-3" /> {label ?? 'Salin'}</>}
    </button>
  );
}

export default function IssuesPanel({ issues, summary }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'warning'>('all');
  const [showAllVideos, setShowAllVideos] = useState<Record<string, boolean>>({});
  // Bulk select per issue: { [issueId]: Set<videoId> }
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});

  const activeIssues = issues.filter(i => i.status !== 'fixed');
  const filtered = filter === 'all' ? activeIssues : activeIssues.filter(i => i.status === filter);
  const categories = [...new Set(activeIssues.map(i => i.category))];
  const pendingCount = activeIssues.filter(i => i.status === 'pending').length;
  const warningCount = activeIssues.filter(i => i.status === 'warning').length;

  const toggleVideoSelect = (issueId: string, videoId: string) => {
    setSelected(prev => {
      const cur = new Set(prev[issueId] ?? []);
      if (cur.has(videoId)) cur.delete(videoId); else cur.add(videoId);
      return { ...prev, [issueId]: cur };
    });
  };

  const toggleSelectAll = (issueId: string, videoIds: string[]) => {
    setSelected(prev => {
      const cur = prev[issueId] ?? new Set();
      const allSelected = videoIds.every(id => cur.has(id));
      const next = new Set(allSelected ? [] : videoIds);
      return { ...prev, [issueId]: next };
    });
  };

  const openSelected = (issueId: string, type: 'youtube' | 'studio') => {
    const ids = Array.from(selected[issueId] ?? []);
    ids.forEach(vid => {
      const url = type === 'youtube'
        ? `https://www.youtube.com/watch?v=${vid}`
        : `https://studio.youtube.com/video/${vid}/edit`;
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  };

  return (
    <div className="space-y-3 pb-4">
      {/* Health Summary */}
      <div className="glass rounded-xl border border-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-white">Channel Health</p>
          <span className={`text-xl font-black ${summary.healthScore >= 70 ? 'text-[#00d4aa]' : summary.healthScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
            {summary.healthScore}%
          </span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${summary.healthScore}%`, background: summary.healthScore >= 70 ? 'linear-gradient(90deg,#00d4aa,#4a9eff)' : summary.healthScore >= 40 ? 'linear-gradient(90deg,#ffd700,#ff7c3e)' : 'linear-gradient(90deg,#ff0000,#ff7c3e)' }} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Terselesaikan', count: summary.fixed, color: 'text-[#00d4aa]', bg: 'bg-[#00d4aa]/10 border-[#00d4aa]/20' },
            { label: 'Belum Fix', count: pendingCount, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
            { label: 'Perlu Dicek', count: warningCount, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          ].map(s => (
            <div key={s.label} className={`rounded-lg border p-2 text-center ${s.bg}`}>
              <p className={`text-base font-black ${s.color}`}>{s.count}</p>
              <p className="text-[9px] text-[#8888bb] font-medium">{s.label}</p>
            </div>
          ))}
        </div>
        {summary.fixed > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#00d4aa]/5 border border-[#00d4aa]/15">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00d4aa] shrink-0" />
            <p className="text-[10px] text-[#00d4aa]">
              <span className="font-bold">{summary.fixed} issue</span> terselesaikan & otomatis dihapus setelah divalidasi YouTube API
            </p>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {([
          { id: 'all', label: `Semua (${activeIssues.length})` },
          { id: 'pending', label: `Belum Fix (${pendingCount})` },
          { id: 'warning', label: `Perlu Dicek (${warningCount})` },
        ] as const).map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${filter === f.id ? 'bg-brand-red/20 text-brand-red border-brand-red/30' : 'bg-white/5 text-[#8888bb] border-white/5 hover:border-white/10'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {activeIssues.length === 0 && (
        <div className="glass rounded-xl border border-[#00d4aa]/20 bg-[#00d4aa]/5 p-6 text-center">
          <CheckCircle2 className="w-10 h-10 text-[#00d4aa] mx-auto mb-3" />
          <p className="text-sm font-bold text-white mb-1">Semua Issue Beres!</p>
          <p className="text-[11px] text-[#8888bb]">Tidak ada masalah yang terdeteksi.</p>
        </div>
      )}

      {categories.map(cat => {
        const catIssues = filtered.filter(i => i.category === cat);
        if (!catIssues.length) return null;
        return (
          <div key={cat} className="glass rounded-xl border border-white/5 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/5 bg-white/3">
              <p className="text-[11px] font-bold text-[#8888bb] uppercase tracking-wider">{cat}</p>
            </div>
            <div className="divide-y divide-white/5">
              {catIssues.map(issue => {
                const isOpen = expanded === issue.id;
                const showAll = showAllVideos[issue.id] ?? false;
                const allVideoIds = issue.affectedVideoIds ?? [];
                const videoCount = allVideoIds.length;
                const displayCount = showAll ? videoCount : Math.min(videoCount, 3);
                const sel = selected[issue.id] ?? new Set<string>();
                const selCount = sel.size;
                const allSelected = videoCount > 0 && videoCount === selCount;

                return (
                  <div key={issue.id} className="p-3">
                    <button className="w-full text-left flex items-start gap-2.5"
                      onClick={() => setExpanded(isOpen ? null : issue.id)}>
                      <SeverityIcon severity={issue.severity} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-xs font-semibold text-white leading-tight">{issue.title}</p>
                          {isOpen ? <ChevronUp className="w-3 h-3 text-[#555577] shrink-0" /> : <ChevronDown className="w-3 h-3 text-[#555577] shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={issue.status} />
                          <span className="text-[10px] text-[#555577] capitalize">{issue.severity}</span>
                          {videoCount > 0 && <span className="text-[10px] text-[#555577]">{videoCount} video</span>}
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="mt-3 ml-6 space-y-3">
                        <p className="text-[11px] text-[#8888bb] leading-relaxed">{issue.description}</p>

                        {/* Langkah aksi */}
                        {issue.action && (
                          <div className="flex items-start gap-1.5 p-2.5 rounded-lg bg-[#4a9eff]/10 border border-[#4a9eff]/20">
                            <Lightbulb className="w-3.5 h-3.5 text-[#4a9eff] shrink-0 mt-0.5" />
                            <p className="text-[11px] text-[#4a9eff] leading-relaxed">{issue.action}</p>
                          </div>
                        )}

                        {/* Saran siap salin — hanya untuk konten yang bisa langsung dipakai */}
                        {issue.suggestion && (
                          <div className="rounded-lg border border-[#00d4aa]/25 bg-[#00d4aa]/5 overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-[#00d4aa]/15 gap-2">
                              <p className="text-[10px] font-bold text-[#00d4aa] truncate">
                                {issue.suggestionLabel ?? 'Siap Salin'}
                              </p>
                              <CopyButton text={issue.suggestion} />
                            </div>
                            <pre className="px-3 py-2.5 text-[10px] text-[#ccddcc] leading-relaxed whitespace-pre-wrap font-sans break-words">
                              {issue.suggestion}
                            </pre>
                          </div>
                        )}

                        {/* Video bermasalah dengan bulk-select */}
                        {issue.affectedItems && issue.affectedItems.length > 0 && (
                          <div>
                            {/* Header + select all + buka semua */}
                            <div className="flex items-center justify-between mb-2">
                              <button
                                onClick={() => toggleSelectAll(issue.id, allVideoIds)}
                                className="flex items-center gap-1.5 text-[10px] text-[#8888bb] hover:text-white transition-colors font-medium">
                                {allSelected
                                  ? <SquareCheckBig className="w-3.5 h-3.5 text-[#4a9eff]" />
                                  : <Square className="w-3.5 h-3.5" />}
                                {allSelected ? 'Batalkan Semua' : `Pilih Semua (${videoCount})`}
                              </button>

                              {selCount > 0 && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => openSelected(issue.id, 'youtube')}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/15 text-red-400 border border-red-500/20 text-[10px] font-semibold hover:bg-red-500/25 transition-colors">
                                    <ExternalLink className="w-3 h-3" />
                                    Buka {selCount} di YT
                                  </button>
                                  <button
                                    onClick={() => openSelected(issue.id, 'studio')}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#4a9eff]/15 text-[#4a9eff] border border-[#4a9eff]/20 text-[10px] font-semibold hover:bg-[#4a9eff]/25 transition-colors">
                                    <Pencil className="w-3 h-3" />
                                    Edit {selCount} di Studio
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              {issue.affectedItems.slice(0, displayCount).map((title, i) => {
                                const videoId = allVideoIds[i];
                                const isChecked = sel.has(videoId);
                                const ytUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
                                const studioUrl = videoId ? `https://studio.youtube.com/video/${videoId}/edit` : null;

                                return (
                                  <div key={i}
                                    className={`flex items-center gap-2 border rounded-lg px-2.5 py-2 transition-colors ${isChecked ? 'bg-[#4a9eff]/10 border-[#4a9eff]/25' : 'bg-white/3 border-white/5'}`}>
                                    {/* Checkbox */}
                                    <button
                                      onClick={() => videoId && toggleVideoSelect(issue.id, videoId)}
                                      className="shrink-0">
                                      {isChecked
                                        ? <SquareCheckBig className="w-4 h-4 text-[#4a9eff]" />
                                        : <Square className="w-4 h-4 text-[#555577] hover:text-[#8888bb]" />}
                                    </button>

                                    <Youtube className="w-3 h-3 text-brand-red shrink-0" />
                                    <p className="text-[10px] text-[#ccccdd] flex-1 leading-snug line-clamp-2">{title}</p>

                                    <div className="flex gap-1 shrink-0">
                                      {ytUrl && (
                                        <a href={ytUrl} target="_blank" rel="noopener noreferrer"
                                          onClick={e => e.stopPropagation()}
                                          title="Buka di YouTube"
                                          className="p-1 rounded-md bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                      {studioUrl && (
                                        <a href={studioUrl} target="_blank" rel="noopener noreferrer"
                                          onClick={e => e.stopPropagation()}
                                          title="Edit di YouTube Studio"
                                          className="p-1 rounded-md bg-[#4a9eff]/15 text-[#4a9eff] hover:bg-[#4a9eff]/25 transition-colors text-[8px] font-bold leading-none flex items-center px-1.5">
                                          <Pencil className="w-2.5 h-2.5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {videoCount > 3 && (
                              <button
                                onClick={() => setShowAllVideos(prev => ({ ...prev, [issue.id]: !showAll }))}
                                className="mt-1.5 text-[10px] text-[#4a9eff] hover:text-[#7ab8ff] font-medium">
                                {showAll ? 'Sembunyikan' : `Lihat ${videoCount - 3} video lainnya`}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
