import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_LANGUAGES, changeLanguage, currentLanguage, type AppLanguage } from '@/i18n';
import { clearKeys, maskKey, setKey, updateSettings, useKeys, useSettings, type ThemeMode, type ThemeName } from '@/lib/settings';
import { PROVIDERS, pickModel, sortModels, validateKey, type Provider } from '@/lib/ai';
import { knownModels, forgetModels, rememberModels } from '@/lib/models';
import { clearHistory } from '@/lib/db';
import { toast } from '@/lib/toast';
import { shortLanguageLabel } from '@/lib/languages';
import { checkForUpdate, installApp, usePWA } from '@/hooks/usePWA';
import { useSystemDark } from '@/hooks/useTheme';
import { Footer, Page } from '@/components/Shell';
import { Icon } from '@/components/Icon';
import { KeySetup } from '@/components/KeySetup';
import { LanguagePicker } from '@/components/LanguagePicker';
import { Mascot } from '@/components/Mascot';
import { Button, Segmented, Switch } from '@/components/ui';

function Card({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-24 p-5 sm:p-6" aria-labelledby={id ? `${id}-title` : undefined}>
      <h2 id={id ? `${id}-title` : undefined} className="mb-5 text-lg font-semibold">
        {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-hair pb-3 last:border-0 last:pb-0">
      <span className="text-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

const SWATCHES = ['#ffecd6', '#ffd4a3', '#ffaa5e', '#d08159', '#8d697a', '#544e68', '#203c56', '#0d2b45'];

function ModelPicker({ provider }: { provider: Provider }) {
  const { t } = useTranslation();
  const settings = useSettings();
  const keys = useKeys();
  const [models, setModels] = useState<string[]>(() => knownModels(provider));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setModels(knownModels(provider));
    const key = keys[provider];
    if (!key) return;
    let alive = true;
    setLoading(true);
    void validateKey(provider, key).then((r) => {
      if (!alive) return;
      setLoading(false);
      if (r.ok) {
        rememberModels(provider, r.models);
        setModels(r.models);
      }
    });
    return () => {
      alive = false;
    };
  }, [provider, keys]);

  const current = settings.models[provider] ?? pickModel(provider, models);
  const list = sortModels(provider, models.length ? models : [current]);
  if (!list.includes(current)) list.unshift(current);

  return (
    <div>
      <label htmlFor="model" className="mb-1.5 block text-sm font-semibold">
        {t('settings.model')}
      </label>
      <select
        id="model"
        className="field font-mono text-[0.95rem]"
        value={current}
        onChange={(e) => updateSettings({ models: { ...settings.models, [provider]: e.target.value } })}
      >
        {list.map((m) => (
          <option key={m} value={m}>
            {m}
            {m === PROVIDERS[provider].defaultModel ? ' ★' : ''}
          </option>
        ))}
      </select>
      <p className="mt-1.5 text-sm text-muted">{loading ? t('settings.modelLoading') : t('settings.modelHint')}</p>
    </div>
  );
}

export function Settings() {
  const { t } = useTranslation();
  const settings = useSettings();
  const keys = useKeys();
  const pwa = usePWA();
  const systemDark = useSystemDark();
  const ui = currentLanguage();
  const resolved = settings.mode === 'system' ? (systemDark ? 'dark' : 'light') : settings.mode;
  const provider = settings.provider;
  const key = keys[provider];

  useEffect(() => {
    if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  }, []);

  return (
    <>
      <Page className="pt-8 sm:pt-12">
        <div className="mb-8 border-b-2 border-line pb-6">
          <h1 className="text-[2.25rem] font-semibold leading-tight tracking-[-0.025em]">{t('settings.title')}</h1>
          <p className="mt-2 text-muted">{t('settings.subtitle')}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="space-y-6">
            <Card title={t('settings.language')}>
              <Segmented<AppLanguage>
                label={t('settings.language')}
                value={ui}
                onChange={(v) => changeLanguage(v)}
                options={APP_LANGUAGES.map((l) => ({ value: l.code, label: l.name, title: l.name }))}
              />
            </Card>

            <Card title={t('settings.theme')}>
              <Segmented<ThemeName>
                label={t('settings.theme')}
                value={settings.theme}
                onChange={(v) => updateSettings({ theme: v })}
                options={[
                  { value: 'slso8', label: t('settings.themes.slso8') },
                  { value: 'original', label: t('settings.themes.original') },
                ]}
              />
              {settings.theme === 'slso8' ? (
                <div className="flex gap-1" aria-hidden>
                  {SWATCHES.map((c) => (
                    <span key={c} className="h-5 flex-1 border border-line" style={{ background: c }} />
                  ))}
                </div>
              ) : null}
            </Card>

            <Card title={t('settings.mode')}>
              <Segmented<ThemeMode>
                label={t('settings.mode')}
                value={settings.mode}
                onChange={(v) => updateSettings({ mode: v })}
                options={[
                  { value: 'light', label: t('settings.modes.light') },
                  { value: 'dark', label: t('settings.modes.dark') },
                  { value: 'system', label: t('settings.modes.system') },
                ]}
              />
              <p className="flex items-center gap-2 text-sm text-muted">
                <Icon name={resolved === 'dark' ? 'moon' : 'sun'} size={16} />
                {t('settings.modeNow', { mode: t(`settings.modes.${resolved}`) })}
              </p>
            </Card>

            <Card title={t('settings.captions')}>
              <LanguagePicker
                label={t('settings.captionLanguage')}
                value={settings.captionLang}
                onChange={(v) => updateSettings({ captionLang: v })}
                extra={[{ value: 'app', label: `${t('settings.followApp')} (${shortLanguageLabel(ui, ui)})` }]}
              />
              <p className="-mt-3 text-sm text-muted">{t('settings.captionLanguageHint')}</p>
            </Card>
          </div>

          <div className="space-y-6">
            <Card id="ai" title={t('settings.ai')}>
              <Segmented<Provider>
                label={t('settings.provider')}
                value={provider}
                onChange={(v) => updateSettings({ provider: v })}
                options={[
                  { value: 'gemini', label: `Gemini${keys.gemini ? ' ✓' : ''}` },
                  { value: 'openai', label: `ChatGPT${keys.openai ? ' ✓' : ''}` },
                ]}
              />
              {key ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-line bg-surface-alt px-4 py-3">
                    <span className="flex items-center gap-2">
                      <Icon name="key" size={18} />
                      <span className="font-mono text-[0.95rem]">{t('settings.keySet', { masked: maskKey(key) })}</span>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="trash"
                      onClick={() => {
                        setKey(provider, null);
                        toast(t('ai.keyRemoved'));
                      }}
                    >
                      {t('ai.removeKey')}
                    </Button>
                  </div>
                  <ModelPicker provider={provider} />
                  <LanguagePicker
                    label={t('settings.answerLanguage')}
                    value={settings.answerLang}
                    includeOriginal={false}
                    onChange={(v) => updateSettings({ answerLang: v })}
                    extra={[{ value: 'app', label: `${t('settings.followApp')} (${shortLanguageLabel(ui, ui)})` }]}
                  />
                  <a
                    href={PROVIDERS[provider].usageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link inline-flex items-center gap-1.5 text-sm font-semibold"
                  >
                    {t('aiErrors.openPanel')} {provider === 'gemini' ? 'Google AI Studio' : 'OpenAI'}
                    <Icon name="external" size={14} />
                  </a>
                </>
              ) : (
                <KeySetup hideProvider />
              )}
              <Switch
                checked={settings.rememberKey}
                onChange={(v) => updateSettings({ rememberKey: v })}
                label={t('settings.rememberKey')}
                hint={t('settings.rememberKeyHint')}
              />
            </Card>

            <Card title={t('settings.data')}>
              <Switch
                checked={settings.saveHistory}
                onChange={(v) => updateSettings({ saveHistory: v })}
                label={t('settings.saveHistory')}
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  icon="trash"
                  onClick={() => {
                    if (!window.confirm(t('history.clearConfirm'))) return;
                    void clearHistory().then(() => toast(t('history.cleared'), 'success'));
                  }}
                >
                  {t('settings.clearHistory')}
                </Button>
                <Button
                  icon="key"
                  onClick={() => {
                    if (!window.confirm(t('settings.clearKeysConfirm'))) return;
                    clearKeys();
                    forgetModels();
                    toast(t('settings.keysCleared'), 'success');
                  }}
                >
                  {t('settings.clearKeys')}
                </Button>
              </div>
            </Card>

            <Card title={t('settings.app')}>
              <div className="space-y-3">
                <Row label={t('settings.installed')} value={pwa.installed ? t('settings.yes') : t('settings.no')} />
                <Row
                  label={t('settings.network')}
                  value={
                    <span className={pwa.online ? 'text-success' : 'text-error'}>
                      {pwa.online ? t('settings.online') : t('settings.offline')}
                    </span>
                  }
                />
                <Row label="BitSub" value={<span className="pixel text-[10px]">v{__APP_VERSION__}</span>} />
              </div>
              {!pwa.installed && pwa.canInstall ? (
                <Button variant="primary" icon="install" className="w-full" onClick={() => void installApp()}>
                  {t('settings.installApp')}
                </Button>
              ) : null}
              {!pwa.installed && pwa.isIOS ? <p className="text-sm text-muted">{t('settings.installIos')}</p> : null}
              <Button
                icon="refresh"
                onClick={() =>
                  void checkForUpdate().then((has) => {
                    if (!has) toast(t('settings.upToDate'));
                  })
                }
              >
                {t('settings.checkUpdate')}
              </Button>
            </Card>

            <Card title={t('settings.about')}>
              <div className="flex items-start gap-4">
                <Mascot size={56} />
                <div className="space-y-2">
                  <p className="leading-relaxed">{t('settings.aboutText')}</p>
                  <p className="text-sm text-muted">
                    {t('settings.version', { version: __APP_VERSION__ })} · {t('settings.family')}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Page>
      <Footer />
    </>
  );
}
