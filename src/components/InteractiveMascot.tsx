/**
 * The landing-page robot: its eyes follow the cursor in pixel steps, it blinks now and then,
 * and it says hi (hop + speech bubble + pixel burst) when clicked or tapped.
 * The eyes are drawn here on top of the eyeless art (see scripts/art.mjs).
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import meta from '@/assets/mascot-eyes.json';
import { burst } from './PixelTrail';
import { cn } from './ui';

// Eye travel, in % of the image (≈ one art pixel of the 32-pixel sprite)
const STEP = 2.6;
// Pixel-art circle
const EYE_SHAPE = 'polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)';
const GREETED_KEY = 'bitsub-greeted';

export function InteractiveMascot({ size = 200, className }: { size?: number; className?: string }) {
  const { t } = useTranslation();
  const phrases = t('home.mascotSays', { returnObjects: true }) as unknown as string[];
  const wrap = useRef<HTMLButtonElement>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const [hop, setHop] = useState(0);
  const [bubble, setBubble] = useState<string | null>(null);
  const next = useRef(0);
  const hideTimer = useRef(0);

  // Eyes follow the pointer (one pixel step in each direction)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const r = wrap.current?.getBoundingClientRect();
      if (!r) return;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.32;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dead = r.width * 0.12;
      setLook({ x: Math.abs(dx) < dead ? 0 : Math.sign(dx), y: Math.abs(dy) < dead ? 0 : Math.sign(dy) });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // Blink every few seconds
  useEffect(() => {
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          setBlink(true);
          window.setTimeout(() => setBlink(false), 130);
          schedule();
        },
        2600 + Math.random() * 3200
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  const say = (text: string, withBurst: boolean) => {
    setBubble(text);
    setHop((n) => n + 1);
    clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setBubble(null), 2600);
    const r = wrap.current?.getBoundingClientRect();
    if (withBurst && r) burst(r.left + r.width / 2, r.top + r.height * 0.3, 22);
  };

  // Say hi once per visit
  useEffect(() => {
    let greeted = false;
    try {
      greeted = sessionStorage.getItem(GREETED_KEY) === '1';
      sessionStorage.setItem(GREETED_KEY, '1');
    } catch {
      /* storage blocked: greet anyway */
    }
    if (greeted) return;
    const timer = window.setTimeout(() => say(phrases[0] ?? 'Oi!', false), 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const onClick = () => {
    next.current = (next.current + 1) % phrases.length;
    say(phrases[next.current] ?? '', true);
  };

  return (
    <button
      ref={wrap}
      type="button"
      onClick={onClick}
      aria-label={t('home.mascotLabel')}
      className={cn('group relative inline-block shrink-0 focus-visible:outline-offset-8', className)}
      style={{ width: size, height: size }}
    >
      <span key={hop} className={cn('absolute inset-0 block', hop > 0 && 'animate-[mascot-hop_420ms_steps(3,end)]')}>
        <img
          src="/illustrations/mascot-eyeless.png"
          alt=""
          width={size}
          height={size}
          draggable={false}
          className="mascot-art absolute inset-0 h-full w-full select-none [image-rendering:pixelated]"
        />
        {meta.eyes.map((e, i) => (
          <span
            key={i}
            className="absolute bg-[#ffecd6] transition-transform duration-75"
            style={{
              left: `${e.left}%`,
              top: `${e.top}%`,
              width: `${e.width}%`,
              height: `${e.height}%`,
              clipPath: EYE_SHAPE,
              transform: `translate(${(look.x * STEP * size) / 100}px, ${(look.y * STEP * size) / 100}px) scaleY(${blink ? 0.15 : 1})`,
            }}
          />
        ))}
      </span>
      {bubble ? (
        <span
          role="status"
          className="absolute bottom-[88%] left-[62%] z-10 w-max max-w-[15rem] border-2 border-[#0d2b45] bg-[#ffecd6] px-3 py-2 text-left text-[0.95rem] font-semibold leading-snug text-[#0d2b45] shadow-[3px_3px_0_0_#0d2b45] animate-rise"
        >
          {bubble}
          <span
            aria-hidden
            className="absolute -bottom-[10px] left-3 h-[10px] w-[10px] border-b-2 border-l-2 border-[#0d2b45] bg-[#ffecd6] [clip-path:polygon(0_0,100%_0,0_100%)]"
          />
        </span>
      ) : null}
    </button>
  );
}
