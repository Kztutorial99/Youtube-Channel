'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Download, Upload, CheckCircle2, Clock, Smartphone,
  Shield, FileArchive, ChevronDown, ChevronUp, Lock, Loader2, AlertTriangle
} from 'lucide-react';

interface VersionInfo {
  version: string;
  filename: string;
  size: string;
  releaseDate: string;
  changelog: string;
  minAndroid: string;
  downloads: number;
}

interface VersionsData {
  latest: string;
  versions: VersionInfo[];
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function VersionCard({ v, isLatest }: { v: VersionInfo; isLatest: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`glass rounded-2xl border overflow-hidden transition-all ${isLatest ? 'border-[#00d4aa]/30' : 'border-white/5'}`}>
      {isLatest && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00d4aa]/10 border-b border-[#00d4aa]/20">
          <CheckCircle2 className="w-3 h-3 text-[#00d4aa]" />
          <span className="text-[10px] font-bold text-[#00d4aa]">VERSI TERBARU</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse ml-auto" />
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#00d4aa]/15 border border-[#00d4aa]/25 flex items-center justify-center shrink-0">
              <FileArchive className="w-4 h-4 text-[#00d4aa]" />
            </div>
            <div>
              <p className="text-sm font-black text-white">ZArchiver Pro</p>
              <p className="text-[10px] text-[#8888bb]">v{v.version}</p>
            </div>
          </div>

          <a
            href={`/downloads/${v.filename}`}
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-[11px] transition-all active:scale-95 shrink-0"
            style={{ background: 'linear-gradient(135deg,#00d4aa,#4a9eff)', color: '#fff' }}
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        </div>

        {/* Info pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-full bg-white/5 text-[#8888bb] border border-white/5">
            <Shield className="w-2.5 h-2.5" /> {v.size}
          </span>
          <span className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-full bg-white/5 text-[#8888bb] border border-white/5">
            <Smartphone className="w-2.5 h-2.5" /> Android {v.minAndroid}+
          </span>
          <span className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-full bg-white/5 text-[#8888bb] border border-white/5">
            <Clock className="w-2.5 h-2.5" /> {v.releaseDate}
          </span>
          {v.downloads > 0 && (
            <span className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-full bg-white/5 text-[#8888bb] border border-white/5">
              <Download className="w-2.5 h-2.5" /> {fmt(v.downloads)} downloads
            </span>
          )}
        </div>

        {/* Changelog toggle */}
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 text-[10px] text-[#555577] hover:text-white transition-colors"
        >
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Changelog
        </button>
        {open && (
          <p className="mt-2 text-[10px] text-[#8888bb] bg-white/3 rounded-lg p-2 leading-relaxed">
            {v.changelog}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Admin Upload Panel ─── */
function AdminUpload({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [minAndroid, setMinAndroid] = useState('5.0');
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file || !key || !version || !changelog) {
      setMsg('Isi semua field dulu bang!');
      setStatus('error');
      return;
    }
    setStatus('uploading');
    setMsg('Mengupload APK...');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('version', version);
      form.append('changelog', changelog);
      form.append('minAndroid', minAndroid);
      form.append('key', key);

      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload gagal');
      setStatus('success');
      setMsg('APK berhasil diupload & di-deploy!');
      onSuccess();
      setTimeout(() => { setOpen(false); setStatus('idle'); setMsg(''); }, 3000);
    } catch (e: any) {
      setStatus('error');
      setMsg(e.message || 'Upload gagal');
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/3 text-[11px] text-[#555577] hover:text-white hover:border-white/20 transition-all"
      >
        <Lock className="w-3 h-3" /> Admin Upload Versi Baru
      </button>
    );
  }

  return (
    <div className="glass rounded-2xl border border-white/10 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#4a9eff]" />
          <span className="text-xs font-bold text-white">Upload Versi Baru</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-[#555577] hover:text-white text-xs">✕</button>
      </div>

      {/* Moderation key */}
      <div>
        <label className="text-[9px] text-[#555577] block mb-1">Admin Key</label>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="Masukkan MODERATION_SECRET"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-[#555577] outline-none focus:border-[#4a9eff]/50"
        />
      </div>

      {/* Version */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] text-[#555577] block mb-1">Versi (contoh: 1.0.1)</label>
          <input
            type="text"
            value={version}
            onChange={e => setVersion(e.target.value)}
            placeholder="1.0.1"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-[#555577] outline-none focus:border-[#4a9eff]/50"
          />
        </div>
        <div>
          <label className="text-[9px] text-[#555577] block mb-1">Min Android</label>
          <input
            type="text"
            value={minAndroid}
            onChange={e => setMinAndroid(e.target.value)}
            placeholder="5.0"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-[#555577] outline-none focus:border-[#4a9eff]/50"
          />
        </div>
      </div>

      {/* Changelog */}
      <div>
        <label className="text-[9px] text-[#555577] block mb-1">Changelog / Catatan Update</label>
        <textarea
          value={changelog}
          onChange={e => setChangelog(e.target.value)}
          placeholder="Tulis perubahan di versi ini..."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-[#555577] outline-none focus:border-[#4a9eff]/50 resize-none"
        />
      </div>

      {/* File picker */}
      <div>
        <label className="text-[9px] text-[#555577] block mb-1">File APK</label>
        <input
          ref={fileRef}
          type="file"
          accept=".apk"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-[#4a9eff]/20 file:text-[#4a9eff] cursor-pointer"
        />
      </div>

      {/* Status */}
      {msg && (
        <div className={`flex items-center gap-2 p-2 rounded-lg text-[10px] font-medium ${
          status === 'success' ? 'bg-[#00d4aa]/15 text-[#00d4aa] border border-[#00d4aa]/20' :
          status === 'error'   ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                                  'bg-[#4a9eff]/15 text-[#4a9eff] border border-[#4a9eff]/20'
        }`}>
          {status === 'uploading' && <Loader2 className="w-3 h-3 animate-spin" />}
          {status === 'success'   && <CheckCircle2 className="w-3 h-3" />}
          {status === 'error'     && <AlertTriangle className="w-3 h-3" />}
          {msg}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={status === 'uploading'}
        className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#4a9eff,#00d4aa)' }}
      >
        {status === 'uploading' ? (
          <span className="flex items-center justify-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengupload...</span>
        ) : (
          <span className="flex items-center justify-center gap-2"><Upload className="w-3.5 h-3.5" /> Upload & Deploy</span>
        )}
      </button>
    </div>
  );
}

/* ══ Main Export ══ */
export default function DownloadPanel() {
  const [data, setData] = useState<VersionsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchVersions() {
    try {
      const res = await fetch(`/downloads/versions.json?t=${Date.now()}`);
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  // Fetch on mount
  useEffect(() => { fetchVersions(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2">
        <Loader2 className="w-5 h-5 text-[#00d4aa] animate-spin" />
        <span className="text-sm text-[#8888bb]">Memuat data versi...</span>
      </div>
    );
  }

  const versions = data?.versions ?? [];
  const latestVer = data?.latest ?? '';

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="glass rounded-2xl border border-white/5 p-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#00d4aa22,#4a9eff22)', border: '1px solid #00d4aa33' }}>
            <FileArchive className="w-5 h-5 text-[#00d4aa]" />
          </div>
          <div>
            <p className="text-sm font-black text-white">ZArchiver Pro</p>
            <p className="text-[10px] text-[#8888bb]">Download gratis • Selalu update</p>
          </div>
        </div>
        <div className="flex gap-2 text-[9px]">
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 font-medium">
            <CheckCircle2 className="w-2.5 h-2.5" /> Sudah di-sign (MT Manager)
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#4a9eff]/15 text-[#4a9eff] border border-[#4a9eff]/20 font-medium">
            <Shield className="w-2.5 h-2.5" /> Aman & Bersih
          </span>
        </div>
      </div>

      {/* Version list */}
      {versions.length === 0 ? (
        <div className="text-center py-8 text-[#555577] text-sm">Belum ada versi tersedia.</div>
      ) : (
        <div className="space-y-3">
          {versions.map(v => (
            <VersionCard key={v.version} v={v} isLatest={v.version === latestVer} />
          ))}
        </div>
      )}

      {/* Admin upload */}
      <AdminUpload onSuccess={fetchVersions} />
    </div>
  );
}
