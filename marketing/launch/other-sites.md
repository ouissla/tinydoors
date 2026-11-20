# Other launch sites — Tiny Doors

Product Hunt and Show HN are the two big ones. These are worth a few minutes each. Most of them ask for the same few things, so the reusable copy is at the top.

---

## Reusable copy

**One line (≤ 80 characters)**
```
A personalised digital advent calendar inside a tiny 3D village.
```

**Short (≤ 160 characters, for meta fields and "short description")**
```
Fill 24 little 3D houses with your photos, notes and mini games, then send one link. A new door opens every day in December. Free to make.
```

**Medium (~500 characters)**
```
Tiny Doors is a digital advent calendar you make for someone you love. Choose a little 3D world (a snowy village, Aussie beach boxes, gingerbread houses, a moon base and more) and put a surprise behind each door: a photo they wipe the frost off, a note, a voucher, a short video, a link or a mini game. Send one link. It opens in any browser with no app or account, and a new door unlocks every day in December. Two worlds are free; a one-off A$6.99 Season Pass unlocks seven more.
```

**Facts sheet**
| | |
|---|---|
| Website | https://tinydoors.app |
| Try it | https://tinydoors.app/editor.html?new |
| Category | Gifts, family, holidays, web app |
| Platforms | Web (phone, tablet, desktop, smart TV browser) |
| Languages | English, French |
| Pricing | Freemium: 2 free worlds; Season Pass A$6.99 once per Christmas (up to 5 premium calendars) |
| Launched | November 2026 |
| Made in | Australia |
| Logo | `assets/brand/icon-512.png` (square), `assets/brand/favicon.svg` (vector) |
| Social card | `assets/brand/social-en.png` (1200×630) |
| Screenshots | `marketing/launch/screenshots/` and `marketing/launch/product-hunt/gallery-*.png` |

**Keywords / tags**
`advent calendar`, `digital advent calendar`, `christmas gift`, `personalised gift`, `long-distance family`, `photo gift`, `three.js`, `3d`, `web app`

---

## The sites

Ordered by how useful they're likely to be for a consumer Christmas product launched this late in November.

### 1. Reddit
The best fit for a consumer gift, but every subreddit has its own self-promotion rules. Read the sidebar first, post as yourself, and reply to comments.

| Subreddit | Angle | Title idea |
|---|---|---|
| r/SideProject | Maker story | I built a digital advent calendar where each day is a little 3D house you fill with photos |
| r/threejs | Tech | Nine Christmas villages built entirely in code with Three.js, no model files (advent calendar project) |
| r/webdev (Showoff Saturday only) | Tech | [Showoff Saturday] An advent calendar in a procedurally built 3D village |
| r/InternetIsBeautiful | The thing itself | A digital advent calendar where you hide photos and mini games behind 24 tiny doors |
| r/LongDistance | Use case | Made something for long-distance couples this December (free) |
| r/australia, r/melbourne, r/sydney | Local | Made a summer-Christmas advent calendar with beach boxes and a surfing Santa |

Post a short GIF or the `gallery-3.png` image (all worlds) with the link in the first comment, where rules allow it.

### 2. Indie Hackers
https://www.indiehackers.com — add Tiny Doors as a product, then write a post. Indie Hackers readers like numbers and honesty more than polish. Angle: *"Launching a seasonal product with a 5-week sales window"*: why a one-off A$6.99 pass instead of a subscription, how you built it, what launch day brought in. A follow-up post in January with real numbers usually does better than the launch post.

### 3. Uneed, Peerlist Launchpad, Microlaunch, Fazier
Smaller Product Hunt-style daily/weekly launch boards, mostly makers. Free listings often have a queue of days or weeks, and most offer a paid option to skip it. With December 1 so close, only pay to skip if the date you'd get is after ~28 November. Use the reusable copy above plus `gallery-1.png` to `gallery-6.png` (they're the right shape for these sites too).

### 4. BetaList
https://betalist.com — built for early-stage startups. The free queue is long (often weeks), so it's probably **too slow for this Christmas**. Worth submitting now for next season, or skip it.

### 5. AlternativeTo and SaaSHub
Evergreen directories that people find through search. List Tiny Doors as an alternative to other digital advent calendars (e.g. e-card advent calendars and photo-calendar apps). Takes 10 minutes and keeps sending a trickle of visits every November.

### 6. Facebook groups
Not a launch site, but probably the biggest audience for this product: grandparent groups, expat groups ("Brits in Australia", "Aussies in London"), parenting groups and long-distance relationship groups. Many ban promotion, so ask an admin first or post only in "promo day" threads.

---

## Tracking

Give each site its own `ref` so you can see what worked:

```
https://tinydoors.app/?ref=producthunt
https://tinydoors.app/?ref=hn
https://tinydoors.app/?ref=reddit-sideproject
https://tinydoors.app/?ref=indiehackers
```

The homepage's canonical tag means these variants don't create duplicate pages in search. Check whether your analytics (Cloudflare Web Analytics or similar) records the query string; if it doesn't, the `Referer` header still shows the site.
