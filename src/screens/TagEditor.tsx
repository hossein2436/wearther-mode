import { useState } from 'react';
import type { GarmentKind, Item, Pattern } from '../types';
import { KINDS } from '../data/catalog';
import { nameColor } from '../engine/color';
import { Chip } from '../components/ui';
import { Garment } from '../components/Garment';

/** Families first (six pictures), then the exact kind (at most four words). */
const GROUPS: { label: string; icon: GarmentKind; kinds: GarmentKind[] }[] = [
  { label: 'Top', icon: 'tshirt', kinds: ['tshirt', 'longsleeve', 'shirt'] },
  { label: 'Warm layer', icon: 'knit', kinds: ['knit', 'hoodie', 'cardigan'] },
  { label: 'Coat', icon: 'trench', kinds: ['raincoat', 'blazer', 'trench', 'puffer'] },
  { label: 'Bottom', icon: 'jeans', kinds: ['jeans', 'chinos', 'shorts', 'skirt'] },
  { label: 'Dress', icon: 'dress', kinds: ['dress'] },
  { label: 'Shoes', icon: 'sneakers', kinds: ['sneakers', 'boots', 'loafers', 'sandals'] },
];

const WARMTH = [{ v: 1, t: 'Light' }, { v: 2.5, t: 'Medium' }, { v: 4, t: 'Warm' }];
const DRESS = [{ v: 1, t: 'Casual' }, { v: 3, t: 'Smart' }, { v: 4.5, t: 'Formal' }];
const PATTERNS: { v: Pattern; t: string }[] = [{ v: 'solid', t: 'Plain' }, { v: 'stripes', t: 'Stripes' }, { v: 'check', t: 'Check' }, { v: 'print', t: 'Print' }];
const nearest = (opts: { v: number }[], x: number) => opts.reduce((a, b) => (Math.abs(b.v - x) < Math.abs(a.v - x) ? b : a)).v;

/** Default name from colour and kind, e.g. "Navy t-shirt". Kept in sync until the user types their own. */
export const autoName = (colorName: string, kind: GarmentKind | null) =>
  kind ? `${colorName} ${KINDS[kind].label.toLowerCase()}` : `${colorName} piece`;

export function TagEditor({
  item, onChange, suggested, kindChosen = true, onKindChosen,
}: {
  item: Item;
  onChange: (i: Item) => void;
  suggested?: boolean;
  kindChosen?: boolean;
  onKindChosen?: () => void;
}) {
  const set = (p: Partial<Item>) => onChange({ ...item, ...p });
  const isAuto = item.name === autoName(item.colorName, kindChosen ? item.kind : null);
  const [group, setGroup] = useState<string | null>(kindChosen ? GROUPS.find((g) => g.kinds.includes(item.kind))?.label ?? null : null);
  const active = GROUPS.find((g) => g.label === group);
  const label = (opts: { v: number; t: string }[], x: number) => opts.find((o) => o.v === nearest(opts, x))?.t;
  const summary = [
    item.name, label(WARMTH, item.warmth), label(DRESS, item.formality),
    item.pattern && item.pattern !== 'solid' ? PATTERNS.find((p) => p.v === item.pattern)?.t : null,
    item.waterproof ? 'Waterproof' : item.keepOutOfRain ? 'Keep out of rain' : null,
  ].filter(Boolean).join(', ');

  const chooseKind = (k: GarmentKind) => {
    set({
      kind: k, slot: KINDS[k].slot, warmth: KINDS[k].warmth, formality: KINDS[k].formality,
      ...(isAuto ? { name: autoName(item.colorName, k) } : {}),
    });
    onKindChosen?.();
  };

  return (
    <>
      <fieldset className="group">
        <legend>What is it?{suggested && kindChosen && <span className="faint"> (suggested)</span>}</legend>
        <div className="families" role="group" aria-label="Kind of clothing">
          {GROUPS.map((g) => (
            <button
              key={g.label}
              type="button"
              className="family"
              aria-pressed={group === g.label}
              onClick={() => { setGroup(g.label); if (g.kinds.length === 1) chooseKind(g.kinds[0]); }}
            >
              <Garment kind={g.icon} color={group === g.label ? item.color : '#C9CDD2'} />
              {g.label}
            </button>
          ))}
        </div>
        {active && active.kinds.length > 1 && (
          <div className="kinds" role="group" aria-label={active.label}>
            {active.kinds.map((k) => (
              <Chip key={k} on={kindChosen && item.kind === k} onClick={() => chooseKind(k)}>{KINDS[k].label}</Chip>
            ))}
          </div>
        )}
      </fieldset>

      <div className="swatch-row">
        <label className="swatch" style={{ background: item.color }}>
          <input
            type="color"
            value={item.color}
            aria-label="Main colour"
            onChange={(e) => {
              const colorName = nameColor(e.target.value);
              set({ color: e.target.value, colorName, ...(isAuto ? { name: autoName(colorName, kindChosen ? item.kind : null) } : {}) });
            }}
          />
        </label>
        <div>
          <strong>{item.colorName}</strong>
          <p className="t-micro muted">Main colour. Tap the circle to change it.</p>
        </div>
      </div>

      <details className="more">
        <summary>
          <span className="more-title">Name, warmth and more</span>
          <span className="more-sub">{summary}</span>
        </summary>
        <div className="more-body">
          <label className="field">
            <span>Name</span>
            <input value={item.name} onChange={(e) => set({ name: e.target.value })} />
          </label>
          <fieldset className="group">
            <legend>How warm is it?</legend>
            <div className="seg" role="radiogroup" aria-label="How warm is it?">
              {WARMTH.map((w) => <button key={w.t} type="button" role="radio" aria-checked={nearest(WARMTH, item.warmth) === w.v} onClick={() => set({ warmth: w.v })}>{w.t}</button>)}
            </div>
          </fieldset>
          <fieldset className="group">
            <legend>How dressy?</legend>
            <div className="seg" role="radiogroup" aria-label="How dressy?">
              {DRESS.map((w) => <button key={w.t} type="button" role="radio" aria-checked={nearest(DRESS, item.formality) === w.v} onClick={() => set({ formality: w.v })}>{w.t}</button>)}
            </div>
          </fieldset>
          <fieldset className="group">
            <legend>Pattern</legend>
            <div className="chips">
              {PATTERNS.map((p) => <Chip key={p.v} on={(item.pattern ?? 'solid') === p.v} onClick={() => set({ pattern: p.v })}>{p.t}</Chip>)}
            </div>
          </fieldset>
          <fieldset className="group">
            <legend>In the rain</legend>
            <div className="chips">
              <Chip on={!!item.waterproof} onClick={() => set({ waterproof: !item.waterproof, keepOutOfRain: false })}>Waterproof</Chip>
              <Chip on={!!item.keepOutOfRain} onClick={() => set({ keepOutOfRain: !item.keepOutOfRain, waterproof: false })}>Keep out of rain</Chip>
            </div>
          </fieldset>
        </div>
      </details>
    </>
  );
}
