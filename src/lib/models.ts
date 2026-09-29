import type { Provider } from './ai';

const KEY = (p: Provider) => `bitsub-models-${p}`;

/** Remember the models a key can use (for the picker in Settings). */
export function rememberModels(provider: Provider, models: string[]) {
  try {
    localStorage.setItem(KEY(provider), JSON.stringify(models));
  } catch {
    /* ignore */
  }
}

export function knownModels(provider: Provider): string[] {
  try {
    const raw = localStorage.getItem(KEY(provider));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function forgetModels() {
  try {
    localStorage.removeItem(KEY('gemini'));
    localStorage.removeItem(KEY('openai'));
  } catch {
    /* ignore */
  }
}
