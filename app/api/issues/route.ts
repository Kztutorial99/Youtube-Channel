import { NextResponse } from 'next/server';
import { getDashboardData, computeSummary } from '@/lib/youtube';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data } = await getDashboardData();
    const summary = computeSummary(data.issues);
    return NextResponse.json({ success: true, data: { issues: data.issues, summary }, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Issues API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to compute issues' }, { status: 502 });
  }
}
