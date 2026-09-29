import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PROVIDERS, type Provider } from '@/lib/ai';
import { TUTORIAL_VIDEOS } from '@/lib/tutorials';
import { currentLanguage } from '@/i18n';
import { Icon } from './Icon';
import { Callout, Modal } from './ui';

export function TutorialModal({ provider, open, onClose }: { provider: Provider; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [showVideo, setShowVideo] = useState(false);
  const p = PROVIDERS[provider];
  const steps = t(`tutorial.${provider}`, { returnObjects: true }) as unknown as string[];
  const video = TUTORIAL_VIDEOS[provider][currentLanguage()][0];
  const site = provider === 'gemini' ? 'Google AI Studio' : 'OpenAI Platform';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('tutorial.title', { provider: provider === 'gemini' ? 'Gemini' : 'ChatGPT' })}
      wide
    >
      <p className="-mt-1 mb-5 text-muted">{t('tutorial.subtitle')}</p>
      <ol className="space-y-4">
        {steps.map((s, i) => (
          <li key={i} className="grid grid-cols-[2.25rem_1fr] gap-3">
            <span className="flex h-9 w-9 items-center justify-center border-2 border-line bg-primary pixel text-[11px] text-on-primary">
              {i + 1}
            </span>
            <span className="pt-1.5 leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
      <a className="btn btn-primary mt-6 w-full" href={p.keyUrl} target="_blank" rel="noopener noreferrer">
        {t('tutorial.openSite', { site })}
        <Icon name="external" size={18} />
      </a>

      {video ? (
        <div className="mt-8">
          <p className="mb-3 font-semibold">{t('tutorial.videoTitle')}</p>
          <div className="card relative aspect-video overflow-hidden bg-ink">
            {showVideo ? (
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&playsinline=1&hl=${currentLanguage()}`}
                title={t('tutorial.videoTitle')}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                className="group absolute inset-0"
                onClick={() => setShowVideo(true)}
                aria-label={t('video.play')}
              >
                <img
                  src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 border-2 border-line bg-primary px-4 py-2.5 font-semibold text-on-primary shadow-hard">
                  <Icon name="play" size={18} />
                  {t('video.play')}
                </span>
              </button>
            )}
          </div>
          <p className="mt-2 text-sm text-muted">{t('tutorial.videoCaption', { author: video.author })}</p>
        </div>
      ) : null}

      <div className="mt-8 space-y-3">
        <Callout icon="lock">{t('tutorial.safety')}</Callout>
        <p className="text-sm text-muted">
          {t('tutorial.limitTip', { provider: provider === 'gemini' ? 'Google AI Studio' : 'OpenAI' })}
        </p>
      </div>
    </Modal>
  );
}
