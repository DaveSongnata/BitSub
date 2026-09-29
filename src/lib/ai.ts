/**
 * Bring-your-own-key AI. Calls go straight from the browser to Google or OpenAI.
 * BitSub never sees the key or the conversation.
 */

export type Provider = 'gemini' | 'openai';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type AiErrorCode =
  | 'invalid_key'
  | 'no_credit'
  | 'rate_limit'
  | 'region'
  | 'overloaded'
  | 'network'
  | 'blocked'
  | 'model_not_found'
  | 'aborted'
  | 'unknown';

export class AiError extends Error {
  code: AiErrorCode;
  retryAfter?: number;
  constructor(code: AiErrorCode, message: string, retryAfter?: number) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export const PROVIDERS: Record<
  Provider,
  { name: string; keyUrl: string; billingUrl: string; usageUrl: string; free: boolean; defaultModel: string; preferred: string[] }
> = {
  gemini: {
    name: 'Gemini',
    keyUrl: 'https://aistudio.google.com/apikey',
    billingUrl: 'https://aistudio.google.com/usage',
    usageUrl: 'https://aistudio.google.com/api-keys',
    free: true,
    defaultModel: 'gemini-3.5-flash-lite',
    preferred: [
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash',
    ],
  },
  openai: {
    name: 'ChatGPT (OpenAI)',
    keyUrl: 'https://platform.openai.com/api-keys',
    billingUrl: 'https://platform.openai.com/settings/organization/billing/overview',
    usageUrl: 'https://platform.openai.com/usage',
    free: false,
    defaultModel: 'gpt-6-luna',
    preferred: ['gpt-6-luna', 'gpt-5.4-nano', 'gpt-5-nano', 'gpt-5.4-mini', 'gpt-5-mini', 'gpt-4.1-mini', 'gpt-4o-mini'],
  },
};

const GEMINI = 'https://generativelanguage.googleapis.com/v1beta';
const OPENAI = 'https://api.openai.com/v1';

// ---------------------------------------------------------------- errors

interface GoogleErrorBody {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: { reason?: string; retryDelay?: string; '@type'?: string }[];
  };
}
interface OpenAIErrorBody {
  error?: { message?: string; code?: string | null; type?: string };
}

function parseRetry(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const n = parseFloat(value);
  return Number.isFinite(n) ? Math.ceil(n) : undefined;
}

