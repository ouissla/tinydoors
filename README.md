# Tiny Doors — advent village prototype

Deploy to the live site with `npm run deploy:production`, or to the test site with `npm run deploy:preview`. See [Deploy changes](docs/LAUNCH.md#deploy-changes) for the full steps. See [the launch guide](docs/LAUNCH.md) for Supabase/Stripe environment placeholders, the database migration, and the remaining work before a paid launch. `.env` is local and ignored by Git; `.env.example` is the shareable template.

A clickable prototype of the recipient experience, in two themes:

- **Snowy**: a Christmas village at night, with moon, aurora, Santa's sleigh, a snowman and frost to wipe off photos
- **Summer**: Aussie beach boxes at sunset, with a surfing Santa, palms in fairy lights and sand to brush off photos

No build step. It's plain HTML/CSS/JS, and every sound is synthesised in the browser (no audio files).

## Run it

```bash
python3 -m http.server 5178
```

Then open http://localhost:5178. Opening `index.html` directly from disk also works.

## Useful URLs (for recording ads)

| URL | What it does |
|---|---|
| `?theme=summer` | Summer version (`?theme=snow` for snowy) |
| `?unlock` | Every door can be opened |
| `?day=12` | Pretend it's December 12 |
| `?to=Sam&from=Dad` | Change the names |
| `?skip` | Skip the "Open it" splash |

The ⚙️ button opens prototype controls: theme, pretend date, names, **your own photos** (they go behind days 3, 9, 15, 21), and "close all doors again".

## What's in it

- 24 doors: four knocks (the door jolts and "knock!" pops up in time with `assets/sounds/door-knock.mp3`), then the door swings open with a "magic whoosh" (`door-whoosh.mp3`, synthesised from scratch by `tools/make-whoosh.py`), light spill and a particle burst (no bell). See `assets/sounds/CREDITS.md`
- Surprise formats: photo (wipe frost/sand), letter in an envelope, riddle, cracker joke, activity/recipe ("We did it!" stamp), voucher (stamped), Christmas Eve finale with fireworks
- 24 preset surprises per theme (`js/content.js`), plus an extra library for the editor
- **Mini games** (`js/games.js`): festive 4×4 emoji sudoku and 6×6 number sudoku, word search (drag or tap first/last letter), memory match, sliding picture puzzle, and word scramble. Each is seeded by the day (same puzzle every time), has a Hint / Peek button (Space on a TV) and ends with a celebration. Four are in each default pack (days 8, 14, 18, 20)
- Locked future doors rattle and say how many sleeps are left
- A garland gains one lit bulb per opened door
- Phone tilt moves the scene (parallax); shaking the phone makes a flurry
- 📺 Family mode: fullscreen, bigger text, arrow keys / TV remote to move, Enter to open, Space to reveal, Esc to close
- Respects reduced-motion settings

## 3D worlds (`3d.html`)

Premium worlds include **Coral Reef Christmas** (`?theme=ocean`): pastel sea-shell houses with conch roofs, a lettuce-coral Christmas tree with a pearl garland and starfish on top, anemones with clownfish, kelp, sea fans, fish schools, glowing jellyfish, light rays and caustics on the sand, turtles in Santa hats, manta rays, diver elves, a humpback and her calf in the blue haze, and Santa's sleigh pulled by dolphins. Tap the treasure chest, giant clam, anemones, jellyfish or the whale.


A full Three.js version of both worlds, alongside the 2D one (the **3D** / **2D** buttons switch between them, keeping the same calendar and opened doors).

- **Snowy:** a terraced village of 24 lit cottages under the northern lights, a big tree on top, snowfall, mountains, a moonlit sleigh and a snowman
- **Summer:** 24 striped beach boxes on sandy terraces above an animated ocean with foam, a palm in fairy lights wearing a Santa hat, a surfing Santa and drifting clouds
- The tree (or palm) has **24 lights, one per opened door**
- Tap a door: the camera flies in, the door swings open on its hinge, light spills out, the surprise pops out, confetti, then the same surprise cards as 2D
- **Explore freely:** drag to orbit, scroll / pinch to zoom right up to the houses, right-drag / two-finger drag to pan, or **W A S D** to walk around and **Q / E** to turn (faster when zoomed out, slower up close); 🏠 (or `H`) flies back to the whole village. Limits keep you from getting lost or going under the ground. Drag directions are set by `DRAG_DIR_X` / `DRAG_DIR_Y` in `js3d/main.js`.
- **Characters with routines:** in winter, elves walk their terrace and stop at doors to knock, wave or deliver presents; penguins waddle and belly-slide in the square; an elf pulls a sled of gifts; reindeer graze by the tree. In summer, elves in board shorts carry surfboards and beach balls; little penguins, crabs scuttling sideways, a hopping kangaroo, circling seagulls. **Tap any of them** for a reaction.
- **Detail:** fairy lights along every roof (twinkling), chimney smoke, wreaths, icicles, framed windows, lamp posts / tiki torches, presents under the tree, candy canes, beach umbrellas, towels, a sandcastle, surfboards, an esky; stone and timber terrace walls, rolling snow hills
- Arrow keys / Enter in family (TV) mode
- Performance: house parts are merged per material and roof lights are instanced (~200 draw calls); phones get fewer characters
- Layout adapts to the screen: 3 rows of 8 on landscape/TV, 4×6 on tablets, 6 rows of 4 on phones
- Everything is built in code (no 3D model files); Three.js 0.160 loads from jsDelivr, so `3d.html` needs a web server (not `file://`) and an internet connection

Same URL flags as 2D: `3d.html?theme=summer`, `?c=<id>`, `?preview`, `?unlock`, `?day=12`, `?skip`.

## Premium worlds (Season Pass)

Seven extra 3D worlds alongside Snowy and Summer, each with its own houses, light-tree, scenery, characters, colours, 24 surprises, game symbols and scratch-off effect:

- 🍪 **Gingerbread Lane** — iced gingerbread houses with gumdrops and candy windows, a tree of stacked star cookies, lollipop lamps, candy forest, ice-cream mountains; gingerbread people and elves; tap lollipops to spin them, bounce the gumdrops, or tap the cupcake for a sprinkle fountain; icing-sugar photo reveal
- 🧸 **Toy Town** — wooden toy houses (pyramid roofs, castles, towers), a block tree, a stitched railway playmat on warm wooden flooring, painted terrace edging and brass studs, rounded alphabet-block hills and a hot-air balloon; tap the musical carousel, spring-loaded jack-in-the-box, rainbow stacking rings or the train (a burst of speed and steam); marching toy soldiers (some drumming) and wind-up penguins
- 🚀 **Space Christmas** — moon-base domes with airlock doors, a spinning neon ring tree, Earth and a ringed planet, a rocket on its pad, craters, a satellite dish, UFOs; violet cratered terrain, lit hex landing tiles and bootprints; tap the rocket to launch and its empty pad to recall it, deploy the solar panels, tune the dish or light up the moon crystals; bouncing astronaut elves and robot reindeer; stardust photo reveal

- 🛠️ **Santa’s Workshop** — snowy timber workshops and a magical toy factory
- 🌿 **Treetop Jungle** — raised treehouses, denser leafy canopies and waterfalls; low foreground firefly lanterns, a playable drum, a butterfly flower and a frog pond with jumping and ripples; tall trees stay outside the house sightlines
- 🌸 **Kawaii Sakura Town** — pastel shops, cherry blossoms and lanterns; a tappable tea set and swinging wish bell alongside the lucky cat, daruma and capsule machine
- 🌃 **Neon City** — capsule apartments with aligned neon trim, flying cars and a glowing skyline; cars and motorbikes take crossing streets and alternate routes, with tappable boosts, a routing console and a cargo teleporter

Preview: `3d.html?theme=gingerbread` / `toys` / `space`. In the editor they're marked **✨ Season Pass**; choosing one allows free customisation and preview, with the Season Pass required to share. Without WebGL, the 2D view shows them over the snowy backdrop with their own colours and content.

## Shake to make it snow

Shake the phone (or press **Space** / **N** in 3D, **S** in 2D) for a blizzard: in 3D, thousands of extra flakes and a gust of wind for ~8 seconds, in every world; in 2D, a big flurry. Works in an ordinary mobile browser — no app or PWA needed — but needs **HTTPS** (or `localhost`). iPhones ask permission once, from the first tap. To test on a phone, serve over HTTPS (e.g. a Netlify/Vercel deploy or a tunnel); plain `http://192.168…` won't get motion events.

## The editor (`editor.html`)

The editor's background is the chosen world itself, live in 3D (`3d.html?theme=<world>&bg`: no UI or sound, no shadows, fewer characters, 30 fps, a slow camera sweep). Picking another world crossfades to it silently. Without WebGL (or from `file://`) the 2D scene is used instead.

1. **Who + world**: names, then choose from two free worlds or the seven-world Season Pass collection. "Fill my 24 doors" creates a complete calendar from that theme's preset pack.
2. **Doors**: the village with every door open. Tap a door to:
   - take a photo (opens the camera on phones) or choose one
   - write a note (day 24 becomes the Christmas Eve letter with fireworks)
   - make a voucher
   - add a **mini game** (🎮 button, or the Games filter) — word searches can use your own words, e.g. family names
   - swap in any of ~45 ready-made surprises
   Suggestion chips nudge the next personal touch, "Add several photos at once" spreads photos across the doors, and a meter counts personal touches.
3. **Share**: preview as the recipient (every door unlocked), copy or send the link, choose the timezone doors open in. Links and the main preview open the **3D** world (`3d.html?c=<id>`); there's also a 2D preview, and `3d.html` falls back to the 2D view on devices without WebGL.

Free calendars get 3 photos. The **Season Pass** costs A$6.99 once per Christmas season and covers up to 5 premium calendars, with every premium world, unlimited photos and no Tiny Doors credit. Cloud accounts use Stripe Checkout and server-verified entitlements; prototype mode uses a demo upgrade without payment.

Recipient links (`3d.html?c=<id>`, or `index.html?c=<id>` for 2D) open on real December dates in the chosen timezone: before 1 December every door is locked, and missed doors stay open to catch up.

**Storage modes:** the default prototype saves calendars/photos in IndexedDB (`js/db.js`), so its links only work on the creating browser. With `APP_MODE=cloud` and Supabase configured, `js/auth.js` and `js/cloud-db.js` add email magic-link sign-in, account-specific calendars and private photo storage. The Worker creates hashed read-only recipient links without requiring recipient accounts. Apply the migration and verify your project using [the launch guide](docs/LAUNCH.md).

## Files

- `js/scene.js` — the illustrated backgrounds (generated SVG layers)
- `js/content.js` — the preset surprises for both themes
- `js/reveal.js` — the surprise card formats and their interactions
- `js/app.js` — village grid, door opening, cards, tilt, keyboard, controls
- `js/games.js` — the mini games
- `js/editor.js` + `css/editor.css` — the creator editor
- `js/db.js` — calendar + photo storage (swap this for the real backend)
- `js/huts.js` — door/hut markup and colours shared by viewer and editor
- `js3d/main.js` — 3D renderer, camera framing, tap-to-open sequence, HUD, keyboard
- `js3d/worlds.js` — world builder, styles per world, snowfall/blizzard, snowy and summer scenery
- `js3d/worlds-extra.js` — Gingerbread Lane, Toy Town and Space Christmas: textures, trees, scenery
- `js3d/houses.js` — 3D cottages / beach boxes with hinged numbered doors (static parts merged)
- `js3d/characters.js` — elves, penguins, reindeer, crabs, kangaroo, seagulls and their behaviours
- `js3d/props.js` — roof fairy lights, chimney smoke, lamps / torches, presents, beach props
- `js/cards.js` — surprise card overlay used by the 3D view
- `js/fx.js` — snow, glints and confetti (canvas)
- `js/audio.js` — synthesised sounds
- `css/styles.css` — everything visual

Remaining before a paid release: verify production email delivery, deploy the Worker, complete Stripe test purchases/refunds and configure live payment credentials, and add server-side date filtering if future surprises must stay private from recipients inspecting responses.

### Calendar length, links and videos

The creator can choose 24 doors (daily, 1–24 December) or 12 doors, with either
schedule: daily from 13–24 December, or on 1, 3, 5…21 December, with the final door on 24 December. Both short schedules finish on Christmas Eve.
Schedules use the calendar's selected time zone. Switching lengths keeps hidden
personal edits for when the creator switches back.

Each house can contain a clickable HTTP/HTTPS link, including a YouTube link,
with custom button text. Links open in a new tab. Video surprises use the device
camera and microphone, stop automatically after 10 seconds, and can be stopped
early or recorded again. Recording requires HTTPS or localhost and a browser
supporting MediaRecorder. Clips use private storage and the same recipient
signed-URL flow as photos; each clip is limited to 10 MB.

Before deploying these features in cloud mode, apply the
`calendar_schedules_and_video` migration. It accepts 12 or 24 doors and adds
WebM/MP4 to the existing private media bucket's allowed formats without changing
ownership policies. The existing 10 MB bucket limit remains in place.
