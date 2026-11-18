/* The creator's editor: who + theme → 24 pre-filled doors → personalise → preview & share. */
(async function () {
  const A = window.Advent;
  const $ = (id) => document.getElementById(id);
  const esc = A.esc;
  const params = new URLSearchParams(location.search);
  let LAST = 'littledoors:last';
  let shareToken = null;
  const FREE_PHOTOS = 3;

  let cal = null;
  let theme = 'snow';
  let step = 'start';
  let huts = [];
  const photoURL = {}; // photoId -> object URL

  const fill = (s) => String(s || '').replace(/\{to\}/g, cal ? cal.to : 'them').replace(/\{from\}/g, cal ? cal.from : 'you');
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const photoCount = () => cal.days.filter((d) => d.photoId).length;
  const personalCount = () => cal.days.filter((d) => d.personal).length;

  // ---------------- Theme / background ----------------
  A.FX.init($('ambient'), $('fx'));
  // ---- Live 3D backdrop: the chosen world drifting behind the editor ----
  const webgl = (() => {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  })();
  let bgTheme = null;
  function setBackdrop(t) {
    if (!webgl || location.protocol === 'file:' || t === bgTheme) return;
    bgTheme = t;
    const box = $('bg3d');
    const f = document.createElement('iframe');
    f.tabIndex = -1;
    f.setAttribute('aria-hidden', 'true');
    f.title = '';
    f.src = `3d.html?theme=${encodeURIComponent(t)}&bg`;
    f._show = () => {
      if (bgTheme !== t) { f.remove(); return; } // picked another world meanwhile
      if (f.classList.contains('on')) return;
      f.classList.add('on');
      document.body.classList.add('has3d');
      setTimeout(() => box.querySelectorAll('iframe').forEach((o) => { if (o !== f) o.remove(); }), 1000);
    };
    box.appendChild(f);
    setTimeout(() => f.isConnected && f._show(), 8000); // in case "ready" never arrives
  }
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || e.data.littleDoorsBg !== 'ready') return;
    const f = [...$('bg3d').querySelectorAll('iframe')].find((x) => x.contentWindow === e.source);
    if (f) f._show();
  });

  function setTheme(t) {
    if (!A.THEMES[t]) t = 'snow';
    setBackdrop(t);
    theme = t;
    const look = A.baseOf(t); // premium worlds borrow a base 2D backdrop here; their own colours still apply
    document.documentElement.dataset.theme = t;
    document.documentElement.dataset.base = look;
    document.querySelector('meta[name=theme-color]').content = look === 'snow' ? '#0b1638' : '#ff9a8b';
    A.Sound.theme = A.THEMES[t].sound || look;
    A.FX.setTheme(look);
    A.Scene.build(look, $('scene'), $('foreground'));
    document.querySelectorAll('[data-theme-pick]').forEach((b) => {
      const selected = b.dataset.themePick === t;
      b.classList.toggle('on', selected);
      b.setAttribute('aria-pressed', String(selected));
      if (selected) {
        $('selectedWorld').textContent = `${A.THEMES[t].name} — ${b.dataset.description}`;
      }
    });
  }

  // ---------------- Saving ----------------
  let saveT, saveQueue = Promise.resolve();
  function persist() {
    const snapshot = structuredClone(cal);
    const task = saveQueue.catch(() => {}).then(() => A.DB.saveCalendar(snapshot));
    saveQueue = task;
    return task;
  }
  function save() {
    $('saved').textContent = 'Saving…';
    clearTimeout(saveT);
    saveT = setTimeout(async () => {
      try {
        await persist();
        A.store.set(LAST, cal.id);
        $('saved').textContent = 'Saved ✓';
      } catch (e) {
        $('saved').textContent = 'Couldn’t save';
      }
    }, 250);
  }

  let toastT;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function celebrate(node, count = 70) {
    A.Sound.init();
    A.Sound.chime();
    const r = node.getBoundingClientRect();
    A.FX.burst(r.left + r.width / 2, r.top + r.height / 2, { count, power: 0.8 });
  }

  // ---------------- Load ----------------
  try { await A.DBReady; }
  catch { return; } // The account panel shows the retry message; never silently save locally.
  if (A.DB.isCloud) {
    document.querySelectorAll('.proto-note').forEach((node) => { node.textContent = 'Your link is read-only. Recipients do not need to sign in.'; });
    $('buyBtn').textContent = 'Season Pass coming soon';
    $('buyBtn').disabled = true;
    $('goDoors').nextElementSibling.textContent = 'Save your calendar to your account. Recipients open their link without signing in.';
    $('buyBtn').nextElementSibling.textContent = 'Online checkout is not available yet.';
    if (A.Auth.user) {
      LAST += ':' + A.Auth.user.id;
      try {
        const calendars = await A.DB.listCalendars();
        $('accountCalendars').replaceChildren();
        calendars.forEach((item) => {
          const link = document.createElement('a');
          link.href = 'editor.html?c=' + encodeURIComponent(item.id) + '&step=doors';
          link.textContent = (item.to || 'Your calendar') + ' · ' + (A.THEMES[item.theme]?.name || 'Calendar');
          $('accountCalendars').append(link);
        });
        if (!calendars.length) $('accountCalendars').textContent = 'Your first calendar starts below.';
      } catch { $('accountCalendars').textContent = 'Couldn’t load your calendars. Refresh to try again.'; }
    }
  }
  const wanted = params.has('new') ? null : params.get('c') || A.store.get(LAST, null);
  if (wanted) {
    try { cal = await A.DB.getCalendar(wanted); }
    catch {
      $('saved').textContent = 'Couldn’t load';
      $('accountMessage').textContent = 'Couldn’t load that calendar. Please refresh to try again.';
      $('accountMessage').setAttribute('role', 'alert');
      return;
    }
  }
  if (cal) {
    await Promise.all(cal.days.map(async (d) => {
      if (d.photoId && !photoURL[d.photoId]) {
        try { photoURL[d.photoId] = await A.DB.getPhotoURL(d.photoId); }
        catch { $('accountMessage').textContent = 'Some photos couldn’t load. Refresh to try again.'; }
      }
    }));
    setTheme(cal.theme);
    $('fTo').value = cal.to;
    $('fFrom').value = cal.from;
  } else {
    setTheme(params.get('theme') || 'snow');
  }

  // ---------------- Steps ----------------
  let layoutAnimation = null;
  function go(next, instant) {
    if (next !== 'start' && !cal) next = 'start';
    const main = $('editorMain');
    const animateLayout = !instant && !A.reducedMotion && step !== next && matchMedia('(min-width: 960px)').matches;
    if (layoutAnimation) { layoutAnimation.cancel(); layoutAnimation = null; }
    const before = animateLayout ? main.getBoundingClientRect() : null;
    step = next;
    document.body.dataset.editorStep = next;
    ['start', 'doors', 'share'].forEach((s) => ($('s-' + s).hidden = s !== next));
    document.querySelectorAll('#steps li').forEach((li) => {
      li.classList.toggle('on', li.dataset.step === next);
      li.querySelector('button').disabled = !cal && li.dataset.step !== 'start';
    });
    $('edBar').hidden = next === 'start';
    $('nextBtn').hidden = next !== 'doors';
    if (cal) {
      const url = new URL(location.href);
      url.search = `?c=${cal.id}&step=${next}`;
      history.replaceState(null, '', url);
    }
    if (next === 'doors') renderDoors(!instant);
    if (next === 'share') renderShare();
    window.scrollTo({ top: 0, behavior: instant || animateLayout || A.reducedMotion ? 'auto' : 'smooth' });
    if (animateLayout && typeof main.animate === 'function') {
      // Animate visual geometry after laying out the final grid, so house sizes stay correct.
      const after = main.getBoundingClientRect();
      layoutAnimation = main.animate([
        { transform: `translateX(${before.left - after.left}px) scaleX(${before.width / after.width})`, transformOrigin: 'top left', opacity: 0.78 },
        { transform: 'translateX(0) scaleX(1)', transformOrigin: 'top left', opacity: 1 },
      ], { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    }
  }
  document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
  $('backBtn').addEventListener('click', () => go(step === 'share' ? 'doors' : 'start'));
  $('nextBtn').addEventListener('click', () => go('share'));

  // ---------------- 1. Who + theme ----------------
  document.querySelectorAll('.theme-card').forEach((b) =>
    b.addEventListener('click', () => setTheme(b.dataset.themePick))
  );

  let pendingPass = false; // Season Pass bought before the calendar exists
  const hasPass = () => pendingPass || (cal && cal.plan === 'season');

  $('goDoors').addEventListener('click', () => {
    if (A.DB.isCloud && !A.Auth.user) { A.Auth.prompt(); return; }
    if (A.THEMES[theme].premium && !hasPass()) {
      upsell(`${A.THEMES[theme].name} is part of the Season Pass.`);
      return;
    }
    const to = $('fTo').value.trim();
    const from = $('fFrom').value.trim();
    if (!to) {
      $('fTo').focus();
      $('fTo').parentElement.classList.remove('shake');
      void $('fTo').offsetWidth;
      $('fTo').parentElement.classList.add('shake');
      toast('Who is this calendar for?');
      return;
    }
    if (!cal) {
      const now = new Date();
      cal = {
        id: A.DB.newId(),
        theme,
        to,
        from: from || 'Someone who loves you',
        year: now.getMonth() < 2 ? now.getFullYear() - 1 : now.getFullYear(),
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Sydney',
        plan: pendingPass ? 'season' : 'free',
        createdAt: Date.now(),
        days: clone(A.CONTENT[theme]),
      };
    } else {
      cal.to = to;
      cal.from = from || cal.from;
      if (cal.theme !== theme) {
        // Keep everything they made; swap the untouched presets for the new world's pack.
        cal.days = cal.days.map((d, i) => (d.personal ? d : clone(A.CONTENT[theme][i])));
        cal.theme = theme;
      }
    }
    save();
    celebrate($('goDoors'), 110);
    go('doors');
  });

  // ---------------- 2. Doors ----------------
  const grid = $('edGrid');

  function renderDoors(animate) {
    $('dTitle').textContent = fill(A.THEMES[cal.theme].title);
    grid.innerHTML = '';
    huts = A.makeHuts(cal.theme, (d) => A.iconFor(cal.days[d - 1], cal.theme), (d) => openSheet(d));
    huts.forEach((h, i) => {
      h.insertAdjacentHTML('beforeend', '<span class="badge" aria-hidden="true">♥</span><span class="add" aria-hidden="true">+</span>');
      decorate(i + 1);
      grid.appendChild(h);
    });
    layoutGrid();
    if (animate && !A.reducedMotion) {
      huts.forEach((h, i) => setTimeout(() => h.classList.add('open'), 250 + i * 45));
      setTimeout(() => A.Sound.sparkle(8), 400);
    } else {
      huts.forEach((h) => h.classList.add('open'));
    }
    renderHelpers();
  }

  function decorate(d) {
    const h = huts[d - 1];
    if (!h) return;
    const day = cal.days[d - 1];
    const url = day.photoId && photoURL[day.photoId];
    h.classList.toggle('personal', !!day.personal);
    h.classList.toggle('needs-photo', day.type === 'photo' && !day.photoId);
    h.classList.toggle('has-photo', !!url);
    h.querySelector('.inside').style.backgroundImage = url ? `url("${url}")` : '';
    A.setHutIcon(h, A.iconFor(day, cal.theme));
    h.setAttribute('aria-label', `Day ${d}: ${summary(day).title}. Tap to edit.`);
  }

  function layoutGrid() {
    if (!huts.length) return;
    const w = Math.min(grid.clientWidth, 940) - 32; // Room for roofs and badges inside the panel.
    A.layoutHuts(grid, huts, cal.theme, w, 99999, w < 560 ? [4] : [6]);
  }
  window.addEventListener('resize', () => step === 'doors' && layoutGrid());

  function renderHelpers() {
    const n = personalCount();
    const msg = n === 0 ? 'No personal touches yet — even three makes it special'
      : n < 3 ? `${n} personal touch${n === 1 ? '' : 'es'} · lovely start`
      : n < 6 ? `${n} personal touches · this is going to land 💛`
      : `${n} personal touches · absolutely legendary ✨`;
    $('meterText').textContent = msg;
    $('meterBar').style.width = Math.min(100, (n / 6) * 100) + '%';

    const tips = [];
    const emptyPhoto = cal.days.findIndex((d) => d.type === 'photo' && !d.photoId);
    if (emptyPhoto >= 0) tips.push({ label: `📸 Add a photo to day ${emptyPhoto + 1}`, run: () => openSheet(emptyPhoto + 1) });
    if (!cal.days[23].personal) tips.push({ label: '💌 Write the Christmas Eve letter', run: () => openSheet(24, 'note') });
    tips.push({ label: '🖼️ Add several photos at once', run: () => $('bulkIn').click() });
    if (!cal.days[0].personal && tips.length < 3) tips.push({ label: '👋 Write the welcome note', run: () => openSheet(1, 'note') });
    const box = $('suggest');
    box.innerHTML = '';
    tips.slice(0, 3).forEach((t) => {
      const b = A.el('button', 'chip', esc(t.label));
      b.type = 'button';
      b.addEventListener('click', t.run);
      box.appendChild(b);
    });
  }

  function summary(day) {
    switch (day.type) {
      case 'photo': return { title: day.caption ? fill(day.caption) : 'A photo memory', text: day.photoId ? 'Your photo, hidden under ' + (cal.theme === 'snow' ? 'frost' : 'sand') : 'Add your own photo here' };
      case 'message': return { title: 'A note', text: fill(day.text).slice(0, 110) };
      case 'finale': return { title: 'Christmas Eve letter', text: fill(day.text).slice(0, 110) };
      case 'riddle': case 'joke': return { title: fill(day.q), text: A.KIND_LABEL[day.type] };
      case 'activity': return { title: fill(day.title), text: fill(day.body).slice(0, 110) };
      case 'voucher': return { title: fill(day.title), text: 'Voucher · ' + fill(day.body).slice(0, 80) };
      case 'game': {
        const name = (A.GAME_INFO[day.game] || {}).name || 'Mini game';
        const extra = day.game === 'wordsearch' && day.words ? ' · ' + day.words.join(', ') : day.game === 'sudoku' ? (day.size === 6 ? ' · 6×6, numbers' : ' · 4×4, pictures') : '';
        return { title: fill(day.title || name), text: name + extra };
      }
    }
    return { title: 'A surprise', text: '' };
  }

  // ---------------- Day sheet ----------------
  let sheetDay = null;
  let sheetMode = 'home';
  let presetFilter = 'All';

  function openSheet(d, mode) {
    A.Sound.init();
    sheetDay = d;
    const day = cal.days[d - 1];
    sheetMode = mode || (day.photoId ? 'photo' : 'home');
    renderSheet();
    $('sheet').hidden = false;
    document.body.classList.add('sheet-open');
    A.Sound.pop(500, 800, 0.12);
    requestAnimationFrame(() => {
      const f = $('shBody').querySelector('textarea, input[type=text], button');
      f && f.focus({ preventScroll: true });
    });
  }

  function closeSheet() {
    $('sheet').hidden = true;
    document.body.classList.remove('sheet-open');
    if (sheetDay && huts[sheetDay - 1]) huts[sheetDay - 1].focus({ preventScroll: true });
    sheetDay = null;
  }

  function renderSheet() {
    const d = sheetDay;
    const day = cal.days[d - 1];
    $('shDay').textContent = `Day ${d}`;
    $('shKind').textContent = d === 24 ? 'Christmas Eve' : day.personal ? 'Made by you ♥' : 'Ready-made surprise';
    const body = $('shBody');
    const s = summary(day);
    const isEve = d === 24;

    if (sheetMode === 'home') {
      body.innerHTML = `
        <div class="current">
          <span class="cur-icon">${day.photoId ? `<img src="${photoURL[day.photoId]}" alt="">` : A.iconFor(day, cal.theme)}</span>
          <span class="cur-text"><b>${esc(s.title)}</b><small>${esc(s.text)}</small></span>
        </div>
        <p class="label">Make it personal</p>
        <div class="actions">
          <button type="button" data-act="camera"><span>📸</span><b>Take a photo</b></button>
          <button type="button" data-act="library"><span>🖼️</span><b>Choose a photo</b></button>
          <button type="button" data-act="note"><span>💌</span><b>${isEve ? 'Write the letter' : 'Write a note'}</b></button>
          <button type="button" data-act="voucher"><span>🎟️</span><b>Make a voucher</b></button>
          <button type="button" class="wide" data-act="games"><span>🎮</span><b>Add a mini game</b><small>Sudoku, word search, memory…</small></button>
        </div>
        ${day.type === 'game' && day.game === 'wordsearch' ? '<button type="button" class="pick-preset" data-act="words">✏️ Use your own words in this word search <span>→</span></button>' : ''}
        <button type="button" class="pick-preset" data-act="presets">✨ Or pick a different surprise <span>${presets().length} ideas →</span></button>
        <div class="sheet-foot">
          ${day.personal ? '<button type="button" class="link" data-act="reset">Reset to the original</button>' : '<span></span>'}
          <button type="button" class="btn primary" data-act="done">Done</button>
        </div>`;
    } else if (sheetMode === 'photo') {
      body.innerHTML = `
        <div class="photo-edit">
          <div class="pe-thumb">${day.photoId ? `<img src="${photoURL[day.photoId]}" alt="Your photo">` : '<span>📸</span>'}</div>
          <div class="pe-side">
            <label class="field">Caption <small>(written under the photo)</small>
              <input type="text" id="capIn" maxlength="60" value="${esc(day.caption || '')}" placeholder="Remember this?">
            </label>
            <div class="row-btns">
              <button type="button" class="btn ghost small" data-act="camera">📸 Retake</button>
              <button type="button" class="btn ghost small" data-act="library">🖼️ Another</button>
              <button type="button" class="btn ghost small" data-act="removePhoto">Remove</button>
            </div>
          </div>
        </div>
        <p class="hint">${esc(cal.to)} will ${cal.theme === 'snow' ? 'wipe away frost' : 'brush away sand'} to reveal it ✨</p>
        <div class="sheet-foot"><button type="button" class="link" data-act="home">← Other options</button><button type="button" class="btn primary" data-act="done">Done</button></div>`;
      $('capIn').addEventListener('input', (e) => {
        day.caption = e.target.value;
        save();
        decorate(d);
      });
    } else if (sheetMode === 'note') {
      const existing = day.type === 'message' || day.type === 'finale' ? fill(day.text) : '';
      body.innerHTML = `
        <label class="field">${isEve ? 'Your Christmas Eve letter' : 'Your note'}
          <textarea id="noteIn" rows="7" maxlength="900" placeholder="Dear ${esc(cal.to)},&#10;&#10;">${esc(existing)}</textarea>
        </label>
        <p class="hint">It appears in handwriting${isEve ? ', with fireworks' : ', inside an envelope they tap to open'}. Signed “${esc(cal.from)}”.</p>
        <div class="sheet-foot"><button type="button" class="link" data-act="home">← Back</button><button type="button" class="btn primary" data-act="saveNote">Save note</button></div>`;
      // Ready-made words are selected, so typing replaces them; your own words keep the caret at the end.
      requestAnimationFrame(() => {
        const ta = $('noteIn');
        if (!ta) return;
        ta.focus({ preventScroll: true });
        if (day.personal) ta.setSelectionRange(ta.value.length, ta.value.length);
        else ta.select();
      });
    } else if (sheetMode === 'voucher') {
      const v = day.type === 'voucher' ? day : { title: '', body: '' };
      body.innerHTML = `
        <div class="voucher mini-v"><div class="v-main"><span class="v-label">Voucher</span><h2 id="vPrevT">${esc(fill(v.title) || 'One…')}</h2></div><div class="v-stub"><span>Nº ${String(d).padStart(3, '0')}</span></div></div>
        <label class="field">Good for one…
          <input type="text" id="vTitle" maxlength="50" value="${esc(fill(v.title))}" placeholder="breakfast in bed">
        </label>
        <label class="field">The fine print <small>(optional)</small>
          <input type="text" id="vBody" maxlength="120" value="${esc(fill(v.body))}" placeholder="Valid any morning you like. Pancakes guaranteed.">
        </label>
        <div class="idea-chips">${['A day out, just us', 'Breakfast in bed', 'Movie night, you pick', 'A long phone call', 'One car wash', 'Dinner, my treat'].map((x) => `<button type="button" class="chip" data-idea="${esc(x)}">${esc(x)}</button>`).join('')}</div>
        <div class="sheet-foot"><button type="button" class="link" data-act="home">← Back</button><button type="button" class="btn primary" data-act="saveVoucher">Save voucher</button></div>`;
      const sync = () => ($('vPrevT').textContent = $('vTitle').value ? ($('vTitle').value.match(/^one\b/i) ? '' : 'One ') + $('vTitle').value : 'One…');
      $('vTitle').addEventListener('input', sync);
      body.querySelectorAll('[data-idea]').forEach((b) => b.addEventListener('click', () => { $('vTitle').value = b.dataset.idea.toLowerCase(); sync(); }));
    } else if (sheetMode === 'words') {
      const cur = day.type === 'game' && day.game === 'wordsearch' ? day : { title: '', words: [] };
      body.innerHTML = `
        <label class="field">Title
          <input type="text" id="wsTitle" maxlength="40" value="${esc(fill(cur.title || 'Find the hidden words'))}">
        </label>
        <label class="field">Words to hide <small>(3–8 words, 2–10 letters each — names work brilliantly)</small>
          <textarea id="wsWords" rows="3" maxlength="120" placeholder="MIA, DAD, BEACH, PAVLOVA">${esc((cur.words || []).join(', '))}</textarea>
        </label>
        <p class="hint" id="wsHint">Letters only; spaces and punctuation are ignored.</p>
        <div class="sheet-foot"><button type="button" class="link" data-act="home">← Back</button><button type="button" class="btn primary" data-act="saveWords">Save word search</button></div>`;
    } else if (sheetMode === 'presets') {
      const cats = ['All', 'Games', 'Activities', 'Puzzles', 'Jokes', 'Vouchers', 'Notes'];
      const list = presets().filter((p) => presetFilter === 'All' || p.cat === presetFilter);
      body.innerHTML = `
        <div class="filter">${cats.map((c) => `<button type="button" class="chip${c === presetFilter ? ' on' : ''}" data-cat="${c}">${c}</button>`).join('')}</div>
        <div class="preset-list">${list.map((p) => `
          <button type="button" class="preset" data-preset="${p.i}">
            <span class="pe">${A.iconFor(p.item, cal.theme)}</span>
            <span class="pt"><b>${esc(fill(p.title))}</b><small>${p.item.type === 'game' ? esc(summary(p.item).text) : esc(A.KIND_LABEL[p.item.type])}${p.item.chips ? ' · ' + esc(p.item.chips.join(' · ')) : ''}</small></span>
          </button>`).join('')}</div>
        <div class="sheet-foot"><button type="button" class="link" data-act="home">← Back</button><span></span></div>`;
      body.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { presetFilter = b.dataset.cat; renderSheet(); }));
    }
  }

  // Every ready-made surprise from both packs, de-duplicated, current theme first.
  let presetCache = null;
  function presets() {
    if (presetCache && presetCache.theme === cal.theme) return presetCache.list;
    const CAT = { game: 'Games', activity: 'Activities', riddle: 'Puzzles', joke: 'Jokes', voucher: 'Vouchers', message: 'Notes' };
    const seen = new Set();
    const list = [];
    [cal.theme, cal.theme === 'snow' ? 'summer' : 'snow'].forEach((t) =>
      [...A.CONTENT[t], ...((A.EXTRA && A.EXTRA[t]) || [])].forEach((item) => {
        if (!CAT[item.type]) return;
        const title = item.title || item.q || item.text.split('\n')[0];
        if (seen.has(title)) return;
        seen.add(title);
        list.push({ i: list.length, item, title, cat: CAT[item.type] });
      })
    );
    presetCache = { theme: cal.theme, list };
    return list;
  }

  async function setDay(d, next, opts = {}) {
    const old = cal.days[d - 1];
    cal.days[d - 1] = next;
    if (A.DB.isCloud) {
      clearTimeout(saveT);
      $('saved').textContent = 'Saving…';
      try { await persist(); $('saved').textContent = 'Saved ✓'; A.store.set(LAST, cal.id); }
      catch (error) { cal.days[d - 1] = old; $('saved').textContent = 'Couldn’t save'; throw error; }
    } else save();
    if (old.photoId && old.photoId !== next.photoId) {
      A.DB.deletePhoto(old.photoId).catch(() => {}); // Cleanup follows a durable calendar update.
      if (photoURL[old.photoId]) URL.revokeObjectURL(photoURL[old.photoId]);
      delete photoURL[old.photoId];
    }
    decorate(d);
    renderHelpers();
    if (opts.celebrate && huts[d - 1]) celebrate(huts[d - 1].querySelector('.doorway'), 60);
  }

  async function onSheetClick(e) {
    const presetBtn = e.target.closest('[data-preset]');
    if (presetBtn) {
      const p = presets()[+presetBtn.dataset.preset];
      await setDay(sheetDay, clone(p.item));
      closeSheet();
      toast('Surprise swapped ✨');
      return;
    }
    const act = e.target.closest('[data-act]');
    if (act) await handle(act.dataset.act);
  }
  const sheetError = () => toast('Couldn’t save that change. Please try again.');
  $('shBody').addEventListener('click', (e) => onSheetClick(e).catch(sheetError));
  $('sheet').querySelectorAll('.sheet-backdrop, .sheet-head [data-act]').forEach((b) => b.addEventListener('click', () => handle(b.dataset.act).catch(sheetError)));

  let photoTarget = null;
  async function handle(act) {
    const d = sheetDay;
    if (!d) return;
    const day = cal.days[d - 1];
    switch (act) {
      case 'done': closeSheet(); break;
      case 'home': sheetMode = 'home'; renderSheet(); break;
      case 'note': case 'voucher': case 'presets': case 'words': sheetMode = act; renderSheet(); break;
      case 'games': sheetMode = 'presets'; presetFilter = 'Games'; renderSheet(); break;
      case 'saveWords': {
        const words = [...new Set($('wsWords').value.toUpperCase().split(/[^A-Z]+/).filter((w) => w.length >= 2 && w.length <= 10))].slice(0, 8);
        if (words.length < 3) {
          $('wsHint').textContent = 'Add at least 3 words (2–10 letters each).';
          $('wsHint').style.color = '#d22f4a';
          $('wsWords').focus();
          return;
        }
        await setDay(d, { type: 'game', game: 'wordsearch', title: $('wsTitle').value.trim() || 'Find the hidden words', words, personal: true }, { celebrate: true });
        closeSheet();
        toast('Word search saved 🔎');
        break;
      }
      case 'camera': case 'library':
        if (!canAddPhoto(d)) return upsell();
        photoTarget = d;
        $(act === 'camera' ? 'camIn' : 'libIn').click();
        break;
      case 'removePhoto':
        await setDay(d, resetItem(d));
        sheetMode = 'home';
        renderSheet();
        toast('Photo removed');
        break;
      case 'reset':
        await setDay(d, resetItem(d));
        sheetMode = 'home';
        renderSheet();
        toast(`Day ${d} is back to its original surprise`);
        break;
      case 'saveNote': {
        const text = $('noteIn').value.trim();
        if (!text) { $('noteIn').focus(); return; }
        await setDay(d, { type: d === 24 ? 'finale' : 'message', text, personal: true }, { celebrate: true });
        closeSheet();
        toast(d === 24 ? 'Christmas Eve letter saved 💌' : 'Note saved 💌');
        break;
      }
      case 'saveVoucher': {
        let title = $('vTitle').value.trim();
        if (!title) { $('vTitle').focus(); return; }
        if (!/^one\b/i.test(title)) title = 'One ' + title;
        await setDay(d, { type: 'voucher', title, body: $('vBody').value.trim() || 'Valid whenever you like.', personal: true }, { celebrate: true });
        closeSheet();
        toast('Voucher saved 🎟️');
        break;
      }
    }
    void day;
  }

  const resetItem = (d) => clone(A.CONTENT[cal.theme][d - 1]);
  const canAddPhoto = (d) => cal.plan === 'season' || cal.days[d - 1].photoId || photoCount() < FREE_PHOTOS;

  async function addPhotoTo(d, file) {
    const blob = await A.preparePhoto(file);
    const id = await A.DB.putPhoto(blob);
    photoURL[id] = URL.createObjectURL(blob);
    const old = cal.days[d - 1];
    await setDay(d, { type: 'photo', caption: old.type === 'photo' ? old.caption || '' : '', photoId: id, personal: true });
  }

  async function onPhotoPicked(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !photoTarget) return;
    const d = photoTarget;
    toast('Adding your photo…');
    try {
      await addPhotoTo(d, file);
      if (sheetDay === d) { sheetMode = 'photo'; renderSheet(); }
      celebrate(huts[d - 1].querySelector('.doorway'), 70);
      toast(`Photo added to day ${d} 📸`);
    } catch (err) {
      toast('Couldn’t add that photo. Check your connection and try again.');
    }
  }
  $('camIn').addEventListener('change', onPhotoPicked);
  $('libIn').addEventListener('change', onPhotoPicked);

  // Several photos at once: fill the photo slots first, then other ready-made days.
  $('bulkIn').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    const slots = [];
    cal.days.forEach((d, i) => { if (d.type === 'photo' && !d.photoId) slots.push(i + 1); });
    cal.days.forEach((d, i) => { if (!d.personal && d.type !== 'photo' && i > 0 && i < 23) slots.push(i + 1); });
    let added = 0;
    toast('Adding your photos…');
    for (const f of files) {
      const d = slots.shift();
      if (!d) break;
      if (!canAddPhoto(d)) { upsell(`Your ${FREE_PHOTOS} free photos are in. Unlock the Season Pass to add the other ${files.length - added}.`); break; }
      try { await addPhotoTo(d, f); added++; } catch (err) { /* skip unreadable */ }
    }
    if (added) {
      toast(`${added} photo${added === 1 ? '' : 's'} spread across your doors 📸`);
      A.Sound.init();
      A.Sound.sparkle(10);
    }
  });

  // ---------------- Season pass (mock checkout) ----------------
  function upsell(why) {
    $('upWhy').textContent = why || `You’ve used your ${FREE_PHOTOS} free photos.`;
    $('upsell').hidden = false;
    A.Sound.init();
    A.Sound.pop(400, 900, 0.15);
  }
  $('upsell').querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => ($('upsell').hidden = true)));
  $('buyBtn').addEventListener('click', () => {
    if (A.DB.isCloud) return; // Real entitlements are written only by the payment server.
    if (cal) {
      cal.plan = 'season';
      save();
    } else {
      pendingPass = true;
    }
    celebrate($('buyBtn'), 140);
    A.Sound.fanfare();
    $('upsell').hidden = true;
    toast('Season Pass unlocked — every world and unlimited photos 🎉');
    if (step === 'share') renderShare();
  });

  // ---------------- 3. Share ----------------
  const ZONES = ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Adelaide', 'Australia/Perth', 'Australia/Hobart', 'Australia/Darwin', 'Pacific/Auckland', 'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Chicago', 'America/Los_Angeles'];

  // Calendars open in the 3D world by default (it falls back to 2D on devices without WebGL).
  function linkFor(extra = '', page = '3d.html') {
    if (A.DB.isCloud && !extra.includes('preview') && !shareToken) return '';
    const share = A.DB.isCloud && !extra.includes('preview') ? '&s=' + shareToken : '';
    return new URL(`${page}?c=${cal.id}${share}${extra}`, location.href).href;
  }

  async function renderShare() {
    $('shareEmblem').textContent = A.THEMES[cal.theme].emblem;
    $('shareTitle').textContent = `Ready for ${cal.to}!`;
    const n = personalCount(), p = photoCount();
    $('shareSummary').innerHTML = `24 doors · <b>${n}</b> made by you · <b>${p}</b> photo${p === 1 ? '' : 's'}<br>The first door opens on <b>1 December</b>.`;
    $('previewBtn').href = linkFor('&preview');
    $('previewBtn').textContent = `👀 Preview as ${cal.to}`;
    $('preview2dBtn').href = linkFor('&preview', 'index.html');
    $('shareLink').value = linkFor();
    if (A.DB.isCloud) {
      $('copyBtn').disabled = true;
      $('nativeShare').disabled = true;
      $('shareLink').placeholder = 'Preparing your private link…';
      try {
        clearTimeout(saveT);
        await persist();
        shareToken = await A.DB.shareCalendar(cal.id);
        $('shareLink').value = linkFor();
        $('copyBtn').disabled = false;
        $('nativeShare').disabled = false;
        $('saved').textContent = 'Saved ✓';
      } catch {
        $('shareLink').value = '';
        $('shareLink').placeholder = 'Couldn’t prepare the link. Go back and try again.';
        $('saved').textContent = 'Couldn’t share';
      }
    }
    const tz = $('tz');
    const zones = ZONES.includes(cal.tz) ? ZONES : [cal.tz, ...ZONES];
    tz.innerHTML = zones.map((z) => `<option value="${esc(z)}"${z === cal.tz ? ' selected' : ''}>${esc(z.replace(/_/g, ' ').replace('/', ' — '))}</option>`).join('');

    const up = $('upgradeCard');
    if (cal.plan === 'season') {
      up.innerHTML = `<div class="paid"><span>🎉</span><div><b>Season Pass active</b><small>Every world, unlimited photos, no credit, open until 31 January.</small></div></div>`;
    } else {
      up.innerHTML = `
        <p class="kicker">Free calendar</p>
        <h3>Want to go all out?</h3>
        <ul class="perks">
          <li>✨ All seven Season Pass worlds, from Gingerbread Lane to Neon City</li>
          <li>📸 Unlimited photos (you’ve used ${p} of ${FREE_PHOTOS})</li>
          <li>✨ Remove the “Made with Tiny Doors” credit</li>
          <li>💛 One-time A$12.95 for this Christmas — no subscription</li>
        </ul>
        <button type="button" class="btn primary" id="upBtn">Get the Season Pass</button>`;
      $('upBtn').addEventListener('click', () => upsell('Make it unforgettable.'));
    }
  }

  $('tz').addEventListener('change', (e) => { cal.tz = e.target.value; save(); });
  $('copyBtn').addEventListener('click', async () => {
    const link = $('shareLink').value;
    try {
      await navigator.clipboard.writeText(link);
    } catch (e) {
      $('shareLink').select();
      try { document.execCommand('copy'); } catch (err) { /* ignore */ }
    }
    $('copyBtn').textContent = 'Copied ✓';
    A.Sound.init();
    A.Sound.pop(600, 1200, 0.15);
    setTimeout(() => ($('copyBtn').textContent = 'Copy'), 1800);
  });
  $('nativeShare').addEventListener('click', async () => {
    const data = { title: fill(A.THEMES[cal.theme].title), text: `${cal.from} made you an advent calendar 🎄 A new door opens every day in December.`, url: linkFor() };
    if (navigator.share) {
      try { await navigator.share(data); } catch (e) { /* cancelled */ }
    } else {
      $('copyBtn').click();
      toast('Link copied — paste it into a message');
    }
  });

  // ---------------- Keyboard ----------------
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('upsell').hidden) $('upsell').hidden = true;
    else if (!$('sheet').hidden) closeSheet();
  });

  // ---------------- Boot ----------------
  go(cal ? (['doors', 'share'].includes(params.get('step')) ? params.get('step') : 'doors') : 'start', true);
  if (cal) $('saved').textContent = 'Saved ✓';
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => step === 'doors' && layoutGrid());
})();
