/**
 * GET /api/tracks?v=VIDEO_ID
 * Returns the caption track list of a public YouTube video.
 * Stateless: no storage, no logs, no cookies. Only the video id reaches this function.
 *
 * GET /api/tracks?v=VIDEO_ID&diag=1 → which YouTube clients answer from this server
 * (use it after deploying to check that the region isn't blocked).
 */
import { diagnose, getVideo, RelayError } from './_lib/innertube.js';

const STATUS: Record<string, number> = {
  invalid_link: 400,
  not_found: 404,
  private: 403,
  age_restricted: 403,
  unavailable: 403,
  live: 409,
  no_captions: 404,
  rate_limited: 429,
  blocked: 503,
  unknown: 502,
};

function json(body: unknown, status: number, cache = 'no-store'): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cache,
      'x-robots-tag': 'noindex',
      'referrer-policy': 'no-referrer',
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const videoId = params.get('v') ?? '';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);

  try {
    if (params.get('diag') === '1') {
      if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return json({ error: 'invalid_link' }, 400);
      return json(
        {
          region: request.headers.get('x-vercel-id')?.split('::').slice(-2, -1)[0] ?? 'local',
          at: new Date().toISOString(),
          clients: await diagnose(videoId, ctrl.signal),
        },
        200
      );
    }

    // Only our own page may call this (the custom header forces a CORS preflight we never allow).
    if (request.headers.get('x-bitsub') !== '1') return json({ error: 'unknown', message: 'forbidden' }, 403);

    const video = await getVideo(videoId, ctrl.signal);
    // Signed caption URLs stay valid for ~7 hours; a shared CDN cache spares YouTube repeated calls.
    return json(video, 200, 'public, max-age=0, s-maxage=18000, stale-while-revalidate=600');
  } catch (e) {
    const code = e instanceof RelayError ? e.code : 'unknown';
    const cache = code === 'not_found' || code === 'no_captions' ? 'public, max-age=0, s-maxage=900' : 'no-store';
    const message = e instanceof RelayError && code === 'no_captions' ? e.message : undefined;
    return json({ error: code, message }, STATUS[code] ?? 502, cache);
  } finally {
    clearTimeout(timer);
  }
}
