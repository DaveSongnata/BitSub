import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Link, watchPath } from '@/lib/router';
import { useCaptionLang } from '@/hooks/useCaptionLang';
import { Footer, Page } from '@/components/Shell';
import { UrlForm } from '@/components/UrlForm';
import { Icon } from '@/components/Icon';
import { Mascot } from '@/components/Mascot';
import { PasteModal } from '@/components/PlanB';
import { Tag } from '@/components/ui';
import { VideoTile } from '@/components/VideoTile';

function HeroScreen() {
  // A little "screen" with subtitles appearing: shows what BitSub does without words.
  const lines = [0, 1, 2];
  return (
    <div
      aria-hidden
      className="relative hidden h-full min-h-[320px] overflow-hidden border-2 border-line bg-[#203c56] shadow-hard-lg lg:block"
    >
      <div className="absolute inset-0 opacity-[0.08] [background:repeating-linear-gradient(0deg,#ffecd6_0_1px,transparent_1px_4px)]" />
      <div className="absolute left-6 top-6 flex gap-1.5">
        <span className="h-2.5 w-2.5 bg-[#ffaa5e]" />
        <span className="h-2.5 w-2.5 bg-[#d08159]" />
        <span className="h-2.5 w-2.5 bg-[#544e68]" />
      </div>
      <div className="absolute inset-x-0 top-[16%] flex justify-center">
        <img src="/illustrations/mascot.png" alt="" width={200} height={200} className="[image-rendering:pixelated]" />
      </div>
      <div className="absolute inset-x-8 bottom-8 space-y-2">
        {lines.map((i) => (
          <div key={i} className="flex items-center gap-3 animate-rise" style={{ animationDelay: `${150 + i * 220}ms` }}>
            <span className="pixel text-[9px] text-[#ffaa5e]">
              0{i}:{(i * 17 + 12).toString().padStart(2, '0')}
            </span>
            <span className="h-3 flex-1 bg-[#ffecd6]" style={{ maxWidth: `${88 - i * 14}%`, opacity: 1 - i * 0.18 }} />
          </div>
        ))}
        <span className="ml-[3.3rem] inline-block h-3 w-2 animate-blink bg-[#ffaa5e]" />
      </div>
    </div>
  );
}

