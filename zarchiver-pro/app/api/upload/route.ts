import { NextResponse } from 'next/server';
import {
  getVersions, commitVersions, commitApk, getFileSha,
} from '@/lib/versions';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Auth
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

    const bytes    = await file.arrayBuffer();
    const base64   = Buffer.from(bytes).toString('base64');
    const sizeMB   = (bytes.byteLength / 1024 / 1024).toFixed(1) + ' MB';
    const today    = new Date().toISOString().slice(0, 10);
    const filename = `ZarchiverPro_v${version}.apk`;

    // Commit APK
    const apkPath = `public/downloads/${filename}`;
    const apkSha  = await getFileSha(apkPath);
    await commitApk(filename, base64, apkSha);

    // Update versions.json
    const existing = await getVersions().catch(() => ({ latest: '', versions: [] }));
    const vSha     = await getFileSha('public/downloads/versions.json');

    const newEntry = { version, filename, size: sizeMB, releaseDate: today, changelog, minAndroid };
    const updated  = {
      latest: version,
      versions: [newEntry, ...(existing.versions.filter(v => v.version !== version))],
    };
    await commitVersions(updated, vSha);

    return NextResponse.json({
      success: true,
      message: `v${version} berhasil di-commit ke GitHub. Vercel akan auto-deploy dalam ~1 menit.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload gagal';
    console.error('Upload error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
