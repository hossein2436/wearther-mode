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

/**
 * The outfit as a flat-lay. Each piece is itself the "keep" control: tapping it pins it
 * for the next reshuffle. A lock badge appears only on kept pieces, so an untouched outfit
 * shows clothes, not four identical icons.
 */
export function FlatLay({
  items, locked, onToggleLock, revealKey, worn,
}: {
  items: Item[];
  locked: string[];
  onToggleLock?: (id: string) => void;
  revealKey: string;
  worn?: boolean;
}) {
  const { cols, areas, map } = layoutFor(items);
  return (
    <div
      className={`flatlay${worn ? ' is-worn' : ''}`}
      style={{ gridTemplateColumns: cols, gridTemplateAreas: areas }}
      key={revealKey}
    >
      {items.map((it, i) => {
        const isLocked = locked.includes(it.id);
        const body = (
          <>
            <span className="piece-art"><ItemVisual item={it} /></span>
            <span className="piece-name">{it.name}</span>
            {isLocked && <span className="piece-badge" aria-hidden="true"><Icon name="lock" size={14} /></span>}
          </>
        );
        const style = { gridArea: map[it.slot], ['--i' as string]: i };
        return onToggleLock ? (
          <button
            key={it.id}
            type="button"
            className={`piece${isLocked ? ' is-locked' : ''}`}
            style={style}
            aria-pressed={isLocked}
            aria-label={`${it.name}, ${SLOT_LABEL[it.slot].toLowerCase()}. ${isLocked ? 'Kept when you reshuffle' : 'Tap to keep when you reshuffle'}`}
            onClick={() => onToggleLock(it.id)}
          >
            {body}
          </button>
        ) : (
          <div key={it.id} className={`piece${isLocked ? ' is-locked' : ''}`} style={style}>{body}</div>
        );
      })}
    </div>
  );
}
