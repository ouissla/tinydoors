# Product Hunt — Tiny Doors

Everything to paste into the Product Hunt "Submit" form, in the order the form asks for it. Things in `[brackets]` are personal details only you can fill in.

---

## 1. Main info

**Product link:** https://tinydoors.app/?ref=producthunt

> Use the `?ref=producthunt` link so the visits show up in your analytics. (The homepage sets a canonical URL, so the parameter doesn't affect search.)

**Name** (max 40 characters)

```
Tiny Doors
```

**Tagline** (max 60 characters). Pick one. The first is the recommended option.

```
A personalised advent calendar inside a tiny 3D village
```
(55 characters)

Alternatives:

```
24 little doors with your photos, notes and mini games
```
(54 characters)

```
Make someone a digital advent calendar in 10 minutes
```
(52 characters)

**Description** (max 260 characters)

```
Fill a tiny 3D Christmas village with your photos, notes, vouchers and mini games, then send one link. A new door opens every day in December. No app or account needed to open it. Two worlds are free, and a A$6.99 Season Pass unlocks seven more.
```
(245 characters)

**Topics.** Product Hunt lets you pick from its own list. These are the closest matches, in order. Use whichever ones exist when you submit:

1. Gifts
2. Kids / Parenting (or Family)
3. Web App
4. Games (or Photography, if Games isn't offered)

**Pricing:** Freemium

**Promo offer (optional):** the form has a "Promo" field. If you create a Stripe coupon for Product Hunt visitors, use something like `Season Pass 30% off for Product Hunters, code PH30`. Checkout doesn't take promotion codes yet, so leave this empty unless you add them.

**Is this your first launch?** Yes (tick "I worked on this product")

**Makers:** you. Add anyone else who helped.

**Twitter/X handle:** `[your handle, or leave empty]`

---

## 2. Media

All files are in [product-hunt/](product-hunt/).

| Field | File | Notes |
|---|---|---|
| Thumbnail (240×240) | `thumbnail-240-animated.gif` | Cycles through the nine worlds. Use `thumbnail-240.png` (the door icon) if you'd rather have a static one |
| Gallery 1 | `gallery-1.png` | Hero: "24 little doors. One big smile." The **first image is the one shown in social shares**, so keep this first |
| Gallery 2 | `gallery-2.png` | Behind every door: photo, mini game, Christmas Eve letter |
| Gallery 3 | `gallery-3.png` | All nine worlds |
| Gallery 4 | `gallery-4.png` | The editor, in three steps |
| Gallery 5 | `gallery-5.png` | Phones: no app, no account |
| Gallery 6 | `gallery-6.png` | Free vs Season Pass |

All gallery images are 1270×760, the size Product Hunt recommends. Every screenshot in them is a real capture of the app (headless Chrome, `?to=Emma&from=Grandma`). The raw screenshots are in [screenshots/](screenshots/) if you want different crops.

**Video (optional but worth it).** Product Hunt takes a YouTube link and puts it first in the gallery. A 30–45 second screen recording is enough. Suggested shots:

1. (0–5 s) `3d.html?theme=snow&skip&day=9` on a phone: the village, the camera drifting.
2. (5–15 s) Tap door 9. The door knocks, swings open, and you wipe frost off a photo.
3. (15–22 s) Open the word search on day 8 and find one word.
4. (22–30 s) Flick through worlds: summer, gingerbread, space, neon city (`?theme=…`).
5. (30–40 s) Editor: tap a door, add a photo, then "Copy link".
6. End card: "tinydoors.app — free to make".

Turn the sound on: the knocks and the door whoosh are a big part of the charm.

---

## 3. Maker's first comment

Post this as soon as the launch goes live. It's the most-read text on the page after the tagline. Fill in the brackets with your own story; real details get far more replies than a generic pitch.

```
Hi Product Hunt 👋

I made Tiny Doors because [your reason — e.g. "my kids live 3,000 km from their grandparents, and a chocolate calendar in the post felt a bit impersonal"].

It's a digital advent calendar that you fill yourself. You pick a little 3D world (a snowy village, Aussie beach boxes, a gingerbread lane, a moon base…), and each of the 24 houses hides a surprise:

📸 a photo they wipe the frost off
💌 a note, a joke, or a Christmas Eve letter
🎲 a mini game: word search (you can use family names), memory match, sliding puzzle, sudoku
🎟️ a voucher ("one breakfast in bed")
🎥 a 10-second video clip
🔗 a link, like your favourite carol on YouTube

Every door already has a surprise in it, so you can send a finished calendar in two minutes. Personalising it is the fun part, though.

You send one link. It opens in any browser with no app and no account. A new door unlocks at midnight in their timezone, and missed days stay open so nobody loses a day.

A few details I'm proud of:
• everything in the worlds is built in code with Three.js, no 3D model files
• every sound is synthesised in the browser
• shake your phone and it blizzards
• there's a TV "family mode" that works with the remote
• it's in English and French

Pricing: two worlds are completely free. The Season Pass is A$6.99, paid once, and covers up to 5 premium calendars this Christmas, with seven more worlds and unlimited photos. No subscription.

December 1 is [N] days away, so if there's someone you'd like to surprise, now's the time 🎄 I'd love to hear who you'd make one for, and which world I should build next.
```

---

## 4. Short replies to have ready

People ask the same things. Copy, adjust and reply quickly; fast replies help the ranking.

**"Is it really free?"**
Yes. Snowy Village and Summer Christmas are free forever, with all 24 doors, notes, vouchers, mini games and up to 3 photos. The Season Pass is only for the seven premium worlds and unlimited photos.

**"Does the person receiving it need an account / app?"**
No. They open the link in any browser, on a phone, tablet, laptop or smart TV.

**"What if they miss a day?"**
Missed doors stay open, so they can catch up. Future doors stay locked until midnight in the timezone you choose.

**"Can I start late?"**
Yes. There's a 12-door option: either every day from 13 to 24 December, or every second day. Both finish on Christmas Eve. And if you start a 24-door calendar on the 5th, the first doors are simply open already.

**"Is it only for Christmas?"**
For now, yes. [Optional: "I'm thinking about birthdays / Ramadan / Hanukkah countdowns next — would you use one?"]

**"Are my photos private?"**
Photos go to private storage. Recipients see them through signed links that only their calendar's private URL can request. The calendar link itself is unguessable and read-only.

**"How did you build the 3D?"**
Three.js, with every house, character and prop generated in code. House parts are merged per material and roof lights are instanced, so a whole village is about 200 draw calls and runs on older phones.

**"Why A$?"**
I'm in Australia (hence the summer Christmas world 🏖️). Your bank converts it, and it works out to roughly US$4.50 / €4.

---

## 5. Launch-day schedule (Sydney time)

Product Hunt's day starts at **12:01 am Pacific time, which is 7:01 pm the same day in Sydney (AEDT)**. Launches that get early upvotes and comments in the first 4 hours do best.

| When (AEDT) | What |
|---|---|
| A week before | Create/verify your PH account, fill in your profile, follow a few products. Schedule the launch in the form ("Schedule for later") |
| Launch day, 7:01 pm | Launch goes live. Post the maker comment straight away |
| 7:05 pm | Share the PH link with friends, family, and anyone who's tried it. Ask them to **try it and leave a comment**, not just upvote (PH discounts upvote rings and new accounts) |
| 7 pm – midnight | Reply to every comment within ~15 minutes |
| Next morning | Post on X / LinkedIn / Facebook groups (US/EU are awake again) |
| 7 pm next day | Day ends. If you place top 5, PH gives you a badge to add to the homepage |

**Don't:** ask people to "upvote" in public posts, use vote-swap groups, or create accounts. Product Hunt detects it and can bury the launch. "We're live on Product Hunt, I'd love your feedback" is fine.
