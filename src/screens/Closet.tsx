import { useState } from 'react';
import { useStore } from '../state/store';
import type { Item, ItemStatus, Slot } from '../types';
import { Header, Chip, Sheet } from '../components/ui';
import { ItemVisual } from '../components/Garment';
import { Icon } from '../components/Icon';
import { TagEditor } from './TagEditor';
import { api } from '../api';

const FILTERS: { id: string; label: string; test: (i: Item) => boolean }[] = [
  { id: 'all', label: 'All', test: () => true },
  ...([
    ['top', 'Tops'], ['mid', 'Warm layers'], ['outer', 'Jackets and coats'],
    ['bottom', 'Bottoms'], ['onepiece', 'Dresses'], ['shoes', 'Shoes'],
  ] as [Slot, string][]).map(([id, label]) => ({ id, label, test: (i: Item) => i.slot === id })),
  { id: 'wash', label: 'In the wash', test: (i: Item) => i.status === 'wash' },
];

export function Closet() {
  const { s, d } = useStore();
  const [f, setF] = useState('all');
  const filter = FILTERS.find((x) => x.id === f)!;
  const list = s.closet.filter(filter.test);
  const inWash = s.closet.filter((i) => i.status === 'wash').length;

  return (
    <main className="screen has-tabs">
      <Header title="Closet">
        <button className="icon-btn" aria-label="Add clothes" onClick={() => d({ type: 'go', route: 'add' })}>
          <Icon name="add" />
        </button>
      </Header>
      <p className="t-small muted">{s.closet.length} pieces{inWash ? `, ${inWash} in the wash` : ''}</p>

      <div className="chips scroll" role="toolbar" aria-label="Filter closet">
        {FILTERS.map((x) => (
          <Chip key={x.id} on={f === x.id} onClick={() => setF(x.id)}>{x.label}</Chip>
        ))}
      </div>

      {f === 'wash' && inWash > 0 && (
        <button className="btn secondary" onClick={() => d({ type: 'laundryDone' })}>Laundry done</button>
      )}

      {list.length ? (
        <ul className="grid">
          {list.map((i) => (
            <li key={i.id}>
              <button
                className={`tile${i.status !== 'available' ? ' is-away' : ''}`}
                onClick={() => d({ type: 'go', route: 'item', itemId: i.id })}
                aria-label={`${i.name}${i.status === 'wash' ? ', in the wash' : i.status === 'stored' ? ', stored' : ''}`}
              >
                <span className="tile-art"><ItemVisual item={i} /></span>
                <span className="tile-name">{i.name}</span>
                {i.status === 'wash' && <span className="tile-badge">In the wash</span>}
                {i.status === 'stored' && <span className="tile-badge">Stored</span>}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-block">
          <p className="t-body">{s.closet.length ? 'Nothing here right now.' : 'Your closet is empty. Add a few things you wear a lot.'}</p>
          {!s.closet.length && <button className="btn primary" onClick={() => d({ type: 'go', route: 'add' })}>Add clothes</button>}
        </div>
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
    { v: 'available', t: 'Available' },
    { v: 'wash', t: 'In the wash' },
    { v: 'stored', t: 'Stored' },
  ];
  return (
    <main className="screen has-tabs">
      <Header title={orig.name} back={() => d({ type: 'go', route: 'closet' })} />
      <div className="detail-art"><ItemVisual item={item} /></div>
      <p className="t-small muted">
        Worn {item.wearCount} {item.wearCount === 1 ? 'time' : 'times'}
        {item.lastWorn ? `, last on ${new Date(item.lastWorn).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}` : ''}
      </p>
      <fieldset className="tag-group">
        <legend>Status</legend>
        <div className="chip-row">
          {statuses.map((x) => (
            <Chip key={x.v} on={item.status === x.v} onClick={() => setItem({ ...item, status: x.v })}>{x.t}</Chip>
          ))}
        </div>
      </fieldset>
      <TagEditor item={item} onChange={setItem} />
      <div className="sticky-cta">
        <button
          className="btn primary"
          disabled={!changed}
          onClick={() => { d({ type: 'updateItem', item }); d({ type: 'toast', text: 'Changes saved' }); }}
        >
          Save changes
        </button>
        <button className="btn danger-ghost" onClick={() => setConfirmDelete(true)}>Delete from closet</button>
      </div>
      {confirmDelete && (
        <Sheet title={`Delete ${orig.name}?`} onClose={() => setConfirmDelete(false)}>
          <p className="t-body">It won’t be suggested again and its photo is removed. Your wear history stays.</p>
          <button className="btn danger" onClick={() => {
            if (s.email && !s.demo && orig.photoSynced) void api.deleteImage(orig.id).catch(() => undefined);
            d({ type: 'deleteItem', id: orig.id });
            d({ type: 'toast', text: `${orig.name} deleted` });
          }}>
            Delete
          </button>
          <button className="btn ghost" onClick={() => setConfirmDelete(false)}>Keep it</button>
        </Sheet>
      )}
    </main>
  );
}
