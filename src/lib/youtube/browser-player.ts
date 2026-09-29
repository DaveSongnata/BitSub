/**
 * Asks YouTube for a video's caption list straight from the visitor's browser (their own IP),
 * with no server in between.
 *
 * How: a hidden sandboxed iframe (no allow-same-origin) has an opaque origin, so its requests carry
 * `Origin: null`. A CORS "simple" POST (text/plain, no custom headers) from there to innertube's
 * /player is answered with `Access-Control-Allow-Origin: null`, so the frame can read it and hand
 * the result back to us via postMessage. Verified 2026-09-29 in Chromium, Firefox and WebKit.
 * Unofficial: if YouTube ever stops accepting it, the caller falls back to the server relay.
 */
import type { CaptionTrack, FetchErrorCode, VideoInfo } from './client';

// Only the fields we use (sent as ?fields= because a header would force a CORS preflight).
const FIELDS =
  'playabilityStatus(status,reason,messages),videoDetails(videoId,title,author,lengthSeconds,isLive),' +
  'captions.playerCaptionsTracklistRenderer(captionTracks(baseUrl,languageCode,kind,name,isTranslatable),translationLanguages.languageCode)';

// App clients answer without a proof-of-origin token and their caption URLs work anywhere.
// Bump versions (see yt-dlp's _base.py) if YouTube starts rejecting them.
const CLIENTS = {
  ANDROID: { clientName: 'ANDROID', clientVersion: '20.10.38', androidSdkVersion: 30, osName: 'Android', osVersion: '11' },
  IOS: {
    clientName: 'IOS',
    clientVersion: '20.10.4',
    deviceMake: 'Apple',
    deviceModel: 'iPhone16,2',
    osName: 'iPhone',
    osVersion: '18.3.2.22D82',
  },
} as const;
type ClientName = keyof typeof CLIENTS;

function frameSource(parentOrigin: string): string {
  return `<!doctype html><meta charset="utf-8"><script>
const CLIENTS = ${JSON.stringify(CLIENTS)};
const URL_ = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false&fields=' + encodeURIComponent(${JSON.stringify(FIELDS)});
addEventListener('message', async (e) => {
  const d = e.data || {};
  if (typeof d.id !== 'number' || !/^[A-Za-z0-9_-]{11}$/.test(d.videoId) || !CLIENTS[d.client]) return;
  let out;
  try {
    const r = await fetch(URL_, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify({ context: { client: Object.assign({ hl: 'en', gl: 'US' }, CLIENTS[d.client]) }, videoId: d.videoId, contentCheckOk: true, racyCheckOk: true }),
    });
    out = { id: d.id, http: r.status, json: r.ok ? await r.json() : null };
  } catch (err) {
    out = { id: d.id, error: String(err) };
  }
  parent.postMessage(out, ${JSON.stringify(parentOrigin)});
});
<\/script>`;
}

interface FrameReply {
  id: number;
  http?: number;
  json?: PlayerResponse | null;
  error?: string;
}

let frame: HTMLIFrameElement | null = null;
let ready: Promise<HTMLIFrameElement> | null = null;
let seq = 0;

function getFrame(): Promise<HTMLIFrameElement> {
  if (ready) return ready;
  ready = new Promise((resolve, reject) => {
    const el = document.createElement('iframe');
    el.setAttribute('sandbox', 'allow-scripts');
    el.setAttribute('aria-hidden', 'true');
    el.tabIndex = -1;
    el.title = 'BitSub';
    el.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden';
    el.srcdoc = frameSource(window.location.origin);
    el.addEventListener('load', () => resolve(el), { once: true });
    el.addEventListener('error', () => reject(new Error('frame')), { once: true });
    document.body.appendChild(el);
    frame = el;
  });
  return ready;
}

async function askFrame(videoId: string, client: ClientName, signal?: AbortSignal): Promise<FrameReply> {
  const el = await getFrame();
  const id = ++seq;
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => finish(null, new Error('timeout')), 12000);
    const onMessage = (e: MessageEvent) => {
      if (e.source !== el.contentWindow) return;
      const data = e.data as FrameReply | null;
      if (data?.id === id) finish(data);
    };
    const onAbort = () => finish(null, new DOMException('aborted', 'AbortError'));
    function finish(data: FrameReply | null, err?: Error) {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      signal?.removeEventListener('abort', onAbort);
      if (data) resolve(data);
      else reject(err ?? new Error('no answer'));
    }
    window.addEventListener('message', onMessage);
    signal?.addEventListener('abort', onAbort);
    el.contentWindow?.postMessage({ id, videoId, client }, '*');
  });
}

