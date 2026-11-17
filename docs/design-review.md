# Design self-review against Apple HIG and Material 3 (gate 2)

Prototype: [Wearther Mode prototype](https://claude.ai/artifact/Vy64Dq7DKiqbUGaDp8kTLy) · Screenshots: `docs/screens/` (iPhone 15 at 393×852 @3x in light and dark; Pixel 8 at 412×915 @2.625x)

## What passes
- **Touch targets ≥ 44 pt.** Chips are 36 pt visually, but their hit area is extended to 44. Lock buttons are 44×44 around a 28 pt glyph.
- **Navigation:** a bottom tab bar with 4 destinations (HIG tab bar / M3 navigation bar), with text labels on every tab.
- **Sheets for transient tasks:** paywall, install guide, notifications, delete confirmation. They close with the scrim, a Close button or Escape, and focus returns to the trigger.
- **Native controls** for time and select inputs, so each platform shows its own picker.
- **Light and dark themes** follow the system setting. Text contrast is WCAG AA in both.
- **Reduced motion:** the outfit reveal becomes a 120 ms crossfade, and sheets fade instead of rising.
- **Permissions in context:** location, photos and notifications are each preceded by an explanation and have a fallback (type a city, camera instead of library, notifications off).
- **Text equivalents:** the Day Ribbon has a full sentence for screen readers. Rain is shown by icon and hatching as well as colour.

## Deviations to fix in Phase 3

| # | Deviation | Guideline | Fix |
|---|---|---|---|
| 1 | The active tab is marked by colour only (ink vs grey) | M3 navigation bar uses an active-indicator pill. WCAG 1.4.1 (colour alone) | Add a pill behind the active icon and a bolder label |
| 2 | Bottom sheets show a drag handle but can't be dragged down to close | HIG sheets / M3 bottom sheets | Add drag-to-dismiss, or remove the handle |
| 3 | No edge-swipe back in an installed iOS web app (standalone mode has no system back gesture) | HIG navigation | Keep a visible Back button on every pushed screen (done), and add a swipe-from-left gesture |
| 4 | The brand typeface replaces SF Pro / Roboto, and text size follows the browser setting, not iOS Dynamic Type | HIG typography | A deliberate brand choice. Test at 200% browser zoom, and in Phase 3 consider `font: -apple-system-body` scaling on iOS |
| 5 | Lock buttons in the flat-lay overlap the garment art on small widths | HIG layout margins | Move the lock into a corner gutter below 360 pt width |
| 6 | Swipe-to-confirm on the tag card only works on the photo area | Gesture discoverability | Already backed by buttons. Add a one-time hint animation the first time a tag card appears |
| 7 | The outfit engine put a linen shirt under a merino knit at −5° | Product quality, not HIG | Add a fabric/season tag and use it in the engine (Phase 3) |

## Notes for the native version later
- On iOS the tab bar should become a native `UITabBar` (Liquid Glass on iOS 26+) and sheets should use detents.
- On Android, use the M3 navigation bar with an active pill, and predictive back.
