'use client';

import { CheckCircle2, Clock, AlertTriangle, AlertCircle, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { IssueCheck } from '@/lib/youtube';

interface IssueSummary {
  total: number; fixed: number; pending: number;
  warning: number; critical: number; healthScore: number;
}

interface Props {
  issues: IssueCheck[];
  summary: IssueSummary;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'fixed') return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-green/15 text-brand-green border border-brand-green/25">
      <CheckCircle2 className="w-2.5 h-2.5" /> Selesai
    </span>
  );
  if (status === 'warning') return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
      <AlertTriangle className="w-2.5 h-2.5" /> Periksa
    </span>
  );
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/25">
      <Clock className="w-2.5 h-2.5" /> Pending
    </span>
  );
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'critical') return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
  if (severity === 'high') return <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />;
  if (severity === 'medium') return <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />;
  return <AlertTriangle className="w-4 h-4 text-[#555577] shrink-0" />;
}

export default function IssuesPanel({ issues, summary }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'fixed' | 'warning'>('all');

  const filtered = filter === 'all' ? issues : issues.filter(i => i.status === filter);
  const categories = [...new Set(issues.map(i => i.category))];

  return (
    <div className="space-y-3 pb-4">
      {/* Summary */}
      <div className="glass rounded-xl border border-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-white">Channel Health</p>
          <span className={`text-xl font-black ${summary.healthScore >= 70 ? 'text-brand-green' : summary.healthScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
            {summary.healthScore}%
          </span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${summary.healthScore}%`,
              background: summary.healthScore >= 70 ? 'linear-gradient(90deg,#00d4aa,#4a9eff)' :
                summary.healthScore >= 40 ? 'linear-gradient(90deg,#ffd700,#ff7c3e)' :
                'linear-gradient(90deg,#ff0000,#ff7c3e)' }} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Fixed', count: summary.fixed, color: 'text-brand-green', bg: 'bg-brand-green/10 border-brand-green/20' },
            { label: 'Pending', count: summary.pending, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
            { label: 'Warning', count: summary.warning, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          ].map(s => (
            <div key={s.label} className={`rounded-lg border p-2 text-center ${s.bg}`}>
              <p className={`text-base font-black ${s.color}`}>{s.count}</p>
              <p className="text-[9px] text-[#8888bb] font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(['all','pending','warning','fixed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all border ${filter === f ? 'bg-brand-red/20 text-brand-red border-brand-red/30' : 'bg-white/5 text-[#8888bb] border-white/5 hover:border-white/10'}`}>
            {f === 'all' ? `Semua (${summary.total})` : f === 'pending' ? `Pending (${summary.pending})` : f === 'warning' ? `Warning (${summary.warning})` : `Fixed (${summary.fixed})`}
          </button>
        ))}
      </div>

      {/* Issue list by category */}
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
                return (
                  <div key={issue.id} className="p-3">
                    <button className="w-full text-left flex items-start gap-2.5"
                      onClick={() => setExpanded(isOpen ? null : issue.id)}>
                      <SeverityIcon severity={issue.severity} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-xs font-semibold text-white leading-tight truncate">{issue.name}</p>
                          {isOpen ? <ChevronUp className="w-3 h-3 text-[#555577] shrink-0" /> : <ChevronDown className="w-3 h-3 text-[#555577] shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={issue.status} />
                          <span className="text-[10px] text-[#555577] capitalize">{issue.severity}</span>
                        </div>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="mt-2.5 ml-6.5 space-y-2">
                        <p className="text-[11px] text-[#8888bb] leading-relaxed">{issue.description}</p>
                        {issue.action && (
                          <div className="flex items-start gap-1.5 p-2.5 rounded-lg bg-brand-blue/10 border border-brand-blue/20">
                            <Lightbulb className="w-3.5 h-3.5 text-brand-blue shrink-0 mt-0.5" />
                            <p className="text-[11px] text-brand-blue leading-relaxed">{issue.action}</p>
                          </div>
                        )}
                        {issue.affectedVideos && issue.affectedVideos.length > 0 && (
                          <div className="mt-1.5">
                            <p className="text-[10px] text-[#555577] mb-1.5 font-medium">{issue.affectedVideos.length} video terdampak:</p>
                            <div className="space-y-1">
                              {issue.affectedVideos.slice(0, 3).map((v, i) => (
                                <p key={i} className="text-[10px] text-[#8888bb] truncate bg-white/3 px-2 py-1 rounded">{v}</p>
                              ))}
                              {issue.affectedVideos.length > 3 && (
                                <p className="text-[10px] text-[#555577]">+{issue.affectedVideos.length - 3} lainnya</p>
                              )}
                            </div>
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
