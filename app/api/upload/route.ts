import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Allow larger body for APK uploads (Next.js App Router)
export const maxDuration = 60;

interface GHContent {
  sha?: string;
  content?: string;
}

async function getFileSha(path: string, token: string): Promise<string | undefined> {
  const res = await fetch(
    `https://api.github.com/repos/Kztutorial99/Youtube-Channel/contents/${path}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' } }
  );
  if (!res.ok) return undefined;
  const d: GHContent = await res.json();
  return d.sha;
}

async function commitFile(
  path: string,
  content: string, // base64
  message: string,
  token: string,
  sha?: string
) {
  const body: Record<string, unknown> = { message, content };
  if (sha) body.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/Kztutorial99/Youtube-Channel/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'GitHub commit gagal');
  }
  return res.json();
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Auth check
    const key      = formData.get('key')?.toString() || '';
    const expected = process.env.MODERATION_SECRET || '';
    if (!expected || key !== expected) {
      return NextResponse.json({ error: 'Unauthorized — admin key salah.' }, { status: 401 });
    }

    const version    = formData.get('version')?.toString() || '';
    const changelog  = formData.get('changelog')?.toString() || '';
    const minAndroid = formData.get('minAndroid')?.toString() || '5.0';
    const file       = formData.get('file') as File | null;

    if (!version || !changelog || !file) {
      return NextResponse.json({ error: 'version, changelog, dan file wajib diisi.' }, { status: 400 });
    }

    const githubToken = process.env.GITHUB_TOKEN || '';
    if (!githubToken) {
      return NextResponse.json({ error: 'GITHUB_TOKEN belum di-set di secrets.' }, { status: 503 });
    }

    // Convert APK to base64
    const bytes  = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const sizeMB = (bytes.byteLength / 1024 / 1024).toFixed(1) + ' MB';
    const today  = new Date().toISOString().slice(0, 10);
    const filename = `ZarchiverPro_v${version}.apk`;

    // 1. Commit APK file
    const apkPath = `public/downloads/${filename}`;
    const apkSha  = await getFileSha(apkPath, githubToken);
    await commitFile(
      apkPath,
      base64,
      `release: ZArchiver Pro v${version}`,
      githubToken,
      apkSha
    );

    // 2. Update versions.json
    const versionsPath = 'public/downloads/versions.json';
    const versionsSha  = await getFileSha(versionsPath, githubToken);

    // Read existing versions.json
    let existingVersions: { version: string; filename: string; size: string; releaseDate: string; changelog: string; minAndroid: string; downloads: number }[] = [];
    if (versionsSha) {
      const vRes = await fetch(
        `https://api.github.com/repos/Kztutorial99/Youtube-Channel/contents/${versionsPath}`,
        { headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github.v3+json' } }
      );
      const vData: GHContent = await vRes.json();
      if (vData.content) {
        const decoded = Buffer.from(vData.content.replace(/\n/g, ''), 'base64').toString('utf-8');
        const parsed  = JSON.parse(decoded);
        existingVersions = parsed.versions || [];
      }
    }

    // Prepend new version
    const newVersionEntry = { version, filename, size: sizeMB, releaseDate: today, changelog, minAndroid, downloads: 0 };
    const updatedVersions = [newVersionEntry, ...existingVersions.filter(v => v.version !== version)];
    const versionsContent = JSON.stringify({ latest: version, versions: updatedVersions }, null, 2);
    const versionsBase64  = Buffer.from(versionsContent).toString('base64');

    await commitFile(
      versionsPath,
      versionsBase64,
      `release: update versions.json → v${version}`,
      githubToken,
      versionsSha
    );

    return NextResponse.json({ success: true, message: `v${version} berhasil diupload & di-commit ke GitHub. Vercel akan auto-deploy dalam ~1 menit.` });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload gagal';
    console.error('Upload error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
