/**
 * The robot thinking, animated: the art ships without its three "…" dots (see scripts/art.mjs);
 * the dots are drawn here on top and blink in turn, while the robot bobs one pixel, 8-bit style.
 */
import meta from '@/assets/ai-thinking.json';
import { cn } from './ui';

export function ThinkingMascot({ size = 128, className, label }: { size?: number; className?: string; label?: string }) {
  return (
    <span
      className={cn('relative inline-block shrink-0 animate-[think-bob_1.6s_steps(1,end)_infinite]', className)}
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <img
        src="/illustrations/ai-thinking.png"
        alt=""
        width={size}
        height={size}
        className="absolute inset-0 h-full w-full [image-rendering:pixelated]"
        draggable={false}
      />
      {meta.dots.map((d, i) => (
        <span
          key={i}
          className="absolute bg-[#ffaa5e] animate-[think-dot_1.2s_steps(1,end)_infinite]"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: `${d.width}%`,
            height: `${d.height}%`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </span>
  );
}
