# Sound credits

| File | Source | Licence status |
|---|---|---|
| `door-knock.mp3` | "door-knock" by Universfield (`universfield-door-knock-291150.mp3`, likely Pixabay) — trimmed | Pixabay sounds are generally free for commercial use; confirm on the original page before launch |
| `door-whoosh.mp3` | **Original** — synthesised by `tools/make-whoosh.py` (no samples), modelled on the shape of a reference whoosh | Ours to use |

To tweak the whoosh, edit `tools/make-whoosh.py`, then:

```bash
python3 tools/make-whoosh.py /tmp/door-whoosh.wav && ffmpeg -y -i /tmp/door-whoosh.wav -b:a 160k assets/sounds/door-whoosh.mp3
```

The knock timings used to jolt the door (`KNOCK_TIMES` in `js/audio.js`) match `door-knock.mp3`; update them if the file is replaced.
If a file can't load (e.g. opening the page from `file://`), the app falls back to synthesised knocks and a creak.
