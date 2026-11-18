# Wearther Mode v4.2 — photo sources

> **v4.3 update (18 Nov 2026):** none of these URLs is hotlinked any more.
> Every photo below was downloaded to `photos/orig/`, compressed to
> `photos/small/` (products max 360 px q68, heroes max 560 px q70) and
> embedded as base64 in `wearther-v4.html` (416 KB total), because hotlinks
> to 20+ retailer CDNs did not load on the user's phone and silently fell
> back to SVG icons. The URLs below are kept as provenance only. London
> heroes are AI-generated sample models since v4.3 (see table).

Sample photos used in the interactive prototype `wearther-v4.html`.
They are **stand-ins only**: the real app shows the user's own closet photos
(the user photographs each item once). Retailer product images are
copyright of their retailers and are hotlinked here for the prototype only —
they must NOT ship in the production app. Pexels photos are free to use
(Pexels licence).

Preflight (2026-11-18): every URL below returned HTTP 200 with an image
content-type on `curl -I` with a Mozilla UA and a cross-origin Referer, and
the bytes were downloaded and visually checked (isolated product shot or
full-body model, no watermark, no collage). `&amp;` in the search results
was decoded to `&` — the URL itself is otherwise byte-for-byte as returned.

## Closet product photos (one per item)

| Item | Photo URL | Source page |
|---|---|---|
| s1 White tee | https://cdn.dsmcdn.com/ty410/product/media/images/20220426/19/98714817/460070127/1/1_org_zoom.jpg | https://www.trendyol.com/en/greenmint/unisex-white-t-shirt-mengerti-austin-city-limits-festival-kutakuasa-classic-p-288741202 |
| s2 Navy tee | https://anywear.com.pk/cdn/shop/files/NAVY_2_jpg.jpg?v=1782733087&width=300 | https://anywear.com.pk/products/copy-of-men-round-neck-cotton-t-shirts |
| s3 Grey long-sleeve | https://beselfstyle.com/cdn/shop/files/Gray-1_cf2a3d15-d78d-45cd-889f-403281b06045.jpg?v=1737171126&width=533 | https://beselfstyle.com/collections/t-shirts-long-sleeve |
| s4 Pale blue shirt | https://wayver.com.au/cdn/shop/files/Light_Blue_Oxford_Button_Down_1_by_Wayver_600x.jpg?v=1769129530 | https://wayver.com.au/products/button-down-oxford-shirt-light-blue |
| s5 Ecru linen shirt | https://bananaclub.co.in/cdn/shop/files/EcruBeigeBlendedLinenshirt_3.jpg?v=1747054354&width=3560 | https://bananaclubofficial.shop/products/ecru-beige-blended-linen-shir |
| s6 Grey merino knit | https://us.drakes.com/cdn/shop/products/DR2A3A21505-04600-1.jpg?v=1663185905&width=750 | https://us.drakes.com/products/grey-melange-merino-crew-neck-jumper-1 |
| s7 Bottle-green knit | https://www.jcrew.com/brand_creative/2025/202512-Dec/campaign_feat/m_sweaters_eiecs_4.jpg?wid=500 | https://go.shopmy.us/p-30921878 (J.Crew campaign image) |
| s8 Oat hoodie | https://ricoma.com/cdn/shop/files/maker-apparel-beige-hoodie-ricoma-embroidery-machines.webp?v=1749140249&width=800 | https://ricoma.com/collections/blanks/products/unisex-blank-hoodie-cotton-blend-for-dtf-embroidery |
| s9 Camel trench | https://images.selfridges.com/is/image/selfridges/R04382972_BEIGE_ALT02?wid=476&hei=634&fmt=webp&qlt=80,1&bgc=F6F6F6&extend=-18,0,-18,0 | Selfridges product image (no source page returned) |
| s10 Black puffer | https://modehaus-blum.com/cdn/shop/files/herren-steppjacke-mit-stehkragen-reissverschluss-und-leistentaschen-2.jpg?v=1757592936&width=1000 | https://modehaus-blum.com/collections/herren-winterjacken |
| s11 Olive rain jacket | https://img.thelasthunt.com/https%3A%2F%2Fs3.amazonaws.com%2Fsyncpigeon%2Falti_prod%2Fimages%2Frai-12210__front-well.jpg?w=2048&q=75 | https://60jo0npj0w2nhgaa.preview.thelasthunt.com/p/rains-pocket-rain-jacket-unisex-rai-12210 (Rains jacket) |
| s12 Mid-blue jeans | https://forage-clothing.com/cdn/shop/files/RegularFitJeans_midblue_533x.jpg?v=1760691989 | https://forage-clothing.com/collections/all?page=3 |
| s13 Charcoal trousers | https://cdn.suitsupply.com/image/upload/t_pdp-product-trousers-desktop/f_auto,q_auto,w_3500/products/trousers/default/b25201_28 | Suitsupply product image (no source page returned) |
| s14 Stone shorts | https://thumb.braavo.me/birden/1000/3522499335.webp | https://www.birden.com.br/prod/1950/walkshort-classic-chino-sand |
| s15 White sneakers | https://bellvar.com/cdn/shop/files/164.jpg?v=1772455313&width=832 | https://bellvar.com/collections/all |
| s16 Brown Chelsea boots | https://assets.kmart.com.au/transform/0e5a3cc8-7efb-4665-b45a-3c62ac3dd195/88455013-1?io=transform:fill,width:580,height:720 | Kmart Australia product image (no source page returned) |
| s17 Black loafers | https://gerardo.bg/cdn/shop/files/cherni-muzhki-loufuri-estestvena-kozha-ofitsialni.jpg?v=1773504466&width=360 | https://gerardo.bg/ |
| s18 Tan sandals | https://laranjalimashoes.vtexassets.com/arquivos/ids/2404425-1200-1200?v=639044596790630000&width=1200&height=1200&aspect=true | Laranja Lima product image (no source page returned) |

