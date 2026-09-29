import { describe, expect, it } from 'vitest';
import { parsePlayerResponse } from '../youtube/browser-player';

const track = (lang: string, extra = '', kind?: string) => ({
  baseUrl: `https://www.youtube.com/api/timedtext?v=abcdefghijk&signature=x&lang=${lang}&fmt=srv3${extra}`,
  languageCode: lang,
  kind,
  name: { runs: [{ text: lang }] },
});

describe('parsePlayerResponse', () => {
  it('returns the tracks, without fmt and with auto captions marked', () => {
    const r = parsePlayerResponse('abcdefghijk', {
      playabilityStatus: { status: 'OK' },
      videoDetails: { videoId: 'abcdefghijk', title: 'T', author: 'A', lengthSeconds: '42' },
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [track('pt-BR'), track('en', '', 'asr')],
          translationLanguages: [{ languageCode: 'es' }],
        },
      },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.info.tracks.map((t) => [t.languageCode, t.kind])).toEqual([
      ['pt-BR', 'manual'],
      ['en', 'asr'],
    ]);
    expect(r.info.tracks[0]!.baseUrl).not.toContain('fmt=');
    expect(r.info).toMatchObject({ title: 'T', author: 'A', lengthSeconds: 42, translationLanguages: ['es'] });
  });

  it('classifies bot walls, private, age-restricted and missing videos', () => {
    const status = (s: string, reason: string) =>
      parsePlayerResponse('abcdefghijk', { playabilityStatus: { status: s, reason } });
    expect(status('LOGIN_REQUIRED', "Sign in to confirm you're not a bot")).toEqual({ ok: false, code: 'blocked' });
    expect(status('LOGIN_REQUIRED', 'This video is private')).toEqual({ ok: false, code: 'private' });
    expect(status('LOGIN_REQUIRED', 'Sign in to confirm your age')).toEqual({ ok: false, code: 'age_restricted' });
    expect(status('ERROR', 'Video unavailable')).toEqual({ ok: false, code: 'not_found' });
    expect(status('LIVE_STREAM_OFFLINE', 'Premieres soon')).toEqual({ ok: false, code: 'live' });
  });

  it('treats token-only tracks as "try the relay", and no tracks as no captions', () => {
    const tokenOnly = parsePlayerResponse('abcdefghijk', {
      playabilityStatus: { status: 'OK' },
      captions: { playerCaptionsTracklistRenderer: { captionTracks: [track('en', '&exp=xpe')] } },
    });
    expect(tokenOnly).toEqual({ ok: false, code: 'blocked' });
    expect(parsePlayerResponse('abcdefghijk', { playabilityStatus: { status: 'OK' } })).toEqual({
      ok: false,
      code: 'no_captions',
    });
  });

  it('never trusts an answer about another video', () => {
    const r = parsePlayerResponse('abcdefghijk', {
      playabilityStatus: { status: 'OK' },
      videoDetails: { videoId: 'zzzzzzzzzzz' },
    });
    expect(r).toEqual({ ok: false, code: 'blocked' });
  });
});
