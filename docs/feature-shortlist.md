# Feature Shortlist: RICE scoring

_RICE = Reach × Impact × Confidence ÷ Effort._
- **Reach:** % of monthly active users who touch the feature in a quarter.
- **Impact:** 3 = massive, 2 = high, 1 = medium, 0.5 = low.
- **Confidence:** how sure I am of the estimate.
- **Effort:** person-weeks for one engineer with AI assistance.

_All inputs are my estimates from the research. Recalibrate them after beta._

| # | Feature | R | I | C | E | **RICE** | Release | Rationale / evidence |
|---|---|---|---|---|---|---|---|---|
| N1 | **Starter-15 guided import** _(new)_ | 100 | 2 | 70% | 1 | **140** | **MVP** | Setup time is the #1 barrier (about 2 min per item, about 166 items). Lowers the bar to a first useful outfit |
| 6 | **Lock and reshuffle** | 80 | 2 | 80% | 1 | **128** | **MVP** | Cheap once the engine ranks candidates. Gives the user control, which offsets the "outfits don't fit my style" complaints |
| N2 | **Thermal profile + morning check-in** _(new)_ | 90 | 2 | 70% | 1 | **126** | **MVP** | Layerly and Weather Outfit both personalize comfort, so it's table stakes. The check-in turns it into learning |
| 8a | **Morning push notification** | 70 | 2 | 70% | 1 | **98** | **MVP** | Retention driver. Local notifications need no backend |
| N3 | **Weather-safety item flags** (waterproof / not rain-safe) _(new)_ | 60 | 1 | 70% | 0.5 | **84** | **MVP** | Makes "weather as a hard rule" concrete (no suede in rain) |
| 2 | **Feels-like layering engine** (time window) | 100 | 3 | 70% | 3 | **70** | **MVP** | The core differentiator. Answers Cladwell's "cardigan at 100°F" failure |
| 5 | **No-repeat and laundry state** | 80 | 1 | 80% | 1 | **64** | **MVP** | Cladwell users complain about outfits that include items in the laundry |
| 1 | **Fast closet import** (bulk, cutout, auto-tags) | 100 | 3 | 80% | 4 | **60** | **MVP** | Highest effort (native module), but nothing works without it |
| 3 | **Plan B outfit** | 60 | 1 | 70% | 1 | **42** | **MVP** | Nearly free: it's the 2nd-ranked diverse candidate |
| 7 | **Swipe-to-learn** (full deck + model) | 70 | 1 | 50% | 2 | 18 | v1.1 | The MVP ships 👍/👎 pair-weights. The full deck waits for data |
| N4 | **Outfit memory**: similar-weather days _(new)_ | 50 | 0.5 | 50% | 1 | 12 | v1.1 | Precedent in "Today's Fit". Needs the wear log to fill up first |
| 10 | **Closet insights** (cost-per-wear, never-worn, palette) | 40 | 1 | 60% | 2 | 12 | v1.1 (Premium) | Standard in Stylebook and Indyx. Good Premium value |
| 4 | **Calendar-aware occasion** | 40 | 1 | 50% | 2 | 10 | v1.1 (Premium) | Acloset uses schedule. Event titles are noisy, so keywords and manual flags come first |
| 9 | **Trip packing mode** | 25 | 2 | 60% | 3 | 10 | v1.1 (Premium) | High value for Priya but low reach. Acloset and Layerly already have it |
| 8b | **Home-screen widget** | 40 | 1 | 60% | 3 | 8 | v1.1 | Needs a native widget target in Expo (extra build complexity). Acloset and Weather Fit offer one |
| 11 | **Gap finder** | 30 | 1 | 40% | 2 | 6 | Later | Insight only, no shopping. Needs a mature closet and engine |
| N5 | **Screenshot / share-sheet import** _(new)_ | 30 | 1 | 50% | 3 | 5 | Later | Whering does email-receipt parsing. Speeds up adding new purchases |

## MVP cut line
**In the MVP:** N1, 6, N2, 8a, N3, 2, 5, 1, 3, plus 👍/👎 feedback lite. This is about 13.5 person-weeks of feature work before QA and store work `[estimate]`.

**Why the widget isn't in the MVP despite being on the brief:** it's a separate native target with its own data-sharing plumbing (an App Group on iOS) and adds risk to the first store submission. The morning push delivers most of the same value for an effort of 1.
