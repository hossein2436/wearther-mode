# PRD: Wearther Mode, your closet, dressed for today's weather

_Status: v2, gate 1 approved with changes · 17 Nov 2026 · Market: global English_
_Evidence for every market claim is in [research.md](./research.md)._

## 0. Gate-1 decisions (these override anything below)
| # | Decision | Effect |
|---|---|---|
| D-name | Product name is **Wearther Mode** | Used in all UI and docs |
| D-platform | **v1 ships as a PWA** (installable web app). Native iOS/Android comes later, once the PWA is fully working | The Expo/native architecture in §9 is now the **v2 (native) plan**. The v1 architecture is §9a |
| D-server | The owner has a **small server**. It hosts the API: weather proxy, accounts, photo storage, background removal | Removes the "no backend" constraint |
| D-weather | Weather comes from an **open/free source read on our server**. Default: MET Norway Locationforecast (free incl. commercial, CC BY 4.0). Option: self-hosted Open-Meteo | See research §7 |
| D-closet | The user photographs their clothes **once**. The app **remembers** them and builds outfits from them every time the app opens. New photos only when the user buys something new | The closet is persisted on the device (IndexedDB) **and** backed up to the server per account, so it survives storage eviction or a phone change |
| D-money | **7-day free trial, then paid** | Paywall at trial end. The §8 recommendation is replaced. Needs accounts and a web payment provider |

## 1. Problem
People own enough clothes but still lose time, and sometimes get the weather wrong, every morning. Existing closet apps make you catalogue for hours before they're useful (Indyx's own estimate is about 2 min per item across about 166 items), and their weather logic is shallow (one review complained of a cardigan suggested at 100°F). Weather apps tell you the temperature, or dress a generic avatar, but don't know what's in your closet.

**Core idea (original, Persian):** «عکس لباسهای مختلفی که خودم توی کمدم دارم یه بار بدم به اپ، با توجه به وضعیت هوا، ست کنه برام که چی بپوشم هر روز»
"I photograph my clothes once. Every day the app combines them into an outfit for me based on the weather."

## 2. Positioning
> **For** busy people who own more clothes than they wear, **Wearther Mode** is the outfit forecast that dresses you from **your own closet** for **the hours you're actually outside**. **Unlike** closet apps that need hours of setup and treat weather as decoration, it works from 15 items and treats weather as a hard rule, not a hint.

Three proof points to land in every surface:
1. **Ready in 3 minutes.** Bulk import, automatic cutouts, a useful first outfit from 15 items.
2. **Dressed for your whole day.** Hour-by-hour layering between leaving and getting home, not one morning temperature.
3. **Private by default.** Your closet stays on your phone.

## 3. Personas
| Persona | Context | Job to be done | Must-have |
|---|---|---|---|
| **Maya, the hybrid commuter (primary)** | 29, office 3 days a week, lives in a city with changeable weather, about 10-minute mornings | "When I wake up, tell me what to wear from what's clean, so I'm comfortable all day and out the door fast." | A daily outfit in 1 tap, layering for the commute home, laundry awareness |
| **Sam, the intentional minimalist** | 34, capsule wardrobe, men's sizing, tracks spending | "Help me actually wear what I own and stop buying duplicates." | No-repeat logic, wear log, cost-per-wear (v1.1) |
| **Priya, the frequent traveller** | 41, 2–3 business trips a month | "Before a trip, tell me what to pack from my closet for that city's forecast." | Trip packing mode (v1.1) |
| _Cross-cutting trait: thermal comfort_ | Some users run cold, others run hot | "Account for how *I* feel the temperature." | A thermal-profile setting from onboarding |

## 4. Jobs to be done
1. **Main job:** decide today's outfit quickly with confidence that it fits the weather. (Functional + emotional: "I won't be cold at 6 pm.")
2. **Related job:** rediscover forgotten clothes and avoid repeats.
3. **Related job:** pack for a trip without overpacking.
4. **Consumption job:** get my closet into the app without a weekend of work.

## 5. Scope (MoSCoW)
Scoring for each item is in [feature-shortlist.md](./feature-shortlist.md).

### MVP (v1.0): Must
- **Guided starter import:** a "start with 15 items" checklist, bulk multi-select from the photo library or camera, on-device background removal, on-device dominant colour, and fast tag confirmation with chips. Optional AI auto-tagging is decision D3.
- **Item model:** category/slot, colours, pattern, warmth level (1–5), formality (1–5), seasons, weather flags (waterproof / not rain-safe / breathable), and a status (available / in the wash / stored).
- **Weather:** location (one-time or manual city), an hourly forecast covering the user's **leave-home and return-home times**, and an offline cache with a stale-data notice.
- **Outfit engine v1:** deterministic scoring for warmth vs. feels-like temperature across the time window, rain, wind, UV, colour harmony, recency, and learned likes. Every outfit comes with a "why".
- **Today screen:** hero outfit, a **Plan B** alternative, **lock-and-reshuffle**, and "Wear this" to log it.
- **Thermal profile:** "I run cold / neutral / warm", plus a next-morning one-tap check-in ("Yesterday: too cold / just right / too warm") that tunes the user's offset.
- **Feedback lite:** 👍/👎 on an outfit adjusts item and pair weights on-device.
- **No-repeat and laundry:** anything worn N times goes into the wash automatically (user setting), plus a "Laundry done" bulk reset.
- **Morning notification** at the user's chosen time: "12°→7°, rain at 6 pm: trench + knit + chelsea boots."
- **Settings and privacy:** export the closet (zip), delete all data, units (°C/°F), and the data-use disclosure.

