import { memo, useDeferredValue, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { exportTranscript, formatClock, toParagraphs, toTimedBlocks, type Block, type Cue } from '@/lib/transcript';
import { seek, usePlayerTime } from '@/lib/player';
import { copyText } from '@/lib/files';
import { toast } from '@/lib/toast';
import { updateSettings, useSettings } from '@/lib/settings';
import { Icon } from './Icon';
import { Button, SectionTitle, Switch, cn } from './ui';

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Accent-insensitive matching ("acao" finds "ação"). Per character, so indexes stay aligned
 * with the original text (Korean/Japanese would drift if normalized as a whole).
 */
function fold(s: string) {
  let out = '';
  for (const ch of s) {
    const f = ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    out += f.length === ch.length ? f : ch.toLowerCase().length === ch.length ? ch.toLowerCase() : ch;
  }
  return out;
}

function highlight(text: string, query: string, startIndex: number, activeIndex: number): { node: ReactNode; count: number } {
  if (!query) return { node: text, count: 0 };
  const folded = fold(text);
  const q = fold(query);
  const re = new RegExp(escapeRe(q), 'g');
  const parts: ReactNode[] = [];
  let last = 0;
  let count = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(folded))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const idx = startIndex + count;
    parts.push(
      <mark
        key={m.index}
        data-match={idx}
        className={cn('px-0.5 text-text', idx === activeIndex ? 'bg-primary outline-2 outline-line' : 'bg-[var(--bs-highlight)]')}
      >
        {text.slice(m.index, m.index + m[0].length)}
      </mark>
    );
    last = m.index + m[0].length;
    count++;
    if (m[0].length === 0) re.lastIndex++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return { node: parts, count };
}

const Rows = memo(function Rows({
  blocks,
  showTime,
  query,
  active,
  playing,
  long,
  jumpLabel,
}: {
  blocks: Block[];
  showTime: boolean;
  query: string;
  active: number;
  playing: number;
  long: boolean;
  jumpLabel: (time: string) => string;
}) {
  let running = 0;
  return (
    <ol className={cn('divide-y divide-hair', !showTime && 'space-y-0')}>
      {blocks.map((b, i) => {
        const { node, count } = highlight(b.text, query, running, active);
        running += count;
        const time = formatClock(b.start, long);
        return (
          <li
            key={i}
            data-row={i}
            aria-current={i === playing ? 'true' : undefined}
            className={cn(
              'relative grid gap-x-4 py-3 transition-colors duration-200',
              showTime ? 'grid-cols-[4.25rem_1fr] sm:grid-cols-[5rem_1fr]' : 'grid-cols-1',
              i === playing &&
                'bg-[var(--bs-highlight)] before:absolute before:-left-4 before:top-0 before:bottom-0 before:w-1 before:bg-primary sm:before:-left-5'
            )}
          >
            {showTime ? (
              <button
                type="button"
                onClick={() => seek(b.start)}
                className={cn(
                  'h-fit self-start justify-self-start px-1 py-0.5 font-mono text-[0.85rem] tnum underline decoration-primary decoration-2 underline-offset-4 hover:bg-primary hover:text-on-primary hover:no-underline',
                  i === playing ? 'bg-primary font-semibold text-on-primary no-underline' : 'text-muted'
                )}
                aria-label={jumpLabel(time)}
                title={jumpLabel(time)}
              >
                {time}
              </button>
            ) : null}
            <p className={cn('text-pretty leading-relaxed', showTime ? 'text-[1.0125rem]' : 'text-[1.0625rem]')}>{node}</p>
          </li>
        );
      })}
    </ol>
  );
});

