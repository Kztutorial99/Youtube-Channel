import { NextResponse } from 'next/server';
import { getDashboardData, computeSummary } from '@/lib/youtube';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === '1';

    const { data, cached, ts } = await getDashboardData(forceRefresh);
    const summary = computeSummary(data.issues);
    // Client hanya terima issue yang BELUM fix — yang fixed sudah divalidasi & otomatis hilang
    const activeIssues = data.issues.filter(i => i.status !== 'fixed');

    return NextResponse.json({
      success: true,
      data: { channel: data.channel, videos: data.videos, issues: activeIssues, summary },
      cached,
      timestamp: new Date(ts).toISOString(),
    });
  } catch (error) {
    console.error('Data API error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data dari YouTube API. Coba lagi sebentar.' }, { status: 502 });
  }
}
