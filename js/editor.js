/* The creator's editor: who + theme → 24 pre-filled doors → personalise → preview & share. */
(async function () {
  const A = window.Advent;
  const $ = (id) => document.getElementById(id);
  const esc = A.esc;
  const params = new URLSearchParams(location.search);
  const LAST = 'littledoors:last';
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
  function setTheme(t) {
    theme = t;
    document.documentElement.dataset.theme = t;
    document.querySelector('meta[name=theme-color]').content = t === 'snow' ? '#0b1638' : '#ff9a8b';
    A.Sound.theme = t;
    A.FX.setTheme(t);
    A.Scene.build(t, $('scene'), $('foreground'));
    document.querySelectorAll('[data-theme-pick]').forEach((b) => b.classList.toggle('on', b.dataset.themePick === t));
  }

  // ---------------- Saving ----------------
  let saveT;
  function save() {
    $('saved').textContent = 'Saving…';
    clearTimeout(saveT);
    saveT = setTimeout(async () => {
      try {
        await A.DB.saveCalendar(cal);
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
  const wanted = params.has('new') ? null : params.get('c') || A.store.get(LAST, null);
  if (wanted) cal = await A.DB.getCalendar(wanted);
  if (cal) {
    await Promise.all(cal.days.map(async (d) => {
      if (d.photoId && !photoURL[d.photoId]) photoURL[d.photoId] = await A.DB.getPhotoURL(d.photoId);
    }));
    setTheme(cal.theme);
    $('fTo').value = cal.to;
    $('fFrom').value = cal.from;
  } else {
    setTheme(params.get('theme') === 'summer' ? 'summer' : 'snow');
  }

  // ---------------- Steps ----------------
  function go(next, instant) {
    if (next !== 'start' && !cal) next = 'start';
    step = next;
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
    window.scrollTo({ top: 0, behavior: instant ? 'auto' : 'smooth' });
  }
  document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
  $('backBtn').addEventListener('click', () => go(step === 'share' ? 'doors' : 'start'));
  $('nextBtn').addEventListener('click', () => go('share'));

  // ---------------- 1. Who + theme ----------------
  document.querySelectorAll('.theme-card').forEach((b) =>
    b.addEventListener('click', () => {
      A.Sound.init();
      A.Sound.whoosh(0.5, 300, 2200, 0.12);
      setTheme(b.dataset.themePick);
    })
  );

  $('goDoors').addEventListener('click', () => {
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
        plan: 'free',
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
    const w = Math.min($('s-doors').clientWidth, 940) - 8;
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
        </div>
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
    } else if (sheetMode === 'presets') {
      const cats = ['All', 'Activities', 'Puzzles', 'Jokes', 'Vouchers', 'Notes'];
      const list = presets().filter((p) => presetFilter === 'All' || p.cat === presetFilter);
      body.innerHTML = `
        <div class="filter">${cats.map((c) => `<button type="button" class="chip${c === presetFilter ? ' on' : ''}" data-cat="${c}">${c}</button>`).join('')}</div>
        <div class="preset-list">${list.map((p) => `
          <button type="button" class="preset" data-preset="${p.i}">
            <span class="pe">${A.iconFor(p.item, cal.theme)}</span>
            <span class="pt"><b>${esc(fill(p.title))}</b><small>${esc(A.KIND_LABEL[p.item.type])}${p.item.chips ? ' · ' + esc(p.item.chips.join(' · ')) : ''}</small></span>
          </button>`).join('')}</div>
        <div class="sheet-foot"><button type="button" class="link" data-act="home">← Back</button><span></span></div>`;
      body.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { presetFilter = b.dataset.cat; renderSheet(); }));
    }
  }

  // Every ready-made surprise from both packs, de-duplicated, current theme first.
  let presetCache = null;
  function presets() {
    if (presetCache && presetCache.theme === cal.theme) return presetCache.list;
    const CAT = { activity: 'Activities', riddle: 'Puzzles', joke: 'Jokes', voucher: 'Vouchers', message: 'Notes' };
    const seen = new Set();
    const list = [];
    [cal.theme, cal.theme === 'snow' ? 'summer' : 'snow'].forEach((t) =>
      A.CONTENT[t].forEach((item) => {
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
    if (old.photoId && old.photoId !== next.photoId) {
      A.DB.deletePhoto(old.photoId);
      if (photoURL[old.photoId]) URL.revokeObjectURL(photoURL[old.photoId]);
      delete photoURL[old.photoId];
    }
    cal.days[d - 1] = next;
    save();
    decorate(d);
    renderHelpers();
    if (opts.celebrate && huts[d - 1]) celebrate(huts[d - 1].querySelector('.doorway'), 60);
  }

  $('shBody').addEventListener('click', async (e) => {
    const presetBtn = e.target.closest('[data-preset]');
    if (presetBtn) {
      const p = presets()[+presetBtn.dataset.preset];
      await setDay(sheetDay, clone(p.item));
      closeSheet();
      toast('Surprise swapped ✨');
      return;
    }
    const act = e.target.closest('[data-act]');
    if (act) handle(act.dataset.act);
  });
  $('sheet').querySelectorAll('.sheet-backdrop, .sheet-head [data-act]').forEach((b) => b.addEventListener('click', () => handle(b.dataset.act)));

  let photoTarget = null;
  async function handle(act) {
    const d = sheetDay;
    if (!d) return;
    const day = cal.days[d - 1];
    switch (act) {
      case 'done': closeSheet(); break;
      case 'home': sheetMode = 'home'; renderSheet(); break;
      case 'note': case 'voucher': case 'presets': sheetMode = act; renderSheet(); break;
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
      toast('That photo couldn’t be read — try another');
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
    cal.plan = 'season';
    save();
    celebrate($('buyBtn'), 140);
    A.Sound.fanfare();
    $('upsell').hidden = true;
    toast('Season Pass unlocked — add as many photos as you like 🎉');
    if (step === 'share') renderShare();
  });

  // ---------------- 3. Share ----------------
  const ZONES = ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Adelaide', 'Australia/Perth', 'Australia/Hobart', 'Australia/Darwin', 'Pacific/Auckland', 'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Chicago', 'America/Los_Angeles'];

  function linkFor(extra = '') {
    return new URL(`index.html?c=${cal.id}${extra}`, location.href).href;
  }

  function renderShare() {
    $('shareEmblem').textContent = A.THEMES[cal.theme].emblem;
    $('shareTitle').textContent = `Ready for ${cal.to}!`;
    const n = personalCount(), p = photoCount();
    $('shareSummary').innerHTML = `24 doors · <b>${n}</b> made by you · <b>${p}</b> photo${p === 1 ? '' : 's'}<br>The first door opens on <b>1 December</b>.`;
    $('previewBtn').href = linkFor('&preview');
    $('previewBtn').textContent = `👀 Preview as ${cal.to}`;
    $('preview3dBtn').href = new URL(`3d.html?c=${cal.id}&preview`, location.href).href;
    $('shareLink').value = linkFor();
    const tz = $('tz');
    const zones = ZONES.includes(cal.tz) ? ZONES : [cal.tz, ...ZONES];
    tz.innerHTML = zones.map((z) => `<option value="${esc(z)}"${z === cal.tz ? ' selected' : ''}>${esc(z.replace(/_/g, ' ').replace('/', ' — '))}</option>`).join('');

    const up = $('upgradeCard');
    if (cal.plan === 'season') {
      up.innerHTML = `<div class="paid"><span>🎉</span><div><b>Season Pass active</b><small>Unlimited photos, no credit, open until 31 January.</small></div></div>`;
    } else {
      up.innerHTML = `
        <p class="kicker">Free calendar</p>
        <h3>Want to go all out?</h3>
        <ul class="perks">
          <li>📸 Unlimited photos (you’ve used ${p} of ${FREE_PHOTOS})</li>
          <li>✨ Remove the “Made with Little Doors” credit</li>
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
