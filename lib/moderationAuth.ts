import { NextResponse } from 'next/server';

/**
 * Guard untuk endpoint /api/moderate/* yang bisa hapus video / ubah komentar publik lewat
 * OAuth channel-owner. `confirm: true` di body BUKAN autentikasi — cuma mencegah klik tidak
 * sengaja. Endpoint ini butuh secret key di header supaya tidak bisa dipanggil siapa pun yang
 * sekadar tahu URL-nya.
 *
 * Kirim header: x-moderation-key: <MODERATION_SECRET>
 */
export function checkModerationAuth(req: Request): NextResponse | null {
  const expected = process.env.MODERATION_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: 'MODERATION_SECRET belum di-set di environment — endpoint moderasi dinonaktifkan demi keamanan.' },
      { status: 503 }
    );
  }
  const provided = req.headers.get('x-moderation-key') || '';
  if (!timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  return null; // lolos, lanjutkan handler
}

/** Bandingkan string tanpa membocorkan waktu perbandingan (hindari timing attack pada secret). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
