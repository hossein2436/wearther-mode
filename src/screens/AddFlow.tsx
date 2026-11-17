import { useEffect, useRef, useState } from 'react';
import { useStore, type DraftItem } from '../state/store';
import type { Item } from '../types';
import { Header } from '../components/ui';
import { Icon } from '../components/Icon';
import { ItemVisual } from '../components/Garment';
import { TagEditor } from './TagEditor';
import { dominantColor, nameColor } from '../engine/color';
import { KINDS } from '../data/catalog';
import { sampleCloset } from '../data/mock';

const uid = () => Math.random().toString(36).slice(2, 10);

/** Downscale to ≤ 800 px and re-encode, so photos stay small enough to keep on the device. */
async function shrink(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 800 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext('2d')?.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/webp', 0.82);
}

export function AddScreen() {
  const { d } = useStore();
  return (
    <main className="screen has-tabs">
      <Header title="Add clothes" back={() => d({ type: 'go', route: 'closet' })} />
      <p className="t-body muted">Bought something new? Add it here. The rest of your closet stays as it is.</p>
      <AddFlow />
    </main>
  );
}

export function AddFlow({ compact }: { compact?: boolean }) {
  const { s, d } = useStore();
  const lib = useRef<HTMLInputElement>(null);
  const cam = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, 30);
    const drafts: DraftItem[] = list.map(() => ({ id: uid(), state: 'cutting' }));
    d({ type: 'addDrafts', drafts });
    for (let k = 0; k < list.length; k++) {
      try {
        const photo = await shrink(list[k]);
        // Real app: upload to the server's cut-out worker; here we simulate its latency.
        await new Promise((r) => setTimeout(r, 700));
        const color = await dominantColor(photo).catch(() => '#8A8F96');
        const item: Item = {
          id: drafts[k].id, name: `${nameColor(color)} top`, kind: 'tshirt', slot: 'top', color, colorName: nameColor(color),
          warmth: KINDS.tshirt.warmth, formality: KINDS.tshirt.formality, status: 'available', wearCount: 0,
          photo, addedAt: s.isoToday,
        };
        d({ type: 'draftReady', id: drafts[k].id, item });
      } catch {
        d({ type: 'discardDraft', id: drafts[k].id });
        d({ type: 'toast', text: 'We couldn’t read one of those photos. Try another.' });
      }
    }
  };

  const addSamples = () => {
    const have = new Set(s.closet.map((i) => i.name));
    const samples = sampleCloset().filter((i) => !have.has(i.name)).slice(0, 8);
    const drafts: DraftItem[] = samples.map((it) => ({ id: uid(), state: 'cutting', sample: it }));
    d({ type: 'addDrafts', drafts });
    drafts.forEach((dr, k) =>
      setTimeout(() => d({ type: 'draftReady', id: dr.id, item: { ...dr.sample!, id: dr.id, addedAt: s.isoToday } }), 400 + k * 250),
    );
  };

  const ready = s.drafts.filter((x) => x.state === 'ready');
  const cutting = s.drafts.filter((x) => x.state === 'cutting').length;

  return (
    <section className={`addflow${compact ? ' compact' : ''}`} aria-label="Add clothes">
      <input ref={lib} type="file" accept="image/*" multiple hidden onChange={(e) => { void onFiles(e.target.files); e.target.value = ''; }} />
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { void onFiles(e.target.files); e.target.value = ''; }} />

      {!s.drafts.length && (
        <>
          <div className="add-buttons">
            <button className="btn primary" onClick={() => lib.current?.click()}>
              <Icon name="photos" /> Choose photos
            </button>
            <button className="btn secondary" onClick={() => cam.current?.click()}>
              <Icon name="camera" /> Take a photo
            </button>
          </div>
          <p className="t-small muted tips">
            Best results: one piece per photo, laid flat or on a hanger, plain background, daylight.
          </p>
          <button className="btn ghost" onClick={addSamples}>Try it with sample clothes</button>
        </>
      )}

      {cutting > 0 && (
        <p className="cutting" role="status">
          <span className="spinner" aria-hidden="true" /> Cutting out {cutting} {cutting === 1 ? 'photo' : 'photos'}…
        </p>
      )}

      {ready[0] && <TagCard key={ready[0].id} draft={ready[0]} left={ready.length} />}
    </section>
  );
}

function TagCard({ draft, left }: { draft: DraftItem; left: number }) {
  const { d } = useStore();
  const [item, setItem] = useState<Item>(draft.item!);
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => ref.current?.focus(), []);

  const confirm = () => {
    d({ type: 'confirmDraft', id: draft.id, item });
    d({ type: 'toast', text: `${item.name} added` });
  };

  return (
    <div
      className="tagcard"
      ref={ref}
      tabIndex={-1}
      aria-label={`Check the details for ${item.name}. ${left} to go.`}
      style={{ transform: dx ? `translateX(${dx}px) rotate(${dx / 40}deg)` : undefined }}
    >
      <div
        className="tagcard-photo"
        onPointerDown={(e) => { start.current = e.clientX; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
        onPointerMove={(e) => start.current !== null && setDx(Math.max(0, e.clientX - start.current))}
        onPointerUp={() => {
          const w = ref.current?.offsetWidth ?? 300;
          if (dx > w * 0.3) confirm();
          setDx(0);
          start.current = null;
        }}
      >
        <ItemVisual item={item} />
        <span className="tagcard-count">{left} to check</span>
      </div>
      <TagEditor item={item} onChange={setItem} suggested={!draft.sample} />
      <div className="tagcard-actions">
        <button className="btn secondary" onClick={() => d({ type: 'discardDraft', id: draft.id })}>Skip this one</button>
        <button className="btn primary" onClick={confirm}><Icon name="check" /> Looks right</button>
      </div>
      <p className="t-small muted center">Or swipe the photo right to confirm.</p>
    </div>
  );
}
