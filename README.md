# Little Doors — advent village prototype

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

- 24 doors with a 3D swing-open, light spill, particle burst, creak and chime sounds
- Surprise formats: photo (wipe frost/sand), letter in an envelope, riddle, cracker joke, activity/recipe ("We did it!" stamp), voucher (stamped), Christmas Eve finale with fireworks
- 24 preset surprises per theme (`js/content.js`)
- Locked future doors rattle and say how many sleeps are left
- A garland gains one lit bulb per opened door
- Phone tilt moves the scene (parallax); shaking the phone makes a flurry
- 📺 Family mode: fullscreen, bigger text, arrow keys / TV remote to move, Enter to open, Space to reveal, Esc to close
- Respects reduced-motion settings

## 3D worlds (`3d.html`)

A full Three.js version of both worlds, alongside the 2D one (the **3D** / **2D** buttons switch between them, keeping the same calendar and opened doors).

- **Snowy:** a terraced village of 24 lit cottages under the northern lights, a big tree on top, snowfall, mountains, a moonlit sleigh and a snowman
- **Summer:** 24 striped beach boxes on sandy terraces above an animated ocean with foam, a palm in fairy lights wearing a Santa hat, a surfing Santa and drifting clouds
- The tree (or palm) has **24 lights, one per opened door**
- Tap a door: the camera flies in, the door swings open on its hinge, light spills out, the surprise pops out, confetti, then the same surprise cards as 2D
- Drag to look around, tilt the phone or move the mouse for parallax, arrow keys / Enter in family (TV) mode
- Layout adapts to the screen: 3 rows of 8 on landscape/TV, 4×6 on tablets, 6 rows of 4 on phones
- Everything is built in code (no 3D model files); Three.js 0.160 loads from jsDelivr, so `3d.html` needs a web server (not `file://`) and an internet connection

Same URL flags as 2D: `3d.html?theme=summer`, `?c=<id>`, `?preview`, `?unlock`, `?day=12`, `?skip`.

## The editor (`editor.html`)

1. **Who + world**: names, then pick Snowy or Summer. "Fill my 24 doors" creates a complete calendar from that theme's preset pack.
2. **Doors**: the village with every door open. Tap a door to:
   - take a photo (opens the camera on phones) or choose one
   - write a note (day 24 becomes the Christmas Eve letter with fireworks)
   - make a voucher
   - swap in any of ~36 ready-made surprises
   Suggestion chips nudge the next personal touch, "Add several photos at once" spreads photos across the doors, and a meter counts personal touches.
3. **Share**: preview as the recipient (every door unlocked), copy or send the link, choose the timezone doors open in.

Free calendars get 3 photos; the 4th opens a mock **Season Pass** (A$12.95 one-time, no payment taken) that unlocks unlimited photos and removes the credit.

Recipient links (`index.html?c=<id>`) open on real December dates in the chosen timezone: before 1 December every door is locked, and missed doors stay open to catch up.

**Prototype limitation:** calendars and photos are saved in this browser's IndexedDB (`js/db.js`), so a link only opens on the device that made it. Swapping `js/db.js` for Supabase (tables + private photo bucket + signed URLs) is the next backend step; the rest of the app uses only its five functions.

## Files

- `js/scene.js` — the illustrated backgrounds (generated SVG layers)
- `js/content.js` — the preset surprises for both themes
- `js/reveal.js` — the surprise card formats and their interactions
- `js/app.js` — village grid, door opening, cards, tilt, keyboard, controls
- `js/editor.js` + `css/editor.css` — the creator editor
- `js/db.js` — calendar + photo storage (swap this for the real backend)
- `js/huts.js` — door/hut markup and colours shared by viewer and editor
- `js3d/main.js` — 3D renderer, camera framing, tap-to-open sequence, HUD, keyboard
- `js3d/worlds.js` — the snowy and summer 3D worlds (terraces, tree/palm lights, sky, ocean, weather)
- `js3d/houses.js` — 3D cottages / beach boxes with hinged numbered doors
- `js/cards.js` — surprise card overlay used by the 3D view
- `js/fx.js` — snow, glints and confetti (canvas)
- `js/audio.js` — synthesised sounds
- `css/styles.css` — everything visual

Not included yet: a server (so links work on other devices), real payments, or server-side unlocking.
