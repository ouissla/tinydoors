/* Quick drawings behind a door: a small sketch pad for creators, and a replay for recipients.
   Drawings are stored as strokes in the door itself (no upload), on a 1000 × 750 grid. */
(function () {
  const A = (window.Advent = window.Advent || {});
  const tr = A.I18n.t;

  const W = 1000, H = 750;
  const COLORS = ['#26334a', '#d22f4a', '#2f8f4e', '#2b6fd6', '#f2a516', '#8e44ad', '#8b5a2b', '#ffffff'];
  const COLOR_NAMES = ['Ink', 'Red', 'Green', 'Blue', 'Gold', 'Purple', 'Brown', 'White'];
  const SIZES = [6, 14, 30];
  const MAX_POINTS = 8000; // Keeps a busy drawing to a few tens of kilobytes.
  const PAPER = '#fffdf7';
  const MAX_PAUSE = 700; // Long pauses while drawing are shortened to this in the replay (ms).
  const SPEED = 3; // The replay runs at least this many times faster than it was drawn…
  const LONGEST = 8000, SHORTEST = 1500; // …and lasts between these (ms) whenever it can.

  // Only well-formed strokes from the palette survive, so a stored document can't inject anything odd.
  function clean(strokes) {
    if (!Array.isArray(strokes)) return [];
    let budget = MAX_POINTS;
    const out = [];
    for (const s of strokes) {
      if (!s || !COLORS.includes(s.c) || !SIZES.includes(s.w) || !Array.isArray(s.p)) continue;
      const p = [];
      for (let i = 0; i + 1 < s.p.length && budget > 0; i += 2, budget--) {
        const x = Math.round(s.p[i]), y = Math.round(s.p[i + 1]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) break;
        p.push(Math.max(0, Math.min(W, x)), Math.max(0, Math.min(H, y)));
      }
      if (p.length) {
        const st = { c: s.c, w: s.w, p };
        // Timing: when the stroke started (t) and when each point was drawn after that (d), in ms.
        const d = Array.isArray(s.d) ? s.d.slice(0, p.length / 2).map(Math.round) : null;
        if (Number.isFinite(s.t) && s.t >= 0 && d && d.length === p.length / 2 && d.every((v, i) => Number.isFinite(v) && v >= (i ? d[i - 1] : 0))) {
          st.t = Math.round(s.t);
          st.d = d;
        }
        out.push(st);
      }
      if (budget <= 0) break;
    }
    // Timing is all or nothing, and strokes must run in order, or the replay falls back to a steady pace.
    const timed = out.every((st, i) => 'd' in st && (!i || st.t >= out[i - 1].t));
    if (!timed) out.forEach((st) => { delete st.t; delete st.d; });
    return out;
  }
  const pointCount = (strokes) => strokes.reduce((n, s) => n + s.p.length / 2, 0);

  function setup(canvas) {
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');
    g.lineCap = 'round';
    g.lineJoin = 'round';
    return g;
  }
  function paper(g) { g.fillStyle = PAPER; g.fillRect(0, 0, W, H); }

  // Draw a stroke up to `upto` points (a dot when it has just one).
  function stroke(g, s, upto = s.p.length / 2) {
    const n = Math.min(upto, s.p.length / 2);
    if (n < 1) return;
    g.strokeStyle = g.fillStyle = s.c;
    g.lineWidth = s.w;
    if (n === 1) {
      g.beginPath(); g.arc(s.p[0], s.p[1], s.w / 2, 0, Math.PI * 2); g.fill();
      return;
    }
    g.beginPath();
    g.moveTo(s.p[0], s.p[1]);
    for (let i = 1; i < n; i++) g.lineTo(s.p[i * 2], s.p[i * 2 + 1]);
    g.stroke();
  }
  function drawAll(g, strokes) { paper(g); strokes.forEach((s) => stroke(g, s)); }

  // When each point appears in the replay, in drawing time (ms), with long pauses shortened.
  // Drawings saved without timing get a steady pace instead.
  function timeline(strokes) {
    const total = pointCount(strokes);
    if (strokes.length && 'd' in strokes[0]) {
      let clock = 0, lastEnd = null;
      return strokes.map((s) => {
        clock += lastEnd === null ? 0 : Math.min(MAX_PAUSE, Math.max(0, s.t - lastEnd));
        let prev = 0;
        const times = s.d.map((v) => (clock += Math.min(MAX_PAUSE, v - prev), prev = v, clock));
        lastEnd = s.t + s.d[s.d.length - 1];
        return times;
      });
    }
    const step = Math.max(2000, Math.min(5000, total * 6)) * SPEED / Math.max(1, total);
    let i = 0;
    return strokes.map((s) => s.p.filter((_, j) => j % 2 === 0).map(() => i++ * step));
  }

  // Replays the drawing as it was drawn, sped up.
  function replay(canvas, strokes, onDone) {
    const g = setup(canvas);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!pointCount(strokes) || reduce) { drawAll(g, strokes); onDone && onDone(); return () => {}; }
    const times = timeline(strokes);
    const length = Math.max(1, times[times.length - 1].at(-1));
    let speed = Math.max(SPEED, length / LONGEST);
    if (length / speed < SHORTEST) speed = Math.max(1, length / SHORTEST);
    const ms = length / speed;
    let raf = 0, start = 0;
    const frame = (t) => {
      start ||= t;
      const now = (t - start) * speed;
      paper(g);
      for (let i = 0; i < strokes.length; i++) {
        const ts = times[i];
        if (ts[0] > now) break;
        let n = 1;
        while (n < ts.length && ts[n] <= now) n++;
        stroke(g, strokes[i], n);
      }
      if (t - start < ms) raf = requestAnimationFrame(frame);
      else { drawAll(g, strokes); onDone && onDone(); }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }

  // The creator's sketch pad. Returns { strokes(), isEmpty() }.
  function pad(host, initial, onChange) {
    let strokes = clean(initial);
    let color = COLORS[0], size = SIZES[1];
    // New strokes continue the existing drawing's clock, just after its last line.
    const last = strokes.at(-1);
    const resumeAt = last && 'd' in last ? last.t + last.d.at(-1) + 400 : 0;
    let sessionStart = null;
    const clock = (e) => resumeAt + Math.round(e.timeStamp - sessionStart);
    host.classList.add('draw-pad');
    host.innerHTML = `
      <canvas class="draw-canvas" aria-label="${tr('Drawing area')}"></canvas>
      <div class="draw-tools">
        <div class="draw-colors" role="radiogroup" aria-label="${tr('Colour')}">${COLORS.map((c, i) => `<button type="button" class="draw-color" role="radio" data-color="${c}" style="--c:${c}" aria-label="${tr(COLOR_NAMES[i])}" title="${tr(COLOR_NAMES[i])}"></button>`).join('')}</div>
        <div class="draw-sizes" role="radiogroup" aria-label="${tr('Pen size')}">${SIZES.map((s) => `<button type="button" class="draw-size" role="radio" data-size="${s}" aria-label="${tr(['Thin pen', 'Medium pen', 'Thick pen'][SIZES.indexOf(s)])}"><i style="--s:${Math.round(s / 2.5) + 3}px"></i></button>`).join('')}</div>
        <div class="draw-edit">
          <button type="button" class="btn ghost small" data-draw="undo">${tr('↶ Undo')}</button>
          <button type="button" class="btn ghost small" data-draw="clear">${tr('Clear')}</button>
        </div>
      </div>`;
    const canvas = host.querySelector('canvas');
    const g = setup(canvas);
    drawAll(g, strokes);

    const sync = () => {
      host.querySelectorAll('[data-color]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.color === color)));
      host.querySelectorAll('[data-size]').forEach((b) => b.setAttribute('aria-checked', String(+b.dataset.size === size)));
      host.querySelector('[data-draw="undo"]').disabled = !strokes.length;
      host.querySelector('[data-draw="clear"]').disabled = !strokes.length;
      host.querySelectorAll('.draw-size i').forEach((i) => i.style.background = color === '#ffffff' ? '#c8ccd4' : color);
    };
    const changed = () => { sync(); onChange && onChange(); };
    sync();

    host.querySelector('.draw-tools').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      e.stopPropagation();
      if (b.dataset.color) color = b.dataset.color;
      else if (b.dataset.size) size = +b.dataset.size;
      else if (b.dataset.draw === 'undo') { strokes.pop(); drawAll(g, strokes); }
      else if (b.dataset.draw === 'clear') { strokes = []; drawAll(g, strokes); }
      changed();
    });

    let cur = null, id = null;
    const at = (e) => {
      const r = canvas.getBoundingClientRect();
      return [Math.round(((e.clientX - r.left) / r.width) * W), Math.round(((e.clientY - r.top) / r.height) * H)];
    };
    canvas.addEventListener('pointerdown', (e) => {
      if (cur || pointCount(strokes) >= MAX_POINTS) return;
      e.preventDefault();
      id = e.pointerId;
      canvas.setPointerCapture(id);
      sessionStart ??= e.timeStamp;
      cur = { c: color, w: size, p: at(e), t: clock(e), d: [0] };
      strokes.push(cur);
      stroke(g, cur);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!cur || e.pointerId !== id) return;
      const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of events.length ? events : [e]) {
        const [x, y] = at(ev);
        const lx = cur.p[cur.p.length - 2], ly = cur.p[cur.p.length - 1];
        if (Math.hypot(x - lx, y - ly) < 4 || pointCount(strokes) >= MAX_POINTS) continue;
        g.strokeStyle = cur.c; g.lineWidth = cur.w;
        g.beginPath(); g.moveTo(lx, ly); g.lineTo(x, y); g.stroke();
        cur.p.push(Math.max(0, Math.min(W, x)), Math.max(0, Math.min(H, y)));
        cur.d.push(Math.max(cur.d.at(-1), clock(ev) - cur.t));
      }
    });
    const end = (e) => {
      if (!cur || e.pointerId !== id) return;
      cur = null;
      changed();
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);

    return { strokes: () => clean(strokes), isEmpty: () => !strokes.length };
  }

  A.Drawing = { pad, replay, clean, COLORS, SIZES };
})();
