/**
 * Icon set: hand-drawn strokes with square caps (BitTask style), 24×24 grid.
 */
import type { SVGProps } from 'react';

const PATHS = {
  paste: 'M9 4h6v3H9zM7 5.5H5v15h14v-15h-2M8.5 12h7M8.5 16h5',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 20 20',
  download: 'M12 4v11M7 10.5l5 5 5-5M5 20h14',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  close: 'M6 6l12 12M18 6 6 18',
  arrowRight: 'M5 12h13M13 6l6 6-6 6',
  arrowLeft: 'M19 12H6M11 6l-6 6 6 6',
  settings:
    'M10.5 3h3l.6 2.6 1.9 1.1 2.5-.8 1.5 2.6-1.9 1.8v2.2l1.9 1.8-1.5 2.6-2.5-.8-1.9 1.1-.6 2.6h-3l-.6-2.6-1.9-1.1-2.5.8-1.5-2.6 1.9-1.8v-2.2L3.5 8.5 5 5.9l2.5.8 1.9-1.1zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  history: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4M12 8v4.5l3 2',
  sparkle: 'M12 3v5M12 16v5M3 12h5M16 12h5M7 7l2 2M15 15l2 2M17 7l-2 2M9 15l-2 2',
  send: 'M4 12 20 4l-4 16-4-7zM12 13l8-9',
  stop: 'M7 7h10v10H7z',
  play: 'M8 5v14l11-7z',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  key: 'M14.5 9.5a4.5 4.5 0 1 1-1.3-3.2M13 11l7 7M17 15l2-2M15 17l1.5-1.5',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 14.5v2.5',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3.5 9h17M3.5 15h17M12 3c-2.5 3-2.5 15 0 18M12 3c2.5 3 2.5 15 0 18',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2',
  wifiOff:
    'M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.6M19 13a10 10 0 0 0-2.3-1.7M2 9.5a15 15 0 0 1 4.5-3M22 9.5A15 15 0 0 0 10.5 5.1M12 20h.01',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4',
  share: 'M12 15V4M7.5 8.5 12 4l4.5 4.5M5 12v8h14v-8',
  install: 'M12 3v11M7.5 9.5 12 14l4.5-4.5M4 17v3h16v-3',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5',
  alert: 'M12 3 2 20h20zM12 9.5v5M12 17v.5',
  text: 'M4 6h16M4 10h16M4 14h11M4 18h8',
  bolt: 'M13 3 5 13h6l-1 8 8-10h-6z',
  video: 'M3 6h13v12H3zM16 10l5-3v10l-5-3',
  question: 'M9.2 9a2.9 2.9 0 1 1 4.3 2.5c-1 .6-1.5 1.2-1.5 2.3v.4M12 17.5v.5',
  sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  eyeOff:
    'M3 3l18 18M10.6 5.6A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.8 3.6M6.4 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1.1M9.9 10a2.5 2.5 0 0 0 3.6 3.5',
  bookmark: 'M6 3h12v18l-6-4.5L6 21z',
  plus: 'M12 5v14M5 12h14',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  strokeWidth = 2.25,
  ...rest
}: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  const filled = name === 'play' || name === 'stop';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
