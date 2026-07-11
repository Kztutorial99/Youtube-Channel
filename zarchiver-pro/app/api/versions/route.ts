import { NextResponse } from 'next/server';
import { getVersions } from '@/lib/versions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getVersions();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ latest: '', versions: [] });
  }
}
