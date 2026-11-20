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
      if (p.length) out.push({ c: s.c, w: s.w, p });
      if (budget <= 0) break;
    }
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

  // Replays the drawing as if it were being drawn, in about 2–5 seconds.
  function replay(canvas, strokes, onDone) {
    const g = setup(canvas);
    const total = pointCount(strokes);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!total || reduce) { drawAll(g, strokes); onDone && onDone(); return () => {}; }
    const ms = Math.max(2000, Math.min(5000, total * 6));
    let raf = 0, start = 0;
    const frame = (t) => {
      start ||= t;
      let left = Math.ceil(total * Math.min(1, (t - start) / ms));
      paper(g);
      for (const s of strokes) {
        const n = s.p.length / 2;
        stroke(g, s, left);
        left -= n;
        if (left <= 0) break;
      }
      if (t - start < ms) raf = requestAnimationFrame(frame);
      else onDone && onDone();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }

  // The creator's sketch pad. Returns { strokes(), isEmpty() }.
  function pad(host, initial, onChange) {
    let strokes = clean(initial);
    let color = COLORS[0], size = SIZES[1];
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
      cur = { c: color, w: size, p: at(e) };
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
