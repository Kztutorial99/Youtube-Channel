'use client';

import { useState, useRef } from 'react';
import { Upload, Lock, Loader2, CheckCircle2, AlertTriangle, FileArchive, LogOut, Plus } from 'lucide-react';

type Status = 'idle' | 'uploading' | 'success' | 'error';

export default function AdminPanelPage() {
  const [authed, setAuthed]   = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [authErr, setAuthErr]  = useState('');

  // Upload form state
  const [version, setVersion]     = useState('');
  const [changelog, setChangelog] = useState('');
  const [minAndroid, setMinAndroid] = useState('5.0');
  const [status, setStatus]       = useState<Status>('idle');
  const [msg, setMsg]             = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    // Client-side we just pass key to API — the API validates MODERATION_SECRET
    if (keyInput.trim().length < 4) {
      setAuthErr('Key terlalu pendek.');
      return;
    }
    sessionStorage.setItem('ak', keyInput.trim());
    setAuthed(true);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    const key  = sessionStorage.getItem('ak') || '';
    if (!file || !version || !changelog) {
      setMsg('Isi semua field!');
      setStatus('error');
      return;
    }
    setStatus('uploading');
    setMsg('Mengupload APK ke GitHub...');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('version', version);
      form.append('changelog', changelog);
      form.append('minAndroid', minAndroid);
      form.append('key', key);

      const res  = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload gagal');

      setStatus('success');
      setMsg(data.message || 'Berhasil! Vercel akan auto-deploy dalam ~1 menit.');
      setVersion(''); setChangelog(''); setMinAndroid('5.0');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err: unknown) {
      setStatus('error');
      setMsg(err instanceof Error ? err.message : 'Upload gagal');
    }
  }

  /* ─── Auth gate ─── */
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg,#4a9eff22,#00d4aa22)', border: '1px solid #4a9eff33' }}>
              <Lock className="w-7 h-7 text-[#4a9eff]" />
            </div>
            <h1 className="text-xl font-black text-white mb-1">Admin Panel</h1>
            <p className="text-[#555577] text-sm">Area terbatas. Masukkan admin key.</p>
          </div>

          <form onSubmit={handleAuth} className="glass rounded-2xl border border-white/5 p-5 space-y-4">
            <div>
              <label className="text-[10px] text-[#555577] block mb-1.5">Admin Key (MODERATION_SECRET)</label>
              <input
                type="password"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                placeholder="••••••••••••"
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-[#444466] outline-none focus:border-[#4a9eff]/50 transition-all"
              />
              {authErr && <p className="text-red-400 text-[10px] mt-1">{authErr}</p>}
            </div>
            <button type="submit"
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#4a9eff,#00d4aa)' }}>
              Masuk
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ─── Admin Dashboard ─── */
  return (
    <div className="min-h-screen px-4 pb-12 max-w-2xl mx-auto">
      <div className="pt-8 md:pt-12 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
            <FileArchive className="w-6 h-6 text-[#00d4aa]" /> Admin Panel
          </h1>
          <p className="text-[#555577] text-sm">Upload versi baru ZArchiver Pro.</p>
        </div>
        <button onClick={() => { setAuthed(false); sessionStorage.removeItem('ak'); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] text-[#555577] hover:text-white border border-white/5 hover:border-white/15 transition-all">
          <LogOut className="w-3.5 h-3.5" /> Keluar
        </button>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="glass rounded-2xl border border-white/5 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Plus className="w-4 h-4 text-[#00d4aa]" />
          <span className="font-bold text-white text-sm">Upload Versi Baru</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-[#555577] block mb-1.5">Nomor Versi *</label>
            <input type="text" value={version} onChange={e => setVersion(e.target.value)}
              placeholder="contoh: 1.0.1"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#444466] outline-none focus:border-[#00d4aa]/50 transition-all" />
          </div>
          <div>
            <label className="text-[10px] text-[#555577] block mb-1.5">Min Android</label>
            <input type="text" value={minAndroid} onChange={e => setMinAndroid(e.target.value)}
              placeholder="5.0"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#444466] outline-none focus:border-[#00d4aa]/50 transition-all" />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-[#555577] block mb-1.5">Changelog / Catatan Update *</label>
          <textarea value={changelog} onChange={e => setChangelog(e.target.value)}
            placeholder="Tulis perubahan di versi ini..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#444466] outline-none focus:border-[#00d4aa]/50 transition-all resize-none" />
        </div>

        <div>
          <label className="text-[10px] text-[#555577] block mb-1.5">File APK *</label>
          <input ref={fileRef} type="file" accept=".apk"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-[#00d4aa]/20 file:text-[#00d4aa] cursor-pointer" />
        </div>

        {/* Status */}
        {msg && (
          <div className={`flex items-start gap-2.5 p-3 rounded-xl text-[11px] font-medium ${
            status === 'success' ? 'bg-[#00d4aa]/10 text-[#00d4aa] border border-[#00d4aa]/20' :
            status === 'error'   ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                    'bg-[#4a9eff]/10 text-[#4a9eff] border border-[#4a9eff]/20'
          }`}>
            {status === 'uploading' && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 mt-0.5" />}
            {status === 'success'   && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
            {status === 'error'     && <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
            <span className="leading-relaxed">{msg}</span>
          </div>
        )}

        <button type="submit" disabled={status === 'uploading'}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#00d4aa,#4a9eff)' }}>
          {status === 'uploading'
            ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Mengupload...</span>
            : <span className="flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> Upload & Deploy</span>
          }
        </button>
      </form>

      <p className="text-center text-[#333355] text-[10px] mt-6">
        Setelah upload, Vercel akan auto-deploy dalam ~1 menit. Halaman download langsung update.
      </p>
    </div>
  );
}
