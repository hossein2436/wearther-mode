import type { GarmentKind, Item } from '../types';
import { KINDS } from '../data/catalog';
import { nameColor } from '../engine/color';
import { Chip } from '../components/ui';

const GROUPS: { label: string; kinds: GarmentKind[] }[] = [
  { label: 'Tops', kinds: ['tshirt', 'longsleeve', 'shirt'] },
  { label: 'Warm layers', kinds: ['knit', 'hoodie', 'cardigan'] },
  { label: 'Jackets and coats', kinds: ['raincoat', 'blazer', 'trench', 'puffer'] },
  { label: 'Bottoms', kinds: ['jeans', 'chinos', 'shorts', 'skirt'] },
  { label: 'Dresses', kinds: ['dress'] },
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
  return (
    <div className="tags">
      <label className="field">
        <span>Name</span>
        <input value={item.name} onChange={(e) => set({ name: e.target.value })} />
      </label>

      <fieldset className="tag-group">
        <legend>What is it?{suggested && kindChosen && <span className="suggested"> suggested</span>}</legend>
        {GROUPS.map((g) => (
          <div key={g.label} className="chip-row" role="group" aria-label={g.label}>
            {g.kinds.map((k) => (
              <Chip
                key={k}
                on={kindChosen && item.kind === k}
                onClick={() => {
                  set({
                    kind: k, slot: KINDS[k].slot, warmth: KINDS[k].warmth, formality: KINDS[k].formality,
                    ...(isAuto ? { name: autoName(item.colorName, k) } : {}),
                  });
                  onKindChosen?.();
                }}
              >
                {KINDS[k].label}
              </Chip>
            ))}
          </div>
        ))}
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
  );
}
