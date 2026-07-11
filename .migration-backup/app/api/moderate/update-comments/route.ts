import { NextResponse } from 'next/server';
import { getAccessToken, fetchYTAuthed } from '@/lib/youtubeAuth';
import { checkModerationAuth } from '@/lib/moderationAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST: update teks komentar yang sudah ada (misalnya komentar pinned berisi link gate/sub4unlock)
 * jadi teks baru, tanpa menghapus video. Dipakai untuk ganti link subs4unlock.id dengan link
 * download langsung supaya penonton tidak kehilangan akses.
 *
 * Body: { comments: { commentId: string, text: string }[], confirm: true }
 */
export async function POST(req: Request) {
  const authError = checkModerationAuth(req);
  if (authError) return authError;
  let body: { comments?: { commentId: string; text: string }[]; confirm?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body request tidak valid (harus JSON).' }, { status: 400 });
  }

  const { comments, confirm } = body;
  if (!Array.isArray(comments) || comments.length === 0) {
    return NextResponse.json({ error: 'comments wajib diisi (array of { commentId, text }).' }, { status: 400 });
  }
  if (confirm !== true) {
    return NextResponse.json({ error: 'Konfirmasi wajib: kirim confirm: true.' }, { status: 400 });
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal otentikasi YouTube OAuth.' }, { status: 502 });
  }

  const updated: string[] = [];
  const failed: { commentId: string; error: string }[] = [];

  for (const { commentId, text } of comments) {
    try {
      const res = await fetchYTAuthed(
        `https://www.googleapis.com/youtube/v3/comments?part=snippet`,
        accessToken,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: commentId,
            snippet: { textOriginal: text },
          }),
        }
      );
      if (res.ok) {
        updated.push(commentId);
      } else {
        const errBody = await res.text().catch(() => '');
        failed.push({ commentId, error: `HTTP ${res.status}: ${errBody.slice(0, 200)}` });
      }
    } catch (err: any) {
      failed.push({ commentId, error: err.message || 'unknown error' });
    }
  }

  return NextResponse.json({ updated, failed });
}
