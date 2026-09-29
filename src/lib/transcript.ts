/**
 * Transcript model + exporters (TXT, TXT with time, SRT, VTT).
 * Everything here is pure and runs in the browser.
 */

export interface Cue {
  /** seconds */
  start: number;
  /** seconds */
  end: number;
  text: string;
}

export interface Block {
  start: number;
  end: number;
  text: string;
}

export type ExportFormat = 'txt' | 'txt-time' | 'srt' | 'vtt';

const SENTENCE_END = /[.!?…。！？]["'”’)\]]*$/;

export function cleanText(raw: string): string {
  return raw
    .replace(/​/g, '')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Remove overlaps (auto captions roll two lines at a time) and empty cues. */
export function normalizeCues(cues: Cue[]): Cue[] {
  const sorted = cues
    .map((c) => ({ ...c, text: cleanText(c.text) }))
    .filter((c) => c.text.length > 0)
    .sort((a, b) => a.start - b.start);
  const out: Cue[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i]!;
    const next = sorted[i + 1];
    let end = cur.end > cur.start ? cur.end : cur.start + 2;
    if (next && next.start > cur.start && end > next.start) end = next.start;
    const prev = out[out.length - 1];
    // Drop exact duplicates that some tracks emit back-to-back
    if (prev && prev.text === cur.text && Math.abs(prev.start - cur.start) < 0.05) continue;
    out.push({ start: cur.start, end: Math.max(end, cur.start + 0.2), text: cur.text });
  }
  return out;
}

interface GroupOptions {
  /** Prefer to break after a sentence once the block has at least this many chars */
  softChars: number;
  /** Always break once the block has at least this many chars */
  hardChars: number;
  /** Always break once the block spans this many seconds */
  hardSeconds: number;
  /** A silence this long (seconds) starts a new block */
  gap: number;
}

function group(cues: Cue[], o: GroupOptions): Block[] {
  const blocks: Block[] = [];
  let cur: Block | null = null;
  for (const c of cues) {
    if (cur) {
      const silence = c.start - cur.end;
      const len = cur.text.length;
      const span = cur.end - cur.start;
      const sentenceDone = SENTENCE_END.test(cur.text);
      const shouldBreak = silence >= o.gap || (sentenceDone && len >= o.softChars) || len >= o.hardChars || span >= o.hardSeconds;
      if (shouldBreak) {
        blocks.push(cur);
        cur = null;
      }
    }
    if (!cur) cur = { start: c.start, end: c.end, text: c.text };
    else {
      cur.text = `${cur.text} ${c.text}`;
      cur.end = Math.max(cur.end, c.end);
    }
  }
  if (cur) blocks.push(cur);
  return blocks;
}

/** Short blocks for reading with timestamps (≈ one idea each). */
export function toTimedBlocks(cues: Cue[]): Block[] {
  const punctuated = cues.filter((c) => SENTENCE_END.test(c.text)).length > cues.length * 0.15;
  return punctuated
    ? group(cues, { softChars: 110, hardChars: 260, hardSeconds: 22, gap: 2.5 })
    : group(cues, { softChars: 90, hardChars: 170, hardSeconds: 12, gap: 1.8 });
}

/** Long blocks for plain paragraphs. */
export function toParagraphs(cues: Cue[]): Block[] {
  return group(cues, { softChars: 420, hardChars: 900, hardSeconds: 120, gap: 4 });
}

function pad(n: number, size = 2): string {
  return String(Math.floor(n)).padStart(size, '0');
}

/** 75 → "01:15", 3725 → "1:02:05" */
export function formatClock(seconds: number, forceHours = false): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0 || forceHours) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

