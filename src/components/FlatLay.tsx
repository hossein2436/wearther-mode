import type { Item, Slot } from '../types';
import { ItemVisual } from './Garment';
import { Icon } from './Icon';
import { SLOT_LABEL } from '../data/catalog';

type Area = Partial<Record<Slot, string>>;

/** Picks a grid composition for whichever slots this outfit has. */
function layoutFor(items: Item[]): { cols: string; areas: string; map: Area } {
  const has = (s: Slot) => items.some((i) => i.slot === s);
  const o = has('outer'), m = has('mid'), d = has('onepiece');
  const map: Area = { outer: 'o', mid: 'm', top: 't', bottom: 'b', onepiece: 'b', shoes: 's' };
  if (d && o) return { cols: '1.15fr 1fr', areas: '"o b" "s b"', map };
  if (d) return { cols: '1.2fr 1fr', areas: '"b s" "b s"', map };
  if (o && m) return { cols: '1.2fr 1fr 1fr', areas: '"o m t" "o b s"', map };
  if (o) return { cols: '1.2fr 1fr 1fr', areas: '"o t b" "o s b"', map };
  if (m) return { cols: '1fr 1fr 1fr', areas: '"m t b" "m s b"', map };
  return { cols: '1fr 1fr', areas: '"t b" "s b"', map };
}

export function FlatLay({
  items, locked, onToggleLock, revealKey,
}: {
  items: Item[];
  locked: string[];
  onToggleLock?: (id: string) => void;
  revealKey: string;
}) {
  const { cols, areas, map } = layoutFor(items);
  return (
    <div className="flatlay" style={{ gridTemplateColumns: cols, gridTemplateAreas: areas }} key={revealKey}>
      {items.map((it, i) => {
        const isLocked = locked.includes(it.id);
        return (
          <div
            key={it.id}
            className={`piece${isLocked ? ' is-locked' : ''}`}
            style={{ gridArea: map[it.slot], ['--i' as string]: i }}
          >
            <div className="piece-art"><ItemVisual item={it} /></div>
            <span className="piece-name">{it.name}</span>
            {onToggleLock && (
              <button
                className="piece-lock"
                aria-pressed={isLocked}
                aria-label={`${isLocked ? 'Unlock' : 'Keep'} ${it.name}, ${SLOT_LABEL[it.slot].toLowerCase()}`}
                onClick={() => onToggleLock(it.id)}
              >
                <Icon name={isLocked ? 'lock' : 'unlock'} size={16} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
