# Tiny Doors launch kit

Everything needed to launch Tiny Doors on Product Hunt, Hacker News and smaller launch sites. Prepared 20 November 2026.

| File | What's in it |
|---|---|
| [product-hunt.md](product-hunt.md) | Every Product Hunt form field (name, tagline, description, topics, pricing), the maker's first comment, ready replies, launch-day schedule in Sydney time |
| [show-hn.md](show-hn.md) | Hacker News "Show HN" title, link, first comment and timing |
| [other-sites.md](other-sites.md) | Reusable copy (one line, short, medium, facts sheet), plus Reddit, Indie Hackers, Uneed/Peerlist/Microlaunch/Fazier, BetaList, AlternativeTo |
| [product-hunt/](product-hunt/) | `gallery-1.png` … `gallery-6.png` (1270×760), `thumbnail-240.png`, `thumbnail-240-animated.gif` |
| [screenshots/](screenshots/) | Real captures: all nine worlds, opened doors, the editor, phone views |
| [source/gallery.html](source/gallery.html) | Editable source of the gallery slides |

## Before you launch — blockers

The launch will send people to tinydoors.app, so these from [docs/LAUNCH.md](../../docs/LAUNCH.md) need to be done first:

- [ ] **Production sign-in.** Add the production `/auth.html` callback URLs to Supabase's redirect allowlist and set the Site URL to https://tinydoors.app. Then send yourself a sign-in email on tinydoors.app. Without this, visitors can build a calendar but can't save or share it.
- [ ] **Live payments.** Production has paid checkout disabled. Install the live Stripe key, Price and webhook secret, and do one real A$6.99 purchase and refund. Otherwise every Season Pass upsell from the launch is lost.
- [ ] **Separate test data** from production in Supabase, or exclude test purchases from entitlement checks (see LAUNCH.md).
- [ ] **Deploy the latest commit** (12-door calendars, links and video) to production, if it isn't there yet, with `npm run deploy:production`, after applying the `calendar_schedules_and_video` migration.
- [ ] Check `https://tinydoors.app/api/health` reports `paidLaunchReady: true`.
- [ ] Make a public demo calendar with every door unlocked, to link from Show HN and replies.
- [ ] Optional: record a 30–45 s video for Product Hunt (shot list in product-hunt.md).

## Suggested dates

December 1 is a Tuesday, so the useful window is the week before.

| Date (Sydney) | What |
|---|---|
| Fri 20 – Mon 23 Nov | Fix the blockers. Schedule the Product Hunt launch. Submit to the smaller boards (their queues take days) |
| **Tue 24 Nov, 7:01 pm** | **Product Hunt goes live** (12:01 am Pacific, Tuesday 24) |
| **Thu 26 Nov, 1:00 am** | **Show HN** (9 am Eastern, Wednesday 25) |
| Sat 28 Nov | Reddit: r/webdev Showoff Saturday, r/SideProject, r/threejs |
| Sun 29 – Mon 30 Nov | Facebook groups and local subreddits: "last chance to set one up before December 1" |
| Mid-December | Indie Hackers post. Remind people it isn't too late: the daily 12-door calendar starts on 13 December |

Thursday 26 November is US Thanksgiving, so US traffic will be lower that day and the day after. Launching Product Hunt on the Tuesday avoids it.

## Regenerating the images

The slides use the real screenshots in `screenshots/`. To change the text, edit `source/gallery.html`, start the local server (`python3 -m http.server 5178` in the repo root) and render each slide:

```bash
for i in 1 2 3 4 5 6; do google-chrome --headless=new --hide-scrollbars --window-size=1270,760 --virtual-time-budget=6000 --screenshot=marketing/launch/product-hunt/gallery-$i.png "http://localhost:5178/marketing/launch/source/gallery.html?s=$i"; done
```

New screenshots can be taken the same way from `3d.html` (see the URL flags in the main README), e.g. `3d.html?theme=space&skip&day=9&to=Emma&from=Grandma`.