Notes on the product shots (visually checked 2026-11-18):
- Flat isolated shots on white: s1, s2, s3, s6, s7, s8, s10, s11, s12, s13, s14, s15, s16, s17.
- On-model studio shots, clean background: s4 (pale blue shirt), s5 (ecru linen shirt),
  s9 (camel trench, worn with jeans). These still read as the garment, not a lifestyle scene.
- s18 sandals are photographed on wood, not white — the warm background fits the palette.
- s11 is a sage-green hooded rain jacket (closest olive match found); s7's J.Crew image is a
  flat dark-green knit. s2's image is only 300px wide — fine at tile size.
- Heavy files (lazy-loaded, only shown at small sizes): s5 is 5.1 MB / 3560px,
  s13 is 1.1 MB / 3500px. In production these would be replaced by the user's own
  photos at sensible sizes.
- Rejected: the first white-sneakers pick (Amberjack) was a side view on a black
  background — wrong for the light theme; the first stone-shorts pick (Rontomson)
  returned 404 on preflight, and the Secretsales close-up was a cropped torso shot.

## Today hero — sample model photos (one per scenario × gender)

The hero photo shows a **similar look, not the exact pieces** — the caption in
the app says so. The exact pieces are the photo thumbnails in the list below
the hero. Looks 2–3 in a scenario reuse the same hero photo.

| Scenario | Male | Female |
|---|---|---|
| London (mixed, trench) | **AI-generated sample model (v4.3)** — `photos/orig/ai-male-london.jpg` (photorealistic studio shot, man wearing camel trench open over pale blue shirt, mid-blue jeans, brown Chelsea boots). No real person, no copyright issue. The Pexels photo 10995370 (cream coat) it replaced is kept in `photos/orig/male_london.jpg` (Pexels original, unused since v4.3). | **AI-generated sample model (v4.3)** — `photos/orig/ai-female-london.jpg` (photorealistic studio shot, woman wearing camel trench open over pale blue shirt, mid-blue jeans, brown Chelsea boots). No real person, no copyright issue. The Pexels photo 18904215 it replaced is kept in `photos/orig/female_london.jpg` (Pexels original, unused since v4.3). |
| Toronto (cold, puffer) | https://dtcralphlauren.scene7.com/is/image/PoloGSI/s7-AI710B15571004_alternate1?$rl_4x5_pdp_mob$ — Ralph Lauren studio shot (man in a black puffer, full body) | https://images.pexels.com/photos/6910653/pexels-photo-6910653.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1 — Pexels photo 6910653 (woman in a black puffer in snow) |
| Lisbon (hot, tee + shorts) | https://images.pexels.com/photos/18394309/pexels-photo-18394309/free-photo-of-apus-insorit-moda-om.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500 — Pexels photo 18394309 (man in a white tee and light shorts against a white wall; shoes are sneakers, not sandals) | https://images.pexels.com/photos/14083127/pexels-photo-14083127.jpeg?w=600 — Pexels photo 14083127 (woman in a white tee and denim shorts; the shorts are denim, not stone) |

Pexels photos are free to use under the Pexels licence. The Ralph Lauren image is
a retailer product photo (© Ralph Lauren, prototype only, as above).

Rejected model photos: the first male Toronto pick (Pexels 7823931) had a scarf
covering the model's face; the first female Lisbon pick (Pexels 8493537) was a
white crop top with an arms-up pose — not a modest match for a white tee.
The Tenson puffer alternative was a female model, so it was not used for the male set.

## Fallback

If any photo fails to load at runtime, the prototype swaps it back to the
grey SVG silhouette (`garmentSVG`) for a product, or to the SVG mannequin
(`modelSVG`) for the hero — so the app never shows a broken image.