// ---------------------------------------------------------------- parsing (mirrors api/_lib/innertube.ts)

export interface PlayerResponse {
  playabilityStatus?: { status?: string; reason?: string; messages?: string[] };
  videoDetails?: { videoId?: string; title?: string; author?: string; lengthSeconds?: string; isLive?: boolean };
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

export type PlayerResult = { ok: true; info: VideoInfo } | { ok: false; code: FetchErrorCode };

export function parsePlayerResponse(videoId: string, p: PlayerResponse | null | undefined): PlayerResult {
  if (!p) return { ok: false, code: 'unknown' };
  const status = p.playabilityStatus?.status;
  const reason = `${p.playabilityStatus?.reason ?? ''} ${(p.playabilityStatus?.messages ?? []).join(' ')}`;
  if (status && status !== 'OK') {
    if (
      /not a bot|confirm you.re not|unusual traffic/i.test(reason) ||
      (status === 'LOGIN_REQUIRED' && !/age|private/i.test(reason))
    )
      return { ok: false, code: 'blocked' };
    if (/age|inappropriate/i.test(reason)) return { ok: false, code: 'age_restricted' };
    if (/private/i.test(reason)) return { ok: false, code: 'private' };
    if (status === 'LIVE_STREAM_OFFLINE' || /premiere|live stream|live event/i.test(reason)) return { ok: false, code: 'live' };
    if (status === 'ERROR' || /unavailable|removed|does not exist|terminated/i.test(reason))
      return { ok: false, code: 'not_found' };
    return { ok: false, code: 'unavailable' };
  }
  // Blocked clients are sometimes served a different video: never trust that.
  if (p.videoDetails?.videoId && p.videoDetails.videoId !== videoId) return { ok: false, code: 'blocked' };
  const renderer = p.captions?.playerCaptionsTracklistRenderer;
  const raw = renderer?.captionTracks ?? [];
  const tracks: CaptionTrack[] = raw
    .filter((t) => !/[?&]exp=xpe/.test(t.baseUrl))
    .map((t) => {
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
  if (!tracks.length) {
    if (raw.length) return { ok: false, code: 'blocked' }; // tracks exist but need a token: let the relay try
    return { ok: false, code: p.videoDetails?.isLive ? 'live' : 'no_captions' };
  }
  const d = p.videoDetails ?? {};
  return {
    ok: true,
    info: {
      videoId,
      title: d.title ?? '',
      author: d.author ?? '',
      lengthSeconds: Number(d.lengthSeconds ?? 0) || 0,
      isLive: Boolean(d.isLive),
      tracks,
      translationLanguages: (renderer?.translationLanguages ?? []).map((l) => l.languageCode),
    },
  };
}

/** Definitive answers about the video itself (no point asking the server). */
const FINAL: FetchErrorCode[] = ['not_found', 'private', 'age_restricted', 'live', 'no_captions'];

/**
 * Caption list from the visitor's browser. Resolves with the info, or with a final error code
 * about the video; rejects when the browser path can't answer (then the caller uses the relay).
 */
export async function fetchVideoInfoInBrowser(videoId: string, signal?: AbortSignal): Promise<PlayerResult> {
  const answers: FetchErrorCode[] = [];
  for (const client of Object.keys(CLIENTS) as ClientName[]) {
    const reply = await askFrame(videoId, client, signal);
    if (reply.error || !reply.http || reply.http !== 200) continue;
    const result = parsePlayerResponse(videoId, reply.json);
    if (result.ok) return result;
    answers.push(result.code);
    // Both clients agree about the video itself: that's the answer.
    if (answers.length >= 2 && answers[0] === answers[1] && FINAL.includes(answers[0]!)) return { ok: false, code: answers[0]! };
  }
  throw new Error(`browser path failed: ${answers.join(',') || 'no answer'}`);
}

/** For tests and cleanup. */
export function disposeBrowserPlayer() {
  frame?.remove();
  frame = null;
  ready = null;
}
