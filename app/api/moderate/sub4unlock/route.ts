import { NextResponse } from 'next/server';
import { getDashboardData, findSub4UnlockVideos } from '@/lib/youtube';
import { getAccessToken, fetchYTAuthed } from '@/lib/youtubeAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** GET: scan semua video publik, cari yang pakai gimmick "sub4unlock". Read-only, tidak menghapus apa pun. */
export async function GET() {
  try {
    const { data } = await getDashboardData();
    const matches = findSub4UnlockVideos(data.videos);
    return NextResponse.json({ count: matches.length, videos: matches });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal scan video.' }, { status: 502 });
  }
}

/**
 * POST: hapus video yang dipilih + post komentar klarifikasi di video terbaru yang masih tayang.
 * Body: { videoIds: string[], confirm: true }
 * `confirm: true` wajib ada supaya tidak ada penghapusan tidak sengaja lewat request tanpa sadar.
 */
export async function POST(req: Request) {
  let body: { videoIds?: string[]; confirm?: boolean; commentText?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body request tidak valid (harus JSON).' }, { status: 400 });
  }

  const { videoIds, confirm, commentText } = body;
  if (!Array.isArray(videoIds) || videoIds.length === 0) {
    return NextResponse.json({ error: 'videoIds wajib diisi (array of string).' }, { status: 400 });
  }
  if (confirm !== true) {
    return NextResponse.json({ error: 'Konfirmasi wajib: kirim confirm: true untuk melanjutkan penghapusan (aksi ini permanen).' }, { status: 400 });
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal otentikasi YouTube OAuth.' }, { status: 502 });
  }

  const deleted: string[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const id of videoIds) {
    try {
      const res = await fetchYTAuthed(
        `https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(id)}`,
        accessToken,
        { method: 'DELETE' }
      );
      if (res.status === 204 || res.status === 200) {
        deleted.push(id);
      } else {
        const errBody = await res.text().catch(() => '');
        failed.push({ id, error: `HTTP ${res.status}: ${errBody.slice(0, 200)}` });
      }
    } catch (err: any) {
      failed.push({ id, error: err.message || 'unknown error' });
    }
  }

  // Post komentar klarifikasi di video terbaru yang masih tayang (bukan salah satu yang baru dihapus).
  let commentResult: { posted: boolean; videoId?: string; error?: string } = { posted: false };
  try {
    const { data } = await getDashboardData(true); // refresh biar video yang baru dihapus tidak ikut
    const stillPublic = data.videos
      .filter(v => v.status === 'public' && !deleted.includes(v.id))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const latest = stillPublic[0];

    if (latest) {
      const text = commentText || defaultClarificationComment();
      const res = await fetchYTAuthed(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet`,
        accessToken,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            snippet: {
              videoId: latest.id,
              topLevelComment: { snippet: { textOriginal: text } },
            },
          }),
        }
      );
      if (res.ok) {
        commentResult = { posted: true, videoId: latest.id };
      } else {
        const errBody = await res.text().catch(() => '');
        commentResult = { posted: false, videoId: latest.id, error: `HTTP ${res.status}: ${errBody.slice(0, 200)}` };
      }
    } else {
      commentResult = { posted: false, error: 'Tidak ada video publik lain untuk diberi komentar.' };
    }
  } catch (err: any) {
    commentResult = { posted: false, error: err.message || 'Gagal post komentar.' };
  }

  return NextResponse.json({ deleted, failed, comment: commentResult });
}

function defaultClarificationComment(): string {
  return [
    'Pemberitahuan: beberapa video lama di channel ini yang menggunakan sistem "sub4unlock" (konten dikunci sampai subscribe) sudah dihapus.',
    'Sistem itu melanggar kebijakan YouTube dan tidak sesuai dengan cara channel ini seharusnya berjalan.',
    'Kalau kamu pernah subscribe karena itu, terima kasih sudah mendukung — konten ke depannya akan terbuka untuk semua tanpa syarat gate seperti itu.',
  ].join('\n\n');
}
