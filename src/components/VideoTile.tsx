import { useTranslation } from 'react-i18next';
import type { SavedVideo } from '@/lib/db';
import { Link } from '@/lib/router';
import { formatClock } from '@/lib/transcript';
import { thumbnailUrl } from '@/lib/youtube/url';
import { languageLabel } from '@/lib/languages';
import { currentLanguage } from '@/i18n';
import { Mascot } from './Mascot';

export function VideoTile({ video, href }: { video: SavedVideo; href: string }) {
  const { t } = useTranslation();
  const ui = currentLanguage();
  return (
    <Link href={href} className="group block h-full border-2 border-line bg-surface shadow-hard lift">
      <div className="relative aspect-video overflow-hidden border-b-2 border-line bg-ink">
        {video.videoId ? (
          <img
            src={thumbnailUrl(video.videoId, 'mq')}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Mascot size={48} />
          </div>
        )}
        {video.lengthSeconds ? (
          <span className="absolute bottom-1.5 right-1.5 bg-ink px-1.5 py-0.5 font-mono text-xs tnum text-on-ink">
            {formatClock(video.lengthSeconds)}
          </span>
        ) : null}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 font-semibold leading-snug">{video.title || '—'}</p>
        <p className="mt-1 truncate text-sm text-muted">
          {video.pasted ? t('video.pasted') : [video.author, languageLabel(video.language, ui)].filter(Boolean).join(' · ')}
        </p>
      </div>
    </Link>
  );
}
