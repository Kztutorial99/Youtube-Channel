import { NextRequest, NextResponse } from 'next/server';

// Rate limit per-IP, in-memory. Catatan: pada Vercel serverless ini per-instance,
// bukan global — cukup untuk meredam spam kasual, BUKAN pertahanan penuh terhadap
// abuse terdistribusi (untuk itu perlu shared store seperti Upstash/KV).
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Endpoint mahal (memanggil YouTube API / force refresh) dibatasi lebih ketat
// daripada endpoint yang baca dari cache.
const DEFAULT_LIMIT = 20;
const EXPENSIVE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function isExpensive(pathname: string, searchParams: URLSearchParams): boolean {
  if (pathname.startsWith('/api/sync')) return true;
  if (pathname.startsWith('/api/data') && searchParams.get('refresh') === '1') return true;
  return false;
}

function rateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/** Same-origin check untuk method yang mengubah state / memicu panggilan mahal ke YouTube API. */
function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // request server-to-server / curl tanpa Origin header (mis. health check) tidak diblok
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (!pathname.startsWith('/api/')) return NextResponse.next();

  if (req.method === 'POST' && !isSameOrigin(req)) {
    return new NextResponse(
      JSON.stringify({ success: false, error: 'Forbidden: cross-origin request tidak diizinkan.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const ip = getClientIp(req);
  const expensive = isExpensive(pathname, searchParams);
  const limit = expensive ? EXPENSIVE_LIMIT : DEFAULT_LIMIT;
  const key = `${ip}:${expensive ? 'expensive' : 'default'}`;

  if (!rateLimit(key, limit)) {
    return new NextResponse(
      JSON.stringify({ success: false, error: 'Rate limit exceeded. Coba lagi dalam 1 menit.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
