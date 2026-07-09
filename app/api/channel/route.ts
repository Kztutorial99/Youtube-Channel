import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/youtube';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data } = await getDashboardData();
    return NextResponse.json({ success: true, data: data.channel, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Channel API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch channel data' }, { status: 502 });
  }
}
