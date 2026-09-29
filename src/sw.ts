/// <reference lib="webworker" />
/**
 * BitSub service worker: the app shell works offline; YouTube and AI calls always go to the network.
 */
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: (string | { url: string; revision: string | null })[] };

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// SPA: every navigation gets index.html (except the API)
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [/^\/api\//] }));

// Video thumbnails: nice to have offline in the history
registerRoute(
  ({ url }) => url.hostname === 'i.ytimg.com',
  new CacheFirst({
    cacheName: 'thumbnails',
    plugins: [
      // <img> requests are opaque (status 0); allow them, but keep the count low (opaque entries are padded)
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 60, purgeOnQuotaError: true }),
    ],
  })
);

// The page asks before switching to a new version (update button)
self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | null)?.type === 'SKIP_WAITING') void self.skipWaiting();
});
