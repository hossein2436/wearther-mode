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
  wifi: 'M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 12.6a10 10 0 0 1 4-2.3M12 10a10 10 0 0 1 7 2.6M12 20h.01',
};

export function Icon({ name, size = 22, label }: { name: keyof typeof P | string; size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={P[name] ?? ''} />
    </svg>
  );
}
