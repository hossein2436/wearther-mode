import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import type { Item, Outfit } from '../types';
import { ItemVisual } from './Garment';
import { Icon } from './Icon';
import { SLOT_LABEL } from '../data/catalog';
import { signature } from '../engine';
import { WeatherGlyph } from './WeatherGlyph';

interface Box { l: number; t: number; w: number; h: number; rot: number; z: number }

/**
 * A styled flat-lay, head to toe: layers fanned across the top, legs below, shoes tucked in the corner.
 * Positions are percentages of the card, chosen per combination of slots so every look reads as composed.
 */
export function composeLayout(items: Item[]): Map<string, Box> {
  const by = (s: Item['slot']) => items.find((i) => i.slot === s);
  const out = new Map<string, Box>();
  const one = by('onepiece'), outer = by('outer'), shoes = by('shoes'), bottom = by('bottom');
  if (one) {
    out.set(one.id, { l: 6, t: 0, w: 52, h: 96, rot: -2, z: 2 });
    if (outer) out.set(outer.id, { l: 44, t: 0, w: 54, h: 58, rot: 6, z: 1 });
    const mid = by('mid');
    if (mid && !outer) out.set(mid.id, { l: 46, t: 2, w: 50, h: 52, rot: 5, z: 1 });
  } else {
    const upper = [outer, by('mid'), by('top')].filter(Boolean) as Item[];
    const rows: Box[][] = [
      [],
      [{ l: 18, t: 0, w: 62, h: 52, rot: -3, z: 3 }],
      [{ l: 0, t: 0, w: 58, h: 54, rot: -6, z: 2 }, { l: 42, t: 4, w: 54, h: 48, rot: 4, z: 3 }],
      [{ l: -2, t: 0, w: 52, h: 54, rot: -7, z: 1 }, { l: 26, t: -2, w: 48, h: 46, rot: -1, z: 2 }, { l: 52, t: 8, w: 48, h: 44, rot: 6, z: 3 }],
    ];
    upper.forEach((it, i) => out.set(it.id, rows[upper.length][i]));
    if (bottom) out.set(bottom.id, { l: 12, t: 42, w: 48, h: 58, rot: -2, z: 0 });
  }
  if (shoes) out.set(shoes.id, { l: 58, t: 70, w: 38, h: 30, rot: 8, z: 5 });
  return out;
}

function Composition({ items, kept, onToggle }: { items: Item[]; kept?: string[]; onToggle?: (id: string) => void }) {
  const layout = composeLayout(items);
  return (
    <div className="compose">
      {items.map((it, i) => {
        const b = layout.get(it.id);
        if (!b) return null;
        const style = {
          left: `${b.l}%`, top: `${b.t}%`, width: `${b.w}%`, height: `${b.h}%`, zIndex: b.z,
          ['--rot' as string]: `${b.rot}deg`, ['--i' as string]: i,
        } as CSSProperties;
        const isKept = !!kept?.includes(it.id);
        const body = (
          <>
            <ItemVisual item={it} />
            {isKept && <span className="piece-pin" aria-hidden="true"><Icon name="lock" size={14} /></span>}
          </>
        );
        return onToggle ? (
          <button
            key={it.id}
            type="button"
            className={`piece${isKept ? ' is-kept' : ''}`}
            style={style}
            aria-pressed={isKept}
            aria-label={`${it.name}, ${SLOT_LABEL[it.slot].toLowerCase()}. ${isKept ? 'Kept for the next looks' : 'Tap to keep it in the next looks'}`}
            onClick={() => onToggle(it.id)}
          >
            {body}
          </button>
        ) : (
          <div key={it.id} className="piece" style={style}>{body}</div>
        );
      })}
    </div>
  );
}