async function toAiError(provider: Provider, res: Response): Promise<AiError> {
  let body: unknown = null;
  const text = await res.text().catch(() => '');
  try {
    body = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  if (Array.isArray(body)) body = body[0];
  const status = res.status;

  if (provider === 'gemini') {
    const err = (body as GoogleErrorBody | null)?.error;
    const reason = err?.details?.find((d) => d.reason)?.reason;
    const retry = parseRetry(err?.details?.find((d) => d.retryDelay)?.retryDelay);
    const msg = err?.message ?? (text || `HTTP ${status}`);
    if (reason === 'API_KEY_INVALID' || /api key not valid|API_KEY_INVALID/i.test(msg) || status === 401)
      return new AiError('invalid_key', msg);
    // Only a missing/unregistered key means the key itself is bad; other 403s (API disabled, restrictions) are not.
    if (status === 403 && /unregistered callers/i.test(msg)) return new AiError('invalid_key', msg);
    if (status === 404 && (err?.status === 'NOT_FOUND' || /models\//i.test(msg))) return new AiError('model_not_found', msg);
    if (status === 429) {
      const daily = /per day|daily|quota_exceeded|PerDay/i.test(msg);
      return new AiError(daily ? 'no_credit' : 'rate_limit', msg, retry);
    }
    if (err?.status === 'FAILED_PRECONDITION' || /location is not supported|region/i.test(msg)) return new AiError('region', msg);
    if (status === 503 || status === 500 || status === 504) return new AiError('overloaded', msg, retry);
    return new AiError('unknown', msg);
  }

  const err = (body as OpenAIErrorBody | null)?.error;
  const code = err?.code ?? '';
  const msg = err?.message ?? (text || `HTTP ${status}`);
  if (status === 401 || code === 'invalid_api_key') return new AiError('invalid_key', msg);
  if (code === 'model_not_found' || (status === 404 && /model/i.test(msg))) return new AiError('model_not_found', msg);
  if (status === 429) {
    if (/credit|quota|billing|spend_limit|usage_limit/i.test(`${code} ${msg}`)) return new AiError('no_credit', msg);
    return new AiError('rate_limit', msg, parseRetry(res.headers.get('retry-after')));
  }
  if (status === 403 && /country|region|territory/i.test(msg)) return new AiError('region', msg);
  if (status >= 500) return new AiError('overloaded', msg, parseRetry(res.headers.get('retry-after')));
  return new AiError('unknown', msg);
}

async function safeFetch(provider: Provider, url: string, init: RequestInit, key: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw new AiError('aborted', 'aborted');
    if (!navigator.onLine) throw new AiError('network', 'offline');
    // OpenAI answers some errors (bad key, no credit) without CORS headers, which the
    // browser reports as a network error. Ask the models endpoint to find out why.
    if (provider === 'openai') {
      const check = await validateKey('openai', key).catch(() => null);
      if (check && !check.ok && check.error) throw check.error;
      throw new AiError('no_credit', 'OpenAI refused the request (check key, credit and limits).');
    }
    throw new AiError('network', e instanceof Error ? e.message : 'network');
  }
  if (!res.ok) throw await toAiError(provider, res);
  return res;
}

// ---------------------------------------------------------------- models / validation

export interface KeyCheck {
  ok: boolean;
  models: string[];
  error?: AiError;
}

export async function validateKey(provider: Provider, key: string): Promise<KeyCheck> {
  const k = key.trim();
  try {
    if (provider === 'gemini') {
      const res = await fetch(`${GEMINI}/models?pageSize=200`, { headers: { 'x-goog-api-key': k } });
      if (!res.ok) return { ok: false, models: [], error: await toAiError('gemini', res) };
      const data = (await res.json()) as {
        models?: { name: string; supportedGenerationMethods?: string[] }[];
      };
      const models = (data.models ?? [])
        .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m) => m.name.replace(/^models\//, ''))
        .filter((id) => /^gemini-/.test(id) && !/embedding|image|tts|audio|live|vision|robotics|computer/i.test(id));
      return { ok: true, models };
    }
    const res = await fetch(`${OPENAI}/models`, { headers: { Authorization: `Bearer ${k}` } });
    if (!res.ok) return { ok: false, models: [], error: await toAiError('openai', res) };
    const data = (await res.json()) as { data?: { id: string }[] };
    const models = (data.data ?? [])
      .map((m) => m.id)
      .filter(
        (id) =>
          /^(gpt-|o\d|chatgpt-)/.test(id) &&
          !/(audio|realtime|tts|transcribe|image|search|embedding|instruct|codex|computer|moderation|dall|whisper|-\d{4}-\d{2}-\d{2}$)/i.test(
            id
          )
      );
    return { ok: true, models };
  } catch (e) {
    return { ok: false, models: [], error: new AiError('network', e instanceof Error ? e.message : 'network') };
  }
}

/** Pick the best available model for the provider. */
export function pickModel(provider: Provider, available: string[], wanted?: string | null): string {
  if (wanted && (available.length === 0 || available.includes(wanted))) return wanted;
  for (const id of PROVIDERS[provider].preferred) if (available.includes(id)) return id;
  const lite = available.find((m) => /flash-lite|nano|mini|luna/.test(m));
  return lite ?? available[0] ?? PROVIDERS[provider].defaultModel;
}

export function sortModels(provider: Provider, models: string[]): string[] {
  const pref = PROVIDERS[provider].preferred;
  const rank = (m: string) => {
    const i = pref.indexOf(m);
    return i === -1 ? 100 : i;
  };
  return [...new Set(models)].sort((a, b) => rank(a) - rank(b) || b.localeCompare(a));
}

// ---------------------------------------------------------------- streaming

async function* sseEvents(res: Response, signal?: AbortSignal): AsyncGenerator<{ event?: string; data: string }> {
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buf = '';
  try {
    while (true) {
      if (signal?.aborted) throw new AiError('aborted', 'aborted');
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let idx: number;
      while ((idx = buf.indexOf('\n\n')) !== -1) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        let event: string | undefined;
        const data: string[] = [];
        for (const line of raw.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
        }
        if (data.length) yield { event, data: data.join('\n') };
      }
    }
    if (buf.trim().startsWith('data:')) yield { data: buf.trim().slice(5).trim() };
  } finally {
    reader.releaseLock();
  }
}

export interface StreamOptions {
  provider: Provider;
  apiKey: string;
  model: string;
  system: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
  onDelta: (text: string) => void;
}

function supportsReasoningEffort(model: string): boolean {
  return /^(gpt-5|gpt-6|o\d)/.test(model);
}

async function streamGemini(o: StreamOptions, useThinking = true): Promise<string> {
  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: o.system }] },
    contents: o.messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 8192,
      ...(useThinking && /gemini-3/.test(o.model) ? { thinkingConfig: { thinkingLevel: 'low' } } : {}),
    },
  };
  let res: Response;
  try {
    res = await safeFetch(
      'gemini',
      `${GEMINI}/models/${encodeURIComponent(o.model)}:streamGenerateContent?alt=sse`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': o.apiKey.trim() },
        body: JSON.stringify(body),
        signal: o.signal,
      },
      o.apiKey
    );
  } catch (e) {
    // Some models reject the thinking option: try once without it.
    if (useThinking && e instanceof AiError && e.code === 'unknown' && /thinking/i.test(e.message)) return streamGemini(o, false);
    throw e;
  }
  let full = '';
  let blocked = false;
  for await (const { data } of sseEvents(res, o.signal)) {
    let json: {
      candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
      promptFeedback?: { blockReason?: string };
      error?: { message?: string };
    };
    try {
      json = JSON.parse(data) as typeof json;
    } catch {
      continue;
    }
    if (json.error) throw new AiError('unknown', json.error.message ?? 'error');
    if (json.promptFeedback?.blockReason) blocked = true;
    const cand = json.candidates?.[0];
    for (const part of cand?.content?.parts ?? []) {
      if (part.thought || !part.text) continue;
      full += part.text;
      o.onDelta(full);
    }
    if (cand?.finishReason === 'SAFETY' || cand?.finishReason === 'PROHIBITED_CONTENT') blocked = true;
  }
  if (!full && blocked) throw new AiError('blocked', 'blocked');
  return full;
}

