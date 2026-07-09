import { NextResponse } from 'next/server';
import { getChannelStats, getAllVideos, computeIssues } from '@/lib/youtube';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  try {
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
    return NextResponse.json({
      success: true,
      data: { channel, videos, issues, summary },
      timestamp: new Date().toISOString(),
      message: 'Sync berhasil! Data diperbarui dari YouTube API.'
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ success: false, error: 'Sync gagal. Coba lagi.' }, { status: 500 });
  }
}
