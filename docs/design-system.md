# Wearther Mode: Design System v2, "Dressed by the sky"

_v2, 17 Nov 2026. Replaces the v1 "Day Ribbon" system. Screens: `docs/screens/v2/`._

## Concept
Weather apps give you a number; closet apps give you a grid. Wearther Mode v2 makes **the day's own sky the screen**.
- **The sky:** on Today, the background is a vertical gradient of the feels-like temperature, from the hour you leave (top) to the hour you're back (bottom).
- **The deck:** your clothes sit on that sky as a styled flat-lay in a swipeable deck.
- **The rail:** a thin hour rail beside the deck marks the rain and when the coat is on.

One element is loud, the sky. Everything else is quiet chrome, so the clothes carry the screen.

### Plan, checked against generic defaults
| First instinct | Why it was rejected | What we did |
|---|---|---|
| Horizontal ribbon under a big header (v1) | Pushed the outfit below the fold; the ribbon needed a legend | The day became the **background** and a **vertical rail** beside the deck; the legend is written as the day's plan ("Camel trench on all day", "Rain from 17:00") |
| White card per outfit, three buttons under it | SaaS card kit; Plan B / Reshuffle / 👍 / 👎 competed | A **deck**: swipe left for another look, right to love it. The same three actions sit in a glass dock: ✕, **Wear this**, ♥ |
| Cream + serif, or black + acid accent | The two most common generated looks | Overcast **mist** chrome, ink text, **one accent (cobalt)** for selection, rain and focus |
| Small caps eyebrows, middle-dot meta strings | Template tells | Sentence case; place and date on two plain lines |
| Lock icon on every piece | Four identical icons, noise | Tap a garment to keep it; a pin appears only on kept pieces |

## Tokens (see `src/theme/tokens.css`)
**Chrome:**
- `--mist #ECEEEA`, dark `#101318`
- `--surface #FFF`, dark `#1B1F26`
- `--surface-2`
- `--ink #1A1D21`; `--ink-2`; `--ink-3`
- `--line`
- `--cobalt #2742D6`, dark `#8EA0FF` (the only accent)
- `--danger`

**Sky ramp (data colour, feels-like):**

| Temperature | Name | Light | Dark |
|---|---|---|---|
| ≤ 0° | frost | `#A9C8F2` | `#1D3254` |
| 8° | chill | `#BCDDE8` | `#1C3A44` |
| 15° | fresh | `#CFE7C9` | `#22392C` |
| 22° | warm | `#F7DE96` | `#43391A` |
| ≥ 30° | heat | `#F8B993` | `#4A2C1D` |

Interpolated per hour in `components/Sky.tsx`.

**Type:** Archivo variable, self-hosted (`@fontsource-variable/archivo`, OFL), with width and weight axes.

| Style | Size | Width | Weight | Use |
|---|---|---|---|---|
| hero | 68 | 125% | 780 | Temperatures, tabular numerals |
| display | 34 | 112% | 720 | Screen titles |
| verdict | 22 | 106% | 640 | The day's sentence |
| title | 22 | | | |
| body | 17 | | 420 | Reading text |
| small | 14 | | | |
| micro | 12 | | | |

**Space:** 4-point scale, 20px page padding.

**Radius:** grows with the object.
- 10: wells
- 14: inputs
- 22: tiles and lists
- 32: look cards and sheets
- pill: buttons, chips, tab bar, dock

**Elevation:** two tinted levels (`--lift-1`, `--lift-2`), no grey drop-shadow kit.

**Motion:**
- `--ease` is `cubic-bezier(.22,1,.36,1)`.
- `--spring` is used for kept pieces, the stamp and toggles.
- Durations are 160ms and 280ms.

## Components
- **Floating tab bar:** a glass capsule inset 16px from the edges. The active tab gets a soft ink pill.
- **Look deck** (`components/Look.tsx`):
  - The top card is glass over the sky.
  - The next two looks peek behind it, rotated, to show there are more.
  - Drag past 28% of the width: left gives another look (a weak "skip" signal), right loves the look (strong signal plus a heart burst).
  - Keyboard: ← and →.
  - "Wear this" stamps the card ("Worn today", a spring stamp that settles into the corner).
- **Composition:** pieces are laid out head to toe with slight rotation, using percentage boxes per slot combination (`composeLayout`). Each piece is a button: tap to keep it in the next looks.
- **Hour rail:**
  - ticks every 2 hours
  - cobalt hatched segment for rain
  - ink bar for the hours the coat is on
  - ring for "now"
  - The plan line under the deck doubles as its legend.
- **Closet wall:**
  - Three columns, grouped by slot and sorted dark to light, so the closet reads as a gradient.
  - Each tile is tinted with the garment's own colour.
- **Tag card:**
  - The photo sits on its own colour tint.
  - Six picture tiles for the family, then at most four kinds.
  - A colour swatch.
  - Name, warmth, dressiness, pattern and rain behaviour are folded into one summary line.
- **Settings:** inset grouped lists, including **Your style** (what we've learned, the opt-in share toggle, how we pick looks) and **Forecast for** in a sheet.
- **Paywall:** an honest trial timeline (Day 1, Day 6 reminder, Day 8 choose a plan, no card until then) plus two plan cards.

## Accessibility
- **Contrast:**
  - Ink on every sky stop is 9.9:1 or more.
  - Secondary text on the sky uses `--ink-sky-2` (5:1 or more on every stop), because the usual `--ink-2` drops to 3.5:1 on frost and heat.
  - Cobalt on white is 7.4:1.
- **Targets:** at least 44px everywhere; the dock buttons are 52px.
- **Gestures:** every gesture has a button and a key. Pieces are buttons with `aria-pressed` and a spoken name and slot.
- **Reduced motion:** animations and transitions collapse to 1ms and the welcome sky stops drifting.
- **Dark mode:** garments get a faint light rim and a soft light pool behind them, so black clothes stay visible on a night surface.
