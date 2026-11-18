const P: Record<string, string> = {
  today: 'M4 7h16M4 7v12h16V7M8 3v4M16 3v4M8 12h3v3H8z',
  closet: 'M12 6a2 2 0 1 1 2 2c-1 .4-2 1-2 2v1M12 11l-9 6h18z',
  add: 'M12 5v14M5 12h14',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
  unlock: 'M7 11V8a5 5 0 0 1 9.6-2M6 11h12v9H6z',
  shuffle: 'M4 7h3c5 0 5 10 10 10h3M17 14l3 3-3 3M4 17h3c1.6 0 2.6-1 3.5-2.3M14 9.3C15 8 16 7 17.6 7H20M17 4l3 3-3 3',
  drop: 'M12 4c3 4 5 7 5 9.5a5 5 0 0 1-10 0C7 11 9 8 12 4z',
  up: 'M7 11v8M7 11l3-7c1.5 0 2.5 1 2.2 2.6L11.8 10H17a2 2 0 0 1 2 2.4l-1.2 5A2 2 0 0 1 15.8 19H7M3 11h4v8H3z',
  down: 'M17 13V5M17 13l-3 7c-1.5 0-2.5-1-2.2-2.6l.4-3.4H7a2 2 0 0 1-2-2.4l1.2-5A2 2 0 0 1 8.2 5H17M21 13h-4V5h4z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  photos: 'M4 5h16v14H4zM4 15l4.5-4.5L13 15l3-3 4 4M15.5 8.5h.01',
  back: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6L6 18',
  share: 'M12 4v11M8 8l4-4 4 4M6 12v8h12v-8',
  plusbox: 'M5 5h14v14H5zM12 9v6M9 12h6',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  cloud: 'M7.5 18.5h9.5a4 4 0 0 0 .4-8A5.5 5.5 0 0 0 6.8 9.6 4.5 4.5 0 0 0 7.5 18.5z',
  sunny: 'M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4',
  plusbox2: 'M7 3.5h10A3.5 3.5 0 0 1 20.5 7v10a3.5 3.5 0 0 1-3.5 3.5H7A3.5 3.5 0 0 1 3.5 17V7A3.5 3.5 0 0 1 7 3.5zM12 8v8M8 12h8',
  sliders: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 4.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM9 14.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
  user: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4.5 20a7.5 7.5 0 0 1 15 0',
  crown: 'M4 18h16M4.5 8l4 4 3.5-6 3.5 6 4-4-1.5 10h-12z',
  trash: 'M5 7h14M9 7V4.5h6V7M7 7l1 13h8l1-13',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  x: 'M7 7l10 10M17 7L7 17',
  pin: 'M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11zM12 8.5a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z',
  coat: 'M9 3l3 3 3-3 5 3-2 6-2-1v10H8V11l-2 1-2-6zM12 6v15',
  hanger: 'M12 7a2 2 0 1 1 2-2M12 7v1L3 15h18l-9-7',
  flat: 'M4 7h16v12H4zM9 11h6',
  light: 'M12 3v2M5.6 5.6 7 7M3 12h2M18.4 5.6 17 7M21 12h-2M8 15a4 4 0 1 1 8 0v2H8zM10 20h4',
  chevron: 'M9 6l6 6-6 6',
  wifi: 'M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 12.6a10 10 0 0 1 4-2.3M12 10a10 10 0 0 1 7 2.6M12 20h.01',
};

export function Icon({ name, size = 22, label, fill, duo }: { name: keyof typeof P | string; size?: number; label?: string; fill?: boolean; duo?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {duo && <path d={P[name] ?? ''} fill="currentColor" fillOpacity={0.28} stroke="none" />}
      <path d={P[name] ?? ''} />
    </svg>
  );
}