export function Home() {
  const { t } = useTranslation();
  const [lang, setLang] = useCaptionLang();
  const [paste, setPaste] = useState(false);
  const recent = useLiveQuery(
    () =>
      db.videos
        .orderBy('openedAt')
        .reverse()
        .limit(4)
        .toArray()
        .catch(() => []),
    [],
    []
  );
  const steps = t('home.steps', { returnObjects: true }) as unknown as { title: string; text: string }[];
  const privacy = t('home.privacy', { returnObjects: true }) as unknown as { title: string; text: string }[];
  const faq = t('home.faq', { returnObjects: true }) as unknown as { q: string; a: string }[];
  const origin = typeof window !== 'undefined' ? window.location.host : 'bitsub.app';

  return (
    <>
      <Page className="pt-8 sm:pt-14">
        {/* Hero */}
        <section className="grid items-stretch gap-8 lg:grid-cols-12 lg:gap-10" aria-labelledby="hero-title">
          <div className="flex flex-col lg:col-span-7">
            <Tag className="self-start">{t('home.badge')}</Tag>
            <h1
              id="hero-title"
              className="mt-5 text-balance text-[2.625rem] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[3.5rem] lg:text-[4rem]"
            >
              {t('home.title')}{' '}
              <span className="relative inline-block">
                <span className="relative z-10">{t('home.titleAccent')}</span>
                <span aria-hidden className="absolute inset-x-[-0.08em] bottom-[0.06em] z-0 h-[0.32em] bg-primary" />
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-[1.125rem] leading-relaxed text-muted">{t('home.subtitle')}</p>

            <div className="card mt-8 p-4 sm:p-6">
              <UrlForm lang={lang} onLangChange={setLang} autoFocus />
              <div className="mt-4 flex flex-col gap-1.5 border-t border-hair pt-4 text-sm text-muted">
                <p className="flex items-start gap-2">
                  <Icon name="info" size={16} className="mt-0.5 shrink-0" />
                  <span>{t('home.mobileHint')}</span>
                </p>
                <p className="hidden items-start gap-2 sm:flex">
                  <Icon name="bolt" size={16} className="mt-0.5 shrink-0" />
                  <span>
                    {t('home.tip', { from: '§1', to: '§2' })
                      .split(/(§1|§2)/)
                      .map((part, i) =>
                        part === '§1' ? (
                          <code key={i} className="kbd">
                            youtube.com
                          </code>
                        ) : part === '§2' ? (
                          <code key={i} className="kbd">
                            {origin}
                          </code>
                        ) : (
                          part
                        )
                      )}
                  </span>
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setPaste(true)} className="link mt-4 self-start text-[0.95rem] font-semibold">
              {t('home.pasteOwn')}
            </button>
          </div>
          <div className="lg:col-span-5">
            <HeroScreen />
          </div>
        </section>

        {/* Recent */}
        {recent.length ? (
          <section className="mt-16" aria-labelledby="recent-title">
            <div className="mb-4 flex items-end justify-between gap-3">
              <h2 id="recent-title" className="text-xl font-semibold">
                {t('home.recentTitle')}
              </h2>
              <Link href="/history" className="link text-sm font-semibold">
                {t('home.recentAll')}
              </Link>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recent.map((v) => (
                <li key={v.id}>
                  <VideoTile video={v} href={v.pasted ? `/text/${v.id}` : watchPath(v.videoId ?? v.id, v.requested)} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* How it works */}
        <section className="mt-20" aria-labelledby="steps-title">
          <h2 id="steps-title" className="mb-6 text-xl font-semibold">
            {t('home.stepsTitle')}
          </h2>
          <ol className="grid gap-px border-2 border-line bg-line md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={i} className="bg-surface p-5 sm:p-6">
                <span className="pixel text-[22px] text-[color:var(--bs-accent-text)]">0{i + 1}</span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1.5 leading-relaxed text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </Page>

      {/* Privacy: a solid ink field (Nubank-style block) */}
      <section className="mt-20 border-y-2 border-line bg-ink text-on-ink" aria-labelledby="privacy-title">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-12">
          <div className="md:col-span-4">
            <Mascot size={56} mood="happy" />
            <h2 id="privacy-title" className="mt-5 text-balance text-[1.875rem] font-semibold leading-tight tracking-[-0.02em]">
              {t('home.privacyTitle')}
            </h2>
          </div>
          <ul className="grid gap-8 sm:grid-cols-3 md:col-span-8">
            {privacy.map((p, i) => (
              <li key={i} className="border-t-2 border-[color:var(--bs-primary)] pt-4">
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="mt-1.5 leading-relaxed opacity-80">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Page>
        {/* FAQ */}
        <section className="mt-20 grid gap-8 md:grid-cols-12" aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-[1.875rem] font-semibold leading-tight tracking-[-0.02em] md:col-span-4">
            {t('home.faqTitle')}
          </h2>
          <div className="border-t-2 border-line md:col-span-8">
            {faq.map((f, i) => (
              <details key={i} className="group border-b-2 border-line">
                <summary className="flex list-none items-center justify-between gap-4 py-4 text-[1.0625rem] font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-line transition-colors group-open:bg-primary group-open:text-on-primary">
                    <Icon name="plus" size={16} className="transition-transform group-open:rotate-45" />
                  </span>
                </summary>
                <p className="max-w-2xl pb-5 leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </Page>
      <Footer />
      <PasteModal open={paste} onClose={() => setPaste(false)} />
    </>
  );
}
