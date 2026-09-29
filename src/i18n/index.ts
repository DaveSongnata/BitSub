import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from './locales/pt-BR';
import en from './locales/en';
import es from './locales/es';

export const APP_LANGUAGES = [
  { code: 'pt-BR', short: 'PT', name: 'Português' },
  { code: 'en', short: 'EN', name: 'English' },
  { code: 'es', short: 'ES', name: 'Español' },
] as const;

export type AppLanguage = (typeof APP_LANGUAGES)[number]['code'];

/** Only an explicit choice made in Settings is remembered. */
export const LANGUAGE_CHOICE_KEY = 'bitsub-language-choice';
/** Older versions cached the auto-detected language here; it's ignored and cleaned up. */
const LEGACY_KEY = 'bitsub-language';

/** Map any browser language (pt-PT, en-GB, es-MX…) to one we ship. */
export function toAppLanguage(code: string | undefined | null): AppLanguage {
  const c = (code ?? '').toLowerCase();
  if (c.startsWith('pt')) return 'pt-BR';
  if (c.startsWith('es')) return 'es';
  if (c.startsWith('en')) return 'en';
  return 'pt-BR';
}

const BRAZIL_TIMEZONE =
  /^America\/(Sao_Paulo|Recife|Fortaleza|Belem|Maceio|Bahia|Araguaina|Santarem|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Eirunepe|Noronha)$/;

/**
 * 1. ?hl=xx in the URL  2. the person's choice in Settings
 * 3. Portuguese if it's anywhere in the browser's languages, or the clock is set to a Brazilian time zone
 *    (common case: Chrome in English on a Brazilian Windows)
 * 4. the first English/Spanish browser language  5. Portuguese
 */
export function detectLanguage(): AppLanguage {
  const fromUrl = new URLSearchParams(window.location.search).get('hl');
  if (fromUrl) return toAppLanguage(fromUrl);
  try {
    localStorage.removeItem(LEGACY_KEY);
    const choice = localStorage.getItem(LANGUAGE_CHOICE_KEY);
    if (choice) return toAppLanguage(choice);
  } catch {
    /* storage blocked */
  }
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  if (langs.some((l) => /^pt\b/i.test(l))) return 'pt-BR';
  try {
    if (BRAZIL_TIMEZONE.test(Intl.DateTimeFormat().resolvedOptions().timeZone)) return 'pt-BR';
  } catch {
    /* no Intl time zone */
  }
  const other = langs.find((l) => /^(en|es)\b/i.test(l));
  return other ? toAppLanguage(other) : 'pt-BR';
}

void i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    en: { translation: en },
    es: { translation: es },
  },
  lng: detectLanguage(),
  supportedLngs: ['pt-BR', 'en', 'es'],
  fallbackLng: 'pt-BR',
  load: 'currentOnly',
  interpolation: { escapeValue: false },
  returnObjects: true,
  react: { useSuspense: false },
});

function syncHtml(lng: string) {
  const lang = toAppLanguage(lng);
  document.documentElement.lang = lang;
  const t = i18n.getFixedT(lang);
  document.title = t('meta.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
}

i18n.on('languageChanged', syncHtml);
if (i18n.isInitialized) syncHtml(i18n.language);
else i18n.on('initialized', () => syncHtml(i18n.language));

export function currentLanguage(): AppLanguage {
  return toAppLanguage(i18n.resolvedLanguage ?? i18n.language);
}

/** Explicit choice (Settings): remembered on this device. */
export function changeLanguage(lang: AppLanguage) {
  try {
    localStorage.setItem(LANGUAGE_CHOICE_KEY, lang);
  } catch {
    /* storage blocked: still switch for this visit */
  }
  void i18n.changeLanguage(lang);
}

export default i18n;
