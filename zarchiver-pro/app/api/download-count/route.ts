import { NextResponse } from 'next/server';
import { ensureTable, incrementCount } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { filename } = await req.json();
    if (!filename) return NextResponse.json({ error: 'filename required' }, { status: 400 });
    await ensureTable();
    const count = await incrementCount(filename);
    return NextResponse.json({ count: Number(count) });
  } catch (err) {
    console.error('download-count error:', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
