# Redesign pass, AI try-on, and how outfits are judged

_17 Nov 2026. Covers the Mobbin-referenced redesign of Today, Add and onboarding; a proposal for "see it on me" AI try-on; and the honest answer to "how does the app know what looks good?"_

## 1. References (Mobbin, iOS)

| Pattern we took | Where it comes from |
|---|---|
| Outfit is the first thing under a compact weather line; temperature small, top corner | [Whering planner](https://mobbin.com/screens/5584ee39-8566-4469-9970-80da382a7dc7), [Alta home](https://mobbin.com/screens/54b0699d-3414-42be-b2d2-123612dc358b) |
| One plain forecast sentence instead of a data dump | [The Weather Channel home](https://mobbin.com/screens/2a9e8135-5669-4923-a97b-48fed3144d5e) |
| Compact hourly temperature bar as the single loud element | [(Not Boring) Weather](https://mobbin.com/screens/010e9637-bca5-4ea0-a7fb-2f28c190b1ce) |
| Two pinned actions under the outfit, one primary | [Doji "Style Me / Try on"](https://mobbin.com/screens/99f86f35-6924-4bde-a89f-ef1d546124f3) |
| Category first, then items | [Whering wardrobe](https://mobbin.com/screens/c53e1545-692b-4996-87da-7ec8ccb483c6), [Alta closet](https://mobbin.com/screens/01c40467-c11f-4fed-948c-b7faac932601) |
| Full-body capture with a guide silhouette (for try-on, later) | [UNIQLO MySize camera flow](https://mobbin.com/flows/0f980d52-29c5-4de7-9fa4-09f10a574fb1), [CapCut AI model](https://mobbin.com/flows/dce47208-c91e-4fc5-af30-2f2a33fb2dcd) |

## 2. Critique → fix

| Finding (principle, severity) | Fix shipped |
|---|---|
| "Wear this" sat under the tab bar; outfit started at 40% of the screen (visual hierarchy, false floor; 3) | Header cut to one line + temp; **Wear this** pinned above the tab bar with Shuffle beside it |
| Four identical lock icons on every outfit (Von Restorff, H8; 2) | Pieces are the control: tap to keep. A lock badge shows only on kept pieces |
| Ribbon had no key (H6 recognition over recall; 2) | Legend under the ribbon: feels like · rain · layer on (only the parts present) |
| Plan B, Reshuffle, 👍, 👎 all equal weight (Hick; 2) | Segmented Today / Plan B; 👍/👎 demoted to a "Good pick?" row; one primary button |
| No payoff after "Wear this" (Peak-End; 2) | Pieces lift in sequence, then a check stamp: "Logged. Have a good day." Reduced motion: fade only |
| Install card came back every visit (goodwill; 1) | "Not now" is remembered |
| Tag card showed 19 kind chips + 5 fields per item (Tesler, excise; 3) | Pick a family (6 chips) → exact kind (≤4). Name, warmth, dressiness, rain folded into "Name, warmth and more" with a summary line |
| 4 onboarding steps before the closet (goal gradient; 2) | Hours and "how you feel the cold" merged: 3 steps |

Screens: `docs/screens/redesign/` (`before-*`, `after-*`, `before-after.png`).

## 3. AI try-on ("see it on me") — proposal, needs approval

**Idea:** the user takes one full-body photo; the app renders the chosen outfit on it.

**Options checked (Nov 2026):**
- **Hosted APIs.** FASHN: about $0.075 per image on demand; its Try-On Max endpoint costs 4 credits per image. Google Vertex `virtual-try-on-001`: about $0.06 per image, but third-party trackers list it for deprecation on 15 Mar 2027.
- **Open-source models.** Most popular ones (IDM-VTON, OOTDiffusion, CatVTON, StableVITON) are licensed non-commercial and can't ship in a paid app. FASHN VTON v1.5 (Jan 2026) is Apache-2.0, but it needs a GPU; our small server can't run it.

**Unit cost:** try-on APIs dress one garment per call. A 3–4 piece outfit is therefore 2–3 chained calls, roughly $0.15–0.25 per render. A daily render for every user would cost more than the $3.99 subscription, so the feature must be **on tap, capped** (for example 10 renders a month) or a higher tier.

**Privacy:** a full-body photo is sensitive.
- Explicit opt-in.
- Stored only on our server, encrypted, deletable in Settings.
- Sent to the provider only at render time.
- Choose a provider whose terms exclude training on inputs.

**Plan:** v1.1, behind a provider interface (FASHN first; self-hosted FASHN VTON on a rented GPU if volume justifies it). Capture screen with a body-outline guide (UNIQLO pattern). **Blocked on:** approval to create a paid API account.

## 4. How the app judges "good together"

Today it is **rules, not taste**. Each candidate outfit is scored on:
1. weather fit (hour-by-hour comfort, rain, wind)
2. colour harmony on the hue wheel, with neutrals as free passes
3. how evenly dressy the pieces are
4. variety (not worn recently)
5. your own 👍/👎 history per pair of items.

**Why rules are a reasonable start**
- Stylists' colour guidance is widely shared:
  - neutrals as a base
  - analogous colours for calm looks
  - complementary colours for contrast
  - navy and olive treated as neutrals.
- Lab studies show harmony is **not universal**. In one study, ratings for 300 jacket/trouser colour pairs differed by style, sex and age group. That is why personal feedback outweighs any fixed rule.

**Why we don't just train on a public dataset**
- The academic standard is Polyvore outfit data, used for compatibility scoring and fill-in-the-blank tasks.
- Polyvore is gone (acquired by SSENSE, image URLs dead).
- The datasets ship under research or unclear licences, so they are risky for a paid product.

**Upgrade path (in order)** — steps 1–3 are now built, see §5.
1. Score lightness and saturation contrast, not only hue. Hue-only harmony is a known limitation.
2. A short, stylist-written rule table: shoe/trouser formality, pattern mixing, one statement piece.
3. Learn from our own users' opt-in 👍/👎 data, a model trained on what our users actually wear.
4. Optional: a vision model reviews the flat-lay before showing it.

Sources: fashn.ai pricing and changelog, fashn.ai open-source VTON comparison, Replicate IDM-VTON page, Hugging Face OOTDiffusion discussion, Google Cloud Virtual Try-On docs, getmaxim.ai and futureagi model trackers, Huang et al. 2017 "Color Harmony in Two-piece Garments" (Color Res. & App.), Han et al. 2017 Polyvore dataset (github.com/xthan/polyvore-dataset), Vasileva et al. 2018 (arXiv 1803.09196).

## 5. Style engine v2 (built, 17 Nov 2026)
`src/engine/style.ts`, `rules.ts` and `taste.ts`, with tests in `src/engine/__tests__/style.test.ts`.

1. **Perceptual colour.**
   - Colours are converted to OKLCH (OKLab), not HSL. Every garment gets a stylist's colour family. Navy, denim, camel, brown, olive, black, white and grey count as neutrals.
   - Each look gets a **scheme**: neutral, tonal, neutral plus one colour, analogous, complementary, triadic or clash.
   - It also gets a **lightness contrast** (low, mid or high) between the upper body and legs, and a count of **loud** pieces (high chroma).
2. **Stylist rule table.**
   - Declarative rules, each with a weight and a human reason. Examples:
     - neutral base with one colour
     - tonal looks
     - softened complementary colours
     - clash
     - at most one loud piece
     - darker on the bottom grounds it
     - shoes echo the top
     - shoes at the same dress level
     - shoes at least as dark as the trousers in smart looks
     - boots with shorts
     - hoodie under a blazer
     - denim on denim without contrast
     - one smart piece lifts a casual look
     - one pattern at a time
   - Patterns are a new optional tag.
   - The best reason is shown on the look card ("Neutral base, blue as the one colour").
3. **Learned taste.**
   - An online logistic model over anonymous look features: scheme, contrast, dress level, accent families, family pairs, kinds and the rules that fired.
   - The signals and their strength:
     - wear: strong yes
     - love: strongest yes
     - swipe-away: weak no
     - dislike: strong no
   - Weights are bounded. Settings shows "What we've learned" and can reset it.
4. **Community prior (opt-in, off by default).**
   - If the person turns on "Help improve picks for everyone", their anonymous feature lists and yes/no labels are sent in batches.
   - The server stores only counts per feature: no user id, no items, names or photos (`taste_stats`; tested).
   - `GET /api/taste/prior` returns weights for features seen at least 20 times.
   - New users start from that prior. It fades to 20% weight as their own signals grow.
5. **Not built:** the vision-model review, because it needs a paid API and your approval.
