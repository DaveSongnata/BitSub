import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FetchErrorCode } from '@/lib/youtube/client';
import { thumbnailUrl, watchUrl } from '@/lib/youtube/url';
import { Icon } from './Icon';
import { Mascot } from './Mascot';
import { PasteModal } from './PlanB';
import { Button } from './ui';

const RETRYABLE = new Set<FetchErrorCode | 'playlist'>(['rate_limited', 'blocked', 'unknown', 'offline']);
const PASTEABLE = new Set<FetchErrorCode | 'playlist'>(['rate_limited', 'blocked', 'unknown', 'age_restricted', 'unavailable']);

export function ErrorView({
  error,
  videoId,
  title,
  onRetry,
  onAnother,
}: {
  error: FetchErrorCode | 'playlist';
  videoId: string | null;
  title?: string;
  onRetry: () => void;
  onAnother: () => void;
}) {
  const { t } = useTranslation();
  const [paste, setPaste] = useState(false);

  return (
    <section className="grid gap-6 md:grid-cols-12 md:gap-8" aria-live="assertive">
      <div className="md:col-span-5">
        <div className="card relative flex aspect-video items-center justify-center overflow-hidden bg-ink">
          {videoId ? (
            <img src={thumbnailUrl(videoId, 'mq')} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
          ) : null}
          <Mascot size={112} className="mascot-rim relative" />
        </div>
      </div>
      <div className="flex flex-col gap-5 md:col-span-7">
        {title ? <p className="font-semibold text-muted">{title}</p> : null}
        <h1 className="text-balance text-[1.625rem] font-semibold leading-tight tracking-[-0.015em] sm:text-3xl">
          {t(`errors.${error}`)}
        </h1>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" icon="paste" onClick={onAnother}>
            {t('errors.tryAnother')}
          </Button>
          {RETRYABLE.has(error) ? (
            <Button icon="refresh" onClick={onRetry}>
              {t('common.retry')}
            </Button>
          ) : null}
          {PASTEABLE.has(error) ? (
            <Button variant="ghost" icon="text" onClick={() => setPaste(true)}>
              {t('errors.pasteManually')}
            </Button>
          ) : null}
          {videoId && error !== 'not_found' ? (
            <a className="btn btn-ghost" href={watchUrl(videoId)} target="_blank" rel="noopener noreferrer">
              <Icon name="external" size={18} />
              {t('video.watchOnYouTube')}
            </a>
          ) : null}
        </div>
      </div>
      <PasteModal open={paste} onClose={() => setPaste(false)} defaultTitle={title} videoId={videoId} />
    </section>
  );
}
