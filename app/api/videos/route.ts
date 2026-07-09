import { NextResponse } from 'next/server';
import { getAllVideos } from '@/lib/youtube';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const videos = await getAllVideos();
    return NextResponse.json({ success: true, data: videos, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Videos API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch videos' }, { status: 500 });
  }
}
