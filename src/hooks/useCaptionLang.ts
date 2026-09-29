import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/lib/settings';
import { toAppLanguage } from '@/i18n';

/**
 * Caption language chosen in the form. Starts from the preference in Settings
 * ("same as the app" by default) and remembers changes for this visit only.
 */
let sessionChoice: string | null = null;
const listeners = new Set<() => void>();

export function setSessionCaptionLang(v: string | null) {
  sessionChoice = v;
  listeners.forEach((l) => l());
}

export function useCaptionLang(): [string, (v: string) => void] {
  const { i18n } = useTranslation();
  const settings = useSettings();
  const choice = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => sessionChoice,
    () => sessionChoice
  );
  const preferred = settings.captionLang === 'app' ? toAppLanguage(i18n.resolvedLanguage ?? i18n.language) : settings.captionLang;
  return [choice ?? preferred, setSessionCaptionLang];
}
