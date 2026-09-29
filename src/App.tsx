import { lazy, Suspense, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from '@/lib/router';
import { isVideoId } from '@/lib/youtube/url';
import { toast } from '@/lib/toast';
import { useApplyTheme } from '@/hooks/useTheme';
import { startPWA, usePWA } from '@/hooks/usePWA';
import { Header } from '@/components/Shell';
import { Dots, Toaster } from '@/components/ui';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Home } from '@/pages/Home';

const Watch = lazy(() => import('@/pages/Watch').then((m) => ({ default: m.Watch })));
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })));
const History = lazy(() => import('@/pages/Other').then((m) => ({ default: m.History })));
const NotFound = lazy(() => import('@/pages/Other').then((m) => ({ default: m.NotFound })));
const ShareRedirect = lazy(() => import('@/pages/Other').then((m) => ({ default: m.ShareRedirect })));
const TextView = lazy(() => import('@/pages/Other').then((m) => ({ default: m.TextView })));

function Routes() {
  const { pathname, search, href } = useLocation();
  const parts = pathname.split('/').filter(Boolean);
  const start = Number(search.get('t') ?? '') || undefined;

  if (pathname === '/') {
    // bitsub.app/?url=... or ?v=...
    const url = search.get('url') ?? search.get('text');
    const v = search.get('v');
    if (url || (v && isVideoId(v))) return <ShareRedirect text={url ?? v ?? ''} />;
    return <Home />;
  }
  if (pathname === '/watch') {
    const v = search.get('v');
    if (v && isVideoId(v)) return <Watch videoId={v} langParam={search.get('lang')} start={start} />;
    return <NotFound />;
  }
  if (pathname === '/settings') return <Settings />;
  if (pathname === '/history') return <History />;
  if (parts[0] === 'text' && parts[1]) return <TextView id={parts[1]} />;
  if (pathname === '/share')
    return <ShareRedirect text={[search.get('url'), search.get('text'), search.get('title')].filter(Boolean).join(' ')} />;
  // Shortcuts: bitsub.app/shorts/ID, /live/ID, /embed/ID, /ID, and full pasted links (/https://youtu.be/ID)
  if (
    (['shorts', 'live', 'embed', 'v'].includes(parts[0] ?? '') && parts[1] && isVideoId(parts[1])) ||
    (parts.length === 1 && isVideoId(parts[0]!))
  ) {
    const id = parts.length === 1 ? parts[0]! : parts[1]!;
    return <ShareRedirect text={id} />;
  }
  if (/youtu/.test(href)) return <ShareRedirect text={safeDecode(href.slice(1))} />;
  return <NotFound />;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

// After a new deploy, old lazy chunks disappear: reload once to pick up the new version.
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (e) => {
    const key = 'bitsub-reloaded';
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    e.preventDefault();
    window.location.reload();
  });
}

export function App() {
  const { t } = useTranslation();
  useApplyTheme();
  const { online } = usePWA();
  const { href } = useLocation();

  useEffect(() => {
    startPWA(() => toast(t('pwa.offlineReady'), 'success'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastOnline = useRef(online);
  useEffect(() => {
    if (lastOnline.current === online) return;
    lastOnline.current = online;
    toast(online ? t('pwa.online') : t('pwa.offline'), online ? 'success' : 'info');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <div className="flex-1">
        <Suspense
          fallback={
            <div className="flex min-h-[50vh] items-center justify-center text-muted">
              <Dots size="lg" />
            </div>
          }
        >
          <ErrorBoundary resetKey={href}>
            <Routes />
          </ErrorBoundary>
        </Suspense>
      </div>
      <Toaster />
    </div>
  );
}
