# Wearther Mode — v4 redesign ("Calm editorial")

## v4.1 — model view (18 Nov 2026)

The suggested outfit is now shown **worn on a sample model** instead of as
separate clothes. This is the default view on Today ("On model"), with a
"Flat lay" toggle above the card that keeps the v4 vertical stack.

**What changed**
- Two faceless, modest, mannequin-like inline-SVG models — Male (broader
  shoulders, straighter hips, short hair) and Female (narrower shoulders,
  wider hips, tied-back hair + bun). No photos, no facial features, neutral
  skin tone. Gender is a setting, not a fact about the user: it defaults to
  Male and can be changed in the You tab ("Model" section, "Your model is
  only shown to you") or with the small Male/Female switch on the Today card.
- Layering, in body order: shoes → bottoms → top → mid → outer. The outer
  (trench / puffer / rain jacket) is drawn **open** — two side panels plus
  shoulders and collar — so the layer underneath stays visible in the
  centre. If a knit/hoodie covers a shirt, the shirt collar still peeks out.
  Every garment is filled with its real hex from `mock.ts` and fitted to the
  body (SVG groups in model coordinates, not pasted flat-lay shapes).
- Kept/pinned pieces get a small ✓ badge on the model at that piece's
  position; tapping a row in the piece breakdown below the model highlights
  that garment on the model for ~1.4 s.
- Look navigation on the card itself: prev/next arrows on the model's sides
  (44 px, labelled) plus left/right swipe on the model (touch + mouse,
  ~60 px threshold), in addition to the existing dots.
- "Wear this" now sits directly under the model card (before the hourly
  curve), with Shuffle / Love as a quiet row under it. After wearing, a
  "Worn today ✓" badge appears on the model card corner as well as on the
  button — the confirmation is where the user is looking.
- Closet → item sheet has "Try in today's look": it swaps that item into
  the current look on the model if its slot matches (and it isn't in the
  wash), then returns to Today. If the slot doesn't exist in this look
  (e.g. a trench in the Lisbon looks, which have no outer), it shows
  "That doesn't fit this slot" and stays put.
- All v4 behaviour is preserved: 3 scenarios, 3 looks each, temperature
  curve, dark mode, °C/°F, closet search/filters/laundry.

**How the layering works (prototype code, `wearther-v4.html`)**
`modelSVG(pieces, gender)` builds one SVG (`viewBox 0 0 360 540`): `modelBody()`
(skin silhouette + hair), then `modelShoes()` → `modelBottom()` →
`modelTop()` (top, then mid) → collar peek → `modelOuter()` (open panels).
`currentLookItems()` applies a "Try in today's look" swap on top of the
hand-composed look before rendering. The real app would do the same with
`ItemVisual` cut-outs positioned per slot instead of the SVG silhouettes —
the slot order and the open-outer rule are the parts to keep.

**Still a stand-in, not a photo try-on.** The model is a drawn mannequin, not
the user and not a photo of the clothes on a body. A real "see it on me"
photo try-on would need a paid API (see `docs/redesign-and-ai.md` §3: FASHN
≈ $0.075/image, or ≈ $0.15–0.25 per 3–4 piece outfit via chained calls;
Google Vertex virtual-try-on ≈ $0.06/image but listed for deprecation
15 Mar 2027; the open-source models are non-commercial and can't ship in a
paid app, and a self-hosted GPU model needs a bigger server). It would also
need explicit opt-in, encrypted storage of a full-body photo, and a cap
(e.g. 10 renders/month) so the cost stays under the $3.99 subscription.
That is a v1.1 decision needing approval to create a paid API account — the
sample model here is the free, private interim step.

**Verification (18 Nov 2026, jsdom):** script passes `node --check`; file
67,442 bytes, no `<img>` tags; model renders 5 pieces (London/Toronto) and
3 (Lisbon); gender switch re-renders both models; swipe changes the look;
Wear shows the badge on the card; flat-lay toggle works; "Try in today's
look" swaps Olive rain jacket in over Camel trench and correctly refuses a
trench in a Lisbon look.

**Compromises:** the open outer layer is simplified (two flat panels, no
folds or drape); sleeves are straight rather than following the arm angle;
shorts show skin legs, trousers cover them; the mannequin has one skin tone
and no size/body-type options yet.

A redesign of the v3 "Weather toy box" system (`docs/design-system.md`, 17 Nov 2026).
The outfit engine, weather logic, trial/paywall and data model are untouched —
this is a presentation redesign only.

## Try it

Open `wearther-v4.html` in any browser (double-click it, or serve the `v4/`
folder). It is a self-contained, phone-sized interactive prototype (430 px max):
4 tabs (Today / Closet / Add / You), working scenario switcher
(London / Toronto / Lisbon), 3 looks per scenario, tappable outfit pieces,
hourly temperature curve, working closet search/filters/laundry flow, item
detail sheet, and a dark-mode toggle in the You tab.

## Before → after

| # | Problem in v3 | Fix in v4 | Where |
|---|---|---|---|
| 1 | Full-screen saturated mood gradient paints the whole app (`src/theme/app.css:144` `.scene`; `src/theme/tokens.css:54` `--canvas` = 26% mood) | Mood is ONE restrained accent: a small weather chip, the hourly curve, the layer-on bar. Canvas is warm paper `#F7F5F0` (light) / `#121214` (dark) | `tokens-v4.css` (moods now expose `--accent` / `--accent-soft` / `--accent-ink` only); `app-v4.css` `.mood-chip`, `.hour-curve`, `.layer-bar` |
| 2 | Giant 84 px temperature competes with the outfit (`src/theme/tokens.css:24` `--t-hero: 6rem`; `src/theme/app.css:13` `.t-hero`; `src/screens/Today.tsx:126-133` `.hero`) | Temperature is small (`--t-temp: 15px`) in the weather strip. The verdict is the hero headline in a serif/display face | `tokens-v4.css` (`--t-hero` deleted); `app-v4.css` `.weather-strip`, `.verdict`; `Today.tsx` edit 1 below |
| 3 | Verdict sits below the hero temp + glyph (`src/screens/Today.tsx:136`, after the `.hero` block) | Hierarchy: place + date line → verdict → outfit → why → hourly → actions | `Today.tsx` edit 1 below |
| 4 | Outfit is a scattered diagonal collage (`src/theme/app.css` `.deck` / `.look` / `.piece` absolute positioning; `src/components/Look.tsx` `LookDeck`) | Proper vertical flat-lay stack, aligned like a person: outer → mid → top → bottom → shoes. Each piece is its own clean white card row (art, name + role, pin button) | `app-v4.css` `.outfit-stack`, `.piece-row`; `Today.tsx` edit 2 below |
| 5 | Lock/pin buttons overlap garment art on small widths (design-review #5, `docs/design-review.md:23`) | Pin is a 44 px button in the row's own gutter, never over the art; kept pieces get a "Kept ✓" tag | `app-v4.css` `.pin-btn`, `.kept-tag` |
| 6 | Hourly strip is 7+ overflowing capsules (`src/theme/app.css:164` `.hours`; `src/screens/Today.tsx:231-250` `Hours()`) | ONE temperature curve (inline SVG sparkline, 08:00–18:00) with a shaded rain window, tappable points, and a "trench on 08:00–19:00" bar underneath | `app-v4.css` `.hour-card`, `.hour-curve`, `.layer-bar`; `Today.tsx` edit 3 below |
| 7 | Actions dock: giant pink love circle + X circle compete with Wear (`src/theme/app.css:66-75` `.round`, `.round.love`; `:244` `.actions-dock`; `src/screens/Today.tsx:193-208`) | ONE full-width primary "Wear this" (dark ink). Below it a quiet row: Shuffle + a small heart toggle "Love" | `app-v4.css` `.actions`, `.actions-quiet`, `.btn-quiet`; `Today.tsx` edit 3 below |
| 8 | "Wear this" fires a confetti explosion + a landing stamp (`src/screens/Today.tsx:94` `confettiFrom(...)`; `src/theme/app.css:237` `@keyframes stamp`) | Calm confirmation: button becomes "Worn today ✓" + a small toast. No confetti, no stamp | `Today.tsx` edit 3 below; `app-v4.css` `.btn.primary.is-done` |
| 9 | Active tab marked by colour only — ink vs grey (design-review #1, `docs/design-review.md:19`) | Active tab gets a soft pill background + a filled icon + a bolder label | `app-v4.css` `.tabbar`, `.tab[aria-current='page']` |
| 10 | Floating liquid blob tab bar (`src/theme/app.css:117` `.tab-blob`, bounce easing) | Minimal translucent bar, no blob, no hop animation | `app-v4.css` `.tabbar` (`.tab-blob` deleted) |
| 11 | Toy-clay surfaces everywhere: lit top edge, 5 px bottom edge, mood-tinted drop shadow (`src/theme/tokens.css:57-67` `--clay`; `src/theme/app.css:51-56` shine sweep on primary) | One soft shadow, 18–22 px radii, flat 1 px hairlines, no shine, no depth | `tokens-v4.css` `--shadow` / `--shadow-sm`; `app-v4.css` `.btn`, `.card` |
| 12 | Closet filter chips carry a garment icon + long label ("Jackets and coats") and truncate off-screen (`src/screens/Closet.tsx:44-46`) | Short labels that fit (All, Jackets, Warm layers, Tops, Bottoms, Shoes, In the wash) + counts, horizontally scrollable | `app-v4.css` `.chip`; `Closet.tsx` edit below |
| 13 | Closet tiles show name only (`src/screens/Closet.tsx:80` `.tile-name`) | Tiles show name + wear count ("Worn 7 times") | `app-v4.css` `.tile-meta`; `Closet.tsx` edit below |
| 14 | Settings rows use gradient squircle icons (`src/theme/app.css` `.row-icon` with `--a`/`--b` gradients) | Flat neutral icon chips on `var(--paper-2)` | `app-v4.css` `.row-icon` |
| 15 | Sheets show a drag handle but can't be dragged (design-review #2, `docs/design-review.md:20`) | Handle kept as a visual affordance only, documented in CSS; sheets close via scrim / Close / Escape (drag-to-dismiss still a Phase 3 job) | `app-v4.css` `.sheet-handle` comment |

## What was deliberately kept

- **Outfit engine** (`src/engine/`): untouched. Looks in the prototype follow its
  rules (weather-first, neutral base + one colour, rain-proof outer + boots
  on wet days, warmest coat at −9°).
- **Weather logic & data**: real data from `src/data/mock.ts` — the 18-item
  starter closet (names, kinds, hex colours, `wearCount = (n·7) % 11`),
  the 3 scenarios (London mixed 9°/13° feels, rain from 17:00, wind 28 km/h;
  Toronto cold −9°/−1° feels, dry; Lisbon hot 21°/35° feels, sunny) and the
  London hourly feels `9,10,11,12,12,13,13,12,11,10,9` (08:00–18:00).
  Toronto/Lisbon hourly curves are the mock.ts cosine curves sampled at
  08:00–18:00 (−9…−1 and 21…35).
- **Trial / paywall**: "2 days left of your free week" banner + See plans
  sheet, same copy and day-5–7 timing as `Today.tsx` / `Settings.tsx`.
- **Accessibility passes from `docs/design-review.md`**: touch targets ≥ 44 px,
  text labels on every tab, AA contrast in light and dark, sheets close via
  scrim/Close/Escape with focus return, `prefers-reduced-motion` respected
  (fades only), rain shown by icon + label as well as colour.
- **Dark mode** follows the system setting in the CSS; the prototype adds a
  manual toggle in the You tab (real app: keep system-following, toggle is
  prototype-only).

## Compromises / demo-only choices in the prototype

- **Garment art is drawn, not photographed.** Pieces are simple inline-SVG
  silhouettes filled with each item's real hex from `mock.ts`. The real app
  keeps its cut-out photos (`ItemVisual`); the SVGs only stand in for them.
- **"Last worn" is derived, not real.** `mock.ts` has no `lastWorn` field, so
  the item sheet derives a plausible date from `wearCount`. Don't ship that —
  add a real `lastWorn` to the item record instead.
- **In-wash demo state:** Grey merino knit and White sneakers start "In the
  wash" (2 items) so the wash filter and "Laundry done" flow are visible.
  They are excluded from the looks for consistency. In the real app the wash
  state comes from the store, as today.
- **Looks are hand-picked, not engine-picked.** The 3 looks per scenario were
  composed by hand following the engine's rules, because the prototype has no
  engine. The real app keeps calling `pickLooks()` — only the rendering
  changes (edit 2 below).
- **Add tab photo upload is stubbed** (file picker shows file names; no
  cut-out runs). The starter checklist (12 of 15) follows `src/data/catalog.ts`
  `STARTER` (tops 4/4, bottoms 2/2, mid 2/2, outer 2/2, shoes 2/3, dresses 0/2).
- **One Google Font import** (Fraunces, display only) with a Georgia serif
  fallback, so the file degrades gracefully offline.

## How to apply the CSS patch

1. Back up the v3 files, then copy over them:
   ```bash
   cp v4/tokens-v4.css src/theme/tokens.css
   cp v4/app-v4.css    src/theme/app.css
   ```
2. Make the 3 small structural edits below (plus the 2 one-line Closet edits).
3. `npm run dev` and check `?demo=today&scenario=mixed|cold|hot`. Then grep
   for v3 leftovers that must be gone: `--m1`, `--m2`, `--clay`, `.tab-blob`,
   `confettiFrom`, `.scene` — any remaining hit is dead code to delete.

### Edit 1 — `src/screens/Today.tsx`: verdict first, no hero temp, no Scene
Delete the `<Scene mood={mood} />` import/use and the whole `.hero` block
(lines ~124–136: `.place-pill` + `.hero` with the `CountUp` `.t-hero`
temperatures). Replace the header with:
```tsx
<header aria-labelledby="verdict">
  <p className="place-line"><b>{forecast.place}</b> · {shortDay(dayIso)}</p>
  <div className="weather-strip">
    <span className="mood-chip"><WeatherGlyph kind={glyphForMood(mood)} className="mini" still /> {condLabel}</span>
    <span className="temp-line">{deg(summary.minFeels)}–{deg(summary.maxFeels)} <span>feels like</span> · Wind {summary.maxWind} km/h</span>
  </div>
  <h1 id="verdict" className="verdict">{verdict(summary, s.win)}</h1>
</header>
```
(`verdict()` at line ~257 already returns the right sentence; keep it.
`useCountUp` / `CountUp` become unused — delete them.)

### Edit 2 — `src/screens/Today.tsx`: outfit stack instead of LookDeck
Replace the `<LookDeck … />` section with a flat-lay stack. Order items by
slot — outer, mid, top, bottom, shoes — and render one `.piece-row` each
(reuse the existing `kept` state and `onToggle` handler; the pin button is
now in the row gutter instead of overlapping the art, fixing review #5):
```tsx
<section aria-label="Your look for the day">
  <div className="look-meta">… dots + prev/next (setIndex) …</div>
  <div className="outfit-stack">
    {[...look.items].sort((a,b)=>SLOT_ORDER.indexOf(a.slot)-SLOT_ORDER.indexOf(b.slot)).map((it,i)=>(
      <button key={it.id} className={`piece-row${kept.includes(it.id)?" is-kept":""}`}
        aria-pressed={kept.includes(it.id)} onClick={()=>onToggle(it.id)}>
        <span className="piece-art"><ItemVisual item={it} /></span>
        <span className="piece-info"><span className="nm">{it.name}</span>
          <span className="rl">{SLOT_LABEL[it.slot]}</span>
          <span className="kept-tag">Kept ✓</span></span>
        <span className="pin-btn" aria-hidden="true"><Icon name="pin" /></span>
      </button>
    ))}
  </div>
  {look && <p className="why"><span className="why-label">Why this works</span>{look.why}</p>}
</section>
```
Delete the `press()` keyboard hack and the `LookDeck` import when the deck is
gone. Keep `pickLooks()` exactly as-is.

### Edit 3 — `src/screens/Today.tsx`: hourly curve + calm actions
Replace `Hours()` (lines ~231–250, the `.hours` capsule row) with a
`.hour-card` containing one inline SVG sparkline over `s.hours` (feels-like),
a shaded `<rect>` over the rain window (`s.rainFrom` onwards), tappable
`<circle className="hour-point" r="14">` hit areas, a readout line for the
selected hour, and the `.layer-bar` (`{outer} on, {hh(layer[0])}–{hh(layer[1]+1)}`).
Replace the `.actions-dock` block (lines ~193–208) with:
```tsx
<div className="actions">
  <button className={`btn primary${isWorn?" is-done":""}`} disabled={isWorn} onClick={wear}>
    {isWorn ? <><Icon name="check" /> Worn today ✓</> : "Wear this"}
  </button>
  <div className="actions-quiet">
    <button className="btn-quiet" onClick={()=>setIndex(i=>i+1)}>↻ Shuffle</button>
    <button className="btn-quiet" aria-pressed={isLoved} onClick={()=>signal("love")}>♥ {isLoved?"Loved":"Love"}</button>
  </div>
</div>
```
And in `wear()` (lines ~90–100): delete the `confettiFrom(...)` call and the
`justWorn` stamp timer; keep the `d({type:"wear"})` dispatch and add a toast
(`d({type:"toast", text:"Worn today ✓"})`).

### Edit 4 — `src/screens/Closet.tsx`: short filters + wear counts
- Shorten the section labels used in chips (lines ~42–48): "Jackets and coats"
  → "Jackets", "Warm layers" stays, "Tops" stays, "Bottoms" stays, "Shoes"
  stays; drop the `<Garment …/>` icon inside each `Chip` (icon + long label
  is what truncated). Keep the counts.
- In the tile (lines ~74–82), add under `.tile-name`:
  ```tsx
  <span className="tile-meta">Worn {i.wearCount} {i.wearCount===1?"time":"times"}</span>
  ```
  (`.tile-meta` is already styled in `app-v4.css`.)

### Not changed (still open, per design-review.md)
- #2 drag-to-dismiss for sheets, #3 edge-swipe back, #4 Dynamic Type,
  #6 tag-card hint animation, #7 fabric/season tags in the engine — all
  still Phase 3 work, none of them blocked by this redesign.

---

## v4.2 — real sample photos (18 Nov 2026)

The grey SVG silhouettes are gone as the main garment art. Every closet item
now shows a real sample product photo, and Today shows a real sample-model
photo per city and gender.

- **Closet tiles, item sheet, flat lay:** `photoImg(item)` renders the
  item's photo from the `PHOTOS` map (18 entries, `wearther-v4.html`),
  `object-fit: contain` on the warm-paper card, `loading="lazy"`, `alt` =
  item name. If a photo fails at runtime, `onerror` swaps the SVG
  silhouette back in (`imgFallback`) — never a broken image.
- **Today hero (Model view):** `MODEL_PHOTOS[gender][scenario]` — one
  full-body sample-model photo per city × gender (Pexels, except Toronto
  male which is a Ralph Lauren studio shot). It shows a **similar look, not
  the exact pieces** — the caption under the photo says so, and the exact
  pieces are the photo thumbnails in the list below. Looks 2–3 reuse the
  same hero photo for that scenario. If the hero fails to load, the SVG
  mannequin returns (`modelImgFallback`).
- **Sources:** `PHOTO-SOURCES.md` — every URL, its source page, and the
  licence note. All 24 URLs were preflighted (HEAD 200, image content-type,
  Mozilla UA + cross-origin Referer) and downloaded and visually checked.
  Pexels photos are free to use; the retailer shots are © their retailers
  and are prototype stand-ins only — the production app must use the user's
  own closet photos, which is the product's whole premise anyway.
- **Known mismatches (honest stand-ins):** the male London coat is cream,
  not camel; Lisbon male wears sneakers, not sandals; Lisbon female wears
  denim shorts, not stone; the rain jacket is sage green rather than olive.
  The "Try in today's look" toast now says the piece "is in today's look
  now — see it in the list below", because the hero photo can't reflect a swap.
- **Weight:** the file grew 67.6 KB → 72.6 KB (remote URLs only, nothing
  embedded). Two photos are heavy (ecru linen shirt 5.1 MB, charcoal
  trousers 1.1 MB) — lazy-loaded and shown small, but they should be
  replaced by sensibly-sized user photos in production.
- **Verified:** `node --check` clean; jsdom smoke test 18/18 real checks
  (hero per scenario × gender, 5 piece photos per look, 18 closet tiles,
  item sheet, photo credit in You). The only jsdom noise was its missing
  `window.scrollTo` (pre-existing) and `loading` not reflecting as an IDL
  property (the attribute is present — confirmed via `getAttribute`).

---

## v4.3 — photos embedded, Add works with your own photos (18 Nov 2026)

The user was right: on her phone she still saw drawing icons, not photos.
The v4.2 photos were hotlinks to 20+ different retailer CDNs. They returned
HTTP 200 from this VM, but on the user's phone/network many of those hosts
don't load — and the `onerror` fallback silently swapped in the grey SVG
silhouettes. Remote hotlinking was the bug, not the photos.

**What changed**
- **No remote images at all.** All 24 photos (18 product + 6 hero) are
  downloaded, compressed with PIL and embedded as base64 JPEG data URIs
  directly in `wearther-v4.html`. The file works fully offline — verified
  in headless Chromium with the network disabled. The only remaining remote
  URL is the Google Fonts link (Fraunces), which degrades gracefully to
  Georgia/system fonts when offline; it is not needed for any photo.
- **Image budget:** products → max 360 px on the long side, JPEG q68
  (3.6–15 KB each); heroes → max 560 px wide, JPEG q70 (13–29 KB each).
  All embedded images together: ~296 KB raw → ~394 KB base64. File:
  72.6 KB → **416 KB** (widget limit is 1 MB).
- **London heroes are AI-generated sample models, not drawings and not real
  people.** Photorealistic full-body studio shots, female (default) and male,
  wearing exactly London look 1: camel trench open over the pale blue shirt,
  mid-blue jeans, brown Chelsea boots, plain off-white background. No
  copyright issue, no real person. (One honest note: the bottle-green knit
  from look 1 sits under the trench and isn't visible in the photo — the
  caption still says "a similar look".) Toronto/Lisbon heroes stay the
  verified Pexels photos, embedded the same way. In production the app does
  NOT need AI generation per user — it shows the user's own closet photos;
  the AI model is only the sample-model stand-in for the prototype.
- **Add is real now — the user's core flow.** Choosing photos in Add
  (`FileReader` → canvas downscale to max 360 px JPEG) adds each one to the
  closet immediately, with its REAL photo, visible at once in Closet, in
  flat lay, and via "Try in today's look". Name is auto-derived from the
  file name (editable text field); slot defaults to Top with a picker
  (Outer / Warm layer / Top / Bottom / Shoes); colour is picked from 6
  swatches — no `#888888` placeholder. Items persist in-memory for the
  session plus a best-effort `localStorage` save (guarded with try/catch —
  the widget iframe may block storage, and that must not crash).
- **Flat lay is now the proof view:** pieces are 104 px photo cards
  (`.outfit-stack.flat .piece-art`), large and clear — her real coat next
  to her real shirt, not icons.
- The SVG silhouettes survive only as code (`garmentSVG`/`modelSVG`) for
  the `onerror` fallback. With embedded images they should never fire.

**Verified for real this time (headless Chromium, network OFFLINE)**
- `node --check` clean; file 416 KB; 24/24 base64 URIs decode to valid
  JPEGs with the right dimensions; 0 remote photo hosts in the file.
- Screenshots looked at directly: Today (female, London) shows the real
  AI model photo — camel trench open over pale blue shirt; Flat lay shows
  5 real piece photos, large (trench, green knit, blue shirt, jeans…);
  Closet shows 18 real tile photos, 0 SVG fallbacks; Add upload tested
  end-to-end with a real file input — the photo appears as "Just added"
  with its real thumbnail, closet count goes 18 → 19, picking Bottom +
  "Try in today's look" swaps it into today's look (piece list shows it,
  toast confirms). The only console error offline is the Google Fonts
  fetch failing — expected, and the serif falls back to Georgia.
- Screenshots: `/tmp/shots/01-today-female-london.png`,
  `02-flat-lay.png`, `03-closet.png`, `04-add-uploaded.png`,
  `05-try-in-look.png` (kept in /tmp, not shipped).

**One cosmetic fix found in the screenshots:** the slot segmented control
in the "Just added" card overflowed on the right ("Shoes" clipped). Fixed:
it now scrolls horizontally inside the card.

## v4.4 — Flat lay by default, body-order stack, "Why this look" (2026-11-18)

User's call: the flat view should be the default for now, the outfit needs a
plain-language reason, and — the key idea — a simple logic that lays the
clothes out in body order on one composed picture, so no model photo (AI or
otherwise) is needed at all.

- **Flat lay is now the default** (`state.view:"flat"`); the toggle still
  offers "On model" second. The AI model photos stay in the file for the
  model view, but nothing in the default flow depends on them.
- **Body-order stack (`.body-stack`):** the real piece photos are laid out
  in one column in the order they sit on a body — Outer → Warm layer →
  Top → Bottom → Shoes — each photo overlapping the one above, widths
  shrinking down the body (188 → 148 → 148 → 138 → 112 px), each with a
  small role tag (Outer / Warm layer / Top / Bottom / Shoes). The logic is
  just `SLOT_ORDER` sort + overlap; any slot may be missing (Lisbon has no
  outer) and the order of the rest is unchanged. Below the stack, the exact
  piece rows (with pin buttons) are unchanged.
- **"Why this look" card:** the old one-line `look.why` stays as the lead,
  plus one plain reason per piece from deterministic rules over the weather
  — no AI generation: rain decides the outer + boots ("rain from 17:00 —
  the outer layer has to keep you dry"), the feels-like range decides the
  warm layer, the midday high decides shorts/sandals. Same rules drive
  every scenario/look, so the explanation can never contradict the outfit.
- **Correction to the v4.3 notes above:** the chat preview rejects
  `localStorage`/IndexedDB, so in this prototype added items persist
  in-memory only for the session (the save/load functions are no-ops now);
  the real app persists to its own database. The v4.3 text claiming a
  best-effort `localStorage` save is out of date for this file.

**Verified (headless Chromium shell, `node --check` clean, file 421 KB)**
- Dumped DOM: `Flat lay` is `aria-pressed="true"` on load; 5 body layers
  render for London look 1, in order trench → knit → shirt → jeans →
  boots, each with its role tag.
- Screenshots inspected: `/tmp/shots/v44-today-top.png` and
  `v44-today-full.png` — body stack reads as one dressed figure, piece
  rows show real photos, "Why this look" lists 5 correct per-piece reasons
  (rain 17:00, feels 9–13°), hour curve and layer bar intact, no errors
  except the expected offline Google Fonts fetch.

**Subscription math (user's $2/month question, Nov 2026 prices)**
- Daily outfits in this flat-lay design cost **$0 per outfit** — no image
  is generated. At $2/month the subscription is nearly all margin (minus
  the store's 15–30%, so ~$1.40–$1.70 net); only AI generations are a
  variable cost, so cap those.
- If AI try-on/model images are added later: at Nano Banana 2.1
  ($0.0336/image) or Genlook ($0.02/image), **20 generations/month** costs
  $0.40–$0.67 against ~$1.40 net — a safe headline number. At FASHN v1.6
  ($0.075/image) the same budget only covers ~10/month. Unused generations
  should not roll over; extras can be sold pay-per-use (~$0.10 each).
