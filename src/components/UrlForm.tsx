/**
 * The one input that matters: paste a YouTube link (+ pick the caption language).
 * Pasting a valid link submits right away.
 */
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { parseYouTubeLink } from '@/lib/youtube/url';
import { navigate, watchPath } from '@/lib/router';
import { toast } from '@/lib/toast';
import { Button, cn } from './ui';
import { Icon } from './Icon';
import { LanguagePicker } from './LanguagePicker';

export function UrlForm({
  lang,
  onLangChange,
  compact = false,
  initialValue = '',
  autoFocus = false,
}: {
  lang: string;
  onLangChange: (v: string) => void;
  compact?: boolean;
  initialValue?: string;
  autoFocus?: boolean;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = useId();

  useEffect(() => setValue(initialValue), [initialValue]);
  useEffect(() => {
    if (autoFocus && window.matchMedia('(pointer: fine)').matches) input.current?.focus();
  }, [autoFocus]);

  const go = (raw: string): boolean => {
    const text = raw.trim();
    if (!text) {
      setError(t('errors.empty'));
      input.current?.focus();
      return false;
    }
    const parsed = parseYouTubeLink(text);
    if (!parsed?.videoId) {
      setError(parsed?.playlistOnly ? t('errors.playlist') : t('errors.invalid_link'));
      input.current?.focus();
      return false;
    }
    setError(null);
    input.current?.blur();
    navigate(watchPath(parsed.videoId, lang, parsed.start));
    return true;
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    go(value);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setValue(text);
      if (text.trim()) go(text);
      else input.current?.focus();
    } catch {
      toast(t('toast.pasteDenied'));
      input.current?.focus();
    }
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className={cn('w-full', compact ? 'flex flex-row items-start gap-2 md:gap-3' : 'flex flex-col gap-4')}
    >
      <div className={cn('min-w-0', compact && 'flex-1')}>
        <label htmlFor={inputId} className={cn('mb-1.5 flex items-baseline gap-2.5 text-sm font-semibold', compact && 'sr-only')}>
          <span className="step-num">01</span>
          {t('home.linkLabel')}
        </label>
        <div className="relative">
          <Icon name="video" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
          <input
            ref={input}
            id={inputId}
            type="url"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="go"
            className={cn(
              'field pl-12 text-[1.0625rem]',
              compact ? 'pr-12 sm:pr-[7.5rem]' : 'pr-[7.5rem]',
              compact ? 'min-h-[52px]' : 'min-h-[60px]',
              error && 'border-error'
            )}
            placeholder={t('home.placeholder')}
            value={value}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text');
              if (parseYouTubeLink(text)?.videoId) {
                e.preventDefault();
                setValue(text.trim());
                go(text);
              }
            }}
          />
          <button
            type="button"
            onClick={() => void pasteFromClipboard()}
            aria-label={t('home.paste')}
            className={cn(
              'absolute right-2 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-1.5 border-2 border-line bg-surface-alt text-sm font-semibold transition-colors hover:bg-primary hover:text-on-primary active:translate-y-[calc(-50%+1px)]',
              compact ? 'px-2 sm:px-3' : 'px-3'
            )}
          >
            <Icon name="paste" size={16} />
            <span className={cn(compact && 'hidden sm:inline')}>{t('home.paste')}</span>
          </button>
        </div>
        {error ? (
          <p id={errorId} role="alert" className="mt-2 flex items-start gap-2 text-[0.95rem] font-medium text-error">
            <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
            {error}
          </p>
        ) : null}
      </div>

      <div className={cn(compact ? 'contents' : 'flex flex-col gap-3 xs:flex-row xs:items-end')}>
        <div className={cn('min-w-0', compact ? 'hidden w-56 flex-none md:block' : 'flex-1')}>
          {compact ? null : (
            <span aria-hidden className="mb-1.5 flex items-baseline gap-2.5 text-sm font-semibold">
              <span className="step-num">02</span>
              {t('home.languageLabel')}
            </span>
          )}
          <LanguagePicker
            value={lang}
            onChange={onLangChange}
            label={t('home.languageLabel')}
            hideLabel
            className={compact ? 'min-h-[52px]' : ''}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size={compact ? 'md' : 'lg'}
          iconRight="arrowRight"
          aria-label={t('home.submit')}
          className={cn('xs:flex-none', compact ? 'min-h-[52px] px-4 md:px-5' : 'min-h-[60px]')}
        >
          <span className={cn(compact && 'hidden md:inline')}>{t('home.submit')}</span>
        </Button>
      </div>
    </form>
  );
}