async function streamOpenAI(o: StreamOptions): Promise<string> {
  const body: Record<string, unknown> = {
    model: o.model,
    stream: true,
    messages: [{ role: 'system', content: o.system }, ...o.messages],
  };
  if (supportsReasoningEffort(o.model)) body.reasoning_effort = 'low';
  const res = await safeFetch(
    'openai',
    `${OPENAI}/chat/completions`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${o.apiKey.trim()}` },
      body: JSON.stringify(body),
      signal: o.signal,
    },
    o.apiKey
  );
  let full = '';
  for await (const { data } of sseEvents(res, o.signal)) {
    if (data === '[DONE]') break;
    let json: {
      choices?: { delta?: { content?: string | null }; finish_reason?: string | null }[];
      error?: { message?: string };
    };
    try {
      json = JSON.parse(data) as typeof json;
    } catch {
      continue;
    }
    if (json.error) throw new AiError('unknown', json.error.message ?? 'error');
    const delta = json.choices?.[0]?.delta?.content;
    if (delta) {
      full += delta;
      o.onDelta(full);
    }
    if (json.choices?.[0]?.finish_reason === 'content_filter' && !full) throw new AiError('blocked', 'blocked');
  }
  return full;
}

export async function streamChat(o: StreamOptions): Promise<string> {
  try {
    return o.provider === 'gemini' ? await streamGemini(o) : await streamOpenAI(o);
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof DOMException && e.name === 'AbortError') throw new AiError('aborted', 'aborted');
    throw new AiError('network', e instanceof Error ? e.message : String(e));
  }
}

/** Rough token estimate (good enough to decide when to split). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.6);
}