### v1.1: Should
- Home-screen and lock-screen widgets
- Calendar-aware occasion and formality
- Trip packing mode
- Closet insights (cost-per-wear, never-worn, palette)
- Full swipe-to-learn preference model
- Outfit memory ("what you wore on a similar day")
- Premium subscription (see §8)

### Later: Could
- Gap finder
- Screenshot/share-sheet import of products
- Cloud backup and multi-device sync (needs accounts)
- Apple Watch complication
- Localization

### Won't (this cycle)
- Social feed
- Marketplace or resale
- Virtual try-on
- Shopping affiliate links
- Human stylists

## 6. Success metrics
| Metric | Definition | Target hypothesis (validate in beta) |
|---|---|---|
| **Activation** | Adds **15+ items** within 7 days of install | ≥ 45% of installs |
| Time to first outfit | Install → first outfit shown | Median ≤ 3 min |
| **D7 / D30 retention** | Opens the app or widget on day 7 / day 30 | ≥ 30% / ≥ 15% |
| **Outfit accept rate** | Outfits marked "Wear this" ÷ outfits shown as the hero | ≥ 40%; with Plan B or reshuffle ≥ 65% |
| Weather-fit satisfaction | Next-morning check-in answered "just right" | ≥ 70% |
| Crash-free sessions | Store vitals or a privacy-respecting crash reporter (needs approval) | ≥ 99.5% |

## 7. Privacy stance
- **Local-first.** Photos and the closet database live on the device, in the app sandbox, covered by OS device backups.
- **No account in the MVP**, so no login wall. This also means the 5.1.1(v) account-deletion requirement doesn't apply while we have no accounts.
- **Network calls:**
  - Weather: sends only a coarse geocell (about 0.1°), never precise coordinates.
  - Optional AI tagging (if approved): the image is sent over TLS, processed and **not stored**, and the toggle is opt-in.
- **No ads, no data selling.** Analytics only if you approve them (D6).

## 8. Monetization: **7-day free trial, then subscription** (decided at gate 1)
- **The trial starts** when the user saves their closet (account created with an email one-time code). No card is needed to start.
- **On day 5** an in-app banner appears, plus a push if the user has allowed notifications: "2 days left".
- **On day 8** the Today screen shows the paywall:
  - The closet stays viewable and exportable (we never hold user data hostage).
  - Generating outfits needs a subscription.
- **Price to test:** $3.99/mo or $24.99/yr `[hypothesis]`.
- **Payment provider:** decision G2-3. Web PWAs can't use App Store or Play billing. Stripe Billing or a merchant-of-record such as Paddle or Lemon Squeezy (they handle global sales tax) both support trials. The owner's legal entity and country decide which providers are available.

