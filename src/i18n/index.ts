import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
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

export const LANGUAGE_KEY = 'bitsub-language';

/** Map any browser language (pt-PT, en-GB, es-MX…) to one we ship. */
export function toAppLanguage(code: string | undefined | null): AppLanguage {
  const c = (code ?? '').toLowerCase();
  if (c.startsWith('pt')) return 'pt-BR';
  if (c.startsWith('es')) return 'es';
  if (c.startsWith('en')) return 'en';
  return 'pt-BR';
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      en: { translation: en },
      es: { translation: es },
    },
    supportedLngs: ['pt-BR', 'en', 'es'],
    nonExplicitSupportedLngs: false,
    fallbackLng: (code) => [toAppLanguage(code)],
    load: 'currentOnly',
    detection: {
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'hl',
      lookupLocalStorage: LANGUAGE_KEY,
      caches: ['localStorage'],
      convertDetectedLanguage: (lng: string) => toAppLanguage(lng),
    },
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

export function changeLanguage(lang: AppLanguage) {
  void i18n.changeLanguage(lang);
}

export default i18n;
