import type { GarmentKind, Item } from '../types';

/** Flat-lay illustrations used for sample items. Real items show the user's own cutout photo. */
const SHAPE: Record<GarmentKind, { body: string; detail?: string }> = {
  tshirt: { body: 'M30 16 42 12q8 7 16 0l12 4 16 13-8 12-8-5v50H30V36l-8 5-8-12z', detail: 'M42 12q8 9 16 0' },
  longsleeve: { body: 'M32 14 43 11q7 6 14 0l11 3 12 11 9 52-10 2-9-40v48H30V39l-9 40-10-2 9-52z', detail: 'M43 11q7 8 14 0M21 74l10 2M69 76l10-2' },
  shirt: { body: 'M32 14 43 10l7 9 7-9 11 4 12 11 9 52-10 2-9-40v48H30V39l-9 40-10-2 9-52z', detail: 'M43 10l7 9 7-9M50 19v68M50 30h.1M50 44h.1M50 58h.1M50 72h.1' },
  knit: { body: 'M32 14 43 11q7 7 14 0l11 3 12 11 9 52-10 2-9-40v48H30V39l-9 40-10-2 9-52z', detail: 'M43 11q7 9 14 0M30 80h40M30 83h40M11 73l10 2M79 75l10-2' },
  hoodie: { body: 'M32 16q4-14 18-14t18 14l12 9 9 52-10 2-9-40v48H30V39l-9 40-10-2 9-52z', detail: 'M38 17q12 10 24 0M46 22v10M54 22v10M36 62h28v14H36z' },
  cardigan: { body: 'M32 14 43 11l7 26 7-26 11 3 12 11 9 52-10 2-9-40v48H30V39l-9 40-10-2 9-52z', detail: 'M50 37v50M53 46h.1M53 60h.1M53 74h.1' },
  blazer: { body: 'M32 13 44 10l6 34 6-34 12 3 12 12 8 52-10 2-8-40v47H30V39l-8 40-10-2 8-52z', detail: 'M44 10l-4 16 6 4M56 10l4 16-6 4M50 44v43M54 56h.1M54 68h.1M36 66h8' },
  trench: { body: 'M32 10 44 8l6 12 6-12 12 2 12 12 9 56-10 2-8-38 2 54H26l2-54-8 38-10-2 9-56z', detail: 'M44 8l-4 14 8 6M56 8l4 14-8 6M28 56h44M46 30h.1M54 30h.1M46 42h.1M54 42h.1M50 56v40' },
  puffer: { body: 'M30 14q20-10 40 0l12 10 8 50-12 3-8-34v45H30V43l-8 34-12-3 8-50z', detail: 'M30 32h40M30 46h40M30 60h40M30 74h40M50 8v80' },
  raincoat: { body: 'M32 14q4-12 18-12t18 12l12 10 9 52-10 2-8-38v50H30V40l-8 38-10-2 9-52z', detail: 'M38 15q12 10 24 0M50 20v68M36 64h10M54 64h10' },
  jeans: { body: 'M30 8h40l5 86H56L50 36l-6 58H25z', detail: 'M30 16h40M50 16v20M34 16q2 10 10 10M66 16q-2 10-10 10' },
  chinos: { body: 'M31 8h38l4 86H56L50 34l-6 60H27z', detail: 'M31 15h38M40 34v58M60 34v58' },
  shorts: { body: 'M28 22h44l5 46-23 3-4-24-4 24-23-3z', detail: 'M28 29h44M50 29v18' },
  skirt: { body: 'M35 16h30l16 66H19z', detail: 'M35 23h30M42 23l-8 59M58 23l8 59M50 23v59' },
  dress: { body: 'M38 6h6q6 7 12 0h6v24l-2 10 18 54H22l18-54-2-10z', detail: 'M40 40h20' },
  sneakers: { body: 'M10 62q2-16 16-16h14q6-8 16-6l14 10q16 2 20 12v10H10z', detail: 'M10 66h80M36 48l4 6M44 45l4 6M52 43l4 6' },
  boots: { body: 'M26 12h26l2 44q22 2 32 10v12H22l2-22z', detail: 'M24 70h62M40 12v44M30 34h4' },
  loafers: { body: 'M8 64q2-12 18-14h34q24 2 32 14v8H8z', detail: 'M8 68h84M48 54q10 2 18 0' },
  sandals: { body: 'M10 68q4-6 14-6h52q14 0 16 6v4H10z', detail: 'M30 62q10-18 24 0M48 62q8-14 20 0' },
};

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 - amt))));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

export function Garment({ kind, color }: { kind: GarmentKind; color: string }) {
  const s = SHAPE[kind];
  const line = shade(color, color.toUpperCase() > '#E0' ? 0.3 : 0.38);
  return (
    <svg viewBox="0 0 100 100" className="garment" aria-hidden="true">
      <path d={s.body} fill={color} stroke={line} strokeWidth={1.4} strokeLinejoin="round" />
      <path d={s.body} fill="url(#clay-shade)" />
      <path d={s.body} fill="none" stroke="url(#clay-rim)" strokeWidth={2.2} strokeLinejoin="round" />
      {s.detail && <path d={s.detail} fill="none" stroke={line} strokeWidth={1.2} strokeLinecap="round" opacity={0.75} />}
    </svg>
  );
}

export function ItemVisual({ item }: { item: Item }) {
  return item.photo ? (
    <img src={item.photo} alt="" className="garment" draggable={false} />
  ) : (
    <Garment kind={item.kind} color={item.color} />
  );
}

/** Shared gradients that give every illustrated garment a soft, lit-from-the-top-left 3D feel. */
export function ClayDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id="clay-shade" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.42" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id="clay-rim" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
