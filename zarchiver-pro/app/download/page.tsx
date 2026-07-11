import { Suspense } from 'react';
import { getVersions } from '@/lib/versions';
import DownloadClient from './DownloadClient';

export const revalidate = 60;

export default async function DownloadPage() {
  const data = await getVersions().catch(() => ({ latest: '', versions: [] }));
  return (
    <div className="min-h-screen px-4 pb-28 md:pb-12 max-w-2xl mx-auto">
      <div className="pt-8 md:pt-12 mb-6">
        <h1 className="text-2xl font-black text-white mb-1">Download APK</h1>
        <p className="text-[#8888bb] text-sm">Pilih versi yang kamu mau. Langsung download, tanpa ribet.</p>
      </div>
      <Suspense fallback={<div className="text-[#555577] text-sm">Memuat...</div>}>
        <DownloadClient data={data} />
      </Suspense>
    </div>
  );
}
