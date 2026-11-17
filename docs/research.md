# Research: Weather-Aware Outfit App (Phase 1)

_Researched 17 Nov 2026. Market: global English launch (App Store and Google Play)._
_Every factual claim links to its source. Unverified items are marked `[unverified]`. Prices are US App Store prices unless noted. They change often, so re-check them before pricing decisions._

---

## 1. Problem evidence

- A 2,000-woman survey by UK uniform maker Simon Jersey estimated **more than an hour a week** spent choosing outfits, about 12 min every workday morning. Two-thirds try on more than one outfit, and about 25% have arrived late to work because of it. ([Fox News / Newser](https://www.foxnews.com/health/women-spend-5-months-of-their-lives-deciding-what-to-wear), [Fox News](https://www.foxnews.com/lifestyle/women-spend-how-much-of-their-lives-deciding-what-to-wear))
- A Marks & Spencer survey of 2,000 adults put it at **17 min/day** for women. 15% of adults said they had chosen the wrong clothes and it soured their day. ([Yahoo](https://www.yahoo.com/lifestyle/time-000000511.html))
- ⚠️ Both are vendor-commissioned surveys and therefore marketing-grade evidence. Use them for positioning only, not for sizing the market.

**The real barrier is setup cost, not the morning decision itself:**
- Indyx estimates about **2 min per item**. Its average catalogued wardrobe holds **166 items**, and 25% of those went unworn in a year. That works out to about 5.5 hours of setup. ([Stacker syndication](https://www.thegardenisland.com/syndicated/can-you-really-organize-your-closet-with-an-app-how-to-tell-if-its-worth-your-time-to-set-one-up), [Action News Jax](https://www.actionnewsjax.com/news/can-you-really/SAF5WKSDZI3OTFHMH74AFBUQUY))
- Indyx users add an average of **59 new pieces a year**, so cataloguing never really ends. ([WSOC](https://www.wsoctv.com/news/can-you-really/SAF5WKSDZI3OTFHMH74AFBUQUY))
- Just Style reported that catalogue time is one of the biggest concerns for virtual-wardrobe users, and an app abandoned midway through setup costs time without paying it back. ([Stacker](https://stacker.com/stories/home-garden/can-you-really-organize-your-closet-app-how-tell-if-its-worth-your-time-set-one))

**Product implication:** whoever gets a user from "installed" to "a useful outfit from my own clothes" fastest wins activation. This is the biggest design constraint in the PRD.

---

## 2. Competitive teardown

### 2a. Closet-catalogue apps

| App | Digitizing items | Weather logic | Pricing (US) | Top complaints |
|---|---|---|---|---|
| **Whering** (UK) | Photo with auto background removal, AI tagging, retailer database, email-receipt parsing ([NeuronFeed](https://neuronfeed.com/startups/whering), [Econyl](https://www.econyl.com/?p=40959)) | Not weather-led. "Dress Me" gives randomized suggestions ([Indyx compare](https://myindyx.com/versus/whering-vs-cladwell?format=amp)) | Free core. Premium about $6/mo or $40/yr per a third-party chart `[unverified]` ([Wardrowbe chart](https://wardrowbe-landing.pages.dev/blog/wardrobe-app-comparison-chart-2026/)). Store listing claims 9M+ users ([App Store](https://apps.apple.com/gb/app/id1519461680)) | Crashes, lag, background-removal failures ([Kimola, Google Play reviews](https://kimola.com/reports/whering-digital-closet-stylist-user-feedback-report-google-play-en-144486)). AI outfits feel disjointed from personal style ([Indyx compare](https://myindyx.com/versus/save-your-wardrobe-vs-whering)) |
| **Acloset** (KR) | Photo with AI attribute tagging ([App Store](https://apps.apple.com/app/id1542311809)) | **Daily outfits based on weather and schedule.** Weather outfit widget ([App Store](https://apps.apple.com/app/id1542311809), [support](https://www.acloset.app/support/)). Trip packing with real weather ([Stork](https://www.stork.ai/en/acloset)) | All features free **up to 100 items**. Basic $3.99/mo or $27.99/yr, Premium $9.99/mo or $59.99/yr, Expert $24.99/mo or $147.99/yr ([Stacker](https://thebradentontimes.com/premium/stacker/stories/can-you-really-organize-your-closet-with-an-app-how-to-tell-if-itrsquos-worth-your-time-to-set,218054)). 4.3★ from 3.5K US reviews ([AppPricingLab](https://www.apppricinglab.com/app/apple/1542311809)) | The 100-item cap acts as a paywall. A competitor claims weather "isn't core to the workflow" (a biased source) ([Wardrowbe](https://wardrowbe-landing.pages.dev/blog/wardrowbe-vs-acloset/)). AI outfits get mixed reviews ([Indyx compare](https://www.myindyx.com/versus/acloset-cladwell)) |
| **Indyx** (US) | Photo with AI background removal. Paid in-home "Archivist" service **from $295** ([App Store](https://apps.apple.com/mz/app/id1599179405?l=en-gb)) | Not weather-led. Human stylists instead | Free core is unlimited. Insider $12.99/mo or $74.99/yr ([WFTV](https://www.wftv.com/news/can-you-really/SAF5WKSDZI3OTFHMH74AFBUQUY/)) | Calendar and outfit-builder UX were the top annoyances in the company's own survey ([Indyx blog](https://myindyx.com/blog/you-spoke-what-you-said)). To log a wear you must build an outfit first ([JustUseApp](https://justuseapp.com/en/app/1599179405/indyx-wardrobe-outfit-app/reviews)) |
| **Stylebook** (US) | Manual photos plus background-removal tools ([148apps](https://www.148apps.com/app/515126225/)) | None. Its Outfit Shuffle is random ([features](https://stylebookapp.com/features.html)) | **$4.99 one-time**, no free tier ([Stacker](https://www.thegardenisland.com/syndicated/can-you-really-organize-your-closet-with-an-app-how-to-tell-if-its-worth-your-time-to-set-one-up)). 4.7★ from about 8.7K reviews ([AppFollow](https://apps.appfollow.io/ios/stylebook/335709058?country=us)) | No mix-and-match suggestions ([App Store IN review](https://apps.apple.com/in/app/stylebook/id335709058)). Tagging each item by hand is slow ([App Store MY review](https://apps.apple.com/my/app/stylebook/id335709058)). No cross-device sync ([App Store NZ review](https://apps.apple.com/nz/app/stylebook/id335709058?uo=2)) |
| **Cladwell** (US) | Camera roll or pick from its own library. Background removal ([App Store CA](https://apps.apple.com/ca/app/cladwell/id1140550878)) | Daily outfits "based on your closet, the forecast, and wear frequency" ([App Store](https://apps.apple.com/pa/app/cladwell/id1140550878?l=en-GB)) | Free download, then $7.99/mo or $59.99/yr ([App Store US](https://apps.apple.com/app/id1140550878)) | **"100F weather and nearly every outfit is paired with a cardigan"** ([App Store US review](https://apps.apple.com/us/app/cladwell/id1140550878?l=ko)). "Weather is shown but the match doesn't consider it" ([App Store CA review](https://apps.apple.com/ca/app/cladwell/id1140550878)). Crashes, price ([App Store ZA](https://apps.apple.com/za/app/cladwell/id1140550878)) |
| **Smart Closet** (two different apps share the name) | Rabbit Tech version: pick items from brands, $2.99 upfront ([App Store](https://apps.apple.com/app/id1198057728)). A separate "Smart Closet: Your AI Stylist" lists weather-based suggestions ([App Store](https://apps.apple.com/us/app/id1263105601)) | Claimed in the listing `[unverified depth]` | $2.99 paid / freemium | Reviewer describes it as no-frills with manual tagging and no smart recommendations `[unverified; competitor blog]` ([Cufflink](https://cufflinkai-landing.pages.dev/blog/digital-closet-apps-comparison-2026)) |

### 2b. Weather-first outfit apps: the closest threat
These start from the forecast. Most use generic clothes or an avatar rather than the user's real closet.

- **Layerly ("Your Weather Stylist")**, iPhone only. It recommends outfits from real-time weather, personalized to whether you run hot or cold. It also has a digital wardrobe, gap suggestions and forecast-based travel packing lists. ([App Store](https://apps.apple.com/us/app/layerly/id6760975746)) The listing shows few ratings. **This is the nearest concept to ours. Download and test it before gate 2.**
- **Weather Fit**: forecast plus outfit advice, an avatar that models outfits, home and lock-screen widgets, and a subscription. ([App Store](https://apps.apple.com/kr/app/weather-fit-%EB%82%A0%EC%94%A8-%EC%98%B7-%EC%BD%94%EB%94%94-%EB%B0%8F-%EC%B2%AB%ED%99%94%EB%A9%B4-%EC%9C%84%EC%A0%AF/id1194408342?l=en-GB))
- **Weather Outfit – What to Wear**: learns from daily comfort feedback. $3.99/mo, $19.99/yr, or $69.99 lifetime. ([App Store](https://apps.apple.com/app/id6769089874))
- **Today's Fit**: shows what you wore on days with similar temperatures, using your own outfit photos. ([App Store](https://apps.apple.com/app/id6761530241))

### 2c. Takeaways
1. **The market is split.** Closet apps have the real wardrobe but weak weather logic. Weather apps have good weather logic but generic clothes. Our position is the intersection: **your real closet × your forecast hour by hour × setup in minutes.**
2. **Cladwell's "cardigan at 100°F" review is the clearest failure we can design against.** Weather has to be a hard constraint in the engine, not just a label on the screen.
3. **Thermal personalization ("I run cold") has precedent** (Layerly, Weather Outfit). That makes it table stakes, not a differentiator.
4. **Item caps behind a paywall annoy users** (Acloset's 100 items). Keep the closet unlimited on the free tier.
5. **Stability is a competitive weapon.** Whering and Cladwell both draw crash and lag complaints, so performance budgets belong in the acceptance criteria.

---

## 3. Weather API comparison

**Usage assumptions:**
- Each DAU triggers about 2 forecast fetches a day (morning plus one refresh).
- Without server caching: 10k DAU ≈ 600k calls/mo and 100k DAU ≈ 6M calls/mo.
- **With a geocell cache** (lat/lon rounded to about 0.1°, refreshed once an hour), cost scales with *distinct cells*, not users: 1,000 cells ≈ 720k/mo and 5,000 cells ≈ 3.6M/mo. The cell counts themselves are `[unverified estimate]`.

| Provider | Commercial terms | Free allowance | Cost @10k DAU | Cost @100k DAU | Hourly + feels-like | Notes |
|---|---|---|---|---|---|---|
| **Open-Meteo** | Free tier is **non-commercial only**. Commercial use needs a paid plan ([Terms](https://open-meteo.com/en/terms), [pricing](https://open-meteo.com/en/pricing)) | Free tier: 10k/day, 300k/mo, no commercial use ([pricing](https://open-meteo.com/en/pricing)) | **API Standard** covers 1M calls/mo. Price isn't published on the page, so request a quote `[unverified]` ([pricing](https://open-meteo.com/en/pricing)) | Professional covers 5M/mo. Enterprise covers more than 50M `[price unverified]` ([pricing](https://open-meteo.com/en/pricing)) | Yes: hourly `apparent_temperature`, precipitation probability, wind, UV `[verify fields in Phase 3]` | Fixed monthly plans, no per-call billing. Data under CC BY 4.0, so attribution is required ([GitHub](https://github.com/open-meteo/open-meteo/blob/main/README.md)) |
| **Apple WeatherKit** | Included with the Apple Developer Program ([Apple](https://developer.apple.com/weatherkit)) | **500k calls/mo included** ([Apple](https://developer.apple.com/weatherkit)) | Uncached: 1M tier **$49.99/mo** ([Apple](https://developer.apple.com/weatherkit/get-started/)) | Uncached: 10M tier **$499.99/mo** ([Apple](https://developer.apple.com/weatherkit)) | Yes | The REST API needs a signed JWT, so Android needs a server. Missing attribution is a common App Review rejection ([Axiom notes](https://charleswiltgen.github.io/Axiom/skills/integration/weatherkit)) |
| **OpenWeather One Call 3.0** | Pay per call | 1,000 calls/day free, then £0.0012/call ([OpenWeather](https://openweathermap.org/one-call-1-deprecated.md)) | Uncached: about **£684/mo** (calculated) | Uncached: about **£7,164/mo** (calculated) | Yes: 48-hour hourly forecast ([OpenWeather](https://openweathermap.org/test)) | Card required even on the free tier ([FreeAPIHub](https://freeapihub.com/apis/openweathermap-api)). Expensive at scale without caching |
| **Tomorrow.io** | Free plan meant for testing and small scale ([support](https://support.tomorrow.io/hc/en-us/articles/23554984091156-Tomorrow-io-Pricing-Overview)) | 500/day, 25/hour, 3/sec ([Tomorrow.io](https://tomorrow.io/a/faq/weather-api/what-is-rate-limiting-in-the-context-of-a-weather-api)) | Paid from about $49/mo `[unverified third-party]` ([APISpine](https://apispine.com/tomorrow-io-vs-openweathermap-api)) | Enterprise quote | Yes | Free limits are too low for production |

**Recommendation:** Open-Meteo **API Standard** behind a thin edge proxy with a geocell cache, which keeps call volume in the 1M tier well past 10k DAU. **Fallback:** WeatherKit. Its free 500k is attractive, but Android needs the same proxy for JWT signing.
**Blocker:** you have to get an Open-Meteo price quote (it's a paid service, so it needs your approval).

---

## 4. Background removal and auto-tagging

### On-device background removal (recommended for MVP)
- **iOS:** Vision `VNGenerateForegroundInstanceMaskRequest` gives class-agnostic subject lifting on **iOS 17+**. Below iOS 17, Vision can only segment people. ([Axiom Vision ref](https://charleswiltgen.github.io/Axiom/reference/vision-ref), [IMG.LY](https://img.ly/blog/how-to-remove-backgrounds-using-coreml/))
- **Android:** ML Kit Subject Segmentation.
  - Needs API 24+ and adds about 200 KB to the app; the model downloads through Play services. ([Google](https://developers.google.com/ml-kit/vision/subject-segmentation/android?hl=en))
  - It runs **fully on-device** but is **still in beta, with no SLA**. ([Google](https://developers.google.cn/ml-kit/vision/subject-segmentation?authuser=8))
  - Average latency is about 200 ms on a Pixel 7 Pro. ([Google](https://developers.google.com/ml-kit/vision/subject-segmentation?hl=zh-tw))
- **Expo packages:**
  - `react-native-background-remover` wraps both APIs. ([Socket](https://socket.dev/npm/package/react-native-background-remover))
  - `expo-segmentation` targets iOS 17 / API 24, needs a dev build and does not run in Expo Go. ([pkgstats](https://www.pkgstats.com/pkg:@westwood-dev/expo-segmentation))
  - Download counts for these packages are low. **Recommendation:** write a small in-repo Expo Module (about 150 lines per platform) rather than depending on a lightly maintained package.

### Cloud background removal (fallback only)
- Photoroom Remove Background API costs **$0.02/image**, with plans from $20/mo. ([Photoroom](https://photoroom.com/api/remove-background)) For a 60-item import that's about $1.20 per user. Use it only as a fallback for unsupported devices, and it needs your approval.

### Auto-tagging (category, colour, pattern, warmth, formality, season)
| Option | Privacy | Cost | Accuracy | Offline |
|---|---|---|---|---|
| On-device dominant colour (k-means on masked pixels) plus manual quick-chips for category | Best: nothing leaves the device | $0 | Colour is good. Category depends on the user | ✅ |
| On-device classifier (Vision / ML Kit image labeling) | Good | $0 | Generic labels ("clothing", "shoe"), weak on warmth and formality `[unverified]` | ✅ |
| Cloud vision-language model behind the proxy (opt-in, image not stored) | Photo leaves the device in transit | Low per item `[estimate in Phase 3 against current price sheets]` | Best at warmth, formality and fabric `[unverified]` | ❌ |

**Recommendation:** a hybrid. On-device colour and cutout, plus an **opt-in** "Auto-tag with AI" toggle (on by default with a clear disclosure, or off by default, which is your call at gate 1). The fallback is a fast swipe-style tag confirmation UI.

---

## 5. Platform and store constraints (verified Nov 2026)
- **Expo SDK 58** is the latest stable: released 15 Oct 2026, React Native 0.88, built for iOS 27. ([Expo](https://expo.dev/changelog/sdk-58.md))
- **Google Play:** new apps and updates must target **Android 16 (API 36)** from 31 Aug 2026. ([Google Play Help](https://support.google.com/googleplay/android-developer/answer/11926878?), [Android Developers](https://developer.android.com/google/play/requirements/target-sdk?hl=nl))
- **Apple 5.1.1(v):** any app that supports account creation must offer in-app account deletion. ([Apple](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion))

---

## 6. Name candidates
I couldn't check domain availability from this environment (WHOIS is blocked), so every domain below is `[unverified]`. The store checks are web searches, not trademark searches.

| Name | Store/web conflict found? | Notes |
|---|---|---|
| **Wearther** | None found in search | Weather + wear. Pronunciation can be ambiguous |
| **Dresscast** | None found in search | Clear "forecast" metaphor |
| **Closetcast** | None found in search | Clear but long |
| **Skyrobe** | Not checked `[unverified]` | Evocative and short |
| **Morning Layers** | Not checked `[unverified]` | Descriptive, good for ASO |
| ~~FitCast~~ | ❌ Taken: Korean App Store app and a Stanford project ([App Store KR](https://apps.apple.com/kr/app/fitcast-%EA%B8%B0%EC%98%A8%EB%B3%84-%EC%98%B7%EC%B0%A8%EB%A6%BC/id6474090221), [Stanford](https://web.stanford.edu/class/cs147/projects23/UnintentionalGood/FitCast/)) | Rejected |
| ~~Layerly / LayR / Layered~~ | ❌ Taken by direct competitors ([Layerly](https://apps.apple.com/us/app/layerly/id6760975746), [LayR](https://f4.fund/startups/layr-style), [Layered](https://drobinin.com/layered/)) | Rejected |

---

# Addendum (gate 1 → PWA-first, self-hosted server)

## 7. Open / free weather sources the owner's server can read

| Source | License / cost | Coverage and data | Running cost on a small server | Fit |
|---|---|---|---|---|
| **MET Norway Locationforecast 2.0** (api.met.no) | **Free, even for commercial use**. Data is CC BY 4.0 and attribution may sit on a separate, easy-to-find page ([FAQ](https://docs.api.met.no/doc/FAQ)) | Point forecast anywhere in the world: hourly temperature, wind, humidity, precipitation, UV `[verify fields: compact vs complete]` | Tiny: one HTTP fetch plus a cache | ✅ **Default** |
| **Self-hosted Open-Meteo** | Code is **AGPLv3**, unlimited calls when self-hosted ([open-meteo.com](https://open-meteo.com/)). Upstream model data is open | Many models (ECMWF, GFS, ICON…). Directly provides `apparent_temperature` | Heavy. One team reports **about 50 GB** of disk on a single VPS ([DEV](https://dev.to/feed/simplemeteo)). Full coverage advises **150 GB+ on NVMe** ([docs mirror](https://huggingface.co/spaces/soiz1/open-wether/blob/main/docs/getting-started.md)). Sync jobs run continuously | Option for scale or independence later |

### MET Norway rules we must build in ([Terms of Service](https://docs.api.met.no/doc/TermsOfService))
- An identifying User-Agent: app or domain name plus a contact email or website.
- Total traffic under **20 requests/second** for the whole app, and a **caching proxy** once traffic grows. Our server is that proxy.
- Respect `Expires` and use `If-Modified-Since`. Don't cluster requests at the top of the hour.
- **At most 4 decimals** in coordinates. 5 or more get a 403.
- Browsers should call our backend, not MET directly.
- **The terms must be accepted by a human in authority.** An AI agent can't accept them on your behalf, so **you** need to read and accept them before launch.
- No apparent temperature in the data, so our server computes feels-like with the standard wind-chill and heat-index formulas `[cite the NWS formulas in Phase 3]`.

## 8. PWA platform constraints (iOS is the strict one)
- **Storage:** Safari's 7-day cap on script-writable storage doesn't apply to Home Screen web apps. They have their own usage counter ([The Register, quoting WebKit](https://www.theregister.com/2020/03/26/apple_relax_were_not_totally/)), and Apple staff confirmed Home Screen apps don't have this limit ([Apple Dev Forums](https://developer.apple.com/forums/thread/710157)). `navigator.storage.persist()` is the standard way to ask for durable storage ([MDN](https://developer.mozilla.org/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)).
  → **Design:** an "Add to Home Screen" coach mark on iOS, plus a server backup of the closet as a safety net.
- **Push:** Web Push on iOS/iPadOS needs **16.4+**, the app **added to the Home Screen**, and a permission request **triggered by a user tap** ([WebKit](https://webkit.org/?p=13878), [PushAlert](https://pushalert.co/documentation/ios-web-push)).
- **Install prompt:** iOS has no `beforeinstallprompt`, so installation is manual via Share → Add to Home Screen ([MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)). We need our own instructions sheet.

## 9. Background removal for a web app (licenses matter for a paid product)

| Option | License | Verdict |
|---|---|---|
| `@imgly/background-removal` (in-browser) | **AGPL-3.0** ([bestofjs](https://bestofjs.org/projects/background-removal), [OSS Insight](https://ossinsight.io/analyze/imgly/background-removal-js)). Copyleft applies to network use, so our client code would have to be open-sourced, or we'd buy a commercial license | ❌ Avoid |
| Bria RMBG-1.4 / 2.0 models | **Non-commercial (CC BY-NC 4.0)**. Commercial use needs a Bria agreement ([model card](https://huggingface.co/cocktailpeanut/rm/blob/main/README.md), [Bria](https://gitserver.onethingai.com/ai-models/RMBG-2.0/src/commit/5676458b2a05527c7c13ab9b0a34f9a7bd38cc16/README.md)) | ❌ Avoid |
| **`rembg` on our server** (Python) | **MIT** ([GitHub](https://github.com/danielgatis/rembg)). Bundles several models, including BiRefNet variants ([libraries.io](https://libraries.io/pypi/rembg)) | ✅ **Recommended** |
| **BiRefNet** model | **MIT, commercial use OK** ([Replicate](https://replicate.com/sprited/birefnet/readme)) | ✅ Use the `birefnet-general-lite` variant on CPU `[benchmark speed on your server]` |

→ **Plan:** the PWA uploads a downscaled photo (≤1600 px). The server `cutout` worker returns a transparent PNG and **deletes the original**. The cutout is stored on the device and, if G2-1 is approved, in the user's server backup.
