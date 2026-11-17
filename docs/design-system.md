# Wearther Mode: Design System v3, "Weather toy box"

_v3, 17 Nov 2026. Replaces v2. Screens: `docs/screens/v3/`._

## Idea
The day's **weather mood paints the whole app** in one saturated colour, and everything you touch is **soft, chunky and a little 3D** (clay): cards with a lit top edge, buttons with real depth, garments with a highlight. The weather is alive on Today:
- rain streaks fall
- snow drifts
- warm light floats up

References (Mobbin, iOS):
- [Sunlitt](https://mobbin.com/screens/6939e78b-ae10-4d7a-aea0-0493a5290bc2): full-screen saturated colour, pill chips
- [(Not Boring) Weather](https://mobbin.com/screens/b998bfe3-fafc-4142-8891-4a87aecd2d9a): chunky playful 3D
- [Tubi](https://mobbin.com/screens/7e852d98-72e7-4857-8069-1a32294755f3): the card deck

## Moods (`tokens.css`)
| Mood | When | Colours | Text |
|---|---|---|---|
| rain | 2+ wet hours | `#2A35D8` to `#3F59EE` | white |
| frost | mean feels < 4° | `#7B95FF` to `#B9C9FF` | `#0B1440` |
| cool | < 14° | `#2FBFAE` to `#9CE6D2` | `#04302B` |
| mild | < 20° | `#9BDC5B` to `#E2F59E` | `#16300A` |
| sun | < 27° | `#FFC53A` to `#FFE58C` | `#3A2400` |
| heat | ≥ 27° | `#FF6B3D` to `#FFA47A` | `#3A0E00` |

**Contrast:** text passes AA on both ends of every gradient (6.0 to 12.2:1), except the white text on rain's lighter end, which was darkened to `#3F59EE` to pass.

**Where the mood shows:**
- The mood is set on `.app` (`state/day.ts`), so the tab bar's liquid blob, kept pieces, meters, toggles and timelines all take the day's colour.
- Off Today, the canvas is the mood's light colour at 26% over warm white.

**Dark mode:**
- Moods are deepened with near-black.
- Text is white.
- Cards are `#1F2129`.

## Type
Bricolage Grotesque variable (self-hosted, OFL).

| Use | Size | Weight | Width |
|---|---|---|---|
| Temperatures (tabular figures) | 84 | 800 | 75% |
| Titles | 38 | 800 | 80% |
| Verdict | 26 | 800 | 80% |
| Body | 17 | 440 | |

## Clay surfaces and controls
- **Cards:** radius 36. The `--clay` shadow is a lit top edge, a darker bottom edge, and a mood-tinted drop shadow.
- **Buttons:** pills that sit on a 5px edge and press down 4px when tapped.
  - The primary button has a slow shine sweep.
  - Love is pink (`#FF3D7F`), the only colour that never changes with the mood.
- **Selected chips, tiles and plans** lift 3px and get an ink outline with an ink edge.
- **Toggles:** a bouncy knob on the mood colour.
- **Settings rows:** each has a gradient squircle icon.

## Icons and illustration
- **Weather glyphs** (`WeatherGlyph.tsx`): clay SVG with radial fills, specular highlight and contact shadow.
  - sun: rays turn
  - heat: sun pulses
  - partly and cloud: cloud drifts
  - rain: drops fall
  - snow: flakes fall
- **Garments:** shared `ClayDefs` gradients give every illustrated garment a soft top-left light and a rim highlight.
- **UI icons:** rounded 2.1 strokes, with a duotone fill when active (tab bar, tips, place pill).

## Motion and effects (all off with reduced motion)
- **Sky particles:** a canvas layer per mood: rain, snow, or light motes. It pauses in background tabs.
- **Temperature:** counts up on first load.
- **Deck:**
  - Pieces spring in, then idle-float.
  - With a mouse, the card tilts toward the pointer and a glare follows.
  - Drag left gives another look; drag right loves it with a heart burst and a haptic tap.
- **Wear this:** confetti in the mood and outfit colours, a three-tap vibration, and a "Worn today" stamp that lands, then settles into the corner.
- **Tab bar:** the blob slides with an overshoot and the icon hops.
- **Sheets:** spring up.
- **Toasts:** pop in.

## Layout of Today
1. Place pill.
2. Hero: temperatures plus a clay glyph.
3. Verdict.
4. Look deck.
5. Hour capsules: icon, feels-like temperature, and a bar on the hours the coat is on.
6. Why it works.
7. Dock: ✕, **Wear this**, ♥.
8. Floating clay tab bar.
