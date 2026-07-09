import { NextResponse } from 'next/server';
import { getChannelStats, getAllVideos, computeIssues } from '@/lib/youtube';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Module-level cache (2 menit normal, bypass jika ?refresh=1)
let cache: { data: unknown; ts: number } | null = null;
const CACHE_TTL = 2 * 60 * 1000; // 2 menit

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

    // Fetch fresh dari YouTube API
    const [channel, videos] = await Promise.all([getChannelStats(), getAllVideos()]);
    const issues = await computeIssues(channel, videos);
    const summary = {
      total: issues.length,
      fixed: issues.filter(i => i.status === 'fixed').length,
      pending: issues.filter(i => i.status === 'pending').length,
      warning: issues.filter(i => i.status === 'warning').length,
      critical: issues.filter(i => i.severity === 'critical' && i.status !== 'fixed').length,
      healthScore: Math.round(
        (issues.filter(i => i.status === 'fixed').length / Math.max(issues.length, 1)) * 100
      ),
    };
    const data = { channel, videos, issues, summary };
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
