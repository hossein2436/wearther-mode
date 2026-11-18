# Wearther Mode: Design System v4, "Calm editorial"

_v4.4, 18 Nov 2026. Replaces v3 ("Weather toy box"). Screens: `docs/screens/v4/`. The full design rationale, prototype and photo sources are in `redesign/v4/`._

## Idea
The outfit is the hero, not the weather effects. The page reads like a short forecast column:
1. Where and when.
2. One sentence verdict.
3. Your real pieces, laid out top to bottom like a body.
4. One button to wear them.
5. Why this look, and the hour-by-hour detail for anyone who wants it.

Everything else is quiet. The page uses:
- warm paper
- one serif voice for the verdict
- system sans everywhere else
- one restrained accent colour, which changes with the day's weather

## Tokens (`src/theme/tokens.css`)
| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F7F5F0` | `#121214` | App canvas |
| `--paper` | `#FFFFFF` | `#1E1E21` | Cards, inputs |
| `--ink` | `#1B1A17` | `#F5F3EE` | Text, primary button |
| `--ink-2` | `#6E6A60` | `#A9A49A` | Secondary text (4.95:1 and 7.5:1 on canvas) |
| `--ink-3` | `#8A8579` | `#77726A` | Icons, placeholders (3.7:1 and 3.5:1 on paper) |

**Type:**
- `--font-display` is Fraunces Variable. It is used for the verdict, screen titles and the welcome headline.
- `--font` is the system UI stack.
- Only the Latin Fraunces file is precached.

## Mood accent
The day's mood (`state/day.ts`) is set as a class on `.app`. Each mood sets three variables:
- `--accent`: curve line, active dots
- `--accent-soft`: mood chip, rain band
- `--accent-ink`: text on `--accent-soft`, the `<em>` in the verdict

| Mood | `--accent` | `--accent-ink` (light) | Ink on soft |
|---|---|---|---|
| frost | `#5B7C99` | `#405F7A` | 5.1:1 |
| rain | `#3B5BDB` | `#2F4AB8` | 5.8:1 |
| cool | `#2E8F80` | `#226D62` | 4.8:1 |
| mild | `#6D8F3A` | `#4A6226` | 5.4:1 |
| sun | `#B97F24` | `#7C5412` | 5.3:1 |
| heat | `#C96A3B` | `#934824` | 5.2:1 |

Dark mode uses lighter variants, all at 7:1 or above.

## Today, top to bottom
1. **Place line** (`.place-line`): city and long date, with "Tomorrow" after the leave-home time.
2. **Weather strip:**
   - a mood chip with the condition label (`conditionLabel`)
   - the feels-like range and wind
3. **Verdict** (`h1.verdict`), one sentence. The rain time or dry-until time is in `<em>`.
4. **Look meta:** "Look 1 of 5", arrows and dots. It wraps around.
5. **Body stack** (`.body-stack`): the pieces in body order (`bodyOrder`). Widths narrow down the body: outer 188, mid and top 148, dress 172, bottom 138, shoes 112. Each piece carries a role tag.
6. **Piece rows** (`.outfit-stack.flat`): name, role and a lock button. Locking keeps the piece in the next looks.
7. **Actions:**
   - **Wear this** is the one primary button. After tapping, it reads "Worn today" and shows a toast.
   - **Shuffle** and **Love** sit below it as a quiet row.
8. **Why this look** (`.why-card`): the style engine's reason, then one line per piece (`pieceReasons`). For example, the rain decides the coat and the boots.
9. **Hour by hour:**
   - a feels-like SVG curve with the rain hours shaded
   - tap or use the keyboard on a point to read that hour
   - a layer bar for when the coat is on
10. **Trial banner, install card and attribution.**

## Other screens
- **Tab bar:** line icons at rest, filled icon plus a soft pill when active. Nothing animates.
- **Closet:**
  - search field
  - short chips: Jackets, Warm layers, Tops, Dresses, Bottoms, Shoes, In the wash
  - tiles show "Worn N times"
- **Welcome:** the same body stack built from sample garments, with "Dressed for the *forecast*." No cycling weather glyph or floating pieces.

## Motion and performance rules
- Motion only answers a person's action, such as a press, a sheet opening or the toast.
- No ambient weather particles, confetti or floating pieces.
- Animate only `transform` and `opacity`. No `backdrop-filter` over moving content.
- Respect `prefers-reduced-motion`.
- **Measured:** 60 fps at 4× CPU throttle on Today, with near-zero idle main-thread work.

## Removed from v3
- Mood gradients
- Clay shading on garments (`ClayDefs`)
- Tab blob
- Scene particles
- Confetti
- CountUp hero
- Card deck (`LookDeck`)

These files are no longer imported: `Scene.tsx`, `Look.tsx`, `Sky.tsx`, `DayRibbon.tsx`, `FlatLay.tsx`. The bundler drops them from the build. They can be deleted once confirmed.

## Photos
In the real app, the body stack shows the user's own cut-out photos. When an item has no photo, it shows an illustrated garment. The retailer product photos in the v4 prototype are © their retailers and must not ship. See `redesign/v4/PHOTO-SOURCES.md`.
