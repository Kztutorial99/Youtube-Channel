/**
 * OAuth helper untuk operasi YouTube yang butuh izin channel-owner (hapus video, post komentar).
 * Beda dari lib/youtube.ts yang hanya baca data publik lewat API key.
 *
 * Token TIDAK di-cache lintas request — selalu refresh access token baru dari refresh token
 * yang tersimpan di env var, karena access token cuma hidup ~1 jam dan serverless functions
 * tidak punya state yang persisten antar-invocation.
 */

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export async function getAccessToken(): Promise<string> {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('YouTube OAuth belum di-setup (YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN belum ada).');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gagal refresh token YouTube OAuth (${res.status}): ${body.slice(0, 300)}`);
  }

  const data: TokenResponse = await res.json();
  return data.access_token;
}

/** fetch ke YouTube Data API dengan Authorization header dari access token OAuth. */
export async function fetchYTAuthed(url: string, accessToken: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
