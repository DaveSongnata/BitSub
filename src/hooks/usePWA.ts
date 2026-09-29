import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  online: boolean;
  installed: boolean;
  canInstall: boolean;
  needRefresh: boolean;
  isIOS: boolean;
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

let deferred: BeforeInstallPromptEvent | null = null;
let updateSW: ((reload?: boolean) => Promise<void>) | null = null;
let registration: ServiceWorkerRegistration | undefined;

let state: PWAState = {
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  installed: typeof window === 'undefined' ? false : isStandalone(),
  canInstall: false,
  needRefresh: false,
  isIOS: typeof navigator === 'undefined' ? false : /iphone|ipad|ipod/i.test(navigator.userAgent),
};
const listeners = new Set<() => void>();
const set = (patch: Partial<PWAState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

let started = false;
export function startPWA(onOfflineReady?: () => void) {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('online', () => set({ online: true }));
  window.addEventListener('offline', () => set({ online: false }));
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    set({ canInstall: true });
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    set({ installed: true, canInstall: false });
  });
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    updateSW = registerSW({
      immediate: true,
      onNeedRefresh: () => set({ needRefresh: true }),
      onOfflineReady: () => onOfflineReady?.(),
      onRegisteredSW: (_url, reg) => {
        registration = reg;
        // Check for a new version every hour and when the app comes back to the foreground
        if (reg) {
          setInterval(() => void reg.update().catch(() => undefined), 60 * 60 * 1000);
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') void reg.update().catch(() => undefined);
          });
        }
      },
    });
  }
}

export async function installApp(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const choice = await deferred.userChoice;
  deferred = null;
  set({ canInstall: false });
  return choice.outcome === 'accepted';
}

export async function applyUpdate() {
  await updateSW?.(true);
}

export async function checkForUpdate(): Promise<boolean> {
  const reg = registration;
  if (!reg) return false;
  await reg.update().catch(() => undefined);
  // A new version may still be installing: wait for it to settle (max 10 s).
  const installing = reg.installing;
  if (installing) {
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      const timer = setTimeout(done, 10000);
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' || installing.state === 'redundant') {
          clearTimeout(timer);
          done();
        }
      });
    });
  }
  return state.needRefresh || Boolean(reg.waiting);
}

export function usePWA(): PWAState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state
  );
}
