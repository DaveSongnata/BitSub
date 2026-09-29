import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from '@/lib/router';
import { applyUpdate, installApp, usePWA } from '@/hooks/usePWA';
import { Icon } from './Icon';
import { Logo } from './Mascot';
import { cn } from './ui';

function NavLink({ href, icon, label, active }: { href: string; icon: 'history' | 'settings'; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex min-h-10 items-center gap-2 border-2 px-2.5 font-semibold transition-colors sm:px-3',
        active ? 'border-line bg-primary text-on-primary' : 'border-transparent hover:bg-surface-alt'
      )}
    >
      <Icon name={icon} size={20} />
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </Link>
  );
}

export function Header() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const pwa = usePWA();
  return (
    <header className="sticky top-0 z-40 border-b-2 border-line bg-bg/95 backdrop-blur-sm safe-top supports-[backdrop-filter]:bg-bg/85">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-primary focus:px-3 focus:py-2 focus:font-semibold"
      >
        {t('nav.skip')}
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="-ml-1 p-1" aria-label={`BitSub — ${t('nav.home')}`}>
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="BitSub">
          {!pwa.online ? (
            <span className="tag hidden border-error text-error xs:inline-flex">
              <Icon name="wifiOff" size={12} strokeWidth={3} />
              {t('nav.offline')}
            </span>
          ) : null}
          {pwa.needRefresh ? (
            <button type="button" onClick={() => void applyUpdate()} className="btn btn-sm btn-primary">
              <Icon name="refresh" size={16} />
              {t('nav.update')}
            </button>
          ) : pwa.canInstall && !pwa.installed ? (
            <button type="button" onClick={() => void installApp()} className="btn btn-sm hidden sm:inline-flex">
              <Icon name="install" size={16} />
              {t('nav.install')}
            </button>
          ) : null}
          <NavLink href="/history" icon="history" label={t('nav.history')} active={pathname === '/history'} />
          <NavLink href="/settings" icon="settings" label={t('nav.settings')} active={pathname === '/settings'} />
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-20 border-t-2 border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo />
          <p className="mt-3 max-w-sm text-muted">{t('footer.tagline')}</p>
        </div>
        <div className="space-y-1.5 text-sm text-muted md:col-span-7 md:text-right">
          <p className="font-semibold text-text">{t('footer.privacy')}</p>
          <p>{t('footer.notAffiliated')}</p>
          <p>
            {t('footer.madeWith')} <span className="pixel text-[9px]">v{__APP_VERSION__}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main id="main" className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6', className)}>
      {children}
    </main>
  );
}
