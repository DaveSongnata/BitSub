import { base } from './youtube/client';

/** Caption languages offered in the picker (the app languages come first). */
export const MAIN_CAPTION_LANGS = ['pt-BR', 'en', 'es'] as const;
export const OTHER_CAPTION_LANGS = [
  'fr',
  'de',
  'it',
  'ja',
  'ko',
  'zh-Hans',
  'zh-Hant',
  'ru',
  'ar',
  'hi',
  'id',
  'tr',
  'nl',
  'pl',
  'uk',
  'vi',
  'th',
  'he',
  'sv',
  'pt-PT',
] as const;

const cache = new Map<string, Intl.DisplayNames | null>();

function displayNames(uiLang: string): Intl.DisplayNames | null {
  if (!cache.has(uiLang)) {
    try {
      cache.set(uiLang, new Intl.DisplayNames([uiLang], { type: 'language' }));
    } catch {
      cache.set(uiLang, null);
    }
  }
  return cache.get(uiLang) ?? null;
}

/** "pt-BR" → "Português (Brasil)" in the UI language, capitalized. */
export function languageLabel(code: string, uiLang: string): string {
  let name: string | undefined;
  try {
    name = displayNames(uiLang)?.of(code);
  } catch {
    name = undefined;
  }
  if (!name || name === code) {
    try {
      name = displayNames(uiLang)?.of(base(code));
    } catch {
      name = undefined;
    }
  }
  const label = name ?? code;
  return label.charAt(0).toLocaleUpperCase(uiLang) + label.slice(1);
}

/** Short label for the app languages ("Português" rather than "Português (Brasil)"). */
export function shortLanguageLabel(code: string, uiLang: string): string {
  if (code === 'pt-BR') return languageLabel('pt', uiLang);
  return languageLabel(code, uiLang);
}
