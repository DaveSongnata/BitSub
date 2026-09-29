import { useTranslation } from 'react-i18next';
import { exportFileName, exportTranscript, FORMAT_MIME, type Cue, type ExportFormat } from '@/lib/transcript';
import { canShareFiles, downloadFile, shareFile } from '@/lib/files';
import { toast } from '@/lib/toast';
import { updateSettings, useSettings } from '@/lib/settings';
import { Icon } from './Icon';
import { Button, SectionTitle, cn } from './ui';

const FORMATS: ExportFormat[] = ['txt', 'txt-time', 'srt', 'vtt'];

export function useExport(cues: Cue[], title: string, language: string, url?: string) {
  const settings = useSettings();
  const build = (format: ExportFormat) => ({
    name: exportFileName(title || 'bitsub', language, format),
    content: exportTranscript(cues, format, { title, url, includeHeader: settings.includeHeader }),
    mime: FORMAT_MIME[format],
  });
  return { build, format: settings.format };
}

export function DownloadPanel({ cues, title, language, url }: { cues: Cue[]; title: string; language: string; url?: string }) {
  const { t } = useTranslation();
  const settings = useSettings();
  const { build } = useExport(cues, title, language, url);
  const format = settings.format;
  const shareable = canShareFiles();

  const download = () => {
    const f = build(format);
    downloadFile(f.name, f.content, f.mime);
    toast(t('download.done'), 'success');
  };
  const share = async () => {
    const f = build(format);
    const r = await shareFile(f.name, f.content, f.mime, title);
    if (r === 'unsupported') download();
  };

  return (
    <section aria-labelledby="download-title">
      <SectionTitle id="download-title">{t('download.title')}</SectionTitle>
      <div className="card p-4 sm:p-5">
        <p className="mb-4 text-muted">{t('download.subtitle')}</p>
        <div role="radiogroup" aria-label={t('download.title')} className="grid gap-2 sm:grid-cols-2">
          {FORMATS.map((f) => {
            const selected = f === format;
            return (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => updateSettings({ format: f })}
                className={cn(
                  'flex items-start gap-3 border-2 border-line p-3 text-left transition-colors',
                  selected ? 'bg-primary text-on-primary' : 'bg-surface hover:bg-surface-alt'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 border-line',
                    selected ? 'bg-ink text-on-ink' : 'bg-surface'
                  )}
                >
                  {selected ? <Icon name="check" size={14} strokeWidth={3.5} /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold leading-tight">{t(`download.formats.${f}.name`)}</span>
                  <span className={cn('mt-1 block text-sm leading-snug', selected ? 'text-on-primary/80' : 'text-muted')}>
                    {t(`download.formats.${f}.desc`)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <label
          className={cn('mt-4 flex items-center gap-3 text-[0.95rem]', format === 'srt' || format === 'vtt' ? 'opacity-50' : '')}
        >
          <input
            type="checkbox"
            className="h-5 w-5 accent-[var(--bs-primary)]"
            checked={settings.includeHeader}
            disabled={format === 'srt' || format === 'vtt'}
            onChange={(e) => updateSettings({ includeHeader: e.target.checked })}
          />
          {t('download.includeHeader')}
        </label>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="primary" icon="download" onClick={download} className="flex-1 sm:flex-none">
            {t('download.button', { format: t(`download.formats.${format}.name`) })}
          </Button>
          {shareable ? (
            <Button icon="share" onClick={() => void share()}>
              {t('download.share')}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
