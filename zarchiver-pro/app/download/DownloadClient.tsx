'use client';

import { useState } from 'react';
import {
  Download, CheckCircle2, Clock, Smartphone, Shield,
  FileArchive, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import type { VersionsData, Version } from '@/lib/versions';

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function VersionCard({ v, isLatest }: { v: Version & { downloads?: number }; isLatest: boolean }) {
  const [open, setOpen] = useState(false);
  const [clicked, setClicked] = useState(false);

  async function handleDownload() {
    setClicked(true);
    try {
      await fetch('/api/download-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: v.filename }),
      });
    } catch {/* silent */}
  }

  return (
    <div className={`glass rounded-2xl border overflow-hidden transition-all ${isLatest ? 'border-[#00d4aa]/30' : 'border-white/5'}`}>
      {isLatest && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00d4aa]/10 border-b border-[#00d4aa]/20">
          <CheckCircle2 className="w-3 h-3 text-[#00d4aa]" />
          <span className="text-[10px] font-bold text-[#00d4aa]">VERSI TERBARU</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse ml-auto" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00d4aa]/15 border border-[#00d4aa]/25 flex items-center justify-center shrink-0">
              <FileArchive className="w-5 h-5 text-[#00d4aa]" />
            </div>
            <div>
              <p className="font-black text-white">ZArchiver Pro</p>
              <p className="text-xs text-[#8888bb]">v{v.version}</p>
            </div>
          </div>

          <a
            href={`/downloads/${v.filename}`}
            download
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95 shrink-0"
            style={{ background: clicked ? 'linear-gradient(135deg,#00d4aa99,#4a9eff99)' : 'linear-gradient(135deg,#00d4aa,#4a9eff)' }}
          >
            {clicked ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {clicked ? 'Berhasil!' : 'Download'}
          </a>
        </div>

        {/* Info pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-white/5 text-[#8888bb] border border-white/5">
            <Shield className="w-3 h-3" /> {v.size}
          </span>
          <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-white/5 text-[#8888bb] border border-white/5">
            <Smartphone className="w-3 h-3" /> Android {v.minAndroid}+
          </span>
          <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-white/5 text-[#8888bb] border border-white/5">
            <Clock className="w-3 h-3" /> {v.releaseDate}
          </span>
          {v.downloads != null && v.downloads > 0 && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-white/5 text-[#8888bb] border border-white/5">
              <Download className="w-3 h-3" /> {fmt(v.downloads)} download
            </span>
          )}
        </div>

        {/* Changelog */}
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 text-[11px] text-[#555577] hover:text-white transition-colors"
        >
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Lihat Changelog
        </button>
        {open && (
          <p className="mt-2 text-[11px] text-[#8888bb] bg-white/3 rounded-xl p-3 leading-relaxed">
            {v.changelog}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DownloadClient({ data }: { data: VersionsData }) {
  const versions = data.versions ?? [];
  const latestVer = data.latest ?? '';

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 gap-3 text-[#555577]">
        <AlertTriangle className="w-8 h-8" />
        <p className="text-sm">Belum ada versi yang tersedia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Warning */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-300/80 leading-relaxed">
          Aktifkan <strong>"Install dari sumber tidak dikenal"</strong> di pengaturan Android sebelum install. APK ini sudah aman dan sudah di-sign ulang.
        </p>
      </div>

      {versions.map(v => (
        <VersionCard key={v.version} v={v} isLatest={v.version === latestVer} />
      ))}
    </div>
  );
}
