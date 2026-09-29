import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PROVIDERS, pickModel, validateKey, type Provider } from '@/lib/ai';
import { rememberModels } from '@/lib/models';
import { getSettings, setKey, updateSettings, useSettings } from '@/lib/settings';
import { toast } from '@/lib/toast';
import { Icon } from './Icon';
import { TutorialModal } from './TutorialModal';
import { Button, cn } from './ui';
import { aiErrorMessage } from './aiErrors';

function ProviderCard({ provider, selected, onSelect }: { provider: Provider; selected: boolean; onSelect: () => void }) {
  const { t } = useTranslation();
  const isGemini = provider === 'gemini';
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex min-w-0 flex-1 flex-col items-start gap-1 border-2 border-line p-3 text-left transition-colors',
        selected ? 'bg-primary text-on-primary' : 'bg-surface hover:bg-surface-alt'
      )}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="text-[1.0625rem] font-semibold">{t(isGemini ? 'ai.gemini' : 'ai.openai')}</span>
        <span
          className={cn(
            'tag',
            selected ? 'border-on-primary bg-transparent text-on-primary' : isGemini ? 'bg-success-bg text-success' : ''
          )}
        >
          {t(isGemini ? 'ai.geminiTag' : 'ai.openaiTag')}
        </span>
      </span>
      <span className={cn('text-sm', selected ? 'opacity-80' : 'text-muted')}>{t(isGemini ? 'ai.geminiBy' : 'ai.openaiBy')}</span>
    </button>
  );
}

export function KeySetup({ hideProvider = false }: { hideProvider?: boolean }) {
  const { t } = useTranslation();
  const { provider } = useSettings();
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tutorial, setTutorial] = useState(false);
  const inputId = useId();
  const errorId = useId();
  const providerName = provider === 'gemini' ? 'Gemini' : 'ChatGPT';

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const key = value.trim();
    if (!key) return;
    setBusy(true);
    setError(null);
    const check = await validateKey(provider, key);
    setBusy(false);
    if (!check.ok) {
      setError(aiErrorMessage(t, provider, check.error));
      return;
    }
    rememberModels(provider, check.models);
    const current = getSettings().models[provider];
    updateSettings({ models: { ...getSettings().models, [provider]: pickModel(provider, check.models, current) } });
    setKey(provider, key);
    setValue('');
    toast(t('ai.keySaved'), 'success');
  };

  return (
    <div className="space-y-5">
      {hideProvider ? null : <p className="text-[1.0625rem] leading-relaxed">{t('ai.intro')}</p>}

      <details className="group border-2 border-line bg-surface-alt">
        <summary className="flex list-none items-center justify-between gap-3 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <Icon name="question" size={18} />
            {t('ai.whatIsKey')}
          </span>
          <Icon name="chevronDown" size={18} className="transition-transform group-open:rotate-180" />
        </summary>
        <p className="px-4 pb-4 leading-relaxed">{t('ai.whatIsKeyText')}</p>
      </details>

      <div className={cn(hideProvider && 'hidden')}>
        <p className="mb-2 text-sm font-semibold">{t('ai.chooseProvider')}</p>
        <div role="radiogroup" aria-label={t('ai.chooseProvider')} className="flex gap-2">
          {(['gemini', 'openai'] as const).map((p) => (
            <ProviderCard
              key={p}
              provider={p}
              selected={provider === p}
              onSelect={() => {
                updateSettings({ provider: p });
                setError(null);
              }}
            />
          ))}
        </div>
        <p className="mt-2 text-sm leading-snug text-muted">{t(provider === 'gemini' ? 'ai.geminiNote' : 'ai.openaiNote')}</p>
      </div>

      <button
        type="button"
        onClick={() => setTutorial(true)}
        className="flex w-full items-center justify-between gap-3 border-2 border-line bg-ink px-4 py-3 text-left font-semibold text-on-ink lift shadow-hard"
      >
        <span className="flex items-center gap-3">
          <Icon name="play" size={18} />
          {t('ai.howToGet')}
        </span>
        <span className="pixel text-[10px] opacity-80">{t('ai.howToGetTime')}</span>
      </button>

      <form onSubmit={(e) => void save(e)} className="space-y-3" noValidate>
        <label htmlFor={inputId} className="block text-sm font-semibold">
          {t('ai.keyLabel', { provider: providerName })}
        </label>
        <div className="relative">
          <Icon name="key" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            id={inputId}
            type={visible ? 'text' : 'password'}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className={cn('field pl-11 pr-12 font-mono text-[0.95rem]', error && 'border-error')}
            placeholder={t('ai.keyPlaceholder')}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-text"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? t('common.hide') : t('common.show')}
            aria-pressed={visible}
          >
            <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
          </button>
        </div>
        {error ? (
          <p id={errorId} role="alert" className="flex items-start gap-2 text-[0.95rem] font-medium text-error">
            <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
            {error}
          </p>
        ) : null}
        <Button type="submit" variant="primary" className="w-full" loading={busy} disabled={!value.trim()}>
          {busy ? t('ai.checking') : t('ai.saveKey')}
        </Button>
        <p className="flex items-start gap-2 text-sm leading-snug text-muted">
          <Icon name="lock" size={16} className="mt-0.5 shrink-0" />
          {t('ai.keyPrivacy', { company: provider === 'gemini' ? 'Google' : 'OpenAI' })}
        </p>
        <p className="text-sm leading-snug text-muted">{provider === 'gemini' ? t('ai.freeNote') : t('ai.costNote')}</p>
        <a
          href={PROVIDERS[provider].keyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="link inline-flex items-center gap-1 text-sm font-semibold"
        >
          {PROVIDERS[provider].keyUrl.replace('https://', '')}
          <Icon name="external" size={14} />
        </a>
      </form>

      <TutorialModal provider={provider} open={tutorial} onClose={() => setTutorial(false)} />
    </div>
  );
}
