import { useSyncExternalStore } from 'react';

export type ToastKind = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
  action?: { label: string; run: () => void };
  duration: number;
}

let toasts: Toast[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(text: string, kind: ToastKind = 'info', opts: Partial<Pick<Toast, 'action' | 'duration'>> = {}) {
  const id = ++seq;
  const item: Toast = { id, kind, text, duration: opts.duration ?? (kind === 'error' ? 6000 : 3200), action: opts.action };
  toasts = [...toasts.filter((t) => t.text !== text), item].slice(-3);
  emit();
  if (item.duration > 0) setTimeout(() => dismiss(id), item.duration);
  return id;
}

export function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
    () => toasts
  );
}
