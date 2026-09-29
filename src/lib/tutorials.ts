import type { Provider } from './ai';
import type { AppLanguage } from '@/i18n';

/**
 * Short "how to create your key" videos, per provider and app language.
 * All verified to exist and be embeddable via YouTube oEmbed on 2026-09-28.
 */
export const TUTORIAL_VIDEOS: Record<Provider, Record<AppLanguage, { id: string; author: string }[]>> = {
  gemini: {
    'pt-BR': [
      { id: 'eLkgX9c4EDc', author: 'Canal do Luiz' },
      { id: '7bgWVbZUxfI', author: 'AG clube da informática' },
    ],
    en: [
      { id: 'JdKcFCLotZY', author: 'Google Cloud' },
      { id: 'YHFMrZD-_3g', author: 'The Code City' },
    ],
    es: [
      { id: '_F8ykOC6rHk', author: 'MundoAI' },
      { id: '2jsKtwd8SdM', author: 'CodigoMx' },
    ],
  },
  openai: {
    'pt-BR': [
      { id: 'mZXOY6xdAYQ', author: 'Guilherme Emanuel SEO e Automação' },
      { id: 'QhZg9NsimSo', author: 'Canal do Luiz' },
    ],
    en: [
      { id: 'J3y1dOpz9R4', author: 'Tom Nassr | XRAY' },
      { id: 'kiq9mbcf8NA', author: 'The Code City' },
    ],
    es: [
      { id: 'FnA7Uye4wiA', author: 'Facundo Corengia' },
      { id: 'aSz2AY3eI3I', author: 'isostopy' },
    ],
  },
};
