'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import type { IssueCheck } from '@/lib/youtube';

interface Props {
  issues: IssueCheck[];
  summary: {
    total: number;
    fixed: number;
    pending: number;
    warning: number;
    critical: number;
    healthScore: number;
  };
}

const severityLabel: Record<string, string> = {
  critical: '🔴 Kritis',
  high: '🟠 Tinggi',
  medium: '🟡 Sedang',
  low: '🟢 Rendah',
};

const categoryOrder = ['Keamanan', 'Branding', 'SEO Judul', 'SEO Tags', 'SEO Metadata', 'Engagement', 'Konsistensi', 'Konten', 'Aksesibilitas'];

export default function IssuesPanel({ issues, summary }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'fixed' | 'warning'>('all');

  const grouped = categoryOrder.reduce<Record<string, IssueCheck[]>>((acc, cat) => {
    const items = issues.filter(i => i.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  const filtered = filter === 'all' ? issues : issues.filter(i => i.status === filter);
  const filteredGrouped = categoryOrder.reduce<Record<string, IssueCheck[]>>((acc, cat) => {
    const items = filtered.filter(i => i.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  const scoreColor = summary.healthScore >= 70 ? 'text-brand-green' : summary.healthScore >= 40 ? 'text-brand-yellow' : 'text-brand-red';
  const scoreGlow = summary.healthScore >= 70 ? 'glow-green' : summary.healthScore >= 40 ? 'glow-yellow' : 'glow-red';

  return (
    <div className="mb-4 animate-fade-in">
      {/* Health Score */}
      <div className={`glass rounded-2xl p-5 mb-3 border border-white/5 ${scoreGlow}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-blue" />
            <span className="font-semibold text-sm">Channel Health Score</span>
          </div>
          <span className={`text-3xl font-black counter ${scoreColor}`}>{summary.healthScore}%</span>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
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
        {/* Summary pills */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <span className="px-2 py-1 rounded-lg text-xs bg-green-500/20 text-green-400 border border-green-500/20">
            ✅ {summary.fixed} Fixed
          </span>
          <span className="px-2 py-1 rounded-lg text-xs bg-red-500/20 text-red-400 border border-red-500/20">
            ❌ {summary.pending} Pending
          </span>
          <span className="px-2 py-1 rounded-lg text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">
            ⚠️ {summary.warning} Warning
          </span>
          {summary.critical > 0 && (
            <span className="px-2 py-1 rounded-lg text-xs bg-red-600/30 text-red-300 border border-red-600/30 font-semibold">
              🔴 {summary.critical} Kritis!
            </span>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {(['all', 'pending', 'warning', 'fixed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f
                ? 'bg-white/15 text-white border border-white/20'
                : 'bg-white/5 text-[#8888bb] border border-white/5 hover:bg-white/10'
            }`}
          >
            {f === 'all' ? `Semua (${issues.length})` : f === 'pending' ? `Pending (${summary.pending})` : f === 'warning' ? `Warning (${summary.warning})` : `Fixed (${summary.fixed})`}
          </button>
        ))}
      </div>

      {/* Issues list */}
      <div className="space-y-2">
        {Object.entries(filteredGrouped).map(([cat, catIssues]) => (
          <div key={cat}>
            <p className="text-[10px] uppercase tracking-widest text-[#555577] font-semibold mb-2 px-1">{cat}</p>
            {catIssues.map(issue => {
              const isOpen = expanded === issue.id;
              const statusIcon = issue.status === 'fixed'
                ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                : issue.status === 'warning'
                ? <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                : <XCircle className="w-4 h-4 text-red-400 shrink-0" />;

              return (
                <div
                  key={issue.id}
                  className={`glass rounded-xl border mb-2 overflow-hidden transition-all ${
                    issue.status === 'fixed' ? 'border-green-500/10 opacity-75' :
                    issue.status === 'warning' ? 'border-yellow-500/20' :
                    issue.severity === 'critical' ? 'border-red-500/30' :
                    'border-white/5'
                  }`}
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : issue.id)}
                    className="w-full flex items-center gap-3 p-3 text-left"
                  >
                    {statusIcon}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{issue.title}</p>
                      <p className="text-[10px] text-[#8888bb]">{severityLabel[issue.severity]}</p>
                    </div>
                    {issue.affectedCount !== undefined && issue.affectedCount > 0 && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/20">
                        {issue.affectedCount} video
                      </span>
                    )}
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#555577] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#555577] shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 border-t border-white/5 pt-3 animate-slide-up">
                      <p className="text-xs text-[#aaaacc] mb-2">{issue.description}</p>
                      {issue.affectedItems && issue.affectedItems.length > 0 && (
                        <div className="mb-2">
                          <p className="text-[10px] text-[#666688] mb-1 uppercase tracking-wide">Video Terdampak:</p>
                          <ul className="space-y-1">
                            {issue.affectedItems.slice(0, 5).map((item, i) => (
                              <li key={i} className="text-[11px] text-[#8888bb] pl-2 border-l-2 border-red-500/30 truncate">{item}</li>
                            ))}
                            {issue.affectedItems.length > 5 && (
                              <li className="text-[11px] text-[#555577]">+{issue.affectedItems.length - 5} lainnya</li>
                            )}
                          </ul>
                        </div>
                      )}
                      <div className="bg-brand-blue/10 border border-brand-blue/20 rounded-lg p-2 mt-2">
                        <p className="text-[10px] text-brand-blue font-medium mb-0.5">💡 Action:</p>
                        <p className="text-[11px] text-[#aaaacc]">{issue.action}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
