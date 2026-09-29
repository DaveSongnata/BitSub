/**
 * Tiny bridge to the embedded YouTube player (privacy-enhanced youtube-nocookie).
 * Timestamps anywhere in the app call seek(); the player component listens.
 */
type Listener = (seconds: number) => void;

let frame: HTMLIFrameElement | null = null;
const listeners = new Set<Listener>();

export function registerFrame(el: HTMLIFrameElement | null) {
  frame = el;
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
