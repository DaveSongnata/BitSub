/**
 * Tiny persisted store for preferences and AI keys (localStorage, per device).
 */
import { useSyncExternalStore } from 'react';
import type { Provider } from './ai';
import type { ExportFormat } from './transcript';

export type ThemeName = 'slso8' | 'original';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface Settings {
  theme: ThemeName;
  mode: ThemeMode;
  /** 'app' = follow the app language, 'original' = spoken language, or a language code */
  captionLang: string;
  provider: Provider;
  models: Partial<Record<Provider, string>>;
  /** 'app' = follow the app language */
  answerLang: string;
  rememberKey: boolean;
  saveHistory: boolean;
  includeHeader: boolean;
  showTime: boolean;
  format: ExportFormat;
}

const DEFAULTS: Settings = {
  theme: 'slso8',
  mode: 'system',
  captionLang: 'app',
  provider: 'gemini',
  models: {},
  answerLang: 'app',
  rememberKey: true,
  saveHistory: true,
  includeHeader: true,
  showTime: true,
  format: 'txt',
};

const SETTINGS_KEY = 'bitsub-settings';
const KEYS_KEY = 'bitsub-keys';

function read<T>(storage: Storage | undefined, key: string): T | null {
  try {
    const raw = storage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(storage: Storage | undefined, key: string, value: unknown) {
  try {
    if (value === null) storage?.removeItem(key);
    else storage?.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: keep in memory */
  }
}

// Accessing storage throws when the browser blocks site data: fall back to memory only.
function storage(kind: 'localStorage' | 'sessionStorage'): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window[kind] : undefined;
  } catch {
    return undefined;
  }
}
const local = storage('localStorage');
const session = storage('sessionStorage');

let settings: Settings = { ...DEFAULTS, ...(read<Partial<Settings>>(local, SETTINGS_KEY) ?? {}) };
let keys: Partial<Record<Provider, string>> =
  read<Partial<Record<Provider, string>>>(settings.rememberKey ? local : session, KEYS_KEY) ?? {};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function getSettings(): Settings {
  return settings;
}

export function updateSettings(patch: Partial<Settings>) {
  const prevRemember = settings.rememberKey;
  settings = { ...settings, ...patch };
  write(local, SETTINGS_KEY, settings);
  if (patch.rememberKey !== undefined && patch.rememberKey !== prevRemember) {
    // Move keys to the right storage
    write(patch.rememberKey ? local : session, KEYS_KEY, keys);
    write(patch.rememberKey ? session : local, KEYS_KEY, null);
  }
  emit();
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, getSettings);
}

export function getKeys() {
  return keys;
}

export function useKeys(): Partial<Record<Provider, string>> {
  return useSyncExternalStore(subscribe, getKeys, getKeys);
}

export function setKey(provider: Provider, key: string | null) {
  const next = { ...keys };
  if (key) next[provider] = key.trim();
  else delete next[provider];
  keys = next;
  write(settings.rememberKey ? local : session, KEYS_KEY, Object.keys(keys).length ? keys : null);
  emit();
}

export function clearKeys() {
  keys = {};
  write(local, KEYS_KEY, null);
  write(session, KEYS_KEY, null);
  emit();
}

export function maskKey(key: string): string {
  const k = key.trim();
  if (k.length <= 8) return '••••';
  return `${k.slice(0, 4)}••••${k.slice(-4)}`;
}

// Cross-tab sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === SETTINGS_KEY) {
      settings = { ...DEFAULTS, ...(read<Partial<Settings>>(local, SETTINGS_KEY) ?? {}) };
      emit();
    }
    if (e.key === KEYS_KEY) {
      keys = read<Partial<Record<Provider, string>>>(settings.rememberKey ? local : session, KEYS_KEY) ?? {};
      emit();
    }
  });
}
