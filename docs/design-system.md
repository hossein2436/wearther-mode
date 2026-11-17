# Wearther Mode: Design System (Phase 2)

## Concept: "the day, worn"
Weather apps give you a number. Closet apps give you a grid. Wearther Mode puts **your day's weather** and **your own clothes** on the same screen, and only one element gets to be loud: the **Day Ribbon**.
- The Day Ribbon is a horizontal band covering the hours between leaving home and getting back, coloured by feels-like temperature.
- Rain is marked where it falls.
- The removable layer is shown spanning the hours you'll need it.

Everything else stays quiet: fog background, slate ink, and clothing cutouts on plain white tiles, so the photos are the hero.

### Plan review against the brief (what I changed and why)
- **First idea:** a sky-gradient hero, like a generic weather app. **Rejected:** decorative, and it's what every forecast app does. **Revised to:** a gradient that *is data*. Colour stops come from the hourly feels-like temperature of *your* window, so the colour means something.
- **First idea:** a cream background with a serif display. **Rejected:** that's a common AI default and has nothing to do with weather. **Revised to:** cool "overcast" fog and a grotesk with strong numerals. Temperatures are the main typography.
- **First idea:** cards for everything. **Revised to:** outfit pieces are cutouts on one flat-lay surface. Cards are used only where something can be acted on as a unit (tag-confirm card, check-in card).
- **Meta strings** like "Thu · Tehran · 12°" were replaced with plain sentences ("Thursday 18 November in Lisbon").

## Colour tokens
| Token | Light | Dark | Use |
|---|---|---|---|
| `--fog` (background) | `#EEF1F4` | `#18202B` | App background (overcast / night) |
| `--paper` (surface) | `#FFFFFF` | `#222C39` | Item tiles, sheets |
| `--ink` (text) | `#1B2430` | `#E8EDF2` | Primary text, primary button fill |
| `--ink-2` (secondary text) | `#5A6675` | `#A3AFBD` | Secondary text. AA on fog: 5.4:1 light / 6.9:1 dark |
| `--line` | `#D5DBE2` | `#344255` | Dividers, outlines |
| `--rain` | `#3D6FB6` | `#7FA9E6` | Rain markers, links, focus ring |

**Temperature ramp** (data only, never decoration). Feels-like °C is mapped through these stops:

| Stop | Colour | Feels-like |
|---|---|---|
| frost | `#8FB3E0` | ≤ 0° |
| chill | `#A9CBD8` | 8° |
| mild | `#B9D7B4` | 15° |
| warm | `#F2D27A` | 23° |
| hot | `#F0A07A` | ≥ 30° |

The Day Ribbon draws the ramp. The Today header is tinted with the window's mean colour at 18% over `--fog`. Text on the ribbon always sits outside it, so contrast never depends on the ramp.

## Typography
- **Typeface:** **Schibsted Grotesk**, the only family. It was cut for a Nordic news publisher (forecast-page heritage), has sturdy tabular figures, and has enough weight range to run display numerals and UI.
- **Scale:** 6 steps on a 1.25 ratio, rem-based so it follows the browser and OS text size.

| Role | Size / line-height | Weight | Notes |
|---|---|---|---|
| `display` | 56/56 | 700 | Temperature range only. Tabular figures, −2% tracking |
| `title` | 28/32 | 700 | Screen titles |
| `heading` | 20/26 | 600 | Section headings |
| `body` | 17/24 | 400 | Matches the iOS body size |
| `small` | 14/20 | 500 | Secondary text, chip labels |
| `micro` | 12/16 | 500 | Ribbon hour ticks only |

- **Sentence case everywhere.** No all-caps labels and no eyebrow labels.

## Spacing, shape, elevation
- **Grid:** 4-point base. Spacing steps 4, 8, 12, 16, 24, 32, 48. Screen side padding 20.
- **Radius scales with size**, not one value everywhere:
  - chips: 999
  - buttons: 14
  - tiles: 16
  - sheets: 24 on the top corners
- **Elevation:** only on sheets and the tab bar (`0 -1px 0 var(--line)` plus a blurred backdrop). Item tiles are flat on white.
- **Touch targets:** ≥ 44×44 pt everywhere, including chips (visual height 32 with padding for the hit area).

## Components
| Component | States |
|---|---|
| Primary button (ink fill) | default, pressed (scale .98), disabled (40%), loading (spinner, label kept) |
| Secondary button (outline) | same states |
| Chip (choice, filter) | off, on (ink fill), focus ring |
| Item tile | default, locked (lock badge + ink outline), in the wash (55% opacity + label), selected |
| Day Ribbon | normal, rain hours, layer span, stale data (dashed outline + "Forecast from 07:12") |
| Tag card | suggested (tags labelled "suggested"), confirmed |
| Sheet | half, full; drag handle; Escape and swipe-down to dismiss |
| Tab bar | 4 tabs: Today, Closet, Add, Settings. Icon + label, active = ink |
| Banner | trial countdown, offline, install hint |

## Motion
| Moment | Spec | Reduced motion |
|---|---|---|
| Outfit reveal (open Today, Plan B) | Pieces settle into the flat-lay: opacity 0→1, translateY 8→0, 40 ms stagger, 280 ms `cubic-bezier(.2,.8,.2,1)` | Instant crossfade, 120 ms |
| Reshuffle | Unlocked tiles flip out and the new ones in: 220 ms. Locked tile stays still | Crossfade, 120 ms |
| Tag-card swipe | Follows the finger. On release past 30% width: 240 ms exit with slight rotation | Buttons only |
| Sheet | 300 ms spring-like ease | Fade, 120 ms |

There is **one orchestrated moment** (the outfit reveal). Nothing animates on its own after that.

## Accessibility
- WCAG 2.2 AA contrast for all text, in both themes.
- Visible focus ring: 2 px `--rain`, 2 px offset.
- Every tile has an accessible name, e.g. "Navy trench coat, outer layer, locked".
- The Day Ribbon has a text equivalent: "From 08:00 to 18:00 it feels 12° falling to 7°, rain from 18:00".
- Respects `prefers-reduced-motion`, `prefers-color-scheme`, and text size up to 200% (layout reflows; the ribbon stays legible).
- No information carried by colour alone: rain also has an icon and text, and temperature is printed as numbers.
