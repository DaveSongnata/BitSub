import { useEffect, useSyncExternalStore } from 'react';
import { useSettings, type ThemeName } from '@/lib/settings';

const query = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function subscribeSystem(cb: () => void) {
  query?.addEventListener('change', cb);
  return () => query?.removeEventListener('change', cb);
}

export function useSystemDark(): boolean {
  return useSyncExternalStore(
    subscribeSystem,
    () => query?.matches ?? false,
    () => false
  );
}

const THEME_COLORS: Record<ThemeName, { light: string; dark: string }> = {
  slso8: { light: '#ffecd6', dark: '#0d2b45' },
  original: { light: '#f5f5f5', dark: '#141414' },
};

/** Applies theme + mode to <html>, like BitTask (data-theme, data-mode, .dark). */
export function useApplyTheme(): 'light' | 'dark' {
  const { theme, mode } = useSettings();
  const systemDark = useSystemDark();
  const resolved = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-mode', mode);
    root.classList.toggle('dark', resolved === 'dark');
    const color = THEME_COLORS[theme][resolved];
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', color));
  }, [theme, mode, resolved]);

  return resolved;
}
