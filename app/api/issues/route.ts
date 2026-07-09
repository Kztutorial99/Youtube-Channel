import { NextResponse } from 'next/server';
import { getChannelStats, getAllVideos, computeIssues } from '@/lib/youtube';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
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
    return NextResponse.json({ success: true, data: { issues, summary }, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Issues API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to compute issues' }, { status: 500 });
  }
}
