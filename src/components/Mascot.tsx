/**
 * BitSub mascot and logo, from the final pixel art (public/illustrations, public/icons).
 */
import { cn } from './ui';

export function Mascot({ size = 64, className, title }: { size?: number; className?: string; title?: string }) {
  return (
    <img
      src="/illustrations/mascot.png"
      alt={title ?? ''}
      aria-hidden={title ? undefined : true}
      width={size}
      height={size}
      draggable={false}
      className={cn('mascot-art shrink-0 select-none [image-rendering:pixelated]', className)}
    />
  );
}

/** Wordmark: app icon + pixel "BitSub". */
export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img src="/icons/icon-192.png" alt="" width={32} height={32} className="h-8 w-8 border-2 border-line" draggable={false} />
      <span className="pixel text-[13px] tracking-tight text-text sm:text-[15px]">
        Bit<span className="text-[color:var(--bs-accent-text)]">Sub</span>
      </span>
    </span>
  );
}
