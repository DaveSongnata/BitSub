import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { clearHistory, db, removeVideo } from '@/lib/db';
import { Link, navigate, watchPath } from '@/lib/router';
import { parseYouTubeLink } from '@/lib/youtube/url';
import { toast } from '@/lib/toast';
import { currentLanguage } from '@/i18n';
import { Footer, Page } from '@/components/Shell';
import { Icon } from '@/components/Icon';
import { Mascot } from '@/components/Mascot';
import { Button, Dots } from '@/components/ui';
import { VideoTile } from '@/components/VideoTile';
import { Result } from './Watch';

/** Pasted transcripts live only in the local history: /text/:id */
export function TextView({ id }: { id: string }) {
  const video = useLiveQuery(() => db.videos.get(id), [id], null);
  if (video === null)
    return (
      <Page className="flex min-h-[50vh] items-center justify-center">
        <Dots size="lg" />
      </Page>
    );
  if (!video) return <NotFound />;
  return (
    <>
      <Page className="pb-28 pt-8 lg:pb-10">
        <Result video={video} notice={null} requested="original" />
      </Page>
      <Footer />
    </>
  );
}

function relativeTime(ts: number, t: ReturnType<typeof useTranslation>['t']): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 90) return t('time.justNow');
  if (diff < 3600) return t('time.minutesAgo', { count: Math.round(diff / 60) });
  if (diff < 86400) return t('time.hoursAgo', { count: Math.round(diff / 3600) });
  if (diff < 86400 * 30) return t('time.daysAgo', { count: Math.round(diff / 86400) });
  return new Date(ts).toLocaleDateString(currentLanguage());
}

export function History() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const videos = useLiveQuery(
    () =>
      db.videos
        .orderBy('openedAt')
        .reverse()
        .toArray()
        .catch(() => []),
    [],
    null
  );
  const chats = useLiveQuery(
    () =>
      db.chats
        .toCollection()
        .primaryKeys()
        .catch(() => []),
    [],
    []
  );
  const withChat = useMemo(() => new Set(chats), [chats]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!videos) return [];
    return q ? videos.filter((v) => `${v.title} ${v.author}`.toLowerCase().includes(q)) : videos;
  }, [videos, query]);

  const clearAll = async () => {
    if (!window.confirm(t('history.clearConfirm'))) return;
    await clearHistory();
    toast(t('history.cleared'), 'success');
  };

  return (
    <>
      <Page className="pt-8 sm:pt-12">
        <div className="mb-8 flex flex-col gap-4 border-b-2 border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[2.25rem] font-semibold leading-tight tracking-[-0.025em]">{t('history.title')}</h1>
            <p className="mt-2 max-w-xl text-muted">{t('history.subtitle')}</p>
          </div>
          {videos?.length ? (
            <Button variant="ghost" icon="trash" onClick={() => void clearAll()}>
              {t('history.clearAll')}
            </Button>
          ) : null}
        </div>

        {videos === null ? (
          <Dots size="lg" />
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-start gap-5 border-2 border-dashed border-line p-8 sm:flex-row sm:items-center">
            <Mascot size={80} />
            <div className="space-y-4">
              <p className="max-w-md text-lg">{t('history.empty')}</p>
              <Link href="/" className="btn btn-primary">
                <Icon name="paste" size={18} />
                {t('history.emptyCta')}
              </Link>
            </div>
          </div>
        ) : (
          <>
            {videos.length > 6 ? (
              <div className="relative mb-6 max-w-md">
                <Icon
                  name="search"
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('history.search')}
                  aria-label={t('history.search')}
                  className="field pl-11"
                />
              </div>
            ) : null}
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((v) => (
                <li key={v.id} className="relative">
                  <VideoTile video={v} href={v.pasted ? `/text/${v.id}` : watchPath(v.videoId ?? v.id, v.requested)} />
                  <div className="mt-2 flex items-center justify-between gap-2 px-0.5 text-sm text-muted">
                    <span>
                      {t('history.savedAt', { when: relativeTime(v.openedAt, t) })}
                      {withChat.has(v.id) ? ` · ${t('history.hasChat')}` : ''}
                    </span>
                    <button
                      type="button"
                      className="p-1.5 hover:bg-surface-alt hover:text-text"
                      aria-label={`${t('common.delete')}: ${v.title}`}
                      onClick={() => void removeVideo(v.id).then(() => toast(t('history.removed')))}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Page>
      <Footer />
    </>
  );
}

export function NotFound() {
  const { t } = useTranslation();
  return (
    <Page className="flex min-h-[60vh] flex-col items-start justify-center gap-5 py-16">
      <Mascot size={96} />
      <h1 className="text-4xl font-semibold tracking-[-0.025em]">{t('notFound.title')}</h1>
      <p className="text-lg text-muted">{t('notFound.text')}</p>
      <Link href="/" className="btn btn-primary">
        {t('notFound.cta')}
        <Icon name="arrowRight" size={18} />
      </Link>
    </Page>
  );
}

/** PWA share target and "bitsub.app/<anything with a YouTube id>" shortcuts. */
export function ShareRedirect({ text }: { text: string }) {
  useEffect(() => {
    const parsed = parseYouTubeLink(text);
    navigate(parsed?.videoId ? watchPath(parsed.videoId, undefined, parsed.start) : '/', { replace: true });
  }, [text]);
  return (
    <Page className="flex min-h-[50vh] items-center justify-center">
      <Dots size="lg" />
    </Page>
  );
}