## 8-old. Earlier recommendation (superseded)
- **Ship the MVP free, with no paywall.** Validate activation and D30 first, and build entitlement checks in from day one.
- **Introduce Premium in v1.1** (freemium):
  - **Free forever:** unlimited items (Acloset's 100-item cap is a known irritant), the daily outfit, Plan B, reshuffle, notifications.
  - **Premium:** trip packing, calendar-aware styling, insights, gap finder, extra widget styles.
  - **Price to test:** $3.99/mo or $24.99/yr with a 7-day trial. That's below Acloset Premium ($9.99) and Cladwell ($7.99/mo), and in the band of weather-first apps ($19.99/yr). All `[hypothesis]`.
  - **Paywall placement:** contextual only, when the user opens a Premium feature. Never on first launch and never blocking the daily outfit.

## 9a. v1 architecture: PWA + owner's server (decided at gate 1)

### Client (PWA)
- **Framework:** Vite + React + TypeScript (strict), installable via a web manifest and a service worker (Workbox).
- **Storage:** IndexedDB holds the closet, cutout images and wear log. It is offline-first: Today works with no network from the cached forecast.
- **Persistence:** the app calls `navigator.storage.persist()`. iOS users are nudged to "Add to Home Screen", because Home Screen web apps keep their own storage and aren't hit by Safari's 7-day cap (research §8).
- **Notifications:** Web Push for the morning outfit. On iOS 16.4+ this works **only after the user adds the app to the Home Screen**.

### Server (owner's machine, Docker Compose)
- **`api`** (Node + Fastify, TypeScript) handles:
  - Auth: email one-time code; session cookie with HttpOnly, Secure and SameSite flags.
  - Trial and subscription state.
  - Closet backup and sync (item JSON + images).
  - Web Push sending.
- **`weather`** module:
  - Fetches MET Norway Locationforecast with a proper User-Agent and coordinates truncated to 4 decimals (we use about 0.1°, so a city-level cell).
  - Honours `Expires` and `If-Modified-Since`.
  - Computes the **feels-like temperature** (wind chill / heat index) server-side, because the source gives temperature, wind and humidity rather than an apparent temperature.
  - Returns a compact hourly JSON with attribution.
- **`cutout`** worker: Python + `rembg` (MIT) with a commercially licensed model. BiRefNet is MIT-licensed. Bria RMBG is excluded because it is non-commercial. It removes the background and returns a PNG. The original photo is deleted after processing.
- **Database:** SQLite, upgradable to Postgres. Images go on disk or an S3-compatible store (MinIO).

### Engine
- Same design as below: pure TypeScript `src/engine/`, shared by the PWA now and the native app later.

## 9. Native-app architecture (v2, after the PWA) and tradeoffs

### Stack
- **Framework:** Expo SDK 58 (latest stable), TypeScript strict, expo-router, EAS Build/Submit.
- **Storage:** `expo-sqlite` for the closet database. Images go in the app documents folder as WebP: a cutout plus a thumbnail.

### Native module
- An **in-repo Expo Module `closet-vision`**:
  - iOS 17+ Vision foreground mask.
  - Android ML Kit Subject Segmentation.
  - Returns a PNG cutout plus the dominant colours.
- On iOS < 17, or when segmentation fails, it falls back to the original photo with a soft crop.

### Engine
- A pure TypeScript `src/engine/`, deterministic and fully unit-tested.
- Candidates come from slots: top + bottom or a one-piece, an optional mid layer, an optional outer layer, shoes, and optional accessories.
- Each candidate is scored on:
  - **Warmth fit:** summed warmth units vs. the target derived from feels-like temperature, checked at the **coldest and warmest hours** of the window. Removable outer layers bridge the gap.
  - **Hard constraints:** no item flagged as not rain-safe when rain probability ≥ threshold; no heavy outerwear above a temperature ceiling (the "no cardigan at 100°F" rule).
  - **Formality coherence.**
  - **Colour harmony:** neutral-anchored rules plus complementary and analogous hue rules.
  - **Recency penalty and learned weights.**
- The warmth-unit table is calibrated against published clothing-insulation (clo) values. Source citation is due in Phase 3 `[to source]`.

### Backend (needs your approval, D1)
- A **stateless edge proxy** that holds the weather API key and caches by geocell and hour.
- Optional AI-tagging endpoint with rate limiting and no persistence.

### Tradeoffs
| Decision | Gain | Cost / risk |
|---|---|---|
| Local-first, no accounts | Zero login friction, a privacy story, no account-deletion flow | No multi-device sync; data loss if the device backup is off |
| On-device segmentation | Free, private, offline | Needs iOS 17+ for best results; ML Kit is still beta (no SLA) |
| Rule-based engine over an LLM | Deterministic, testable, explainable, $0 per outfit | Less "stylish" novelty. Mitigated by learned weights and reshuffle |
| Edge proxy | Hides keys, cuts weather calls 10× or more | A small server to own (cost and uptime) |

## 10. Risks and mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Users abandon during import | High | High | Starter-15 checklist, bulk import, background processing queue, "good enough" tags, progress celebration |
| Bad suggestions erode trust (the Cladwell pattern) | Med | High | Weather hard constraints, a "why" on every outfit, Plan B, thermal check-in, engine test suite |
| Segmentation quality (hangers, busy backgrounds, dark items) | Med | Med | Shooting tips overlay, manual crop fallback, keep the original photo |
| ML Kit beta API changes | Low-Med | Med | Isolate it behind the `closet-vision` module interface |
| Weather licensing or cost at scale | Med | Med | Geocell cache, fixed-price plan, provider abstraction (switch to WeatherKit) |
| Strong overlap with Layerly or Acloset | Med | Med | Lead with time-window layering, 3-minute setup, privacy. Test Layerly before gate 2 |
| App Review rejection (weather attribution, permission strings, privacy labels) | Med | Med | Phase 4 checklist and attribution component built into the weather card |

## 11. Decisions still open (gate 2)
- **G2-1:** Should the server keep closet photos as a backup (recommended, so the closet "is remembered" even if the browser storage is wiped), or should photos stay device-only?
- **G2-2:** MET Norway (free, light) or self-hosted Open-Meteo (about 50–150 GB of disk and sync jobs)? MET's terms must be accepted by you personally, not by an agent.
- **G2-3:** Payment provider, which depends on your company's country.
- **G2-4:** Does the trial require an email at the start (recommended), or can users start without an account?