export function TranscriptPanel({ cues, title, url }: { cues: Cue[]; title: string; url?: string }) {
  const { t } = useTranslation();
  const settings = useSettings();
  const showTime = settings.showTime;
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query.trim());
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const playerTime = usePlayerTime();

  const blocks = useMemo(() => (showTime ? toTimedBlocks(cues) : toParagraphs(cues)), [cues, showTime]);
  const long = (cues[cues.length - 1]?.end ?? 0) >= 3600;

  // Block being played right now (last block that started before the player's time)
  const playing = useMemo(() => {
    if (playerTime === null) return -1;
    let lo = 0;
    let hi = blocks.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (blocks[mid]!.start <= playerTime + 0.25) {
        found = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return found;
  }, [blocks, playerTime]);

  // Follow the video only while the person is looking at the playing part (never hijack their scroll).
  const lastPlaying = useRef(-1);
  useEffect(() => {
    const prev = lastPlaying.current;
    lastPlaying.current = playing;
    if (playing < 0 || playing === prev || deferred) return;
    const list = listRef.current;
    const prevRow = list?.querySelector<HTMLElement>(`[data-row="${prev}"]`);
    const row = list?.querySelector<HTMLElement>(`[data-row="${playing}"]`);
    if (!row || !prevRow) return;
    const r = prevRow.getBoundingClientRect();
    const visible = r.bottom > 0 && r.top < window.innerHeight;
    if (visible) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [playing, deferred]);

  const total = useMemo(() => {
    if (!deferred) return 0;
    const re = new RegExp(escapeRe(fold(deferred)), 'g');
    return blocks.reduce((n, b) => n + (fold(b.text).match(re)?.length ?? 0), 0);
  }, [blocks, deferred]);

  useEffect(() => setActive(0), [deferred, showTime]);
  useEffect(() => {
    if (!deferred || !total) return;
    listRef.current?.querySelector(`[data-match="${active}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [active, deferred, total]);

  const step = (dir: 1 | -1) => {
    if (!total) return;
    setActive((a) => (a + dir + total) % total);
  };

  const copyAll = async () => {
    const text = exportTranscript(cues, showTime ? 'txt-time' : 'txt', { title, url, includeHeader: false });
    const ok = await copyText(text);
    toast(ok ? t('toast.copied') : t('toast.copyFailed'), ok ? 'success' : 'error');
  };

  return (
    <section aria-labelledby="transcript-title">
      <SectionTitle id="transcript-title">{t('transcript.title')}</SectionTitle>
      <div className="card">
        <div className="sticky top-[calc(var(--header-h)+3.25rem)] z-10 flex lg:top-[var(--header-h)] flex-col gap-3 border-b-2 border-line bg-surface p-3">
          <div className="relative min-w-0 flex-1">
            <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  step(e.shiftKey ? -1 : 1);
                }
              }}
              placeholder={t('transcript.search')}
              aria-label={t('transcript.search')}
              className="field min-h-11 pl-10 pr-24"
            />
            {deferred ? (
              <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
                <span className="px-1.5 text-sm tnum text-muted" aria-live="polite">
                  {total ? `${active + 1}/${total}` : t('transcript.noMatches')}
                </span>
                {total > 1 ? (
                  <>
                    <button type="button" className="p-1 hover:bg-surface-alt" onClick={() => step(-1)} aria-label="↑">
                      <Icon name="chevronDown" size={16} className="rotate-180" />
                    </button>
                    <button type="button" className="p-1 hover:bg-surface-alt" onClick={() => step(1)} aria-label="↓">
                      <Icon name="chevronDown" size={16} />
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="w-auto">
              <Switch checked={showTime} onChange={(v) => updateSettings({ showTime: v })} label={t('transcript.showTime')} />
            </div>
            <Button size="sm" icon="copy" onClick={() => void copyAll()}>
              {t('transcript.copyAll')}
            </Button>
          </div>
        </div>
        <div ref={listRef} className="px-4 sm:px-5">
          {blocks.length ? (
            <Rows
              blocks={blocks}
              showTime={showTime}
              query={deferred}
              active={active}
              playing={playing}
              long={long}
              jumpLabel={(time) => t('transcript.jumpTo', { time })}
            />
          ) : (
            <p className="py-6 text-muted">{t('transcript.empty')}</p>
          )}
        </div>
      </div>
    </section>
  );
}
