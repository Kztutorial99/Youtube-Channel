export interface Version {
  version: string;
  filename: string;
  size: string;
  releaseDate: string;
  changelog: string;
  minAndroid: string;
}

export interface VersionsData {
  latest: string;
  versions: Version[];
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const REPO          = 'Kztutorial99/ZarchiverPro';
const VERSIONS_PATH = 'public/downloads/versions.json';

async function ghGet(path: string) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }, next: { revalidate: 60 } }
  );
  if (!res.ok) return null;
  return res.json() as Promise<{ sha: string; content: string }>;
}

export async function getVersions(): Promise<VersionsData> {
  const file = await ghGet(VERSIONS_PATH);
  if (!file) return { latest: '', versions: [] };
  const decoded = Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf-8');
  return JSON.parse(decoded) as VersionsData;
}

export async function commitVersions(data: VersionsData, sha?: string) {
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const body: Record<string, unknown> = {
    message: `release: update versions.json → v${data.latest}`,
    content,
  };
  if (sha) body.sha = sha;
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${VERSIONS_PATH}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
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
}

export async function commitApk(filename: string, base64: string, sha?: string) {
  const body: Record<string, unknown> = {
    message: `release: upload ${filename}`,
    content: base64,
  };
  if (sha) body.sha = sha;
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/public/downloads/${filename}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'GitHub APK commit gagal');
  }
}

export async function getFileSha(path: string): Promise<string | undefined> {
  const file = await ghGet(path);
  return file?.sha;
}
