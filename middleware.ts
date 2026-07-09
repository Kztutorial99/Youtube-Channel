import { NextRequest, NextResponse } from 'next/server';

// Simple token-based protection for internal API routes
// Rate limit: tracked via a lightweight in-memory counter per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;          // max 20 requests
const RATE_WINDOW_MS = 60_000;  // per 60 seconds

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard internal API routes
  if (!pathname.startsWith('/api/')) return NextResponse.next();

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  if (!rateLimit(ip)) {
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
