# User Stories: Wearther Mode

_Format: As a … I want … so that …, followed by Given/When/Then acceptance criteria. Each story is tagged **MVP**, **v1.1** or **Later**._
_Personas: Maya (commuter), Sam (minimalist), Priya (traveller). See [prd.md](./prd.md)._

---

## E1. Onboarding and permissions

**US-1.1 · MVP.** As a new user, I want to see the value in one screen and start without an account, so that I'm not put off before trying.
- **Given** a first launch, **when** the app opens, **then** I see a 1-screen value pitch and a "Start with 15 items" CTA, with no sign-up.
- **Given** I tap the CTA, **then** I'm in the import flow in ≤ 2 taps.

**US-1.2 · MVP.** As a user, I want each permission explained before the OS prompt, so that I trust why it's needed.
- **Given** a feature needs photos, location or notifications, **when** I first use it, **then** an explainer screen appears before the system dialog.
- **Given** I deny a permission, **then** the feature offers a working fallback: camera instead of library, manual city instead of location, no reminder.

**US-1.3 · MVP.** As Maya, I want to set my usual leave-home and return-home times, so that outfits cover my whole day.
- **Given** onboarding, **when** I reach "Your day", **then** I can set leave and return times (defaults 08:00–18:00) and skip the step.
- **Given** these times are set, **then** the engine evaluates the hourly forecast across that window.

**US-1.4 · MVP.** As a user, I want to say whether I run cold or warm, so that suggestions match how I feel.
- **Given** onboarding, **then** I can pick Run cold / Neutral / Run warm, and this shifts the warmth target by a fixed offset.

---

## E2. Closet import

**US-2.1 · MVP.** As Maya, I want to select many photos at once, so that adding my closet is fast.
- **Given** library permission, **when** I multi-select up to 30 photos, **then** they all queue for processing and I can keep using the app.
- **Given** processing finishes, **then** each item shows a cutout thumbnail within 3 seconds per item on a mid-range 2023 device.

**US-2.2 · MVP.** As a user, I want backgrounds removed automatically, so that my closet looks clean.
- **Given** iOS 17+ or a supported Android device, **when** an item is processed, **then** the background is removed on-device with no network call.
- **Given** segmentation fails or isn't supported, **then** the original photo is kept with a soft crop and an "Adjust crop" option.

**US-2.3 · MVP.** As a user, I want tags pre-filled so that I only confirm or correct them.
- **Given** a processed item, **then** the dominant colours are pre-filled on-device, and category, warmth and formality appear as one-tap chips.
- **Given** AI tagging is enabled (decision D3), **then** all fields are pre-filled and marked "suggested".
- **Given** I swipe right on the tag card, **then** the tags are accepted and the next item appears.

**US-2.4 · MVP.** As a new user, I want a checklist of which 15 items to add first, so that I get good outfits quickly.
- **Given** the starter flow, **then** I see slots such as "3 tops, 2 bottoms, 1 mid layer, 1 jacket, 2 shoes…" with progress.
- **Given** the minimum slots are filled (at least 1 top, 1 bottom or 1 one-piece, and 1 pair of shoes), **then** "See today's outfit" is enabled.

**US-2.5 · MVP.** As a user, I want photo tips while shooting, so that cutouts come out well.
- **Given** the camera, **then** an overlay suggests a plain background, flat lay or hanger, and good light.

---

## E3. Item management

**US-3.1 · MVP.** As a user, I want to edit, archive or delete an item, so that my closet stays accurate.
- **Given** an item, **when** I open it, **then** I can edit any tag, set its status (Available / In the wash / Stored), or delete it after confirmation.

**US-3.2 · MVP.** As a user, I want to mark weather properties, so that the app never puts suede in the rain.
- **Given** an item edit screen, **then** I can toggle waterproof, not rain-safe and breathable.
- **Given** an item is flagged not rain-safe and the rain probability in my window is ≥ 50% (configurable), **then** that item is excluded from the hero outfit.

**US-3.3 · MVP.** As Sam, I want to browse and filter my closet, so that I can find items quickly.
- **Given** the Closet tab, **then** I can filter by category, colour, status and season, and the grid scrolls at 60 fps with 300 items.

---

## E4. Weather

**US-4.1 · MVP.** As a user, I want weather for my location or a chosen city, so that outfits fit where I am.
- **Given** location permission, **then** the forecast uses a geocell rounded to about 0.1°.
- **Given** no permission, **then** I can search for and set a city manually.

**US-4.2 · MVP.** As a user, I want the app to work offline, so that I still get an outfit on the subway.
- **Given** no network, **when** I open Today, **then** the last cached forecast is used and a "Forecast from 07:12" notice appears.
- **Given** the cache is older than 12 hours, **then** the notice reads "Forecast may be out of date".

**US-4.3 · MVP.** As a user, I want a compact day summary, so that I understand the outfit choice.
- **Given** Today, **then** I see the window's min and max feels-like temperature, rain timing, wind and UV in one line, plus the required provider attribution.

---

## E5. Daily outfit

**US-5.1 · MVP.** As Maya, I want one confident outfit when I open the app, so that I'm dressed in seconds.
- **Given** at least the minimum closet and a forecast, **when** I open Today, **then** a hero outfit renders in ≤ 1 second from cache.
- **Given** the outfit, **then** a "why" line explains the choice, for example "Cool morning, 18° by 2 pm: knit over tee, trench for the 6 pm rain."

