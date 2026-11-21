/* Mini games that can sit behind a door: sudoku, word search, memory match,
   sliding picture puzzle and word scramble. Each one is seeded by the day,
   so reopening a door shows the same puzzle. */
(function () {
  const A = (window.Advent = window.Advent || {});
  const tr = A.I18n.t;
  const { el, esc } = A;

  const SYMBOLS = {
    snow: ['🎄', '⭐', '🎁', '❄️', '🔔', '🦌'],
    summer: ['☀️', '🌴', '🐚', '🍉', '🏄', '🦀'],
    gingerbread: ['🍪', '🧁', '🍭', '🍬', '🎄', '⭐'],
    toys: ['🧸', '🚂', '🎁', '🥁', '🎈', '⭐'],
    space: ['🚀', '🪐', '⭐', '🌙', '👽', '🛸'],
    workshop: ['🎅', '🛠️', '🎁', '🦌', '🧸', '⭐'],
    jungle: ['🦜', '🐒', '🌴', '🥭', '🐸', '🌺'],
    ocean: ['🐠', '🐙', '🐚', '🦀', '🐳', '⭐'],
    japan: ['🏮', '🍡', '🐱', '🌸', '🍙', '⭐'],
    cyber: ['🌃', '🤖', '🕹️', '⚡', '💾', '🎆'],
  };
  const PIC = {
    snow: { top: '#0f1f52', bottom: '#5b76b8', ground: '#eef4ff', dots: 'rgba(255,255,255,.8)', emoji: '🎄' },
    summer: { top: '#ff86b4', bottom: '#2fb6c8', ground: '#ffd796', dots: 'rgba(255,255,255,.5)', emoji: '🏖️' },
    gingerbread: { top: '#5b2a72', bottom: '#e994b8', ground: '#fff3f8', dots: 'rgba(255,255,255,.7)', emoji: '🍪' },
    toys: { top: '#3f8fe0', bottom: '#e3f3ff', ground: '#f4f7ff', dots: 'rgba(255,255,255,.7)', emoji: '🧸' },
    space: { top: '#010008', bottom: '#2a1a55', ground: '#9a9aa8', dots: 'rgba(255,255,255,.9)', emoji: '🚀' },
    workshop: { top: '#0b1730', bottom: '#46698a', ground: '#eef3f7', dots: 'rgba(255,255,255,.8)', emoji: '🎅' },
    jungle: { top: '#123b3a', bottom: '#e9c46e', ground: '#2d6a45', dots: 'rgba(255,240,160,.8)', emoji: '🦜' },
    ocean: { top: '#0b5f8f', bottom: '#5fd4e6', ground: '#f0d6a0', dots: 'rgba(220,250,255,.85)', emoji: '🐠' },
    japan: { top: '#7d84e0', bottom: '#ffc9dc', ground: '#fff4f8', dots: 'rgba(255,200,225,.9)', emoji: '🌸' },
    cyber: { top: '#05020f', bottom: '#5a1a6e', ground: '#14121f', dots: 'rgba(0,229,255,.8)', emoji: '🌃' },
  };

  function shuffle(arr, r) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function centerOf(node) {
    const b = node.getBoundingClientRect();
    return [b.left + b.width / 2, b.top + b.height / 2];
  }

  function tick(ctx) { ctx.sound.pop(650, 900, 0.08); }
  function good(ctx, node) {
    ctx.sound.chime();
    if (node) {
      const [x, y] = centerOf(node);
      ctx.fx.burst(x, y, { count: 30, power: 0.45, scale: 0.7 });
    }
  }
  function win(ctx, node, msg) {
    node.classList.add('won');
    const banner = el('div', 'game-win', `<span>🎉</span><b>${tr("You did it!")}</b><small>${esc(msg || '')}</small>`);
    node.appendChild(banner);
    ctx.setPrimary(null);
    ctx.sound.fanfare();
    const [x, y] = centerOf(node);
    ctx.fx.burst(x, y, { count: 140, power: 1.1 });
    setTimeout(() => ctx.fx.burst(x, y - 60, { count: 80, power: 0.8 }), 350);
  }
  function shell(item, howTo) {
    return el('div', 'game', `<h2 class="game-title">${esc(item.title || tr("Mini game"))}</h2><p class="game-how">${esc(howTo)}</p>`);
  }

  // ---------------- Sudoku (4×4 emoji or 6×6 numbers) ----------------
  function sudoku(day, item, ctx) {
    const n = item.size === 6 ? 6 : 4;
    const bw = n === 6 ? 3 : 2, bh = 2; // box width × height
    const r = A.rng(day * 7919 + n);
    const symbols = n === 4 ? (SYMBOLS[ctx.theme] || SYMBOLS.snow).slice(0, 4) : ['1', '2', '3', '4', '5', '6'];

    // A valid grid from the classic pattern, then shuffled within the rules.
    const pick = (count, groups) => shuffle([...Array(groups).keys()], r).flatMap((g) => shuffle([...Array(count).keys()], r).map((k) => g * count + k));
    const rows = pick(bh, n / bh), cols = pick(bw, n / bw), perm = shuffle([...Array(n).keys()], r);
    const pattern = (rr, cc) => (bw * (rr % bh) + Math.floor(rr / bh) + cc) % n;
    const solution = rows.map((rr) => cols.map((cc) => perm[pattern(rr, cc)]));

    const ok = (g, rr, cc, v) => {
      for (let i = 0; i < n; i++) if (g[rr][i] === v || g[i][cc] === v) return false;
      const r0 = rr - (rr % bh), c0 = cc - (cc % bw);
      for (let i = 0; i < bh; i++) for (let j = 0; j < bw; j++) if (g[r0 + i][c0 + j] === v) return false;
      return true;
    };
    const count = (g, limit) => {
      for (let rr = 0; rr < n; rr++) for (let cc = 0; cc < n; cc++) {
        if (g[rr][cc] !== null) continue;
        let total = 0;
        for (let v = 0; v < n; v++) {
          if (!ok(g, rr, cc, v)) continue;
          g[rr][cc] = v;
          total += count(g, limit - total);
          g[rr][cc] = null;
          if (total >= limit) return total;
        }
        return total;
      }
      return 1;
    };
    // Remove clues while the answer stays unique.
    const grid = solution.map((row) => row.slice());
    const target = n === 4 ? 6 : 15;
    let givens = n * n;
    for (const k of shuffle([...Array(n * n).keys()], r)) {
      if (givens <= target) break;
      const rr = Math.floor(k / n), cc = k % n;
      const keep = grid[rr][cc];
      grid[rr][cc] = null;
      if (count(grid.map((x) => x.slice()), 2) !== 1) grid[rr][cc] = keep;
      else givens--;
    }

    const node = shell(item, n === 4 ? tr("Every row, column and box needs one of each.") : tr("Fill in 1–6 so every row, column and box has each number once."));
    const board = el('div', `sudoku s${n}`);
    board.style.setProperty('--n', n);
    const cells = [];
    let sel = null;
    for (let rr = 0; rr < n; rr++) for (let cc = 0; cc < n; cc++) {
      const b = el('button', 'cell');
      b.type = 'button';
      const v = grid[rr][cc];
      b.dataset.r = rr;
      b.dataset.c = cc;
      if (v !== null) { b.textContent = symbols[v]; b.classList.add('given'); b.disabled = true; }
      if ((cc + 1) % bw === 0 && cc < n - 1) b.classList.add('edge-r');
      if ((rr + 1) % bh === 0 && rr < n - 1) b.classList.add('edge-b');
      b.addEventListener('click', () => {
        cells.forEach((c) => c.classList.remove('sel'));
        sel = b;
        b.classList.add('sel');
        tick(ctx);
      });
      board.appendChild(b);
      cells.push(b);
    }
    const pad = el('div', 'pad');
    [...symbols, '⌫'].forEach((s, i) => {
      const b = el('button', 'key', esc(s));
      b.type = 'button';
      b.addEventListener('click', () => place(sel, i < n ? i : null));
      pad.appendChild(b);
    });
    node.append(board, pad);

    const val = (c) => (c.dataset.v === undefined || c.dataset.v === '' ? null : +c.dataset.v);
    const value = (c) => (c.classList.contains('given') ? grid[+c.dataset.r][+c.dataset.c] : val(c));
    function place(c, v) {
      if (!c || c.classList.contains('given') || node.classList.contains('won')) return;
      c.dataset.v = v === null ? '' : v;
      c.textContent = v === null ? '' : symbols[v];
      c.classList.remove('pop');
      void c.offsetWidth;
      if (v !== null) c.classList.add('pop');
      tick(ctx);
      check();
    }
    function check() {
      let full = true;
      cells.forEach((c) => c.classList.remove('bad'));
      cells.forEach((c) => {
        const v = value(c);
        if (v === null) { full = false; return; }
        const rr = +c.dataset.r, cc = +c.dataset.c;
        cells.forEach((o) => {
          if (o === c || value(o) !== v) return;
          const r2 = +o.dataset.r, c2 = +o.dataset.c;
          const sameBox = Math.floor(rr / bh) === Math.floor(r2 / bh) && Math.floor(cc / bw) === Math.floor(c2 / bw);
          if (r2 === rr || c2 === cc || sameBox) { if (!c.classList.contains('given')) c.classList.add('bad'); }
        });
      });
      if (full && cells.every((c) => value(c) === solution[+c.dataset.r][+c.dataset.c])) win(ctx, node, n === 4 ? tr("Sudoku superstar!") : tr("Proper puzzle brain."));
    }
    return {
      node,
      label: tr("Hint 💡"),
      primary() {
        if (node.classList.contains('won')) return false;
        const open = cells.filter((c) => !c.classList.contains('given') && value(c) !== solution[+c.dataset.r][+c.dataset.c]);
        if (!open.length) return false;
        const c = open[(Math.random() * open.length) | 0];
        place(c, solution[+c.dataset.r][+c.dataset.c]);
        c.classList.add('hinted');
        return true;
      },
    };
  }

  // ---------------- Word search ----------------
  function wordsearch(day, item, ctx) {
    const r = A.rng(day * 4111 + (item.words || []).join('').length);
    const words = (item.words || []).map((w) => A.I18n.letters(w).replace(/[^A-Z]/g, '')).filter((w) => w.length >= 2 && w.length <= 10).slice(0, 8);
    const longest = Math.max(...words.map((w) => w.length), 5);
    const n = Math.min(11, Math.max(8, longest + (words.length > 5 ? 2 : 1)));
    const g = Array.from({ length: n }, () => Array(n).fill(''));
    const DIRS = [[0, 1], [1, 0], [1, 1], [-1, 1]];
    const placed = [];
    words.forEach((w) => {
      for (let tries = 0; tries < 300; tries++) {
        const [dr, dc] = DIRS[(r() * DIRS.length) | 0];
        const r0 = Math.floor(r() * n), c0 = Math.floor(r() * n);
        const r1 = r0 + dr * (w.length - 1), c1 = c0 + dc * (w.length - 1);
        if (r1 < 0 || r1 >= n || c1 < 0 || c1 >= n) continue;
        let fits = true;
        for (let i = 0; i < w.length; i++) { const ch = g[r0 + dr * i][c0 + dc * i]; if (ch && ch !== w[i]) { fits = false; break; } }
        if (!fits) continue;
        for (let i = 0; i < w.length; i++) g[r0 + dr * i][c0 + dc * i] = w[i];
        placed.push({ w, r0, c0, dr, dc, found: false });
        return;
      }
    });
    const AZ = 'ABCDEFGHIJKLMNOPRSTUWY';
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (!g[i][j]) g[i][j] = AZ[(r() * AZ.length) | 0];

    const node = shell(item, tr("Drag across a word (or tap its first and last letter)."));
    const board = el('div', 'wsearch');
    board.style.setProperty('--n', n);
    const cellEls = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const c = el('div', 'wl', g[i][j]);
      c.dataset.r = i;
      c.dataset.c = j;
      board.appendChild(c);
      cellEls.push(c);
    }
    const list = el('div', 'wlist', placed.map((p, i) => `<span data-i="${i}">${p.w}</span>`).join(''));
    node.append(board, list);
    const at = (i, j) => cellEls[i * n + j];

    let start = null, anchor = null;
    const line = (a, b) => {
      const dr = b.r - a.r, dc = b.c - a.c;
      if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return null;
      const len = Math.max(Math.abs(dr), Math.abs(dc));
      const sr = Math.sign(dr), sc = Math.sign(dc);
      return Array.from({ length: len + 1 }, (_, k) => ({ r: a.r + sr * k, c: a.c + sc * k }));
    };
    const cellFrom = (e) => {
      const t = document.elementFromPoint(e.clientX, e.clientY);
      return t && t.classList.contains('wl') && board.contains(t) ? { r: +t.dataset.r, c: +t.dataset.c } : null;
    };
    const paint = (cells) => {
      cellEls.forEach((c) => c.classList.remove('selecting'));
      (cells || []).forEach((p) => at(p.r, p.c).classList.add('selecting'));
    };
    function finish(a, b) {
      const cells = line(a, b);
      paint(null);
      if (!cells || cells.length < 2) return false;
      const s = cells.map((p) => g[p.r][p.c]).join('');
      const hit = placed.find((p) => !p.found && (p.w === s || p.w === [...s].reverse().join('')));
      if (!hit) { ctx.sound.thunk(); return true; }
      hit.found = true;
      const hue = (placed.indexOf(hit) * 57 + 10) % 360;
      cells.forEach((p) => { const c = at(p.r, p.c); c.classList.add('found'); c.style.setProperty('--h', hue); });
      list.querySelector(`[data-i="${placed.indexOf(hit)}"]`).classList.add('done');
      good(ctx, at(cells[cells.length >> 1].r, cells[cells.length >> 1].c));
      if (placed.every((p) => p.found)) win(ctx, node, `${tr("All")} ${placed.length} ${tr("words found!")}`);
      return true;
    }
    board.addEventListener('pointerdown', (e) => {
      if (node.classList.contains('won')) return;
      const c = cellFrom(e);
      if (!c) return;
      e.preventDefault();
      start = c;
      board.setPointerCapture(e.pointerId);
      paint([c]);
    });
    board.addEventListener('pointermove', (e) => {
      if (!start) return;
      const c = cellFrom(e);
      if (c) paint(line(start, c) || [start]);
    });
    board.addEventListener('pointerup', (e) => {
      if (!start) return;
      const c = cellFrom(e) || start;
      const s = start;
      start = null;
      if (c.r === s.r && c.c === s.c) {
        // tap-tap mode
        if (anchor && !(anchor.r === c.r && anchor.c === c.c)) { finish(anchor, c); anchor = null; at(c.r, c.c).classList.remove('anchor'); cellEls.forEach((x) => x.classList.remove('anchor')); return; }
        cellEls.forEach((x) => x.classList.remove('anchor'));
        anchor = c;
        at(c.r, c.c).classList.add('anchor');
        paint(null);
        tick(ctx);
        return;
      }
      cellEls.forEach((x) => x.classList.remove('anchor'));
      anchor = null;
      finish(s, c);
    });
    return {
      node,
      label: tr("Hint 💡"),
      primary() {
        const p = placed.find((x) => !x.found);
        if (!p) return false;
        const c = at(p.r0, p.c0);
        c.classList.remove('hint');
        void c.offsetWidth;
        c.classList.add('hint');
        tick(ctx);
        return true;
      },
    };
  }

  // ---------------- Memory match ----------------
  function memory(day, item, ctx) {
    const r = A.rng(day * 3301);
    const sym = SYMBOLS[ctx.theme] || SYMBOLS.snow;
    const deck = shuffle([...sym, ...sym], r);
    const node = shell(item, tr("Flip two cards at a time and find all the pairs."));
    const board = el('div', 'memory');
    const status = el('p', 'game-status', tr("Moves: 0"));
    let first = null, lock = false, moves = 0, pairs = 0;
    const cards = deck.map((s) => {
      const b = el('button', 'mcard', `<span class="back"></span><span class="face">${s}</span>`);
      b.type = 'button';
      b.dataset.s = s;
      b.addEventListener('click', () => flip(b));
      board.appendChild(b);
      return b;
    });
    node.append(board, status);
    function flip(b) {
      if (lock || b.classList.contains('up') || node.classList.contains('won')) return;
      b.classList.add('up');
      tick(ctx);
      if (!first) { first = b; return; }
      moves++;
      status.textContent = `${tr("Moves:")} ${moves}`;
      if (first.dataset.s === b.dataset.s) {
        first.classList.add('matched');
        b.classList.add('matched');
        good(ctx, b);
        first = null;
        if (++pairs === deck.length / 2) win(ctx, node, `${tr("All pairs in")} ${moves} ${tr("moves.")}`);
      } else {
        lock = true;
        const a = first;
        first = null;
        setTimeout(() => { a.classList.remove('up'); b.classList.remove('up'); lock = false; }, 750);
      }
    }
    return {
      node,
      label: tr("Peek 👀"),
      primary() {
        if (node.classList.contains('won') || lock) return false;
        lock = true;
        const hidden = cards.filter((c) => !c.classList.contains('up'));
        hidden.forEach((c) => c.classList.add('up'));
        ctx.sound.whoosh(0.4, 600, 2400, 0.1);
        setTimeout(() => { hidden.forEach((c) => c.classList.remove('up')); lock = false; }, 1100);
        return true;
      },
    };
  }

  // ---------------- Sliding picture puzzle ----------------
  function pictureFor(day, theme) {
    const c = document.createElement('canvas');
    c.width = c.height = 600;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 600);
    const P = PIC[theme] || PIC.snow;
    gr.addColorStop(0, P.top);
    gr.addColorStop(1, P.bottom);
    g.fillStyle = gr;
    g.fillRect(0, 0, 600, 600);
    const r = A.rng(day * 17);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = P.dots;
      g.beginPath();
      g.arc(r() * 600, r() * 600, 2 + r() * 5, 0, 7);
      g.fill();
    }
    g.fillStyle = P.ground;
    g.beginPath();
    g.ellipse(300, 610, 420, 140, 0, 0, 7);
    g.fill();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '300px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    g.fillText(P.emoji, 300, 300);
    g.font = '64px "Bagel Fat One", Georgia, serif';
    g.fillStyle = '#fff';
    g.strokeStyle = 'rgba(0,0,0,.35)';
    g.lineWidth = 8;
    g.strokeText(`${tr("Day")} ${day}`, 300, 530);
    g.fillText(`${tr("Day")} ${day}`, 300, 530);
    return c.toDataURL('image/jpeg', 0.9);
  }

  function slide(day, item, ctx) {
    const N = 3;
    const r = A.rng(day * 2027);
    const img = pictureFor(day, ctx.theme);
    // tiles[pos] = tile id; id N*N-1 is the gap. Shuffle by legal moves so it's always solvable.
    let tiles = [...Array(N * N).keys()];
    let gap = N * N - 1, prev = -1;
    const neighbours = (p) => [p - N, p + N, p % N ? p - 1 : -1, (p + 1) % N ? p + 1 : -1].filter((q) => q >= 0 && q < N * N);
    for (let k = 0; k < 80 || tiles.every((t, i) => t === i); k++) {
      const opts = neighbours(gap).filter((q) => q !== prev);
      const q = opts[(r() * opts.length) | 0];
      [tiles[gap], tiles[q]] = [tiles[q], tiles[gap]];
      prev = gap;
      gap = q;
    }
    const node = shell(item, tr("Tap a tile next to the gap to slide it. Rebuild the picture!"));
    const board = el('div', 'slide');
    board.style.setProperty('--n', N);
    const peek = el('div', 'slide-peek');
    peek.style.backgroundImage = `url("${img}")`;
    const els = tiles.map((id) => {
      const t = el('button', 'tile', `<span>${id + 1}</span>`);
      t.type = 'button';
      t.dataset.id = id;
      t.style.backgroundImage = `url("${img}")`;
      t.style.backgroundPosition = `${((id % N) / (N - 1)) * 100}% ${(Math.floor(id / N) / (N - 1)) * 100}%`;
      if (id === N * N - 1) t.classList.add('gap');
      t.addEventListener('click', () => move(id));
      board.appendChild(t);
      return t;
    });
    board.appendChild(peek);
    const status = el('p', 'game-status', tr("Moves: 0"));
    node.append(board, status);
    let moves = 0;
    const layout = () => tiles.forEach((id, pos) => {
      const t = els.find((e) => +e.dataset.id === id);
      t.style.setProperty('--x', pos % N);
      t.style.setProperty('--y', Math.floor(pos / N));
    });
    layout();
    function move(id) {
      if (node.classList.contains('won')) return;
      const pos = tiles.indexOf(id), g = tiles.indexOf(N * N - 1);
      if (!neighbours(g).includes(pos)) { ctx.sound.thunk(); return; }
      [tiles[pos], tiles[g]] = [tiles[g], tiles[pos]];
      moves++;
      status.textContent = `${tr("Moves:")} ${moves}`;
      layout();
      ctx.sound.pop(500, 700, 0.1);
      if (tiles.every((t, i) => t === i)) {
        board.classList.add('solved');
        setTimeout(() => win(ctx, node, `${tr("Solved in")} ${moves} ${tr("moves.")}`), 350);
      }
    }
    return {
      node,
      label: tr("Peek 👀"),
      primary() {
        if (node.classList.contains('won')) return false;
        board.classList.add('peeking');
        setTimeout(() => board.classList.remove('peeking'), 1400);
        return true;
      },
    };
  }

  // ---------------- Word scramble ----------------
  function scramble(day, item, ctx) {
    const r = A.rng(day * 6007);
    const list = (item.words || []).map(([w, h]) => [A.I18n.letters(w).replace(/[^A-Z]/g, ''), h]).filter(([w]) => w.length >= 3);
    const node = shell(item, tr("Tap the letters in the right order."));
    const stage = el('div', 'scramble');
    const status = el('p', 'game-status');
    node.append(stage, status);
    let idx = 0, slots = [], word = '';
    function setup() {
      const [w, hint] = list[idx];
      word = w;
      let letters;
      let guard = 0;
      do { letters = shuffle([...w], r); } while (letters.join('') === w && ++guard < 20);
      stage.innerHTML = `<p class="sc-hint">${esc(hint || '')}</p><div class="sc-slots"></div><div class="sc-tiles"></div>`;
      const sEl = stage.querySelector('.sc-slots'), tEl = stage.querySelector('.sc-tiles');
      slots = [...w].map(() => {
        const s = el('button', 'sc-slot');
        s.type = 'button';
        s.addEventListener('click', () => unplace(s));
        sEl.appendChild(s);
        return s;
      });
      letters.forEach((ch) => {
        const t = el('button', 'sc-tile', ch);
        t.type = 'button';
        t.addEventListener('click', () => placeTile(t));
        tEl.appendChild(t);
      });
      status.textContent = `${tr("Word")} ${idx + 1} ${tr("of")} ${list.length}`;
    }
    function placeTile(t) {
      if (t.classList.contains('used') || node.classList.contains('won')) return;
      const s = slots.find((x) => !x.textContent);
      if (!s) return;
      s.textContent = t.textContent;
      s._tile = t;
      t.classList.add('used');
      tick(ctx);
      if (slots.every((x) => x.textContent)) check();
    }
    function unplace(s) {
      if (!s._tile || node.classList.contains('won')) return;
      s._tile.classList.remove('used');
      s._tile = null;
      s.textContent = '';
    }
    function check() {
      const guess = slots.map((s) => s.textContent).join('');
      const box = stage.querySelector('.sc-slots');
      if (guess === word) {
        box.classList.add('right');
        good(ctx, box);
        setTimeout(() => {
          idx++;
          if (idx >= list.length) win(ctx, node, `${list.length} ${tr("words unscrambled!")}`);
          else setup();
        }, 800);
      } else {
        box.classList.remove('wrong');
        void box.offsetWidth;
        box.classList.add('wrong');
        ctx.sound.thunk();
        setTimeout(() => slots.forEach(unplace), 600);
      }
    }
    if (list.length) setup();
    return {
      node,
      label: tr("Hint 💡"),
      primary() {
        if (node.classList.contains('won')) return false;
        // clear anything after the first wrong letter, then place the next right one
        let k = 0;
        while (k < slots.length && slots[k].textContent === word[k]) k++;
        slots.slice(k).forEach(unplace);
        if (k >= word.length) return false;
        const t = [...stage.querySelectorAll('.sc-tile:not(.used)')].find((x) => x.textContent === word[k]);
        if (t) placeTile(t);
        slots[k].classList.add('hinted');
        return true;
      },
    };
  }

  const GAMES = { sudoku, wordsearch, memory, slide, scramble };

  A.GAME_INFO = {
    sudoku: { icon: '🔢', name: 'Sudoku' },
    wordsearch: { icon: '🔎', name: tr("Word search") },
    memory: { icon: '🃏', name: tr("Memory match") },
    slide: { icon: '🧩', name: tr("Picture puzzle") },
    scramble: { icon: '🔤', name: tr("Word scramble") },
  };

  A.Games = {
    render(day, item, ctx) {
      const fn = GAMES[item.game] || memory;
      return fn(day, item, ctx);
    },
  };
})();
