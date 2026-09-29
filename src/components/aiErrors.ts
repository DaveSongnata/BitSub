import type { TFunction } from 'i18next';
import { AiError, type Provider } from '@/lib/ai';

export function aiErrorMessage(t: TFunction, provider: Provider, error: unknown): string {
  const name = provider === 'gemini' ? 'Gemini' : 'ChatGPT';
  if (!(error instanceof AiError)) return t('aiErrors.network', { provider: name });
  switch (error.code) {
    case 'invalid_key':
      return t('aiErrors.invalid_key', { provider: name });
    case 'no_credit':
      return provider === 'gemini' ? t('aiErrors.no_credit_gemini') : t('aiErrors.no_credit', { provider: 'OpenAI' });
    case 'rate_limit':
      return error.retryAfter
        ? t('aiErrors.rate_limit', { provider: name, seconds: error.retryAfter })
        : t('aiErrors.rate_limit_generic', { provider: name });
    case 'region':
      return t('aiErrors.region', { provider: name });
    case 'overloaded':
      return t('aiErrors.overloaded', { provider: name });
    case 'blocked':
      return t('aiErrors.blocked', { provider: name });
    case 'network':
      return t('aiErrors.network', { provider: name });
    case 'aborted':
      return '';
    default:
      return t('aiErrors.unknown', { provider: name, message: error.message.slice(0, 220) });
  }
}
