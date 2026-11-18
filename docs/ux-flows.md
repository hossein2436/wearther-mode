# Wearther Mode: UX Flows and Information Architecture (Phase 2, PWA v1)

## Information architecture
```
Tab bar
├── Today ─────────── hero outfit · Day Ribbon · why · Wear this · Plan B · Reshuffle (+lock)
│                     cards: morning check-in, trial countdown, offline/stale, install hint
├── Closet ────────── grid · filters (category, status) · Laundry done
│    └── Item ─────── photo · tags · status · weather flags · delete
├── Add ───────────── photos (multi-select or camera) → cutting out → confirm tags (one card per item)
└── Settings ──────── my day (leave/return) · I run cold/warm · units · morning notification
                      · install on Home Screen · subscription · privacy · export · delete all data
Modal: Paywall (day 8+) · Install sheet (iOS) · Permission explainers
```

## Flow 1: First run → first outfit (target ≤ 3 min)
```
Welcome ──▶ Your day (leave 08:00 / back 18:00, skippable)
        ──▶ How do you feel the cold? (cold / about average / warm)
        ──▶ Where are you? [Use my location] or [Type a city]   (explainer before the OS prompt)
        ──▶ Starter closet: progress toward the minimum (1 top · 1 bottom or dress · 1 pair of shoes),
            suggested 15: 4 tops, 2 bottoms, 2 mid layers, 2 jackets, 3 shoes, 2 other
              ├─ [Choose photos] multi-select up to 30
              └─ [Take a photo] camera, with shooting tips
        ──▶ Cutting out… (queue, items appear one by one; the user can start confirming)
        ──▶ Confirm tags: one card per item; chips prefilled; swipe right or "Looks right" = confirm
        ──▶ When the minimum is met: "See today's outfit" is enabled at any time
        ──▶ Save your closet: email → 6-digit code → trial starts (7 days)
        ──▶ Today (outfit reveal)
```
**Decision point G2-4:** if you prefer, the email step can move to day 7 so it doesn't sit in the middle of onboarding. Then the closet is device-only until the user signs up.

## Flow 2: Daily use (the job we're hired for)
```
Morning push (07:30): "12° → 7°, rain at 18:00. Trench, grey knit, dark jeans, boots."
  └▶ Today
       ├─ Wear this ─▶ toast "Logged for today" · items' wear count +1 · auto-wash rule
       ├─ Plan B ────▶ alternative outfit (shares at most 1 piece with the first)
       ├─ Lock a piece + Reshuffle ─▶ new outfit keeping the locked piece
       └─ 👍 / 👎 ───▶ learns quietly; 👎 also offers a new outfit
Next morning: check-in card "Yesterday you wore the trench. How was it?" too cold / just right / too warm
```

## Flow 3: Adding new clothes later
`Add tab → Choose photos → Cutting out → Confirm tags → back to Closet with "3 items added"`. The rest of the closet is untouched. The app never asks for the whole closet again.

## Flow 4: Item edit and laundry
`Closet → Item → status (Available / In the wash / Stored), weather flags (Waterproof / Keep out of rain), tags → Save changes`.
Laundry: `Closet → filter "In the wash" → Laundry done → all back to Available`.

## Flow 5: Trial and paywall
| Day | Experience |
|---|---|
| 1–4 | Full app, plus 1 picture of a look on you. Small "6 days of your free week left" line in Settings |
| 5–7 | Banner on Today: "2 days left of your free week" with See plans |
| 8+ | 3 free looks in total. A note above the look says how many are left ("Free look. 2 more after this, then $1.99 a month.") |
| After the 3rd | Today shows "You've used your 3 free looks" and the paywall: one plan, $1.99/month, unlimited looks + 8 pictures on you a month. Closet, item edit and export stay available. Subscribing brings Today straight back |

## Flow 6: Install on Home Screen (iOS and Android)
- **Android / Chrome:** a native install prompt appears after the first outfit (`beforeinstallprompt`).
- **iOS Safari:** after the first outfit, a bottom sheet shows "Add Wearther Mode to your Home Screen. Your closet stays safe and morning outfits can reach you." It explains Share → Add to Home Screen with illustrations.
- **Morning notifications** are offered only inside the installed app on iOS, because iOS allows web push only there.

## Empty, error and offline states
| State | Copy | Action |
|---|---|---|
| Closet empty | "Your closet is empty. Add a few things you wear a lot and we'll start dressing you." | Choose photos |
| Not enough for an outfit | "Add shoes to get your first outfit." (names the missing slot) | Add shoes |
| No warm layer on a cold day | "It's 2° this morning and your closet has no warm jacket. Here's the warmest we can do." | Add a jacket |
| Background removal failed | "We couldn't cut this one out. It'll look fine as it is, or you can crop it." | Crop · Keep photo |
| Offline | "You're offline. Using the forecast from 07:12." | none |
| Forecast older than 12 h | "This forecast is from yesterday evening. Connect to update it." | Retry |
| Location denied | "No problem. Type your city instead." | City field |
| Everything in the wash | "Everything's in the wash. Mark laundry done when it's back." | Laundry done |
| Server unreachable during cut-out | "Cutting out is paused until you're back online. Your photos are saved." | none (auto-resume) |
