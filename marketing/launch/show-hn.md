# Show HN (Hacker News) — Tiny Doors

Hacker News is the closest thing to Product Hunt, but with a very different crowd: developers who care how it's built and dislike marketing language. A "Show HN" post is for something people can try right now, which Tiny Doors fits, since the editor works without signing up.

Submit at https://news.ycombinator.com/submit. Read the rules first: https://news.ycombinator.com/showhn.html

---

## Title (max 80 characters)

Recommended:

```
Show HN: Tiny Doors – an advent calendar in a 3D village built entirely in code
```
(79 characters)

Alternatives:

```
Show HN: I made a personalised advent calendar where each day is a 3D house
```
(75 characters)

```
Show HN: Tiny Doors – advent calendars with no 3D model files
```
(61 characters)

## URL

```
https://tinydoors.app/editor.html?new
```

Link straight to the editor rather than the homepage. HN readers want to try the thing, not read a landing page. (If you'd rather they see the recipient side first, use a public demo calendar link instead; see "Demo link" below.)

## Text

Submissions with a URL can't have body text, so post this as the **first comment** immediately after submitting:

```
Hi HN, I built Tiny Doors, a digital advent calendar you fill for someone else. You pick a small 3D world, put photos, notes, vouchers, short videos or mini games behind the doors, and send a link. One door unlocks each day of December in the recipient's timezone.

Some things that might interest people here:

- No 3D model files. Every house, tree, character and prop in the nine worlds is generated in code with Three.js (0.160). Static house parts are merged per material and the roof fairy lights are instanced, so a 24-house village with characters is around 200 draw calls. Phones get fewer characters, and the layout switches between 3×8, 4×6 and 6×4 depending on aspect ratio.

- Almost no audio files. Sound effects are synthesised live with the Web Audio API; the only two files are a door-knock sample and a "magic whoosh" that I synthesised offline with a small Python script.

- The 2D version is plain HTML/CSS/JS with no build step. It's also the fallback when WebGL isn't available.

- The mini games (word search, memory, sliding puzzle, emoji sudoku, word scramble) are seeded by the day, so the same door always gives the same puzzle.

- Backend is a Cloudflare Worker plus Supabase (magic-link auth, Postgres with RLS, private storage). Recipients don't need accounts: share links are random tokens stored hashed, and photos/videos are served through short-lived signed URLs.

- Shake your phone for a blizzard (DeviceMotion; iOS asks permission on first tap). There's also a TV mode that works with arrow keys / a remote.

Two worlds are free. Seven more are a one-off A$6.99 "Season Pass" (Stripe Checkout, no subscription), which is how I'm hoping to cover hosting.

You can try the whole editor and preview without signing up; sign-in is only needed to save and share. I'd especially like feedback on 3D performance on older phones and anything confusing in the editor.
```

Before posting, check each technical claim still matches the code. They were written from the README on 20 November 2026.

## Demo link (optional)

HN readers like to see the result without making anything. Make a finished public calendar (for example "To: Hacker News, From: [you]", every door unlocked) and add a line to the comment:

```
Here's what a recipient sees, with every door unlocked: https://tinydoors.app/3d.html?c=[id]&preview
```

## Timing and etiquette

- **Best time:** a weekday between 8 and 10 am US Eastern, which is **midnight to 2 am Sydney time** the following day. Recommended: **Wednesday 25 November, 9 am ET (1 am Thursday in Sydney)**. That's a day after the Product Hunt launch, so you can reply to both.
- Stay up for the first 2 hours and answer every question plainly. On HN, an honest "good point, I hadn't thought of that" does much better than a defensive reply.
- **Never ask for upvotes**, and don't share the direct HN link asking people to vote. HN penalises posts that get votes from people who arrive via a direct link. Sharing it with "I posted it on HN, comments welcome" is fine.
- If it gets no traction, you can repost once a few days later. The HN mods sometimes put good Show HN posts into a "second chance" pool on their own.
