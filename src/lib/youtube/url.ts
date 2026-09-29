/**
 * Understands every shape of YouTube link people paste:
 * watch?v=, youtu.be/, /shorts/, /live/, /embed/, /v/, m., music., nocookie,
 * links with t=, list=, si=, and links pasted together with other text
 * (e.g. "Olha esse vídeo https://youtu.be/xyz?si=abc").
 */

export interface ParsedLink {
  videoId: string | null;
  /** Start time in seconds, when the link has t= / start= */
  start?: number;
  /** The link is a playlist with no specific video */
  playlistOnly?: boolean;
}

const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const HOST_RE = /(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be)$/i;

export function isVideoId(value: string): boolean {
  return ID_RE.test(value);
}

function parseTime(raw: string | null): number | undefined {
  if (!raw) return undefined;
  if (/^\d+$/.test(raw)) return Number(raw);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/.exec(raw);
  if (!m) return undefined;
  const total = Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
  return total > 0 ? total : undefined;
}

function fromUrl(url: URL): ParsedLink | null {
  const host = url.hostname.toLowerCase();
  // Our own domain with a YouTube-like path (bitsub.app/watch?v=...) is handled too.
  const isYouTube = HOST_RE.test(host);
  const params = url.searchParams;
  const start = parseTime(params.get('t') ?? params.get('start'));
  const parts = url.pathname.split('/').filter(Boolean);

  if (host.endsWith('youtu.be')) {
    const id = parts[0] ?? '';
    return isVideoId(id) ? { videoId: id, start } : { videoId: null };
  }

  const v = params.get('v') ?? params.get('vi');
  if (v && isVideoId(v)) return { videoId: v, start };

  const [first, second] = parts;
  if (first && second && ['shorts', 'live', 'embed', 'v', 'e', 'watch'].includes(first.toLowerCase())) {
    return isVideoId(second) ? { videoId: second, start } : { videoId: null };
  }

  // attribution_link?u=/watch%3Fv%3D...
  const u = params.get('u');
  if (u) {
    try {
      return fromUrl(new URL(u, 'https://www.youtube.com'));
    } catch {
      /* ignore */
    }
  }

  if (params.get('list') && isYouTube) return { videoId: null, playlistOnly: true };

  // Bare /VIDEOID path (only for non-YouTube hosts, e.g. bitsub.app/dQw4w9WgXcQ)
  if (!isYouTube && first && !second && isVideoId(first)) return { videoId: first, start };

  return isYouTube ? { videoId: null } : null;
}

/**
 * Extract a video from arbitrary text. Returns null when nothing YouTube-like was found.
 */
export function parseYouTubeLink(input: string): ParsedLink | null {
  const text = input.trim();
  if (!text) return null;
  if (isVideoId(text)) return { videoId: text };

  const candidates = text.match(/(?:https?:\/\/)?(?:[\w-]+\.)*(?:youtube(?:-nocookie)?\.com|youtu\.be)\/[^\s<>"']*/gi);
  const list = candidates ?? [text];
  let fallback: ParsedLink | null = null;
  for (const raw of list) {
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      const parsed = fromUrl(url);
      if (parsed?.videoId) return parsed;
      if (parsed && !fallback) fallback = parsed;
    } catch {
      /* not a URL */
    }
  }
  return fallback;
}

export function watchUrl(videoId: string, seconds?: number): string {
  const t = seconds && seconds > 0 ? `&t=${Math.floor(seconds)}s` : '';
  return `https://www.youtube.com/watch?v=${videoId}${t}`;
}

export function thumbnailUrl(videoId: string, quality: 'mq' | 'hq' | 'maxres' = 'hq'): string {
  const name = quality === 'maxres' ? 'maxresdefault' : `${quality}default`;
  return `https://i.ytimg.com/vi/${videoId}/${name}.jpg`;
}
