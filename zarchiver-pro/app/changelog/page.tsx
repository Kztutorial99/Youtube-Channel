import { getVersions } from '@/lib/versions';
import { List, Tag, Clock, Smartphone, Shield } from 'lucide-react';

export const revalidate = 60;

export default async function ChangelogPage() {
  const data = await getVersions().catch(() => ({ latest: '', versions: [] }));
  const versions = data.versions ?? [];

  return (
    <div className="min-h-screen px-4 pb-28 md:pb-12 max-w-2xl mx-auto">
      <div className="pt-8 md:pt-12 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#00d4aa22,#4a9eff22)', border: '1px solid #00d4aa33' }}>
            <List className="w-5 h-5 text-[#00d4aa]" />
          </div>
          <h1 className="text-2xl font-black text-white">Changelog</h1>
        </div>
        <p className="text-[#8888bb] text-sm">Riwayat semua update ZArchiver Pro.</p>
      </div>

      {versions.length === 0 ? (
        <p className="text-[#555577] text-sm text-center py-16">Belum ada riwayat versi.</p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-white/5" />

          <div className="space-y-6">
            {versions.map((v, i) => (
              <div key={v.version} className="flex gap-4">
                {/* Dot */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border ${
                    i === 0
                      ? 'bg-[#00d4aa]/20 border-[#00d4aa]/40 text-[#00d4aa]'
                      : 'bg-white/5 border-white/10 text-[#555577]'
                  }`}>
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Card */}
                <div className="flex-1 glass rounded-2xl border border-white/5 p-4 mb-2">
                  <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-black text-white">v{v.version}</span>
                        {i === 0 && (
                          <span className="text-[9px] font-bold text-[#00d4aa] bg-[#00d4aa]/10 px-2 py-0.5 rounded-full">LATEST</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-full bg-white/5 text-[#8888bb] border border-white/5">
                        <Clock className="w-2.5 h-2.5" /> {v.releaseDate}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-full bg-white/5 text-[#8888bb] border border-white/5">
                        <Shield className="w-2.5 h-2.5" /> {v.size}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-full bg-white/5 text-[#8888bb] border border-white/5">
                        <Smartphone className="w-2.5 h-2.5" /> Android {v.minAndroid}+
                      </span>
                    </div>
                  </div>

                  <p className="text-[12px] text-[#8888bb] leading-relaxed">{v.changelog}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
