const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = 'UCRaVHUXQGVAH7Gof7kixIoQ';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface ChannelStats {
  id: string;
  title: string;
  description: string;
  customUrl: string;
  publishedAt: string;
  thumbnail: string;
  subscribers: number;
  views: number;
  videoCount: number;
  country: string;
  keywords: string[];
  hasDescription: boolean;
  hasKeywords: boolean;
}

export interface VideoStats {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  durationSeconds: number;
  views: number;
  likes: number;
  comments: number;
  engagementRate: number;
  tags: string[];
  hasTags: boolean;
  defaultLanguage: string;
  hasLanguage: boolean;
  status: 'public' | 'unlisted' | 'private';
  isEngagementDisabled: boolean;
  daysSinceUpload: number;
  playlistIds: string[];
}

export interface IssueCheck {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'fixed' | 'pending' | 'warning';
  affectedCount?: number;
  affectedItems?: string[];
  affectedVideoIds?: string[];
  suggestion?: string;
  action: string;
  checkFn?: string;
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 3600) + (parseInt(match[2] || '0') * 60) + parseInt(match[3] || '0');
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export async function getChannelStats(): Promise<ChannelStats> {
  const url = `${BASE_URL}/channels?part=snippet,statistics,brandingSettings&id=${CHANNEL_ID}&key=${API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  const data = await res.json();
  const ch = data.items[0];
  const branding = ch.brandingSettings?.channel || {};
  return {
    id: ch.id,
    title: ch.snippet.title,
    description: ch.snippet.description || '',
    customUrl: ch.snippet.customUrl || '',
    publishedAt: ch.snippet.publishedAt,
    thumbnail: ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.default?.url || '',
    subscribers: parseInt(ch.statistics.subscriberCount || '0'),
    views: parseInt(ch.statistics.viewCount || '0'),
    videoCount: parseInt(ch.statistics.videoCount || '0'),
    country: ch.snippet.country || 'ID',
    keywords: branding.keywords ? branding.keywords.split(' ').filter((k: string) => k.length > 0) : [],
    hasDescription: !!(ch.snippet.description && ch.snippet.description.trim().length > 20),
    hasKeywords: !!(branding.keywords && branding.keywords.trim().length > 0),
  };
}

export async function getAllVideos(): Promise<VideoStats[]> {
  const channelRes = await fetch(
    `${BASE_URL}/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`,
    { next: { revalidate: 60 } }
  );
  const channelData = await channelRes.json();
  const uploadsId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

  const videoIds: string[] = [];
  let pageToken = '';
  do {
    const playlistRes = await fetch(
      `${BASE_URL}/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=50&pageToken=${pageToken}&key=${API_KEY}`,
      { next: { revalidate: 60 } }
    );
    const playlistData = await playlistRes.json();
    for (const item of playlistData.items || []) videoIds.push(item.contentDetails.videoId);
    pageToken = playlistData.nextPageToken || '';
  } while (pageToken);

  const videos: VideoStats[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const res = await fetch(
      `${BASE_URL}/videos?part=snippet,statistics,contentDetails,status&id=${batch.join(',')}&key=${API_KEY}`,
      { next: { revalidate: 60 } }
    );
    const data = await res.json();
    for (const v of data.items || []) {
      const durationSec = parseDuration(v.contentDetails?.duration || 'PT0S');
      const views = parseInt(v.statistics?.viewCount || '0');
      const likes = parseInt(v.statistics?.likeCount || '0');
      const comments = parseInt(v.statistics?.commentCount || '0');
      const engRate = views > 0 ? parseFloat(((likes + comments) / views * 100).toFixed(2)) : 0;
      const publishedAt = v.snippet?.publishedAt || '';
      const daysSince = publishedAt ? Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86400000) : 0;
      const isEngDisabled =
        v.statistics?.likeCount === undefined &&
        v.statistics?.commentCount === undefined &&
        views > 500;
      videos.push({
        id: v.id,
        title: v.snippet?.title || '',
        description: v.snippet?.description || '',
        thumbnail: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
        publishedAt,
        duration: formatDuration(durationSec),
        durationSeconds: durationSec,
        views, likes, comments, engagementRate: engRate,
        tags: v.snippet?.tags || [],
        hasTags: !!(v.snippet?.tags && v.snippet.tags.length > 0),
        defaultLanguage: v.snippet?.defaultLanguage || v.snippet?.defaultAudioLanguage || '',
        hasLanguage: !!(v.snippet?.defaultLanguage || v.snippet?.defaultAudioLanguage),
        status: v.status?.privacyStatus || 'public',
        isEngagementDisabled: isEngDisabled,
        daysSinceUpload: daysSince,
        playlistIds: [],
      });
    }
  }
  return videos.sort((a, b) => b.views - a.views);
}

export async function computeIssues(channel: ChannelStats, videos: VideoStats[]): Promise<IssueCheck[]> {
  const publicVideos = videos.filter(v => v.status === 'public');
  const noTagVideos = publicVideos.filter(v => !v.hasTags);
  const noLangVideos = publicVideos.filter(v => !v.hasLanguage);
  const engDisabledVideos = publicVideos.filter(v => v.isEngagementDisabled);
  const lowEngVideos = publicVideos.filter(v => v.engagementRate < 1.0 && v.views > 1000 && !v.isEngagementDisabled);
  const longVideos = publicVideos.filter(v => v.durationSeconds > 600 && v.views < 10000);

  const typoPatterns = [/\bAcces\b/i, /\bSecript\b/i, /\bVerssion\b/i, /\bErorr\b/i, /\bFree tool\b/i];
  const typoVideos = publicVideos.filter(v => typoPatterns.some(p => p.test(v.title)));

  const titleMap: Record<string, VideoStats[]> = {};
  for (const v of publicVideos) {
    const norm = v.title.toLowerCase()
      .replace(/\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|january|february|march|april|may|june|july|august|september|october|november|december|\d{4}|\d+)\s*/gi, ' ').trim();
    titleMap[norm] = titleMap[norm] || [];
    titleMap[norm].push(v);
  }
  const dupTitles = Object.values(titleMap).filter(g => g.length > 1).flat();
  const noDescVideos = publicVideos.filter(v => !v.description || v.description.trim().length < 50);
  const daysSinceLastUpload = publicVideos.length > 0 ? Math.min(...publicVideos.map(v => v.daysSinceUpload)) : 999;
  const isUploadStale = daysSinceLastUpload > 60;
  const has2026Content = publicVideos.some(v => /2025|2026/.test(v.title) && new Date(v.publishedAt).getFullYear() >= 2025);

  // Semua issue dikembalikan (incl fixed) — filtering dilakukan di api/data route
  const issues: IssueCheck[] = [
    {
      id: 'channel-description',
      category: 'Branding',
      title: 'Deskripsi Channel',
      description: 'Channel harus punya deskripsi lengkap untuk SEO dan kepercayaan penonton.',
      severity: channel.hasDescription ? 'low' : 'critical',
      status: channel.hasDescription ? 'fixed' : 'pending',
      action: 'Tambah deskripsi di YouTube Studio → Customization → Basic Info',
      suggestion: `kz.tutorial adalah channel yang membahas tutorial Android, Termux, ZArchiver, dan aplikasi modifikasi untuk pengguna Indonesia. Temukan cara install aplikasi, bypass error, dan trik Android terbaru di sini. Subscribe untuk update mingguan!`,
    },
    {
      id: 'channel-keywords',
      category: 'Branding',
      title: 'Keywords Channel',
      description: 'Keywords channel membantu YouTube mengkategorikan konten dan memperluas jangkauan.',
      severity: channel.hasKeywords ? 'low' : 'high',
      status: channel.hasKeywords ? 'fixed' : 'pending',
      action: 'Tambah keywords di YouTube Studio → Customization → Basic Info → Keywords',
      suggestion: `termux android tutorial zarchiver aplikasi mod cara install bypass error android indonesia hp`,
    },
    {
      id: 'video-typos',
      category: 'SEO Judul',
      title: 'Typo di Judul Video',
      description: 'Judul dengan typo terlihat tidak profesional dan bisa menurunkan CTR.',
      severity: typoVideos.length > 0 ? 'high' : 'low',
      status: typoVideos.length === 0 ? 'fixed' : 'pending',
      affectedCount: typoVideos.length,
      affectedItems: typoVideos.map(v => v.title),
      affectedVideoIds: typoVideos.map(v => v.id),
      action: 'Edit judul langsung di YouTube Studio → Content → klik video → Edit title',
    },
    {
      id: 'duplicate-titles',
      category: 'SEO Judul',
      title: 'Judul Duplikat',
      description: 'Beberapa video punya judul yang hampir identik — YouTube tidak bisa membedakan mana yang lebih relevan.',
      severity: dupTitles.length > 0 ? 'high' : 'low',
      status: dupTitles.length === 0 ? 'fixed' : 'pending',
      affectedCount: dupTitles.length,
      affectedItems: dupTitles.map(v => v.title),
      affectedVideoIds: dupTitles.map(v => v.id),
      action: 'Tambahkan suffix unik ke judul',
      suggestion: `Contoh suffix: "2024 Terbaru", "No Root", "Tanpa Error", "100% Berhasil", "Android 14/15"\nFormat: [Topik] [Versi/Tahun] [Keunggulan] - [Channel]\nContoh: "Install Termux 2025 Tanpa Error - kz.tutorial"`,
    },
    {
      id: 'video-tags',
      category: 'SEO Tags',
      title: 'Video Tanpa Tags',
      description: 'Tags membantu algoritma YouTube mengkategorikan konten dan merekomendasikannya.',
      severity: noTagVideos.length > 0 ? 'high' : 'low',
      status: noTagVideos.length === 0 ? 'fixed' : 'pending',
      affectedCount: noTagVideos.length,
      affectedItems: noTagVideos.map(v => v.title),
      affectedVideoIds: noTagVideos.map(v => v.id),
      action: 'Tambahkan tags di YouTube Studio → Content → klik video → Details → Tags',
      suggestion: `termux, termux android, tutorial termux, cara install termux, termux tanpa error, zarchiver, zarchiver mod, android tutorial, tutorial android indonesia, cara install aplikasi android, hp android, android terbaru, tutorial hp, aplikasi android gratis, bypass error android`,
    },
    {
      id: 'default-language',
      category: 'SEO Metadata',
      title: 'Bahasa Default Video',
      description: 'Setting defaultLanguage membantu YouTube mentarget penonton yang tepat.',
      severity: noLangVideos.length > 0 ? 'medium' : 'low',
      status: noLangVideos.length === 0 ? 'fixed' : 'pending',
      affectedCount: noLangVideos.length,
      affectedItems: noLangVideos.map(v => v.title),
      affectedVideoIds: noLangVideos.map(v => v.id),
      action: 'YouTube Studio → Content → klik video → Details → Language → pilih "Indonesian"',
      suggestion: `Pilih bahasa: Indonesian (id)\nYouTube Studio → Content → pilih video → Edit → Details → Language & captions → Video language: Indonesian`,
    },
    {
      id: 'engagement-disabled',
      category: 'Engagement',
      title: 'Video Kena Penalti (Likes/Komentar 0)',
      description: 'Video dengan views tinggi tapi 0 likes & 0 komentar kemungkinan besar dikunci YouTube karena pelanggaran kebijakan.',
      severity: engDisabledVideos.length > 0 ? 'critical' : 'low',
      status: engDisabledVideos.length === 0 ? 'fixed' : 'pending',
      affectedCount: engDisabledVideos.length,
      affectedItems: engDisabledVideos.map(v => `${v.title} (${v.views.toLocaleString()} views)`),
      affectedVideoIds: engDisabledVideos.map(v => v.id),
      action: 'Private atau hapus video ini — tidak berkontribusi ke engagement channel',
      suggestion: `Opsi 1: Private video (jaga views, hilangkan dari search)\nOpsi 2: Hapus video (bersihkan channel)\nOpsi 3: Appeal ke YouTube jika merasa tidak melanggar\n\nYouTube Studio → Content → klik ⋮ di video → Make private / Delete`,
    },
    {
      id: 'low-engagement',
      category: 'Engagement',
      title: 'Video Engagement Rendah (<1%)',
      description: 'Engagement rate di bawah 1% sinyal ke algoritma bahwa konten kurang relevan.',
      severity: lowEngVideos.length > 3 ? 'high' : lowEngVideos.length > 0 ? 'medium' : 'low',
      status: lowEngVideos.length === 0 ? 'fixed' : 'warning',
      affectedCount: lowEngVideos.length,
      affectedItems: lowEngVideos.map(v => `${v.title} (${v.engagementRate.toFixed(1)}%)`),
      affectedVideoIds: lowEngVideos.map(v => v.id),
      action: 'Update thumbnail & tambah CTA di deskripsi untuk dorong likes/komentar',
      suggestion: `Tambahkan di akhir deskripsi:\n---\nKalau video ini membantu, jangan lupa:\n👍 LIKE video ini\n💬 COMMENT pertanyaan kamu\n🔔 SUBSCRIBE & aktifkan notifikasi\n\nAda yang mau ditanyakan? Tulis di kolom komentar!`,
    },
    {
      id: 'upload-frequency',
      category: 'Konsistensi',
      title: 'Frekuensi Upload',
      description: isUploadStale
        ? `Upload terakhir ${daysSinceLastUpload} hari yang lalu — algoritma sudah "tidur". Target 2x/minggu.`
        : `Upload terakhir ${daysSinceLastUpload} hari yang lalu — masih aktif.`,
      severity: isUploadStale ? 'critical' : 'low',
      status: isUploadStale ? 'pending' : 'fixed',
      action: 'Upload 2x/minggu — Minggu & Selasa jam 13:00 WIB',
      suggestion: `Jadwal upload ideal:\n• Minggu 13:00 WIB → video tutorial utama\n• Selasa 13:00 WIB → video tips/trik pendek\n\nIde konten:\n- "Cara Install Termux 2025 di Android 14/15"\n- "ZArchiver Mod Terbaru - Fitur Premium Gratis"\n- "5 Aplikasi Android Wajib untuk Developer 2025"`,
    },
    {
      id: 'fresh-content-2026',
      category: 'Konten',
      title: 'Konten 2025/2026 (Keyword Fresh)',
      description: 'Kompetitor dengan video 2025–2026 mulai menggeser ranking di keyword utama.',
      severity: has2026Content ? 'low' : 'high',
      status: has2026Content ? 'fixed' : 'pending',
      action: 'Buat minimal 1 video dengan keyword 2025/2026 minggu ini',
      suggestion: `Judul yang bisa langsung dipakai:\n• "Install Termux di Android 15 - 2025 Terbaru Tanpa Error"\n• "ZArchiver 2025 - Cara Pakai Fitur Baru di HP Android"\n• "Cara Bypass Root Android 2025 - 100% Berhasil"\n• "5 Aplikasi Termux 2025 yang Wajib Kamu Coba"\n• "Tutorial Lengkap Termux Pemula 2025 dari Nol"`,
    },
    {
      id: 'video-description',
      category: 'SEO Metadata',
      title: 'Deskripsi Video Lengkap',
      description: 'Deskripsi minimal 150 karakter meningkatkan CTR dari search dan ranking.',
      severity: noDescVideos.length > 5 ? 'medium' : 'low',
      status: noDescVideos.length === 0 ? 'fixed' : noDescVideos.length <= 3 ? 'warning' : 'pending',
      affectedCount: noDescVideos.length,
      affectedItems: noDescVideos.slice(0, 10).map(v => v.title),
      affectedVideoIds: noDescVideos.slice(0, 10).map(v => v.id),
      action: 'Tambah deskripsi di YouTube Studio → Content → klik video → Description',
      suggestion: `Template deskripsi siap pakai (ganti bagian [...]:\n\nDi video ini kamu akan belajar cara [topik video] di Android dengan mudah dan tanpa error.\n\n📌 Yang dibahas di video ini:\n• [poin 1]\n• [poin 2]\n• [poin 3]\n\n🔧 Aplikasi yang dibutuhkan:\n• [nama aplikasi]\n\n⏱ Timestamp:\n0:00 - Intro\n[sesuaikan]\n\n---\nKalau video ini membantu, jangan lupa LIKE, COMMENT, dan SUBSCRIBE!\n\n#termux #android #tutorial #indonesia`,
    },
    {
      id: 'captions',
      category: 'Aksesibilitas',
      title: 'Caption / Subtitle Video',
      description: 'Caption meningkatkan watch time, aksesibilitas, dan ranking di search.',
      severity: 'medium',
      status: 'pending',
      action: 'YouTube Studio → Subtitles → Auto-generate → Edit → Publish',
      suggestion: `Cara aktifkan subtitle otomatis:\n1. Buka YouTube Studio\n2. Klik "Subtitles" di menu kiri\n3. Pilih video yang mau diberi subtitle\n4. Klik "Add" → "Auto-generated"\n5. Tunggu proses → Edit jika ada yang salah → Publish\n\nLakukan untuk video dengan views tertinggi dulu!`,
    },
    {
      id: 'long-videos-low-views',
      category: 'Konten',
      title: 'Video Panjang (>10 menit) dengan Views Rendah',
      description: 'Video 10+ menit rata-rata dapat 12K views vs 5–8 menit yang dapat 24K+.',
      severity: longVideos.length > 0 ? 'medium' : 'low',
      status: longVideos.length === 0 ? 'fixed' : 'warning',
      affectedCount: longVideos.length,
      affectedItems: longVideos.map(v => `${v.title} (${v.duration}, ${v.views.toLocaleString()} views)`),
      affectedVideoIds: longVideos.map(v => v.id),
      action: 'Target durasi 5–8 menit untuk video baru',
      suggestion: `Tips potong durasi tanpa hilang konten:\n• Hapus intro panjang (maks 15 detik)\n• Skip bagian loading/menunggu\n• Gabungkan langkah-langkah kecil\n• Pakai text overlay untuk info tambahan tanpa narasi\n• Target: 5–8 menit = sweet spot engagement YouTube`,
    },
    {
      id: 'tos-links',
      category: 'Keamanan',
      title: 'Link subs4unlock / Gate Content di Komentar',
      description: 'Link subs4unlock.id di komentar = pelanggaran ToS YouTube → penyebab engagement dikunci pada video tertentu.',
      severity: 'critical',
      status: 'pending',
      action: 'Hapus manual semua komentar yang berisi link subs4unlock.id',
      suggestion: `Cara hapus komentar bermasalah:\n1. YouTube Studio → Comments\n2. Filter: "Contains links"\n3. Cari komentar dengan "subs4unlock"\n4. Klik ⋮ → Delete comment\n\nAtau hapus langsung di video:\n1. Buka video → Comments section\n2. Hover komentar → klik ⋮ → Remove\n\n⚠️ Prioritas: hapus di video dengan 0 likes/comments dulu!`,
    },
  ];

  return issues; // Return semua — filtering di api/data
}
