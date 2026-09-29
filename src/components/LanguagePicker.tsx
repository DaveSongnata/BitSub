import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { MAIN_CAPTION_LANGS, OTHER_CAPTION_LANGS, languageLabel, shortLanguageLabel } from '@/lib/languages';
import { currentLanguage } from '@/i18n';
import { cn } from './ui';

/** Native select (best on phones) with the app languages first. */
export function LanguagePicker({
  value,
  onChange,
  label,
  hideLabel,
  className,
  includeOriginal = true,
  extra,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  hideLabel?: boolean;
  className?: string;
  includeOriginal?: boolean;
  extra?: { value: string; label: string }[];
}) {
  const { t } = useTranslation();
  const ui = currentLanguage();
  const id = useId();
  const known = new Set<string>([
    ...MAIN_CAPTION_LANGS,
    ...OTHER_CAPTION_LANGS,
    'original',
    ...(extra ?? []).map((e) => e.value),
  ]);
  const others = [...OTHER_CAPTION_LANGS]
    .map((code) => ({ code, label: languageLabel(code, ui) }))
    .sort((a, b) => a.label.localeCompare(b.label, ui));
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className={cn('mb-1.5 block text-sm font-semibold', hideLabel && 'sr-only')}>
        {label}
      </label>
      <select id={id} className="field select-none font-medium" value={value} onChange={(e) => onChange(e.target.value)}>
        {extra?.map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
        <optgroup label={t('languages.suggested')}>
          {MAIN_CAPTION_LANGS.map((code) => (
            <option key={code} value={code}>
              {shortLanguageLabel(code, ui)}
            </option>
          ))}
          {includeOriginal ? <option value="original">{t('languages.original')}</option> : null}
        </optgroup>
        <optgroup label={t('languages.others')}>
          {others.map((o) => (
            <option key={o.code} value={o.code}>
              {o.label}
            </option>
          ))}
          {!known.has(value) ? <option value={value}>{languageLabel(value, ui)}</option> : null}
        </optgroup>
      </select>
    </div>
  );
}
