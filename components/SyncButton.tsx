'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  onSynced: (data: {
    channel: unknown;
    videos: unknown;
    issues: unknown;
    summary: unknown;
  }) => void;
}

export default function SyncButton({ onSynced }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setStatus('loading');
    setMessage('Mengambil data terbaru dari YouTube API...');

    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const json = await res.json();

      if (json.success) {
        onSynced(json.data);
        setStatus('success');
        setMessage(json.message || 'Sync berhasil!');
        setTimeout(() => setStatus('idle'), 4000);
      } else {
        throw new Error(json.error || 'Sync gagal');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={handleSync}
        disabled={status === 'loading'}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
          status === 'loading'
            ? 'bg-white/5 text-[#8888bb] cursor-not-allowed border border-white/10'
            : status === 'success'
            ? 'bg-brand-green/20 text-brand-green border border-brand-green/40 glow-green'
            : status === 'error'
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-brand-red/20 text-brand-red border border-brand-red/30 hover:bg-brand-red/30 active:scale-95'
        }`}
      >
        {status === 'loading' && <RefreshCw className="w-4 h-4 animate-spin" />}
        {status === 'success' && <CheckCircle className="w-4 h-4" />}
        {status === 'error' && <AlertCircle className="w-4 h-4" />}
        {status === 'idle' && <RefreshCw className="w-4 h-4" />}

        <span>
          {status === 'idle' ? '🔄 Sync Sekarang — Cek Update Terbaru' :
           status === 'loading' ? 'Syncing...' :
           status === 'success' ? 'Sync Berhasil!' : 'Sync Gagal'}
        </span>
      </button>

      {message && status !== 'idle' && (
        <p className={`text-center text-[11px] mt-1.5 ${
          status === 'success' ? 'text-brand-green' : status === 'error' ? 'text-red-400' : 'text-[#8888bb]'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}
