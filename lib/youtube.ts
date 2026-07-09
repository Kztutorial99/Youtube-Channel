const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = 'UCRaVHUXQGVAH7Gof7kixIoQ';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface ChannelStats {
  id: string; title: string; description: string; customUrl: string;
  publishedAt: string; thumbnail: string; subscribers: number; views: number;
  videoCount: number; country: string; keywords: string[];
  hasDescription: boolean; hasKeywords: boolean;
}

export interface VideoStats {
  id: string; title: string; description: string; thumbnail: string;
  publishedAt: string; duration: string; durationSeconds: number;
  views: number; likes: number; comments: number; engagementRate: number;
  tags: string[]; hasTags: boolean; defaultLanguage: string; hasLanguage: boolean;
  status: 'public' | 'unlisted' | 'private'; isEngagementDisabled: boolean;
  daysSinceUpload: number; playlistIds: string[];
}

export interface IssueCheck {
  id: string; category: string; title: string; description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'fixed' | 'pending' | 'warning';
  affectedCount?: number; affectedItems?: string[]; affectedVideoIds?: string[];
  /** Teks yang bisa langsung disalin & dipakai — hanya untuk konten nyata (tags, deskripsi, judul, keywords) */
  suggestion?: string;
  /** Label kotak saran, misal "Tags Siap Pakai" / "Template Deskripsi" */
  suggestionLabel?: string;
  action: string; checkFn?: string;
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
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

export async function getChannelStats(): Promise<ChannelStats> {
  const res = await fetch(`${BASE_URL}/channels?part=snippet,statistics,brandingSettings&id=${CHANNEL_ID}&key=${API_KEY}`, { next: { revalidate: 60 } });
  const data = await res.json();
  const ch = data.items[0];
  const branding = ch.brandingSettings?.channel || {};
  return {
    id: ch.id, title: ch.snippet.title, description: ch.snippet.description || '',
    customUrl: ch.snippet.customUrl || '', publishedAt: ch.snippet.publishedAt,
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
  const channelRes = await fetch(`${BASE_URL}/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`, { next: { revalidate: 60 } });
  const channelData = await channelRes.json();
  const uploadsId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
  const videoIds: string[] = [];
  let pageToken = '';
  do {
    const r = await fetch(`${BASE_URL}/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=50&pageToken=${pageToken}&key=${API_KEY}`, { next: { revalidate: 60 } });
    const d = await r.json();
    for (const item of d.items || []) videoIds.push(item.contentDetails.videoId);
    pageToken = d.nextPageToken || '';
  } while (pageToken);

  const videos: VideoStats[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const res = await fetch(`${BASE_URL}/videos?part=snippet,statistics,contentDetails,status&id=${batch.join(',')}&key=${API_KEY}`, { next: { revalidate: 60 } });
    const data = await res.json();
    for (const v of data.items || []) {
      const durationSec = parseDuration(v.contentDetails?.duration || 'PT0S');
      const views = parseInt(v.statistics?.viewCount || '0');
      const likes = parseInt(v.statistics?.likeCount || '0');
      const comments = parseInt(v.statistics?.commentCount || '0');
      const engRate = views > 0 ? parseFloat(((likes + comments) / views * 100).toFixed(2)) : 0;
      const publishedAt = v.snippet?.publishedAt || '';
      const daysSince = publishedAt ? Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86400000) : 0;
      const isEngDisabled = v.statistics?.likeCount === undefined && v.statistics?.commentCount === undefined && views > 500;
      videos.push({
        id: v.id, title: v.snippet?.title || '', description: v.snippet?.description || '',
        thumbnail: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
        publishedAt, duration: formatDuration(durationSec), durationSeconds: durationSec,
        views, likes, comments, engagementRate: engRate,
        tags: v.snippet?.tags || [], hasTags: !!(v.snippet?.tags && v.snippet.tags.length > 0),
        defaultLanguage: v.snippet?.defaultLanguage || v.snippet?.defaultAudioLanguage || '',
        hasLanguage: !!(v.snippet?.defaultLanguage || v.snippet?.defaultAudioLanguage),
        status: v.status?.privacyStatus || 'public', isEngagementDisabled: isEngDisabled,
        daysSinceUpload: daysSince, playlistIds: [],
      });
    }
  }
  return videos.sort((a, b) => b.views - a.views);
}

export async function computeIssues(channel: ChannelStats, videos: VideoStats[]): Promise<IssueCheck[]> {
  const pub = videos.filter(v => v.status === 'public');
  const noTagVideos = pub.filter(v => !v.hasTags);
  const noLangVideos = pub.filter(v => !v.hasLanguage);
  const engDisabledVideos = pub.filter(v => v.isEngagementDisabled);
  const lowEngVideos = pub.filter(v => v.engagementRate < 1.0 && v.views > 1000 && !v.isEngagementDisabled);
  const longVideos = pub.filter(v => v.durationSeconds > 600 && v.views < 10000);
  const typoPatterns = [/\bAcces\b/i, /\bSecript\b/i, /\bVerssion\b/i, /\bErorr\b/i, /\bFree tool\b/i];
  const typoVideos = pub.filter(v => typoPatterns.some(p => p.test(v.title)));
  const titleMap: Record<string, VideoStats[]> = {};
  for (const v of pub) {
    const norm = v.title.toLowerCase().replace(/\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|january|february|march|april|may|june|july|august|september|october|november|december|\d{4}|\d+)\s*/gi, ' ').trim();
    titleMap[norm] = titleMap[norm] || [];
    titleMap[norm].push(v);
  }
  const dupTitles = Object.values(titleMap).filter(g => g.length > 1).flat();
  const noDescVideos = pub.filter(v => !v.description || v.description.trim().length < 50);
  const daysSinceLast = pub.length > 0 ? Math.min(...pub.map(v => v.daysSinceUpload)) : 999;
  const isUploadStale = daysSinceLast > 60;
  const has2026 = pub.some(v => /2025|2026/.test(v.title) && new Date(v.publishedAt).getFullYear() >= 2025);

