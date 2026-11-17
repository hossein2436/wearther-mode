import { useState, type CSSProperties } from 'react';
import { useStore } from '../state/store';
import type { Item, ItemStatus, Slot } from '../types';
import { Header, Chip, Sheet } from '../components/ui';
import { Garment, ItemVisual } from '../components/Garment';
import { Icon } from '../components/Icon';
import { TagEditor } from './TagEditor';
import { toOklch } from '../engine/style';
import { api } from '../api';

const SECTION_ICON: Record<Slot, Item['kind']> = { outer: 'trench', mid: 'knit', top: 'tshirt', onepiece: 'dress', bottom: 'jeans', shoes: 'sneakers' };

const SECTIONS: { slot: Slot; label: string }[] = [
  { slot: 'outer', label: 'Jackets and coats' },
  { slot: 'mid', label: 'Warm layers' },
  { slot: 'top', label: 'Tops' },
  { slot: 'onepiece', label: 'Dresses' },
  { slot: 'bottom', label: 'Bottoms' },
  { slot: 'shoes', label: 'Shoes' },
];

/** Dark to light within a section, so the wall reads as a gradient, like a well-hung rail. */
const byTone = (a: Item, b: Item) => toOklch(a.color).L - toOklch(b.color).L;

export function Closet() {
  const { s, d } = useStore();
  const [f, setF] = useState<'all' | Slot | 'wash'>('all');
  const inWash = s.closet.filter((i) => i.status === 'wash').length;
  const count = (slot: Slot) => s.closet.filter((i) => i.slot === slot).length;
  const sections = f === 'wash'
    ? [{ slot: null, label: 'In the wash', items: s.closet.filter((i) => i.status === 'wash') }]
    : SECTIONS.filter((x) => f === 'all' || x.slot === f).map((x) => ({ ...x, items: s.closet.filter((i) => i.slot === x.slot).sort(byTone) }));

  return (
    <main className="screen has-tabs">
      <Header title="Closet" />
      <p className="t-small muted head-sub">
        {s.closet.length} {s.closet.length === 1 ? 'piece' : 'pieces'}{inWash ? `, ${inWash} in the wash` : ''}
      </p>

      <div className="chips scroll" role="toolbar" aria-label="Show">
        <Chip on={f === 'all'} onClick={() => setF('all')}>All</Chip>
        {SECTIONS.filter((x) => count(x.slot)).map((x) => (
          <Chip key={x.slot} on={f === x.slot} onClick={() => setF(x.slot)}>
            <Garment kind={SECTION_ICON[x.slot]} color={f === x.slot ? '#ffffff' : '#9aa0aa'} />{x.label} <span className="count">{count(x.slot)}</span>
          </Chip>
        ))}
        {inWash > 0 && <Chip on={f === 'wash'} onClick={() => setF('wash')}>In the wash <span className="count">{inWash}</span></Chip>}
      </div>

      {f === 'wash' && inWash > 0 && (
        <button className="btn secondary" onClick={() => { d({ type: 'laundryDone' }); setF('all'); }}>
          <Icon name="check" /> Laundry’s done
        </button>
      )}

      {s.closet.length === 0 ? (
        <section className="empty-state">
          <p className="t-title">Your closet is empty</p>
          <p className="t-small muted">Add the things you wear most. Fifteen pieces is plenty to start.</p>
          <button className="btn primary" onClick={() => d({ type: 'go', route: 'add' })}>Add clothes</button>
        </section>
      ) : (
        sections.filter((x) => x.items.length).map((x) => (
          <section key={x.label} className="stack" aria-label={x.label}>
            {f === 'all' && <h2 className="wall-section">{x.label} <span>{x.items.length}</span></h2>}
            <ul className="wall">
              {x.items.map((i) => (
                <li key={i.id}>
                  <button
                    className={`tile${i.status !== 'available' ? ' is-away' : ''}`}
                    onClick={() => d({ type: 'go', route: 'item', itemId: i.id })}
                    aria-label={`${i.name}${i.status === 'wash' ? ', in the wash' : i.status === 'stored' ? ', stored' : ''}`}
                  >
                    <span className="tile-art" style={{ ['--tint' as string]: i.color } as CSSProperties}>
                      <ItemVisual item={i} />
                      {i.status === 'wash' && <span className="tile-flag">In the wash</span>}
                      {i.status === 'stored' && <span className="tile-flag">Stored</span>}
                    </span>
                    <span className="tile-name">{i.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}

export function ItemDetail() {
  const { s, d } = useStore();
  const orig = s.closet.find((i) => i.id === s.itemId);
  const [item, setItem] = useState<Item | undefined>(orig);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!orig || !item) {
    return (
      <main className="screen has-tabs">
        <Header title="Not found" back={() => d({ type: 'go', route: 'closet' })} />
      </main>
    );
  }
  const changed = JSON.stringify(orig) !== JSON.stringify(item);
  const statuses: { v: ItemStatus; t: string }[] = [
    { v: 'available', t: 'In the closet' },
    { v: 'wash', t: 'In the wash' },
    { v: 'stored', t: 'Stored away' },
  ];
  const last = item.lastWorn ? new Date(`${item.lastWorn}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—';
  return (
    <main className="screen has-tabs">
      <section className="detail-hero" style={{ ['--tint' as string]: item.color } as CSSProperties}>
        <div className="head"><button className="icon-btn" aria-label="Back to closet" onClick={() => d({ type: 'go', route: 'closet' })}><Icon name="back" /></button></div>
        <div className="detail-art"><ItemVisual item={item} /></div>
        <h1 className="t-display">{orig.name}</h1>
        <div className="stats">
          <div className="stat"><strong>{item.wearCount}</strong><span>{item.wearCount === 1 ? 'time worn' : 'times worn'}</span></div>
          <div className="stat"><strong>{last}</strong><span>last worn</span></div>
        </div>
      </section>

      <fieldset className="group">
        <legend>Where is it?</legend>
        <div className="seg" role="radiogroup" aria-label="Where is it?">
          {statuses.map((x) => (
            <button key={x.v} role="radio" aria-checked={item.status === x.v} onClick={() => setItem({ ...item, status: x.v })}>{x.t}</button>
          ))}
        </div>
      </fieldset>

      <TagEditor item={item} onChange={setItem} />

      <button className="btn danger-quiet" onClick={() => setConfirmDelete(true)}>Delete from closet</button>
      {changed && (
        <div className="dock-save">
          <button className="btn primary lg block" onClick={() => { d({ type: 'updateItem', item }); d({ type: 'toast', text: 'Changes saved' }); }}>
            Save changes
          </button>
        </div>
      )}
      {confirmDelete && (
        <Sheet title={`Delete ${orig.name}?`} onClose={() => setConfirmDelete(false)}>
          <p className="t-body">It won’t be suggested again and its photo is removed. Your wear history stays.</p>
          <button className="btn danger block" onClick={() => {
            if (s.email && !s.demo && orig.photoSynced) void api.deleteImage(orig.id).catch(() => undefined);
            d({ type: 'deleteItem', id: orig.id });
            d({ type: 'toast', text: `${orig.name} deleted` });
          }}>
            Delete
          </button>
          <button className="btn quiet" onClick={() => setConfirmDelete(false)}>Keep it</button>
        </Sheet>
      )}
    </main>
  );
}
