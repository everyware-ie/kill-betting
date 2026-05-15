'use client';

const ICON_PATHS = {
  search:  'M11 4a7 7 0 1 0 4.95 11.95L20 20 M15.5 8.5a4.95 4.95 0 1 0 -7 7 4.95 4.95 0 0 0 7 -7Z',
  plus:    'M12 5v14 M5 12h14',
  close:   'M6 6l12 12 M6 18L18 6',
  check:   'M5 12l5 5L20 7',
  arrow:   'M5 12h14 M13 6l6 6 -6 6',
  chevron: 'M9 6l6 6 -6 6',
  back:    'M19 12H5 M11 18l-6 -6 6 -6',
  more:    'M5 12h.01 M12 12h.01 M19 12h.01',
  target:  'M12 3v2 M12 19v2 M3 12h2 M19 12h2 M5.6 5.6l1.4 1.4 M17 17l1.4 1.4 M5.6 18.4 7 17 M17 7l1.4 -1.4 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0 -8Z M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0 -2Z',
  trophy:  'M8 4h8v3a4 4 0 0 1 -8 0Z M4 5h4v2a3 3 0 0 1 -3 -3Z M16 5h4a3 3 0 0 1 -3 3 V5z M9 11h6v4l-1 4h-4l-1 -4Z M8 19h8',
  clock:   'M12 7v5l3 2 M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0 -18Z',
  hash:    'M5 9h14 M5 15h14 M10 3l-2 18 M16 3l-2 18',
  key:     'M14 10a4 4 0 1 0 -4 4l-1 1v2h-2v2H4v-3l5 -5z M16 8h.01',
  user:    'M12 12a4 4 0 1 0 0 -8 4 4 0 0 0 0 8Z M4 20a8 8 0 0 1 16 0',
  users:   'M9 11a4 4 0 1 0 0 -8 4 4 0 0 0 0 8Z M3 19a6 6 0 0 1 12 0 M17 11a3 3 0 1 0 0 -6 M22 19a6 6 0 0 0 -5 -5.9',
  mail:    'M3 7l9 6 9 -6 M3 6h18v12H3z',
  lock:    'M6 10V7a6 6 0 0 1 12 0v3 M5 10h14v10H5z M12 14v2',
  eye:     'M2 12s3 -7 10 -7 10 7 10 7 -3 7 -10 7 -10 -7 -10 -7Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0 -6Z',
  eyeOff:  'M3 3l18 18 M10.6 6.1A7 7 0 0 1 12 6c7 0 10 6 10 6a13 13 0 0 1 -3 4 M6 6a13 13 0 0 0 -4 6s3 6 10 6c1.4 0 2.7 -.3 4 -.7 M9.9 9.9a3 3 0 0 0 4.2 4.2',
  logout:  'M9 5H5v14h4 M12 12h10 M16 7l5 5 -5 5',
  settings:'M19.4 15a1.6 1.6 0 0 0 .3 1.8l.06 .06a2 2 0 1 1 -2.83 2.83l-.06 -.06a1.6 1.6 0 0 0 -1.8 -.3 1.6 1.6 0 0 0 -1 1.5V21a2 2 0 0 1 -4 0v-.1a1.6 1.6 0 0 0 -1 -1.5 1.6 1.6 0 0 0 -1.8 .3l-.06 .06a2 2 0 0 1 -2.83 -2.83l.06 -.06a1.6 1.6 0 0 0 .3 -1.8 1.6 1.6 0 0 0 -1.5 -1H3a2 2 0 0 1 0 -4h.1a1.6 1.6 0 0 0 1.5 -1 1.6 1.6 0 0 0 -.3 -1.8l-.06 -.06a2 2 0 1 1 2.83 -2.83l.06 .06a1.6 1.6 0 0 0 1.8 .3H9a1.6 1.6 0 0 0 1 -1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8 -.3l.06 -.06a2 2 0 1 1 2.83 2.83l-.06 .06a1.6 1.6 0 0 0 -.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0 -1.5 1Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0 -6Z',
  upload:  'M21 15v4H3v-4 M7 9l5 -5 5 5 M12 4v12',
  download:'M21 15v4H3v-4 M7 11l5 5 5 -5 M12 16V4',
  copy:    'M8 8h12v12H8z M16 8V4H4v12h4',
  edit:    'M12 20h9 M16 4l4 4 -10 10H6v-4Z',
  trash:   'M4 7h16 M9 7V5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2 M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1 -1V7 M10 11v6 M14 11v6',
  play:    'M6 4v16l14 -8z',
  flag:    'M5 21V4 M5 4h14l-3 5 3 5H5',
  flame:   'M12 3s4 4 4 8a4 4 0 0 1 -8 0c0 -2 1 -3 1 -3s-1 5 3 5c2 0 3 -2 2 -4 -1 -3 -2 -6 -2 -6Z',
  shield:  'M12 3l8 3v6c0 5 -8 9 -8 9s-8 -4 -8 -9V6Z',
  crown:   'M3 8l4 3 5 -7 5 7 4 -3 -2 11H5Z M5 22h14',
  zap:     'M13 2L4 14h7l-1 8 9 -12h-7Z',
  grid:    'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
  expand:  'M9 3H3v6 M15 21h6v-6 M3 9l7 -7 M21 15l-7 7',
  alert:   'M12 9v4 M12 17h.01 M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71 -3L13.7 3.86a2 2 0 0 0 -3.4 0Z',
  info:    'M12 16v-4 M12 8h.01 M12 21a9 9 0 1 0 0 -18 9 9 0 0 0 0 18Z',
  spinner: 'M12 2v4 M16.2 7.8L19 5 M22 12h-4 M16.2 16.2 19 19 M12 22v-4 M5 19l2.8 -2.8 M2 12h4 M5 5l2.8 2.8',
  image:   'M3 5h18v14H3z M3 16l5 -5 5 5 3 -3 5 5 M9 10a1.5 1.5 0 1 0 0 -3 1.5 1.5 0 0 0 0 3Z',
};

export default function Icon({ name, size = 16, strokeWidth = 1.6, color = 'currentColor', style }) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  const subs = d.split(/(?=M)/g);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      {subs.map((s, i) => <path key={i} d={s} />)}
    </svg>
  );
}