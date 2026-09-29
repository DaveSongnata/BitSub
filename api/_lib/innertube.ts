/**
 * Server side (Vercel Function) of BitSub.
 * Only job: given a video id, return the caption track list (signed URLs) + basic metadata.
 * It never downloads the caption text, never stores anything, never logs.
 */

export interface RelayTrack {
  baseUrl: string;
  languageCode: string;
  name: string;
  kind: 'asr' | 'manual';
  isTranslatable: boolean;
}

export interface RelayVideo {
  videoId: string;
  title: string;
  author: string;
  lengthSeconds: number;
  isLive: boolean;
  tracks: RelayTrack[];
  translationLanguages: string[];
  client: string;
}

export type RelayErrorCode =
  | 'invalid_link'
  | 'not_found'
  | 'unavailable'
  | 'private'
  | 'age_restricted'
  | 'live'
  | 'no_captions'
  | 'rate_limited'
  | 'blocked'
  | 'unknown';

export class RelayError extends Error {
  code: RelayErrorCode;
  constructor(code: RelayErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

interface PlayerResponse {
  playabilityStatus?: { status?: string; reason?: string; messages?: string[] };
  videoDetails?: {
    videoId?: string;
    title?: string;
    author?: string;
    lengthSeconds?: string;
    isLive?: boolean;
    isLiveContent?: boolean;
  };
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: {
        baseUrl: string;
        languageCode: string;
        kind?: string;
        isTranslatable?: boolean;
        name?: { simpleText?: string; runs?: { text?: string }[] };
      }[];
      translationLanguages?: { languageCode: string }[];
    };
  };
}

export interface ClientProfile {
  id: string;
  context: Record<string, unknown>;
  headers: Record<string, string>;
}

const WEB_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36,gzip(gfe)';

/**
 * Order tested on 2026-09-28: small WEB-family answers first (they need the daily
 * signatureTimestamp, but then return caption URLs that work without a PO token),
 * then the app clients. Bump versions from yt-dlp's `_base.py` if they stop working.
 */
export const CLIENTS: ClientProfile[] = [
  {
    id: 'WEB',
    context: { clientName: 'WEB', clientVersion: '2.20260708.00.00' },
    headers: { 'User-Agent': WEB_UA, 'X-YouTube-Client-Name': '1', 'X-YouTube-Client-Version': '2.20260708.00.00' },
  },
  {
    id: 'IOS',
    context: {
      clientName: 'IOS',
      clientVersion: '20.10.4',
      deviceMake: 'Apple',
      deviceModel: 'iPhone16,2',
      osName: 'iPhone',
      osVersion: '18.3.2.22D82',
    },
    headers: {
      'User-Agent': 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)',
      'X-YouTube-Client-Name': '5',
      'X-YouTube-Client-Version': '20.10.4',
    },
  },
  {
    id: 'ANDROID',
    context: { clientName: 'ANDROID', clientVersion: '20.10.38', androidSdkVersion: 30, osName: 'Android', osVersion: '11' },
    headers: {
      'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip',
      'X-YouTube-Client-Name': '3',
      'X-YouTube-Client-Version': '20.10.38',
    },
  },
  {
    id: 'MWEB',
    context: { clientName: 'MWEB', clientVersion: '2.20260708.05.00' },
    headers: {
      'User-Agent':
        'Mozilla/5.0 (iPad; CPU OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1,gzip(gfe)',
      'X-YouTube-Client-Name': '2',
      'X-YouTube-Client-Version': '2.20260708.05.00',
    },
  },
];

/** Day number since epoch; YouTube accepts it as the player "signature timestamp". */
const signatureTimestamp = () => Math.floor(Date.now() / 86_400_000);

export async function callPlayer(videoId: string, client: ClientProfile, signal: AbortSignal): Promise<PlayerResponse> {
  const body = {
    context: { client: { hl: 'en', gl: 'US', ...client.context } },
    videoId,
    playbackContext: { contentPlaybackContext: { signatureTimestamp: signatureTimestamp() } },
    contentCheckOk: true,
    racyCheckOk: true,
  };
  const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      Origin: 'https://www.youtube.com',
      ...client.headers,
    },
    body: JSON.stringify(body),
    signal,
  });
  if (res.status === 429) throw new RelayError('rate_limited');
  if (!res.ok) throw new RelayError('unknown', `player ${client.id} HTTP ${res.status}`);
  return (await res.json()) as PlayerResponse;
}
function classify(p: PlayerResponse): RelayErrorCode | null {
  const status = p.playabilityStatus?.status;
  const reason = `${p.playabilityStatus?.reason ?? ''} ${(p.playabilityStatus?.messages ?? []).join(' ')}`;
  if (!status || status === 'OK') return null;
  if (/not a bot|confirm you.re not|unusual traffic/i.test(reason)) return 'blocked';
  if (/age|inappropriate/i.test(reason)) return 'age_restricted';
  if (/private/i.test(reason)) return 'private';
  if (status === 'LIVE_STREAM_OFFLINE' || /premiere|live stream|live event/i.test(reason)) return 'live';
  if (status === 'ERROR' || /unavailable|removed|does not exist|terminated/i.test(reason)) return 'not_found';
  if (status === 'LOGIN_REQUIRED') return 'blocked';
  return 'unavailable';
}