export function LookDeck({
  looks, index, kept, onToggle, onSkip, onLove, onRestart, wornSig, justWorn, lovedSigs,
}: {
  looks: Outfit[];
  index: number;
  kept: string[];
  onToggle: (id: string) => void;
  onSkip: () => void;
  onLove: () => void;
  onRestart: () => void;
  wornSig?: string;
  justWorn: boolean;
  lovedSigs: string[];
}) {
  const [dx, setDx] = useState(0);
  const [fly, setFly] = useState<'left' | null>(null);
  const [burst, setBurst] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; active: boolean } | null>(null);
  const swallowClick = useRef(false);
  const card = useRef<HTMLDivElement>(null);

  const top = looks[index];
  const next = looks[index + 1];
  const third = looks[index + 2];

  const skip = () => {
    setFly('left');
    window.setTimeout(() => { setFly(null); setDx(0); onSkip(); }, 240);
  };
  const love = () => { setDx(0); setBurst((b) => b + 1); onLove(); };

  const down = (e: PointerEvent<HTMLDivElement>) => { drag.current = { x: e.clientX, active: false }; };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) {
      // Not dragging: tilt the card toward the pointer, and move the glare with it.
      if (e.pointerType !== 'mouse') return;
      const el = e.currentTarget, r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--rx', `${(0.5 - py) * 10}deg`);
      el.style.setProperty('--ry', `${(px - 0.5) * 12}deg`);
      el.style.setProperty('--gx', `${px * 100}%`);
      el.style.setProperty('--gy', `${py * 100}%`);
      el.style.setProperty('--go', '0.9');
      return;
    }
    const d = e.clientX - drag.current.x;
    if (!drag.current.active && Math.abs(d) > 10) {
      for (const k of ['--rx', '--ry']) e.currentTarget.style.removeProperty(k);
      drag.current.active = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (drag.current.active) setDx(d);
  };
  const up = () => {
    if (drag.current?.active) {
      swallowClick.current = true;
      const w = card.current?.offsetWidth ?? 300;
      if (dx < -w * 0.28) skip();
      else if (dx > w * 0.28) love();
      else setDx(0);
    }
    drag.current = null;
    setDragging(false);
  };
  const keys = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); skip(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); love(); }
  };

  if (!top) {
    return (
      <div className="deck">
        <div className="look-end">
          <WeatherGlyph kind="partly" still />
          <p className="t-title">That’s every look for this weather.</p>
          <p className="t-small muted">Unkeep a piece to see more, or start again.</p>
          <button className="btn secondary" onClick={onRestart}>Start again</button>
        </div>
      </div>
    );
  }

  const sig = signature(top.items);
  const worn = wornSig === sig;
  const loved = lovedSigs.includes(sig);
  return (
    <div
      className="deck"
      tabIndex={0}
      onKeyDown={keys}
      role="group"
      aria-roledescription="look deck"
      aria-label={`Look ${index + 1} of ${looks.length}. Left arrow for another look, right arrow to love this one.`}
    >
      {third && <div className="look is-third" aria-hidden="true"><Composition items={third.items} /></div>}
      {next && <div className="look is-next" aria-hidden="true"><Composition items={next.items} /></div>}
      <div
        ref={card}
        key={sig}
        className={`look is-top${dragging ? ' is-dragging' : ''}${fly ? ` fly-${fly}` : ''}`}
        style={dx ? { transform: `translateX(${dx}px) rotate(${dx / 16}deg)` } : undefined}
        onPointerLeave={(e) => { for (const k of ['--rx', '--ry', '--gx', '--gy', '--go']) e.currentTarget.style.removeProperty(k); }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onClickCapture={(e) => { if (swallowClick.current) { e.stopPropagation(); e.preventDefault(); swallowClick.current = false; } }}
      >
        <span className="look-count" aria-hidden="true">{looks.map((_, i) => <i key={i} className={i === index ? 'on' : ''} />)}</span>
        <span className="visually-hidden">Look {index + 1} of {looks.length}{loved ? ', loved' : ''}</span>
        {kept.length > 0 && !worn && <span className="look-kept">{kept.length} kept</span>}
        <Composition items={top.items} kept={kept} onToggle={worn ? undefined : onToggle} />
        {top.style.length > 0 && (
          <div className="look-why" aria-label="Why it works">
            <span className="why-pill"><Icon name="sparkle" size={14} fill />{top.style[0]}</span>
          </div>
        )}
        {worn && (
          <div className={`stamp${justWorn ? '' : ' is-settled'}`} role="status">
            Worn today
            <small>Have a good one</small>
          </div>
        )}
        <span className="glare" aria-hidden="true" />
        {burst > 0 && <div key={burst} className="heart-burst" aria-hidden="true"><Icon name="heart" size={120} fill /></div>}
      </div>
    </div>
  );
}
