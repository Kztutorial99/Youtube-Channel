'use client';

import { useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-[#0a0a14]">
      <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-lg">Terjadi Kesalahan</p>
        <p className="text-[#8888bb] text-sm mt-1 max-w-xs">
          {error.message || 'Ada yang error di dashboard. Coba refresh halaman.'}
        </p>
        {error.digest && (
          <p className="text-[#444466] text-[10px] mt-1 font-mono">ID: {error.digest}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 bg-brand-red/20 text-brand-red border border-brand-red/30 rounded-xl text-sm font-medium hover:bg-brand-red/30 transition-colors"
      >
        <RefreshCw className="w-4 h-4" /> Coba Lagi
      </button>
    </div>
  );
}
