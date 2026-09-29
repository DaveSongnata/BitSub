/**
 * 8-bit particles: a trail of pixel squares behind the mouse, and bursts on demand.
 * Canvas overlay that never blocks clicks. Off on touch screens (trail) and for reduced motion.
 */
import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

const LIGHT = ['#ffaa5e', '#d08159', '#0d2b45', '#ffaa5e'];
const DARK = ['#ffaa5e', '#ffd4a3', '#ffecd6', '#d08159'];
const GRID = 3; // particles snap to a 3px grid: crisp, pixel-art motion
const MAX = 160;

const BURST_EVENT = 'bitsub:burst';

/** Throw a handful of pixels from a point (viewport coordinates). */
export function burst(x: number, y: number, count = 18) {
  window.dispatchEvent(new CustomEvent(BURST_EVENT, { detail: { x, y, count } }));
}

export function PixelTrail() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const trail = window.matchMedia('(pointer: fine)').matches;

    const particles: Particle[] = [];
    let raf = 0;
    let last: { x: number; y: number } | null = null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      el.width = Math.floor(window.innerWidth * dpr);
      el.height = Math.floor(window.innerHeight * dpr);
      el.style.width = `${window.innerWidth}px`;
      el.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };
    resize();

    const palette = () => (document.documentElement.classList.contains('dark') ? DARK : LIGHT);
    const spawn = (x: number, y: number, speed: number, up = 0) => {
      if (particles.length >= MAX) particles.shift();
      const colors = palette();
      const angle = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.6);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v - up,
        life: 0,
        max: 28 + Math.random() * 22,
        size: Math.random() < 0.3 ? 6 : 3,
        color: colors[Math.floor(Math.random() * colors.length)]!,
      });
    };

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!;
        p.life++;
        p.vy += 0.09; // gravity
        p.vx *= 0.97;
        p.x += p.vx;
        p.y += p.vy;
        if (p.life >= p.max) {
          particles.splice(i, 1);
          continue;
        }
        // fade in 4 steps, like old consoles
        ctx.globalAlpha = Math.ceil((1 - p.life / p.max) * 4) / 4;
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x / GRID) * GRID, Math.round(p.y / GRID) * GRID, p.size, p.size);
      }
      ctx.globalAlpha = 1;
      raf = particles.length ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const p = { x: e.clientX, y: e.clientY };
      if (last && Math.hypot(p.x - last.x, p.y - last.y) < 14) return;
      last = p;
      spawn(p.x, p.y, 1.2, 0.6);
      kick();
    };
    const onBurst = (e: Event) => {
      const { x, y, count } = (e as CustomEvent<{ x: number; y: number; count: number }>).detail;
      for (let i = 0; i < count; i++) spawn(x, y, 4.5, 2.5);
      kick();
    };

    if (trail) window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener(BURST_EVENT, onBurst);
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener(BURST_EVENT, onBurst);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden className="pointer-events-none fixed inset-0 z-30" />;
}
