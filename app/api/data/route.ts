import { NextResponse } from 'next/server';
import { getChannelStats, getAllVideos, computeIssues } from '@/lib/youtube';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let cache: { data: unknown; ts: number } | null = null;
const CACHE_TTL = 2 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === '1';
    const now = Date.now();

    if (!forceRefresh && cache && now - cache.ts < CACHE_TTL) {
      return NextResponse.json({
        success: true, data: cache.data,
        cached: true, timestamp: new Date(cache.ts).toISOString()
      });
    }

    const [channel, videos] = await Promise.all([getChannelStats(), getAllVideos()]);
    // computeIssues returns ALL issues (incl fixed) — summary dihitung dari semua
    const allIssues = await computeIssues(channel, videos);

    const totalChecks = allIssues.length;
    const fixedCount = allIssues.filter(i => i.status === 'fixed').length;
    const summary = {
      total: totalChecks,
      fixed: fixedCount,
      pending: allIssues.filter(i => i.status === 'pending').length,
      warning: allIssues.filter(i => i.status === 'warning').length,
      critical: allIssues.filter(i => i.severity === 'critical' && i.status !== 'fixed').length,
      // Health score = persentase issue yang sudah beres dari total semua check
      healthScore: Math.round((fixedCount / Math.max(totalChecks, 1)) * 100),
    };

    // Client hanya terima issue yang BELUM fix — yang fixed sudah divalidasi & otomatis hilang
    const activeIssues = allIssues.filter(i => i.status !== 'fixed');

    const data = { channel, videos, issues: activeIssues, summary };
    cache = { data, ts: now };

    return NextResponse.json({
      success: true, data, cached: false, timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Data API error:', error);
    if (cache) {
      return NextResponse.json({
        success: true, data: cache.data, cached: true, stale: true,
        timestamp: new Date(cache.ts).toISOString()
      });
    }
    return NextResponse.json({ success: false, error: 'Gagal mengambil data' }, { status: 500 });
  }
}