function toVideo(videoId: string, p: PlayerResponse, client: string): RelayVideo {
  const renderer = p.captions?.playerCaptionsTracklistRenderer;
  const tracks: RelayTrack[] = (renderer?.captionTracks ?? []).map((t) => {
    const url = new URL(t.baseUrl, 'https://www.youtube.com');
    url.searchParams.delete('fmt');
    return {
      baseUrl: url.toString(),
      languageCode: t.languageCode,
      name: t.name?.simpleText ?? t.name?.runs?.map((r) => r.text ?? '').join('') ?? t.languageCode,
      kind: t.kind === 'asr' ? 'asr' : 'manual',
      isTranslatable: t.isTranslatable !== false,
    };
  });
  const d = p.videoDetails ?? {};
  return {
    videoId,
    title: d.title ?? '',
    author: d.author ?? '',
    lengthSeconds: Number(d.lengthSeconds ?? 0) || 0,
    isLive: Boolean(d.isLive),
    tracks,
    translationLanguages: (renderer?.translationLanguages ?? []).map((l) => l.languageCode),
    client,
  };
}

/** Web client caption URLs may require a proof-of-origin token; those come back empty. */
function needsPoToken(url: string): boolean {
  return /[?&]exp=xpe/.test(url);
}

async function fillTitle(v: RelayVideo, signal: AbortSignal): Promise<RelayVideo> {
  if (v.title) return v;
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${v.videoId}`)}&format=json`,
      { signal }
    );
    if (res.ok) {
      const o = (await res.json()) as { title?: string; author_name?: string };
      return { ...v, title: o.title ?? v.title, author: v.author || (o.author_name ?? '') };
    }
  } catch {
    /* ignore */
  }
  return v;
}

interface Outcome {
  client: string;
  result: 'ok' | 'no_captions' | 'po_required' | RelayErrorCode;
  tracks?: number;
  ms: number;
  /** Why it failed (diagnostics only) */
  detail?: string;
  video?: RelayVideo;
}

async function tryClient(videoId: string, client: ClientProfile, signal: AbortSignal): Promise<Outcome> {
  const t0 = Date.now();
  const done = (o: Omit<Outcome, 'client' | 'ms'>): Outcome => ({ client: client.id, ms: Date.now() - t0, ...o });
  let p: PlayerResponse;
  try {
    p = await callPlayer(videoId, client, signal);
  } catch (e) {
    const detail = e instanceof Error ? `${e.name}: ${e.message}`.slice(0, 160) : String(e);
    return done({ result: e instanceof RelayError ? e.code : 'unknown', detail });
  }
  const problem = classify(p);
  if (problem) return done({ result: problem });
  // Blocked clients are sometimes served a different video: never trust that.
  if (p.videoDetails?.videoId && p.videoDetails.videoId !== videoId) return done({ result: 'blocked' });
  const video = toVideo(videoId, p, client.id);
  const raw = video.tracks.length;
  video.tracks = video.tracks.filter((t) => !needsPoToken(t.baseUrl));
  // Tracks exist but this client's URLs need a token: not a "no captions" answer, try the next client.
  if (raw && !video.tracks.length) return done({ result: 'po_required', tracks: 0 });
  return done({ result: video.tracks.length ? 'ok' : 'no_captions', tracks: video.tracks.length, video });
}

/** Runs every client once and reports what happened (for /api/tracks?diag=1). */
export async function diagnose(videoId: string, signal: AbortSignal): Promise<Omit<Outcome, 'video'>[]> {
  const out: Omit<Outcome, 'video'>[] = [];
  for (const client of CLIENTS) {
    const { video: _video, ...rest } = await tryClient(videoId, client, signal);
    out.push(rest);
  }
  return out;
}

export async function getVideo(videoId: string, signal: AbortSignal): Promise<RelayVideo> {
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) throw new RelayError('invalid_link');

  const hard: RelayErrorCode[] = [];
  let noCaptions: RelayVideo | null = null;
  let noCaptionAnswers = 0;
  let blocks = 0;
  let sawRateLimit = false;
  let sawTokenWall = false;

  for (const client of CLIENTS) {
    if (signal.aborted) break;
    const o = await tryClient(videoId, client, signal);
    if (o.result === 'ok' && o.video) return fillTitle(o.video, signal);
    if (o.result === 'no_captions' && o.video) {
      noCaptions ??= o.video;
      // Two clean "no captions" answers are enough to believe it.
      if (++noCaptionAnswers >= 2 || o.video.isLive) break;
      continue;
    }
    if (o.result === 'po_required') sawTokenWall = true;
    else if (o.result === 'blocked') {
      // All clients leave from the same server IP: once two are blocked, the rest will be too.
      // Stopping early keeps this IP's reputation from getting worse.
      if (++blocks >= 2) break;
    } else if (o.result === 'rate_limited') sawRateLimit = true;
    else if (o.result !== 'unknown' && o.result !== 'no_captions' && o.result !== 'ok') {
      hard.push(o.result as RelayErrorCode);
      // Two clients agreeing about the video itself (private, removed…) settles it.
      if (hard.filter((h) => h === o.result).length >= 2) break;
    }
  }

  // Some client saw tracks we couldn't use: never claim "no captions" (and never cache that).
  if (sawTokenWall) throw new RelayError('blocked', 'po_required');
  if (noCaptions) {
    if (noCaptions.isLive) throw new RelayError('live');
    throw new RelayError('no_captions', (await fillTitle(noCaptions, signal)).title);
  }
  if (hard[0]) throw new RelayError(hard[0]);
  if (sawRateLimit) throw new RelayError('rate_limited');
  if (blocks) throw new RelayError('blocked');
  throw new RelayError('unknown');
}
