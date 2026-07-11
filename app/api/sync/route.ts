import { NextResponse } from 'next/server';
import { getDashboardData, computeSummary } from '@/lib/youtube';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  try {
    const { data, ts } = await getDashboardData(true);
    const summary = computeSummary(data.issues);
    const activeIssues = data.issues.filter(i => i.status !== 'fixed');

    return NextResponse.json({
      success: true,
      data: { channel: data.channel, videos: data.videos, issues: activeIssues, summary },
      timestamp: new Date(ts).toISOString(),
      message: 'Sync berhasil! Data diperbarui dari YouTube API.',
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ success: false, error: 'Sync gagal. Coba lagi.' }, { status: 502 });
  }
}
