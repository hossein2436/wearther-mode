import type { GarmentKind, Item } from '../types';
import { KINDS } from '../data/catalog';
import { nameColor } from '../engine/color';
import { useState } from 'react';
import { Chip } from '../components/ui';

const GROUPS: { label: string; kinds: GarmentKind[] }[] = [
  { label: 'Top', kinds: ['tshirt', 'longsleeve', 'shirt'] },
  { label: 'Warm layer', kinds: ['knit', 'hoodie', 'cardigan'] },
  { label: 'Jacket or coat', kinds: ['raincoat', 'blazer', 'trench', 'puffer'] },
  { label: 'Bottom', kinds: ['jeans', 'chinos', 'shorts', 'skirt'] },
  { label: 'Dress', kinds: ['dress'] },
  { label: 'Shoes', kinds: ['sneakers', 'boots', 'loafers', 'sandals'] },
];

const WARMTH = [
  { v: 1, t: 'Light' },
  { v: 2.5, t: 'Medium' },
  { v: 4, t: 'Warm' },
];
const DRESS = [
  { v: 1, t: 'Casual' },
  { v: 3, t: 'Smart' },
  { v: 4.5, t: 'Formal' },
];
const nearest = (opts: { v: number }[], x: number) =>
  opts.reduce((a, b) => (Math.abs(b.v - x) < Math.abs(a.v - x) ? b : a)).v;

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
  // Two small choices instead of 19 chips at once: first the family, then the exact kind.
  const [group, setGroup] = useState<string | null>(
    kindChosen ? GROUPS.find((g) => g.kinds.includes(item.kind))?.label ?? null : null,
  );
  const active = GROUPS.find((g) => g.label === group);
  const warmthLabel = WARMTH.find((w) => w.v === nearest(WARMTH, item.warmth))?.t;
  const dressLabel = DRESS.find((w) => w.v === nearest(DRESS, item.formality))?.t;
  const rainLabel = item.waterproof ? 'Waterproof' : item.keepOutOfRain ? 'Keep out of rain' : null;

  const chooseKind = (k: GarmentKind) => {
    set({
      kind: k, slot: KINDS[k].slot, warmth: KINDS[k].warmth, formality: KINDS[k].formality,
      ...(isAuto ? { name: autoName(item.colorName, k) } : {}),
    });
    onKindChosen?.();
  };

  return (
    <div className="tags">
      <fieldset className="tag-group">
        <legend>What is it?{suggested && kindChosen && <span className="suggested"> suggested</span>}</legend>
        <div className="chip-row" role="group" aria-label="Kind of clothing">
          {GROUPS.map((g) => (
            <Chip
              key={g.label}
              on={group === g.label}
              onClick={() => {
                setGroup(g.label);
                if (g.kinds.length === 1) chooseKind(g.kinds[0]);
              }}
            >
              {g.label}
            </Chip>
          ))}
        </div>
        {active && active.kinds.length > 1 && (
          <div className="kind-row" role="group" aria-label={active.label}>
            {active.kinds.map((k) => (
              <Chip key={k} on={kindChosen && item.kind === k} onClick={() => chooseKind(k)}>
                {KINDS[k].label}
              </Chip>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className="tag-group">
        <legend>Main colour</legend>
        <label className="color-field">
          <input
            type="color"
            value={item.color}
            onChange={(e) => {
              const colorName = nameColor(e.target.value);
              set({ color: e.target.value, colorName, ...(isAuto ? { name: autoName(colorName, kindChosen ? item.kind : null) } : {}) });
            }}
            aria-label="Main colour"
          />
          <span>{item.colorName}</span>
        </label>
      </fieldset>

      <details className="more">
        <summary>
          <span className="more-title">Name, warmth and more</span>
          <span className="more-sub">
            {[item.name, warmthLabel, dressLabel, rainLabel].filter(Boolean).join(' · ')}
          </span>
        </summary>
        <div className="more-body">
          <label className="field">
            <span>Name</span>
            <input value={item.name} onChange={(e) => set({ name: e.target.value })} />
          </label>

          <fieldset className="tag-group">
            <legend>How warm is it?</legend>
            <div className="chip-row">
              {WARMTH.map((w) => (
                <Chip key={w.t} on={nearest(WARMTH, item.warmth) === w.v} onClick={() => set({ warmth: w.v })}>{w.t}</Chip>
              ))}
            </div>
          </fieldset>

          <fieldset className="tag-group">
            <legend>How dressy?</legend>
            <div className="chip-row">
              {DRESS.map((w) => (
                <Chip key={w.t} on={nearest(DRESS, item.formality) === w.v} onClick={() => set({ formality: w.v })}>{w.t}</Chip>
              ))}
            </div>
          </fieldset>

          <fieldset className="tag-group">
            <legend>In the rain</legend>
            <div className="chip-row">
              <Chip on={!!item.waterproof} onClick={() => set({ waterproof: !item.waterproof, keepOutOfRain: false })}>Waterproof</Chip>
              <Chip on={!!item.keepOutOfRain} onClick={() => set({ keepOutOfRain: !item.keepOutOfRain, waterproof: false })}>Keep out of rain</Chip>
            </div>
          </fieldset>
        </div>
      </details>
    </div>
  );
}
