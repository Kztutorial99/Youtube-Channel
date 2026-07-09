import { NextResponse } from 'next/server';
import { getChannelStats } from '@/lib/youtube';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const channel = await getChannelStats();
    return NextResponse.json({ success: true, data: channel, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Channel API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch channel data' }, { status: 500 });
  }
}
