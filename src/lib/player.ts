/**
 * Tiny bridge to the embedded YouTube player (privacy-enhanced youtube-nocookie).
 * Timestamps anywhere in the app call seek(); the player component listens.
 * The player also reports its current time, so the transcript can follow along.
 */
import { useSyncExternalStore } from 'react';

type Listener = (seconds: number) => void;

let frame: HTMLIFrameElement | null = null;
const listeners = new Set<Listener>();

// ---- current time (null = player not open)
let currentTime: number | null = null;
const timeListeners = new Set<() => void>();
const setTime = (t: number | null) => {
  if (t === currentTime) return;
  currentTime = t;
  timeListeners.forEach((l) => l());
};

function onMessage(e: MessageEvent) {
  if (!frame || e.source !== frame.contentWindow) return;
  if (!/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(e.origin)) return;
  type PlayerMessage = { event?: string; info?: { currentTime?: number } } | null;
  let data: PlayerMessage;
  try {
    data = (typeof e.data === 'string' ? JSON.parse(e.data) : e.data) as PlayerMessage;
  } catch {
    return;
  }
  const t = data?.info?.currentTime;
  if (typeof t === 'number' && Number.isFinite(t)) setTime(Math.round(t * 4) / 4);
}

function startListening() {
  // Asks the embed to send its state (the IFrame API handshake, without loading the API script).
  frame?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'bitsub', channel: 'widget' }), '*');
}

export function registerFrame(el: HTMLIFrameElement | null) {
  frame = el;
  if (el) {
    window.addEventListener('message', onMessage);
    el.addEventListener('load', startListening);
    startListening();
  } else {
    window.removeEventListener('message', onMessage);
    setTime(null);
  }
}

export function onSeekRequest(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function command(func: string, args: unknown[] = []) {
  frame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
}

export function seek(seconds: number) {
  if (frame) {
    command('seekTo', [seconds, true]);
    command('playVideo');
  }
  listeners.forEach((l) => l(seconds));
}

/** Seconds played in the embedded player, or null while it isn't open. */
export function usePlayerTime(): number | null {
  return useSyncExternalStore(
    (l) => {
      timeListeners.add(l);
      return () => timeListeners.delete(l);
    },
    () => currentTime,
    () => null
  );
}
