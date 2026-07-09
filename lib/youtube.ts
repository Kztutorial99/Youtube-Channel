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
  // Step 1: get all video IDs from uploads playlist
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
    for (const item of playlistData.items || []) {
      videoIds.push(item.contentDetails.videoId);
    }
    pageToken = playlistData.nextPageToken || '';
  } while (pageToken);

  // Step 2: get details in batches of 50
  const videos: VideoStats[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const detailRes = await fetch(
      `${BASE_URL}/videos?part=snippet,statistics,contentDetails,status&id=${batch.join(',')}&key=${API_KEY}`,
      { next: { revalidate: 60 } }
    );
    const detailData = await detailRes.json();
    for (const v of detailData.items || []) {
      const durationSecs = parseDuration(v.contentDetails?.duration || 'PT0S');
      const likes = parseInt(v.statistics?.likeCount || '0');
      const comments = parseInt(v.statistics?.commentCount || '0');
      const views = parseInt(v.statistics?.viewCount || '0');
      const eng = views > 0 ? ((likes + comments) / views) * 100 : 0;
      const published = new Date(v.snippet.publishedAt);
      const daysSince = Math.floor((Date.now() - published.getTime()) / (1000 * 60 * 60 * 24));
      const isEngagementDisabled = views > 100 && likes === 0 && comments === 0;

      videos.push({
        id: v.id,
        title: v.snippet.title,
        description: v.snippet.description || '',
        thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || '',
        publishedAt: v.snippet.publishedAt,
        duration: formatDuration(durationSecs),
        durationSeconds: durationSecs,
        views,
        likes,
        comments,
        engagementRate: Math.round(eng * 100) / 100,
        tags: v.snippet.tags || [],
        hasTags: !!(v.snippet.tags && v.snippet.tags.length > 0),
        defaultLanguage: v.snippet.defaultLanguage || '',
        hasLanguage: !!(v.snippet.defaultLanguage),
        status: v.status?.privacyStatus || 'public',
        isEngagementDisabled,
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

  // Typo checks
  const typoPatterns = [/\bAcces\b/i, /\bSecript\b/i, /\bVerssion\b/i, /\bErorr\b/i, /\bFree tool\b/i];
  const typoVideos = publicVideos.filter(v => typoPatterns.some(p => p.test(v.title)));

  // Duplicate title detection
  const titleMap: Record<string, VideoStats[]> = {};
  for (const v of publicVideos) {
    const norm = v.title.toLowerCase().replace(/\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|january|february|march|april|may|june|july|august|september|october|november|december|\d{4}|\d+)\s*/gi, ' ').trim();
    titleMap[norm] = titleMap[norm] || [];
    titleMap[norm].push(v);
  }
  const dupTitles = Object.values(titleMap).filter(g => g.length > 1).flat();

  // No description check
  const noDescVideos = publicVideos.filter(v => !v.description || v.description.trim().length < 50);

  // Last upload check
  const daysSinceLastUpload = Math.min(...publicVideos.map(v => v.daysSinceUpload));
  const isUploadStale = daysSinceLastUpload > 60;

  // Stale 2025/2026 content
  const has2026Content = publicVideos.some(v =>
    /2025|2026/.test(v.title) && new Date(v.publishedAt).getFullYear() >= 2025
  );

  const issues: IssueCheck[] = [
    {
      id: 'channel-description',
      category: 'Branding',
      title: 'Deskripsi Channel',
      description: 'Channel harus punya deskripsi lengkap untuk SEO dan kepercayaan penonton.',
      severity: channel.hasDescription ? 'low' : 'critical',
      status: channel.hasDescription ? 'fixed' : 'pending',
      action: 'Tambah deskripsi di YouTube Studio → Customization → Basic Info',
    },
    {
      id: 'channel-keywords',
      category: 'Branding',
      title: 'Keywords Channel',
      description: 'Keywords channel membantu YouTube mengkategorikan konten dan memperluas jangkauan.',
      severity: channel.hasKeywords ? 'low' : 'high',
      status: channel.hasKeywords ? 'fixed' : 'pending',
      action: 'Tambah keywords di YouTube Studio → Customization → Basic Info → Keywords',
    },
    {
      id: 'video-typos',
      category: 'SEO Judul',
      title: `Typo di Judul Video`,
      description: 'Judul dengan typo terlihat tidak profesional dan bisa menurunkan CTR.',
      severity: typoVideos.length > 0 ? 'high' : 'low',
      status: typoVideos.length === 0 ? 'fixed' : 'pending',
      affectedCount: typoVideos.length,
      affectedItems: typoVideos.map(v => v.title),
      action: 'Edit judul langsung di YouTube Studio atau via API',
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
      action: 'Tambahkan suffix unik (bulan/tahun/versi) ke setiap judul',
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
      action: 'Tambahkan tags relevan via YouTube Studio atau API',
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
      action: 'Set defaultLanguage ke "id" via API atau YouTube Studio',
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
      action: 'Private atau hapus video ini — tidak berkontribusi ke engagement channel',
    },
    {
      id: 'low-engagement',
      category: 'Engagement',
      title: 'Video Engagement Rendah (<1%)',
      description: 'Engagement rate di bawah 1% sinyal ke algoritma bahwa konten kurang relevan.',
      severity: lowEngVideos.length > 3 ? 'high' : lowEngVideos.length > 0 ? 'medium' : 'low',
      status: lowEngVideos.length === 0 ? 'fixed' : 'warning',
      affectedCount: lowEngVideos.length,
      affectedItems: lowEngVideos.map(v => `${v.title} (${v.engagementRate}%)`),
      action: 'Update deskripsi, thumbnail, dan judul untuk meningkatkan CTR',
    },
    {
      id: 'upload-frequency',
      category: 'Konsistensi',
      title: 'Frekuensi Upload',
      description: isUploadStale
        ? `Upload terakhir ${daysSinceLastUpload} hari yang lalu — algoritma sudah "tidur". Target 2x/minggu.`
        : `Upload terakhir ${daysSinceLastUpload} hari yang lalu — masih aktif. ✅`,
      severity: isUploadStale ? 'critical' : 'low',
      status: isUploadStale ? 'pending' : 'fixed',
      action: 'Upload 2x/minggu — Minggu & Selasa jam 13:00 WIB',
    },
    {
      id: 'fresh-content-2026',
      category: 'Konten',
      title: 'Konten 2025/2026 (Keyword Fresh)',
      description: 'Kompetitor dengan video 2025–2026 mulai menggeser ranking lu di keyword utama.',
      severity: has2026Content ? 'low' : 'high',
      status: has2026Content ? 'fixed' : 'pending',
      action: 'Buat video: "Termux Mod 2026", "ZArchiver Android 15", "Install Termux 2026 Tanpa Error"',
    },
    {
      id: 'video-description',
      category: 'SEO Metadata',
      title: 'Deskripsi Video Lengkap',
      description: 'Deskripsi minimal 150 karakter meningkatkan CTR dari search dan ranking.',
      severity: noDescVideos.length > 5 ? 'medium' : 'low',
      status: noDescVideos.length === 0 ? 'fixed' : noDescVideos.length <= 3 ? 'warning' : 'pending',
      affectedCount: noDescVideos.length,
      affectedItems: noDescVideos.slice(0, 5).map(v => v.title),
      action: 'Tambah deskripsi lengkap (keyword + link + CTA) di setiap video',
    },
    {
      id: 'captions',
      category: 'Aksesibilitas',
      title: 'Caption / Subtitle Video',
      description: 'Caption meningkatkan watch time, aksesibilitas, dan ranking di search. Harus dilakukan manual di YouTube Studio.',
      severity: 'medium',
      status: 'pending',
      action: 'YouTube Studio → Subtitles → Auto-generate → Edit → Publish (untuk tiap video)',
    },
    {
      id: 'long-videos-low-views',
      category: 'Konten',
      title: 'Video Panjang (>10 menit) dengan Views Rendah',
      description: 'Data menunjukkan video 10+ menit rata-rata dapat 12K views vs 5–8 menit yang dapat 24K+.',
      severity: longVideos.length > 0 ? 'medium' : 'low',
      status: longVideos.length === 0 ? 'fixed' : 'warning',
      affectedCount: longVideos.length,
      affectedItems: longVideos.map(v => `${v.title} (${v.duration}, ${v.views.toLocaleString()} views)`),
      action: 'Target durasi 5–8 menit untuk video baru. Edit versi pendek dari video yang ada.',
    },
    {
      id: 'tos-links',
      category: 'Keamanan',
      title: 'Link subs4unlock / Gate Content di Komentar',
      description: 'Link subs4unlock.id di komentar = pelanggaran ToS YouTube → penyebab engagement dikunci pada video tertentu.',
      severity: 'critical',
      status: 'pending',
      action: 'Hapus manual semua komentar yang berisi link subs4unlock.id di YouTube Studio → Comments',
    },
  ];

  return issues;
}