**US-5.2 · MVP.** As a user, I want outfits to respect the weather, so that I'm never over- or under-dressed.
- **Given** a max feels-like temperature ≥ 28°C, **then** no heavy mid-layer or outerwear (warmth ≥ 4) appears in the hero outfit.
- **Given** a min feels-like temperature ≤ 5°C, **then** the outfit includes an outer layer if the closet has one, or else shows a "No warm jacket in your closet" note.
- **Given** a temperature swing ≥ 8°C across the window, **then** the outfit includes a removable layer and the "why" mentions it.

**US-5.3 · MVP.** As a user, I want a Plan B, so that I have an option if I don't like the first one or the forecast is uncertain.
- **Given** Today, **then** one tap shows Plan B: the highest-scoring outfit that shares at most 1 item with the hero.

**US-5.4 · MVP.** As a user, I want to lock an item and reshuffle the rest, so that I can build around a piece I want to wear.
- **Given** an outfit, **when** I lock an item and tap Reshuffle, **then** a new outfit keeps the locked item and changes at least one other slot. If no valid alternative exists, a message says so.

**US-5.5 · MVP.** As a user, I want to tap "Wear this", so that my wear history and laundry update.
- **Given** I tap Wear this, **then** each item's wear count and last-worn date update, and items that reach the auto-wash threshold move to "In the wash".

---

## E6. Feedback and learning

**US-6.1 · MVP.** As a user, I want to 👍/👎 an outfit, so that suggestions improve.
- **Given** 👎, **then** the pair-weights between its items decrease and a new outfit is offered.
- **Given** 👍, **then** the pair-weights increase.
- **And** all learning stays on-device.

**US-6.2 · MVP.** As a user who runs cold, I want a next-morning check-in, so that the app learns my comfort.
- **Given** I wore an outfit yesterday, **when** I open the app, **then** a dismissible card asks "too cold / just right / too warm", and my answer adjusts my thermal offset within bounds.

**US-6.3 · v1.1.** As a user, I want to swipe through outfit ideas, so that the app learns my style faster.
- **Given** the Discover deck, **then** each swipe updates the preference model, and Today's ranking changes measurably after 20 swipes.

---

## E7. Laundry and repeats

**US-7.1 · MVP.** As Sam, I want recently worn combinations avoided, so that I wear my whole closet.
- **Given** an outfit worn in the last N days (default 7), **then** that exact combination is not shown as the hero.

**US-7.2 · MVP.** As a user, I want to mark laundry done in bulk, so that items come back quickly.
- **Given** items "In the wash", **when** I tap Laundry done, **then** they all return to Available.

---

## E8. Notifications and widgets

**US-8.1 · MVP.** As Maya, I want a morning notification with today's outfit, so that I decide before I'm out of bed.
- **Given** notifications are allowed and a time is set, **then** a local notification arrives with the temperature range, a rain alert and the outfit summary.
- **Given** the forecast fetch fails, **then** the notification uses the cached forecast or is skipped. It is never wrong without saying so.

**US-8.2 · v1.1.** As a user, I want a home-screen widget, so that I see the outfit without opening the app.
- **Given** the widget is installed, **then** it shows the hero outfit thumbnail and the temperature range, refreshed each morning.

---

## E9. Calendar and occasion

**US-9.1 · v1.1.** As Maya, I want important meetings to raise formality, so that I'm dressed right for my day.
- **Given** calendar permission and an event whose title matches keywords I've configured, or an event I've flagged, **then** the formality target rises and the "why" mentions the event.

---

## E10. Trip packing

**US-10.1 · v1.1.** As Priya, I want a packing list from my own closet for a destination and dates, so that I pack less and right.
- **Given** a city and dates within the forecast horizon, **then** I get a capsule of items that maximizes the number of valid outfits for that forecast, plus a checklist.
- **Given** dates beyond the forecast horizon, **then** the list uses climate normals and says so.

---

## E11. Insights

**US-11.1 · v1.1.** As Sam, I want cost-per-wear and never-worn items, so that I shop smarter.
- **Given** items with a price and a wear log, **then** Insights shows cost-per-wear, the never-worn list (90 days or more) and the wardrobe colour palette.

**US-11.2 · Later.** As a user, I want to know which single item would unlock the most new outfits, so that my next purchase is useful.
- **Given** the closet, **then** the gap finder simulates adding archetype items and shows "+N outfits", with no shopping links.

---

## E12. Settings, data and privacy

**US-12.1 · MVP.** As a user, I want to export my closet, so that I own my data.
- **Given** Settings → Export, **then** a zip with images and JSON is created and shared via the OS share sheet.

**US-12.2 · MVP.** As a user, I want to delete all data, so that I can leave cleanly.
- **Given** Settings → Delete all data and a typed confirmation, **then** the database and images are wiped and the app returns to onboarding.

**US-12.3 · MVP.** As a user, I want °C/°F and clear privacy information, so that the app fits me and I trust it.
- **Given** Settings, **then** I can switch units, and the Privacy screen states plainly what leaves the device.

**US-12.4 · Later.** As a user with two devices, I want cloud backup, so that I don't lose my closet.
- **Given** an account (Later), **then** sync is available and in-app account deletion is provided (Apple guideline 5.1.1(v)).
