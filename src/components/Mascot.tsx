/**
 * BitSub mascot: a cousin of BitTask's robot, with a subtitle bar on its screen-face.
 * Pure pixel SVG (16×16 grid), crisp at any size.
 */
import type { CSSProperties } from 'react';

export type MascotMood = 'happy' | 'sad' | 'thinking' | 'sleep' | 'wow';

const C = {
  navy: '#0d2b45',
  cream: '#ffecd6',
  orange: '#ffaa5e',
  copper: '#d08159',
  mauve: '#8d697a',
  plum: '#544e68',
};

type Px = [x: number, y: number, w: number, h: number, fill: string];

/** Eyes on the screen-face; the subtitle bar changes with the mood too. */
function face(mood: MascotMood): Px[] {
  const bar: Px[] = [
    [5, 8.6, 6, 0.8, C.cream],
    [5.6, 9.9, 3.4, 0.8, C.cream],
  ];
  switch (mood) {
    case 'sad':
      return [
        [5, 6, 2, 1, C.cream],
        [9, 6, 2, 1, C.cream],
        [5, 5, 1, 1, C.cream],
        [10, 5, 1, 1, C.cream],
        [6, 9.2, 4, 0.8, C.cream],
      ];
    case 'sleep':
      return [[5, 6, 2, 0.8, C.cream], [9, 6, 2, 0.8, C.cream], ...bar];
    case 'thinking':
      return [[6, 4.6, 1.4, 1.8, C.cream], [10, 4.6, 1.4, 1.8, C.cream], ...bar];
    case 'wow':
      return [[5, 4.4, 2, 2.6, C.cream], [9, 4.4, 2, 2.6, C.cream], ...bar];
    default:
      return [[5, 5, 2, 2, C.cream], [9, 5, 2, 2, C.cream], ...bar];
  }
}

export function Mascot({
  size = 64,
  mood = 'happy',
  className,
  style,
  title,
}: {
  size?: number;
  mood?: MascotMood;
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  // Head of the BitSub robot (same design as the app icon): mauve frame, navy screen,
  // cream eyes, two "subtitle" lines as a mouth, copper antenna ears with orange tips.
  const px: Px[] = [
    // antennas
    [1, 0, 1, 1, C.orange],
    [14, 0, 1, 1, C.orange],
    [1, 1, 1, 4, C.copper],
    [14, 1, 1, 4, C.copper],
    // ears
    [0, 5, 2, 5, C.navy],
    [14, 5, 2, 5, C.navy],
    [1, 5.5, 0.9, 3.5, C.copper],
    [14.1, 5.5, 0.9, 3.5, C.copper],
    // head
    [2, 1, 12, 14, C.navy],
    [3, 2, 10, 12, C.mauve],
    [3, 13, 10, 1, C.plum],
    // screen
    [4, 3, 8, 9, C.navy],
    ...face(mood),
  ];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={className}
      style={style}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {px.map(([x, y, w, h, fill], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
      ))}
    </svg>
  );
}

/** Wordmark: pixel "BitSub" + mascot head. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mascot size={compact ? 26 : 30} />
      <span className="pixel text-[13px] tracking-tight text-text sm:text-[15px]">
        Bit<span className="text-[color:var(--bs-accent-text)]">Sub</span>
      </span>
    </span>
  );
}
