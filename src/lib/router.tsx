/**
 * Minimal History API router (no dependency). Paths:
 *  /                       home
 *  /watch?v=ID&lang=xx     result (also /shorts/ID, /live/ID, /embed/ID, /ID)
 *  /text/:id               pasted text
 *  /share?url=&text=       PWA share target
 *  /history, /settings
 */
import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';

const EVENT = 'bitsub:navigate';

function subscribe(cb: () => void) {
  window.addEventListener('popstate', cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener(EVENT, cb);
  };
}

const snapshot = () => window.location.pathname + window.location.search;

export function useLocation(): { pathname: string; search: URLSearchParams; href: string } {
  const href = useSyncExternalStore(subscribe, snapshot, () => '/');
  const url = new URL(href, 'http://x');
  return { pathname: url.pathname, search: url.searchParams, href };
}

export function navigate(to: string, opts: { replace?: boolean; scroll?: boolean } = {}) {
  if (to === snapshot()) return;
  if (opts.replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  window.dispatchEvent(new Event(EVENT));
  if (opts.scroll !== false) window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

export function Link({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (/^https?:/.test(href) || rest.target === '_blank' || rest.download !== undefined) return;
    e.preventDefault();
    navigate(href);
  };
  return <a href={href} onClick={handle} {...rest} />;
}

export function watchPath(videoId: string, lang?: string, t?: number): string {
  const p = new URLSearchParams({ v: videoId });
  if (lang) p.set('lang', lang);
  if (t) p.set('t', String(Math.floor(t)));
  return `/watch?${p.toString()}`;
}
