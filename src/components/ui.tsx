/**
 * UI kit (BitTask family): hard shadows, square corners, lift-and-press.
 */
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Icon, type IconName } from './Icon';
import { dismiss, useToasts } from '@/lib/toast';

export const cn = (...args: Parameters<typeof clsx>) => twMerge(clsx(args));

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'ink';
  size?: 'md' | 'sm' | 'lg';
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  loading,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'btn',
        variant === 'primary' && 'btn-primary',
        variant === 'ink' && 'btn-ink',
        variant === 'ghost' && 'btn-ghost',
        size === 'sm' && 'btn-sm',
        size === 'lg' && 'min-h-14 px-6 text-[1.0625rem]',
        className
      )}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Dots size="sm" /> : icon ? <Icon name={icon} size={size === 'sm' ? 16 : 20} /> : null}
      {children}
      {iconRight && !loading ? <Icon name={iconRight} size={size === 'sm' ? 16 : 20} /> : null}
    </button>
  );
}

/** Three square dots bouncing: BitTask's loader. */
export function Dots({ size = 'md', label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const s = size === 'sm' ? 'h-1.5 w-1.5' : size === 'lg' ? 'h-3 w-3' : 'h-2 w-2';
  return (
    <span role="status" aria-label={label} className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(s, 'bg-current')}
          style={{ animation: `dots 0.6s ${i * 0.15}s infinite alternate steps(3)` }}
        />
      ))}
      <style>{'@keyframes dots{from{transform:translateY(0);opacity:1}to{transform:translateY(-5px);opacity:.45}}'}</style>
    </span>
  );
}

export function Tag({
  children,
  className,
  tone = 'default',
}: {
  children: ReactNode;
  className?: string;
  tone?: 'default' | 'primary' | 'ink' | 'success';
}) {
  return (
    <span
      className={cn(
        'tag',
        tone === 'primary' && 'bg-primary text-on-primary',
        tone === 'ink' && 'border-ink bg-ink text-on-ink',
        tone === 'success' && 'bg-success-bg text-success',
        className
      )}
    >
      {children}
    </span>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('seg', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          title={o.title}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        {hint ? <span className="mt-0.5 block text-sm text-muted">{hint}</span> : null}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-8 w-14 shrink-0 border-2 border-line p-0 transition-colors',
          checked ? 'bg-primary' : 'bg-surface-alt'
        )}
      >
        <span
          className={cn(
            'absolute left-1 top-1 h-5 w-5 border-2 border-line bg-surface transition-transform duration-100',
            checked ? 'translate-x-6' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
}) {
  const { t } = useTranslation();
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab' && panel.current) {
        const focusables = panel.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select,textarea,iframe,[tabindex]:not([tabindex="-1"])'
        );
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => panel.current?.focus());
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--bs-overlay)] p-0 animate-fade sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'flex max-h-[92dvh] w-full flex-col border-2 border-line bg-surface shadow-hard-lg outline-none animate-rise',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b-2 border-line bg-primary px-5 py-3 text-on-primary">
          <h2 id={titleId} className="text-lg font-semibold leading-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon -mr-2 text-on-primary hover:!bg-[rgb(0_0_0/0.08)]"
            aria-label={t('common.close')}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="scroll-thin overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <div className="border-t-2 border-line px-5 py-4 safe-bottom">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

export function Toaster() {
  const items = useToasts();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+88px)] lg:items-end lg:pb-6 lg:pr-6"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role={t.kind === 'error' ? 'alert' : 'status'}
          className={cn(
            'pointer-events-auto flex w-full max-w-md items-start gap-3 border-2 border-line px-4 py-3 shadow-hard animate-rise',
            t.kind === 'error' ? 'bg-error-bg text-text' : t.kind === 'success' ? 'bg-ink text-on-ink' : 'bg-surface text-text'
          )}
        >
          <Icon
            name={t.kind === 'error' ? 'alert' : t.kind === 'success' ? 'check' : 'info'}
            className="mt-0.5 shrink-0"
            size={18}
          />
          <p className="min-w-0 flex-1 text-[0.95rem] font-medium leading-snug">{t.text}</p>
          {t.action ? (
            <button
              type="button"
              className="shrink-0 font-semibold underline underline-offset-4"
              onClick={() => {
                t.action?.run();
                dismiss(t.id);
              }}
            >
              {t.action.label}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function SectionTitle({
  num,
  children,
  aside,
  id,
}: {
  num?: string;
  children: ReactNode;
  aside?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2 id={id} className="flex items-baseline gap-3 text-xl font-semibold leading-tight tracking-[-0.01em]">
        {num ? <span className="step-num">{num}</span> : null}
        {children}
      </h2>
      {aside}
    </div>
  );
}

export function Callout({
  tone = 'info',
  icon,
  children,
  action,
}: {
  tone?: 'info' | 'error' | 'success';
  icon?: IconName;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-2 border-line p-4 sm:flex-row sm:items-start',
        tone === 'error' ? 'bg-error-bg' : tone === 'success' ? 'bg-success-bg' : 'bg-surface-alt'
      )}
      role={tone === 'error' ? 'alert' : undefined}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <Icon name={icon ?? (tone === 'error' ? 'alert' : tone === 'success' ? 'check' : 'info')} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}