function srtTime(seconds: number, sep: ',' | '.'): string {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}${sep}${pad(ms % 1000, 3)}`;
}

/** Break long single-line cues into at most two lines of ~42 chars (subtitle convention). */
function wrapSubtitle(text: string, max = 42): string {
  if (text.length <= max) return text;
  const words = text.split(' ');
  const mid = text.length / 2;
  let best = 0;
  let bestDist = Infinity;
  let pos = 0;
  for (let i = 0; i < words.length - 1; i++) {
    pos += words[i]!.length + 1;
    const d = Math.abs(pos - mid);
    if (d < bestDist) {
      bestDist = d;
      best = i + 1;
    }
  }
  return `${words.slice(0, best).join(' ')}\n${words.slice(best).join(' ')}`;
}

export interface ExportMeta {
  title?: string;
  url?: string;
  includeHeader?: boolean;
}

function header(meta: ExportMeta): string {
  if (!meta.includeHeader) return '';
  const lines = [meta.title, meta.url].filter(Boolean);
  return lines.length ? `${lines.join('\n')}\n\n` : '';
}

export function exportTranscript(cues: Cue[], format: ExportFormat, meta: ExportMeta = {}): string {
  switch (format) {
    case 'txt':
      return (
        header(meta) +
        toParagraphs(cues)
          .map((b) => b.text)
          .join('\n\n') +
        '\n'
      );
    case 'txt-time': {
      const long = (cues[cues.length - 1]?.end ?? 0) >= 3600;
      return (
        header(meta) +
        toTimedBlocks(cues)
          .map((b) => `[${formatClock(b.start, long)}] ${b.text}`)
          .join('\n') +
        '\n'
      );
    }
    case 'srt':
      return cues
        .map((c, i) => `${i + 1}\n${srtTime(c.start, ',')} --> ${srtTime(c.end, ',')}\n${wrapSubtitle(c.text)}\n`)
        .join('\n');
    case 'vtt':
      return (
        'WEBVTT\n\n' +
        cues.map((c) => `${srtTime(c.start, '.')} --> ${srtTime(c.end, '.')}\n${wrapSubtitle(c.text)}\n`).join('\n')
      );
  }
}

export const FORMAT_EXT: Record<ExportFormat, string> = {
  txt: 'txt',
  'txt-time': 'txt',
  srt: 'srt',
  vtt: 'vtt',
};

export const FORMAT_MIME: Record<ExportFormat, string> = {
  txt: 'text/plain',
  'txt-time': 'text/plain',
  srt: 'application/x-subrip',
  vtt: 'text/vtt',
};

/** "Meu Vídeo: Parte 1!" → "meu-video-parte-1" */
export function slugify(text: string, max = 80): string {
  const slug = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '');
  return slug || 'video';
}

export function exportFileName(title: string, lang: string, format: ExportFormat): string {
  const suffix = format === 'txt-time' ? '.com-tempo' : '';
  return `${slugify(title)}.${lang}${suffix}.${FORMAT_EXT[format]}`;
}

/** Compact version for the AI: "[mm:ss] text" blocks. */
export function transcriptForAI(cues: Cue[]): string {
  const long = (cues[cues.length - 1]?.end ?? 0) >= 3600;
  return toTimedBlocks(cues)
    .map((b) => `[${formatClock(b.start, long)}] ${b.text}`)
    .join('\n');
}

export function wordCount(cues: Cue[]): number {
  let n = 0;
  for (const c of cues) n += c.text.split(/\s+/).filter(Boolean).length;
  return n;
}

/**
 * Parse text pasted by the person (e.g. copied from YouTube's "Show transcript" panel,
 * or an SRT/VTT file) into cues. Plain text without times becomes one cue per line.
 */
export function parsePastedTranscript(raw: string): Cue[] {
  const text = raw.replace(/\r\n?/g, '\n').trim();
  if (!text) return [];

  // SRT / VTT
  const arrow = /(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{3}\s*-->\s*(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{3}/;
  if (arrow.test(text)) {
    const toSec = (t: string) => {
      const [hms, ms = '0'] = t.trim().split(/[.,]/);
      const parts = (hms ?? '0').split(':').map(Number);
      while (parts.length < 3) parts.unshift(0);
      return parts[0]! * 3600 + parts[1]! * 60 + parts[2]! + Number(ms) / 1000;
    };
    const cues: Cue[] = [];
    for (const chunk of text.split(/\n{2,}/)) {
      const lines = chunk.split('\n');
      const idx = lines.findIndex((l) => l.includes('-->'));
      if (idx < 0) continue;
      const [a, b] = lines[idx]!.split('-->');
      const body = lines
        .slice(idx + 1)
        .join(' ')
        .replace(/<[^>]+>/g, '');
      if (a && b) cues.push({ start: toSec(a), end: toSec(b.trim().split(/\s/)[0] ?? b), text: body });
    }
    return normalizeCues(cues);
  }

  // "0:00\ntext" (YouTube panel) or "[00:12] text" / "00:12 text"
  const timeOnly = /^\[?(\d{1,2}:)?\d{1,2}:\d{2}\]?$/;
  const timeLead = /^\[?((?:\d{1,2}:)?\d{1,2}:\d{2})\]?\s*[-–—]?\s*(.+)$/;
  const toSeconds = (t: string) =>
    t
      .replace(/[[\]]/g, '')
      .split(':')
      .map(Number)
      .reduce((acc, n) => acc * 60 + n, 0);
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const timed: Cue[] = [];
  let pendingTime: number | null = null;
  for (const line of lines) {
    if (timeOnly.test(line)) {
      pendingTime = toSeconds(line);
      continue;
    }
    const lead = timeLead.exec(line);
    if (lead?.[1] && lead[2]) {
      timed.push({ start: toSeconds(lead[1]), end: 0, text: lead[2] });
      pendingTime = null;
      continue;
    }
    if (pendingTime !== null) {
      timed.push({ start: pendingTime, end: 0, text: line });
      pendingTime = null;
    } else if (timed.length) {
      timed[timed.length - 1]!.text += ` ${line}`;
    } else {
      timed.push({ start: -1, end: 0, text: line });
    }
  }
  const hasTimes = timed.some((c) => c.start >= 0);
  if (!hasTimes) {
    // No times at all: fake a steady pace so exports still work (≈ 2.5 words/second)
    let t = 0;
    return normalizeCues(
      lines.map((l) => {
        const dur = Math.max(1.5, l.split(/\s+/).length / 2.5);
        const cue = { start: t, end: t + dur, text: l };
        t += dur;
        return cue;
      })
    );
  }
  for (let i = 0; i < timed.length; i++) {
    const c = timed[i]!;
    if (c.start < 0) c.start = 0;
    const next = timed[i + 1];
    c.end = next ? Math.max(next.start, c.start + 0.5) : c.start + Math.max(2, c.text.split(/\s+/).length / 2.5);
  }
  return normalizeCues(timed);
}
