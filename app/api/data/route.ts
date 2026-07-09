import { NextResponse } from 'next/server';
import { getChannelStats, getAllVideos, computeIssues } from '@/lib/youtube';

export const dynamic = 'force-dynamic';

let cache: { data: unknown; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 menit cache YouTube API

export async function GET() {
  try {
    const now = Date.now();
    if (cache && now - cache.ts < CACHE_TTL) {
      return NextResponse.json({ success: true, data: cache.data, cached: true, timestamp: new Date().toISOString() });
    }
    const [channel, videos] = await Promise.all([getChannelStats(), getAllVideos()]);
    const issues = await computeIssues(channel, videos);
    const summary = {
      total: issues.length,
      fixed: issues.filter(i => i.status === 'fixed').length,
      pending: issues.filter(i => i.status === 'pending').length,
      warning: issues.filter(i => i.status === 'warning').length,
      critical: issues.filter(i => i.severity === 'critical' && i.status !== 'fixed').length,
      healthScore: Math.round((issues.filter(i => i.status === 'fixed').length / issues.length) * 100),
    };
    const data = { channel, videos, issues, summary };
    cache = { data, ts: now };
    return NextResponse.json({ success: true, data, cached: false, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Data API error:', error);
    if (cache) {
      return NextResponse.json({ success: true, data: cache.data, cached: true, stale: true, timestamp: new Date().toISOString() });
    }
    return NextResponse.json({ success: false, error: 'Gagal mengambil data' }, { status: 500 });
  }
}