  const issues: IssueCheck[] = [
    {
      id: 'channel-description',
      category: 'Branding',
      title: 'Deskripsi Channel',
      description: 'Channel harus punya deskripsi lengkap untuk SEO dan kepercayaan penonton.',
      severity: channel.hasDescription ? 'low' : 'critical',
      status: channel.hasDescription ? 'fixed' : 'pending',
      action: 'YouTube Studio → Customization → Basic Info → Description',
      // Saran: teks deskripsi siap pakai
      suggestion: `kz.tutorial adalah channel tutorial Android, Termux, ZArchiver, dan aplikasi modifikasi untuk pengguna Indonesia. Temukan cara install aplikasi, bypass error, dan trik Android terbaru di sini. Subscribe untuk update mingguan!`,
      suggestionLabel: 'Teks Deskripsi Channel',
    },
    {
      id: 'channel-keywords',
      category: 'Branding',
      title: 'Keywords Channel',
      description: 'Keywords channel membantu YouTube mengkategorikan konten dan memperluas jangkauan.',
      severity: channel.hasKeywords ? 'low' : 'high',
      status: channel.hasKeywords ? 'fixed' : 'pending',
      action: 'YouTube Studio → Customization → Basic Info → Keywords',
      // Saran: keywords siap paste
      suggestion: `termux android tutorial zarchiver aplikasi mod cara install bypass error android indonesia hp`,
      suggestionLabel: 'Keywords Siap Paste',
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
      action: 'YouTube Studio → Content → klik video → Edit title → perbaiki typo → Save',
      // Tidak ada suggestion — harus diedit manual per video
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
      action: 'Tambahkan suffix unik ke setiap judul duplikat',
      // Saran: suffix siap pakai
      suggestion: `Suffix yang bisa ditambahkan di akhir judul:
• 2024 Terbaru
• 2025 Terbaru
• No Root
• Tanpa Error
• 100% Berhasil
• Android 14
• Android 15
• Cara Mudah

Contoh format: [Topik] [Suffix] | kz.tutorial
Contoh: "Install Termux 2025 Tanpa Error | kz.tutorial"`,
      suggestionLabel: 'Contoh Suffix Judul',
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
      action: 'YouTube Studio → Content → klik video → Details → Tags → paste tags di bawah',
      // Saran: tags siap paste langsung ke YouTube Studio
      suggestion: `termux, termux android, tutorial termux, cara install termux, termux tanpa error, zarchiver, zarchiver mod, android tutorial, tutorial android indonesia, cara install aplikasi android, hp android, android terbaru, tutorial hp, aplikasi android gratis, bypass error android`,
      suggestionLabel: 'Tags Siap Paste ke YouTube Studio',
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
      action: 'YouTube Studio → Content → klik video → Details → Language → pilih "Indonesian" → Save',
      // Tidak ada suggestion — ini setting dropdown, bukan teks
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
      action: 'Buka video di Studio → klik ⋮ → Make private (atau Delete jika perlu)',
      // Tidak ada suggestion — aksi di YouTube Studio
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
      action: 'Tambahkan CTA di deskripsi video untuk dorong likes & komentar',
      // Saran: teks CTA siap copy-paste ke deskripsi
      suggestion: `---
Kalau video ini membantu, jangan lupa:
👍 LIKE video ini
💬 COMMENT pertanyaan kamu di bawah
🔔 SUBSCRIBE & aktifkan notifikasi biar gak ketinggalan tutorial baru

Ada yang mau ditanyakan? Tulis di kolom komentar!`,
      suggestionLabel: 'Teks CTA untuk Deskripsi Video',
    },
    {
      id: 'upload-frequency',
      category: 'Konsistensi',
      title: 'Frekuensi Upload',
      description: isUploadStale
        ? `Upload terakhir ${daysSinceLast} hari yang lalu — algoritma sudah "tidur". Target 2x/minggu.`
        : `Upload terakhir ${daysSinceLast} hari yang lalu — masih aktif.`,
      severity: isUploadStale ? 'critical' : 'low',
      status: isUploadStale ? 'pending' : 'fixed',
      action: 'Upload minimal 1 video per minggu — Jadwal ideal: Minggu & Selasa jam 13:00 WIB',
      // Tidak ada suggestion — tidak ada teks yang bisa disalin
    },
    {
      id: 'fresh-content-2026',
      category: 'Konten',
      title: 'Konten 2025/2026 (Keyword Fresh)',
      description: 'Kompetitor dengan video 2025–2026 mulai menggeser ranking di keyword utama.',
      severity: has2026 ? 'low' : 'high',
      status: has2026 ? 'fixed' : 'pending',
      action: 'Buat minimal 1 video baru dengan keyword 2025/2026 minggu ini',
      // Saran: judul video siap pakai
      suggestion: `Install Termux di Android 15 - 2025 Terbaru Tanpa Error
ZArchiver 2025 - Cara Pakai Fitur Baru di HP Android
Cara Bypass Root Android 2025 - 100% Berhasil
5 Aplikasi Termux 2025 yang Wajib Kamu Coba
Tutorial Lengkap Termux Pemula 2025 dari Nol
Cara Install Magisk 2025 di Android Tanpa PC`,
      suggestionLabel: 'Judul Video Siap Pakai',
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
      action: 'YouTube Studio → Content → klik video → Description → paste template di bawah → edit sesuai video → Save',
      // Saran: template deskripsi siap edit & paste
      suggestion: `Di video ini kamu akan belajar cara [TOPIK] di Android dengan mudah dan tanpa error.

📌 Yang dibahas:
• [Poin 1]
• [Poin 2]
• [Poin 3]

🔧 Aplikasi yang dibutuhkan:
• [Nama aplikasi]

⏱ Timestamp:
0:00 - Intro
[sesuaikan]

---
Kalau video ini membantu, jangan lupa LIKE, COMMENT, dan SUBSCRIBE!

#termux #android #tutorial #indonesia #zarchiver`,
      suggestionLabel: 'Template Deskripsi Video',
    },
    {
      id: 'captions',
      category: 'Aksesibilitas',
      title: 'Caption / Subtitle Video',
      description: 'Caption meningkatkan watch time, aksesibilitas, dan ranking di search.',
      severity: 'medium',
      status: 'pending',
      action: 'YouTube Studio → Subtitles → pilih video → Add → Auto-generated → edit jika perlu → Publish',
      // Tidak ada suggestion — ini proses di YouTube Studio
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
      action: 'Target durasi 5–8 menit untuk video baru. Edit versi pendek dari video yang ada.',
      // Tidak ada suggestion — tidak ada teks yang bisa disalin langsung
    },
    {
      id: 'tos-links',
      category: 'Keamanan',
      title: 'Link subs4unlock / Gate Content di Komentar',
      description: 'Link subs4unlock.id di komentar = pelanggaran ToS YouTube → penyebab engagement dikunci pada video tertentu.',
      severity: 'critical',
      status: 'pending',
      action: 'YouTube Studio → Comments → filter "Contains links" → cari subs4unlock → Delete comment',
      // Tidak ada suggestion
    },
  ];

  return issues; // Return semua — filtering fixed dilakukan di api/data route
}
