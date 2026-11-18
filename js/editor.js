/* The creator's editor: who + theme → 24 pre-filled doors → personalise → preview & share. */
(async function () {
  const A = window.Advent;
  const tr = A.I18n.t;
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

  const fill = (s) => String(s || '').replace(/\{to\}/g, cal ? cal.to : tr("them")).replace(/\{from\}/g, cal ? cal.from : tr("you"));
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
    f.src = A.I18n.url(`3d.html?theme=${encodeURIComponent(t)}&bg`);
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
    $('worldPassNotice').hidden = !A.THEMES[t].premium || cal?.plan === 'season';
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
    $('saved').textContent = tr("Saving…");
    clearTimeout(saveT);
    saveT = setTimeout(async () => {
      try {
        await persist();
        A.store.set(LAST, cal.id);
        $('saved').textContent = tr("Saved ✓");
      } catch (e) {
        $('saved').textContent = tr("Couldn’t save");
      }
    }, 250);
  }

  // Finish queued saves before a language change reloads the editor.
  A.I18n.beforeChange = async () => {
    if (!cal) return;
    clearTimeout(saveT);
    try {
      await persist();
      A.store.set(LAST, cal.id);
    } catch (error) {
      toast(tr('Couldn’t save that change. Please try again.'));
      throw error;
    }
  };

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
    document.querySelectorAll('.proto-note').forEach((node) => { node.textContent = tr("Your link is read-only. Recipients do not need to sign in."); });
    $('buyBtn').textContent = tr("Season Pass coming soon");
    $('buyBtn').disabled = true;
    $('goDoors').nextElementSibling.textContent = tr("Save your calendar to your account. Recipients open their link without signing in.");
    $('buyBtn').nextElementSibling.textContent = tr("Online checkout is not available yet.");
    if (A.Auth.user) {
      LAST += ':' + A.Auth.user.id;
      try {
        const calendars = await A.DB.listCalendars();
        $('accountCalendars').replaceChildren();
        calendars.forEach((item) => {
          const link = document.createElement('a');
          link.href = A.I18n.url('editor.html?c=' + encodeURIComponent(item.id) + '&step=doors');
          link.textContent = (item.to || tr("Your calendar")) + ' · ' + (A.THEMES[item.theme]?.name || tr("Calendar"));
          $('accountCalendars').append(link);
        });
        if (!calendars.length) $('accountCalendars').textContent = tr("Your first calendar starts below.");
      } catch { $('accountCalendars').textContent = tr("Couldn’t load your calendars. Refresh to try again."); }
    }
  }
  const wanted = params.has('new') ? null : params.get('c') || A.store.get(LAST, null);
  if (wanted) {
    try { cal = await A.DB.getCalendar(wanted); }
    catch {
      $('saved').textContent = tr("Couldn’t load");
      $('accountMessage').textContent = tr("Couldn’t load that calendar. Please refresh to try again.");
      $('accountMessage').setAttribute('role', 'alert');
      return;
    }
  }
  if (cal) {
    cal.days = cal.days.map(A.I18n.localizePreset);
    await Promise.all(cal.days.map(async (d) => {
      if (d.photoId && !photoURL[d.photoId]) {
        try { photoURL[d.photoId] = await A.DB.getPhotoURL(d.photoId); }
        catch { $('accountMessage').textContent = tr("Some photos couldn’t load. Refresh to try again."); }
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
      url.searchParams.set('c', cal.id);
      url.searchParams.set('step', next);
      url.searchParams.set('lang', A.I18n.locale);
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
  const needsPass = () => !hasPass() && (A.THEMES[cal.theme].premium || photoCount() > FREE_PHOTOS);
  function updatePassNotice() {
    const notice = $('doorsPassNotice');
    notice.hidden = !needsPass();
    notice.textContent = tr("Season Pass selected · A$12.95 once. Free to customise and preview; pay when you’re ready to share.");
  }
  function openPreview(src, title) {
    $('worldPreviewTitle').textContent = title;
    $('worldPreviewFrame').src = A.I18n.url(src);
    $('worldPreview').showModal();
  }
  $('worldPreviewBtn').addEventListener('click', () => openPreview(`3d.html?theme=${encodeURIComponent(theme)}&skip`, A.THEMES[theme].name));
  $('closeWorldPreview').addEventListener('click', () => $('worldPreview').close());
  $('worldPreview').addEventListener('close', () => $('worldPreviewFrame').removeAttribute('src'));
  $('worldPreviewFrame').addEventListener('load', () => {
    // Keep the recipient preview's return links inside this editing session.
    $('worldPreviewFrame').contentDocument?.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (link && new URL(link.href).pathname.endsWith('/editor.html')) {
        e.preventDefault();
        $('worldPreview').close();
      }
    });
  });
  async function previewCalendar(e) {
    e.preventDefault();
    const page = e.currentTarget.id === 'preview2dBtn' ? 'index.html' : '3d.html';
    try {
      clearTimeout(saveT);
      await persist();
      openPreview(linkFor('&preview', page), `${tr("Preview for")} ${cal.to}`);
    } catch { toast(tr("Couldn’t save your preview. Please try again.")); }
  }
  ['calendarPreviewBtn', 'previewBtn', 'preview2dBtn'].forEach((id) => $(id).addEventListener('click', previewCalendar));

  $('goDoors').addEventListener('click', () => {
    if (A.DB.isCloud && !A.Auth.user) { A.Auth.prompt(); return; }
    const to = $('fTo').value.trim();
    const from = $('fFrom').value.trim();
    if (!to) {
      $('fTo').focus();
      $('fTo').parentElement.classList.remove('shake');
      void $('fTo').offsetWidth;
      $('fTo').parentElement.classList.add('shake');
      toast(tr("Who is this calendar for?"));
      return;
    }
    if (!cal) {
      const now = new Date();
      cal = {
        id: A.DB.newId(),
        theme,
        to,
        from: from || tr("Someone who loves you"),
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
    updatePassNotice();
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
    h.setAttribute('aria-label', `${tr("Day")} ${d}: ${summary(day).title}${tr(". Tap to edit.")}`);
  }

  function layoutGrid() {
    if (!huts.length) return;
    const w = Math.min(grid.clientWidth, 940) - 32; // Room for roofs and badges inside the panel.
    A.layoutHuts(grid, huts, cal.theme, w, 99999, w < 560 ? [4] : [6]);
  }
  window.addEventListener('resize', () => step === 'doors' && layoutGrid());

  function renderHelpers() {
    const n = personalCount();
    const msg = n === 0 ? tr("No personal touches yet — even three makes it special")
      : n < 3 ? tr('{count} personal touch{suffix} · lovely start', { count: n, suffix: n === 1 ? '' : 'es', suffixFr: n === 1 ? '' : 's' })
      : n < 6 ? tr('{count} personal touches · this is going to land 💛', { count: n })
      : tr('{count} personal touches · absolutely legendary ✨', { count: n });
    $('meterText').textContent = msg;
    $('meterBar').style.width = Math.min(100, (n / 6) * 100) + '%';

    const tips = [];
    const emptyPhoto = cal.days.findIndex((d) => d.type === 'photo' && !d.photoId);
    if (emptyPhoto >= 0) tips.push({ label: `${tr("📸 Add a photo to day")} ${emptyPhoto + 1}`, run: () => openSheet(emptyPhoto + 1) });
    if (!cal.days[23].personal) tips.push({ label: tr("💌 Write the Christmas Eve letter"), run: () => openSheet(24, 'note') });
    tips.push({ label: tr("🖼️ Add several photos at once"), run: () => $('bulkIn').click() });
    if (!cal.days[0].personal && tips.length < 3) tips.push({ label: tr("👋 Write the welcome note"), run: () => openSheet(1, 'note') });
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
      case 'photo': return { title: day.caption ? fill(day.caption) : tr("A photo memory"), text: day.photoId ? tr('Your photo, hidden under {cover}', { cover: tr(cal.theme === 'snow' ? 'frost' : 'sand') }) : tr("Add your own photo here") };
      case 'message': return { title: tr("A note"), text: fill(day.text).slice(0, 110) };
      case 'finale': return { title: tr("Christmas Eve letter"), text: fill(day.text).slice(0, 110) };
      case 'riddle': case 'joke': return { title: fill(day.q), text: A.KIND_LABEL[day.type] };
      case 'activity': return { title: fill(day.title), text: fill(day.body).slice(0, 110) };
      case 'voucher': return { title: fill(day.title), text: 'Voucher · ' + fill(day.body).slice(0, 80) };
      case 'game': {
        const name = (A.GAME_INFO[day.game] || {}).name || tr("Mini game");
        const extra = day.game === 'wordsearch' && day.words ? ' · ' + day.words.join(', ') : day.game === 'sudoku' ? (day.size === 6 ? tr(" · 6×6, numbers") : tr(" · 4×4, pictures")) : '';
        return { title: fill(day.title || name), text: name + extra };
      }
    }
    return { title: tr("A surprise"), text: '' };
  }

  // ---------------- Day sheet ----------------
  let sheetDay = null;
  let sheetMode = 'home';
  let presetFilter = tr("All");

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
    $('shDay').textContent = `${tr("Day")} ${d}`;
    $('shKind').textContent = d === 24 ? tr("Christmas Eve") : day.personal ? tr("Made by you ♥") : tr("Ready-made surprise");
    const body = $('shBody');
    const s = summary(day);
    const isEve = d === 24;

    if (sheetMode === 'home') {
      body.innerHTML = `
        <div class="current">
          <span class="cur-icon">${day.photoId ? `<img src="${photoURL[day.photoId]}" alt="">` : A.iconFor(day, cal.theme)}</span>
          <span class="cur-text"><b>${esc(s.title)}</b><small>${esc(s.text)}</small></span>
        </div>
        <p class="label">${tr("Make it personal")}</p>
        <div class="actions">
          <button type="button" data-act="camera"><span>📸</span><b>${tr("Take a photo")}</b></button>
          <button type="button" data-act="library"><span>🖼️</span><b>${tr("Choose a photo")}</b></button>
          <button type="button" data-act="note"><span>💌</span><b>${isEve ? tr("Write the letter") : tr("Write a note")}</b></button>
          <button type="button" data-act="voucher"><span>🎟️</span><b>${tr("Make a voucher")}</b></button>
          <button type="button" class="wide" data-act="games"><span>🎮</span><b>${tr("Add a mini game")}</b><small>${tr("Sudoku, word search, memory…")}</small></button>
        </div>
        ${day.type === 'game' && day.game === 'wordsearch' ? `<button type="button" class="pick-preset" data-act="words">${tr("✏️ Use your own words in this word search")} <span>→</span></button>` : ''}
        <button type="button" class="pick-preset" data-act="presets">${tr("✨ Or pick a different surprise")} <span>${presets().length} ${tr("ideas →")}</span></button>
        <div class="sheet-foot">
          ${day.personal ? `<button type="button" class="link" data-act="reset">${tr("Reset to the original")}</button>` : '<span></span>'}
          <button type="button" class="btn primary" data-act="done">${tr("Done")}</button>
        </div>`;
    } else if (sheetMode === 'photo') {
      body.innerHTML = `
        <div class="photo-edit">
          <div class="pe-thumb">${day.photoId ? `<img src="${photoURL[day.photoId]}" alt="${tr("Your photo")}">` : '<span>📸</span>'}</div>
          <div class="pe-side">
            <label class="field">${tr("Caption")} <small>${tr("(written under the photo)")}</small>
              <input type="text" id="capIn" maxlength="60" value="${esc(day.caption || '')}" placeholder="${tr("Remember this?")}">
            </label>
            <div class="row-btns">
              <button type="button" class="btn ghost small" data-act="camera">${tr("📸 Retake")}</button>
              <button type="button" class="btn ghost small" data-act="library">${tr("🖼️ Another")}</button>
              <button type="button" class="btn ghost small" data-act="removePhoto">${tr("Remove")}</button>
            </div>
          </div>
        </div>
        <p class="hint">${esc(cal.to)} ${tr("will")} ${cal.theme === 'snow' ? tr("wipe away frost") : tr("brush away sand")} ${tr("to reveal it ✨")}</p>
        <div class="sheet-foot"><button type="button" class="link" data-act="home">${tr("← Other options")}</button><button type="button" class="btn primary" data-act="done">${tr("Done")}</button></div>`;
      $('capIn').addEventListener('input', (e) => {
        day.caption = e.target.value;
        save();
        decorate(d);
      });
    } else if (sheetMode === 'note') {
      const existing = day.type === 'message' || day.type === 'finale' ? fill(day.text) : '';
      body.innerHTML = `
        <label class="field">${isEve ? tr("Your Christmas Eve letter") : tr("Your note")}
          <textarea id="noteIn" rows="7" maxlength="900" placeholder="${tr('Dear')} ${esc(cal.to)},&#10;&#10;">${esc(existing)}</textarea>
        </label>
        <p class="hint">${tr("It appears in handwriting")}${isEve ? tr(", with fireworks") : tr(", inside an envelope they tap to open")}${tr(". Signed “")}${esc(cal.from)}${A.I18n.locale === 'fr' ? ' ».' : '”.'}</p>
        <div class="sheet-foot"><button type="button" class="link" data-act="home">${tr("← Back")}</button><button type="button" class="btn primary" data-act="saveNote">${tr("Save note")}</button></div>`;
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
        <div class="voucher mini-v"><div class="v-main"><span class="v-label">${tr("Voucher")}</span><h2 id="vPrevT">${esc(fill(v.title) || tr("One…"))}</h2></div><div class="v-stub"><span>Nº ${String(d).padStart(3, '0')}</span></div></div>
        <label class="field">${tr("Good for one…")}
          <input type="text" id="vTitle" maxlength="50" value="${esc(fill(v.title))}" placeholder="${tr("breakfast in bed")}">
        </label>
        <label class="field">${tr("The fine print")} <small>${tr("(optional)")}</small>
          <input type="text" id="vBody" maxlength="120" value="${esc(fill(v.body))}" placeholder="${tr("Valid any morning you like. Pancakes guaranteed.")}">
        </label>
        <div class="idea-chips">${[tr("A day out, just us"), tr("Breakfast in bed"), tr("Movie night, you pick"), tr("A long phone call"), tr("One car wash"), tr("Dinner, my treat")].map((x) => `<button type="button" class="chip" data-idea="${esc(x)}">${esc(x)}</button>`).join('')}</div>
        <div class="sheet-foot"><button type="button" class="link" data-act="home">${tr("← Back")}</button><button type="button" class="btn primary" data-act="saveVoucher">${tr("Save voucher")}</button></div>`;
      const sync = () => ($('vPrevT').textContent = $('vTitle').value ? ($('vTitle').value.match(A.I18n.locale === 'fr' ? /^un(?: bon pour)?\b/i : /^one\b/i) ? '' : tr("One ")) + $('vTitle').value : tr("One…"));
      $('vTitle').addEventListener('input', sync);
      body.querySelectorAll('[data-idea]').forEach((b) => b.addEventListener('click', () => { $('vTitle').value = b.dataset.idea.charAt(0).toLowerCase() + b.dataset.idea.slice(1); sync(); }));
    } else if (sheetMode === 'words') {
      const cur = day.type === 'game' && day.game === 'wordsearch' ? day : { title: '', words: [] };
      body.innerHTML = `
        <label class="field">${tr("Title")}
          <input type="text" id="wsTitle" maxlength="40" value="${esc(fill(cur.title || tr("Find the hidden words")))}">
        </label>
        <label class="field">${tr("Words to hide")} <small>${tr("(3–8 words, 2–10 letters each — names work brilliantly)")}</small>
          <textarea id="wsWords" rows="3" maxlength="120" placeholder="${tr('MIA, DAD, BEACH, PAVLOVA')}">${esc((cur.words || []).join(', '))}</textarea>
        </label>
        <p class="hint" id="wsHint">${tr("Letters only; spaces and punctuation are ignored.")}</p>
        <div class="sheet-foot"><button type="button" class="link" data-act="home">${tr("← Back")}</button><button type="button" class="btn primary" data-act="saveWords">${tr("Save word search")}</button></div>`;
    } else if (sheetMode === 'presets') {
      const cats = [tr("All"), tr("Games"), tr("Activities"), tr("Puzzles"), tr("Jokes"), tr("Vouchers"), tr("Notes")];
      const list = presets().filter((p) => presetFilter === tr("All") || p.cat === presetFilter);
      body.innerHTML = `
        <div class="filter">${cats.map((c) => `<button type="button" class="chip${c === presetFilter ? ' on' : ''}" data-cat="${c}">${c}</button>`).join('')}</div>
        <div class="preset-list">${list.map((p) => `
          <button type="button" class="preset" data-preset="${p.i}">
            <span class="pe">${A.iconFor(p.item, cal.theme)}</span>
            <span class="pt"><b>${esc(fill(p.title))}</b><small>${p.item.type === 'game' ? esc(summary(p.item).text) : esc(A.KIND_LABEL[p.item.type])}${p.item.chips ? ' · ' + esc(p.item.chips.join(' · ')) : ''}</small></span>
          </button>`).join('')}</div>
        <div class="sheet-foot"><button type="button" class="link" data-act="home">${tr("← Back")}</button><span></span></div>`;
      body.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { presetFilter = b.dataset.cat; renderSheet(); }));
    }
  }

  // Every ready-made surprise from both packs, de-duplicated, current theme first.
  let presetCache = null;
  function presets() {
    if (presetCache && presetCache.theme === cal.theme) return presetCache.list;
    const CAT = { game: tr("Games"), activity: tr("Activities"), riddle: tr("Puzzles"), joke: tr("Jokes"), voucher: tr("Vouchers"), message: tr("Notes") };
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
      $('saved').textContent = tr("Saving…");
      try { await persist(); $('saved').textContent = tr("Saved ✓"); A.store.set(LAST, cal.id); }
      catch (error) { cal.days[d - 1] = old; $('saved').textContent = tr("Couldn’t save"); throw error; }
    } else save();
    if (old.photoId && old.photoId !== next.photoId) {
      A.DB.deletePhoto(old.photoId).catch(() => {}); // Cleanup follows a durable calendar update.
      if (photoURL[old.photoId]) URL.revokeObjectURL(photoURL[old.photoId]);
      delete photoURL[old.photoId];
    }
    decorate(d);
    renderHelpers();
    updatePassNotice();
    if (opts.celebrate && huts[d - 1]) celebrate(huts[d - 1].querySelector('.doorway'), 60);
  }

  async function onSheetClick(e) {
    const presetBtn = e.target.closest('[data-preset]');
    if (presetBtn) {
      const p = presets()[+presetBtn.dataset.preset];
      await setDay(sheetDay, clone(p.item));
      closeSheet();
      toast(tr("Surprise swapped ✨"));
      return;
    }
    const act = e.target.closest('[data-act]');
    if (act) await handle(act.dataset.act);
  }
  const sheetError = () => toast(tr("Couldn’t save that change. Please try again."));
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
      case 'games': sheetMode = 'presets'; presetFilter = tr("Games"); renderSheet(); break;
      case 'saveWords': {
        const words = [...new Set(A.I18n.letters($('wsWords').value).split(/[^A-Z]+/).filter((w) => w.length >= 2 && w.length <= 10))].slice(0, 8);
        if (words.length < 3) {
          $('wsHint').textContent = tr("Add at least 3 words (2–10 letters each).");
          $('wsHint').style.color = '#d22f4a';
          $('wsWords').focus();
          return;
        }
        await setDay(d, { type: 'game', game: 'wordsearch', title: $('wsTitle').value.trim() || tr("Find the hidden words"), words, personal: true }, { celebrate: true });
        closeSheet();
        toast(tr("Word search saved 🔎"));
        break;
      }
      case 'camera': case 'library':
        photoTarget = d;
        $(act === 'camera' ? 'camIn' : 'libIn').click();
        break;
      case 'removePhoto':
        await setDay(d, resetItem(d));
        sheetMode = 'home';
        renderSheet();
        toast(tr("Photo removed"));
        break;
      case 'reset':
        await setDay(d, resetItem(d));
        sheetMode = 'home';
        renderSheet();
        toast(tr('Day {day} is back to its original surprise', { day: d }));
        break;
      case 'saveNote': {
        const text = $('noteIn').value.trim();
        if (!text) { $('noteIn').focus(); return; }
        await setDay(d, { type: d === 24 ? 'finale' : 'message', text, personal: true }, { celebrate: true });
        closeSheet();
        toast(d === 24 ? tr("Christmas Eve letter saved 💌") : tr("Note saved 💌"));
        break;
      }
      case 'saveVoucher': {
        let title = $('vTitle').value.trim();
        if (!title) { $('vTitle').focus(); return; }
        if (!(A.I18n.locale === 'fr' ? /^un(?: bon pour)?\b/i : /^one\b/i).test(title)) title = tr("One ") + title;
        await setDay(d, { type: 'voucher', title, body: $('vBody').value.trim() || tr("Valid whenever you like."), personal: true }, { celebrate: true });
        closeSheet();
        toast(tr("Voucher saved 🎟️"));
        break;
      }
    }
    void day;
  }

  const resetItem = (d) => clone(A.CONTENT[cal.theme][d - 1]);

  async function addPhotoTo(d, file) {
    const blob = await A.preparePhoto(file);
    const id = await A.DB.putPhoto(blob);
    photoURL[id] = URL.createObjectURL(blob);
    const old = cal.days[d - 1];
    await setDay(d, { type: 'photo', caption: old.type === 'photo' ? old.caption || '' : '', photoId: id, personal: true });
    updatePassNotice();
  }

  async function onPhotoPicked(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !photoTarget) return;
    const d = photoTarget;
    toast(tr("Adding your photo…"));
    try {
      await addPhotoTo(d, file);
      if (sheetDay === d) { sheetMode = 'photo'; renderSheet(); }
      celebrate(huts[d - 1].querySelector('.doorway'), 70);
      toast(tr('Photo added to day {day} 📸', { day: d }));
    } catch (err) {
      toast(tr("Couldn’t add that photo. Check your connection and try again."));
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
    toast(tr("Adding your photos…"));
    for (const f of files) {
      const d = slots.shift();
      if (!d) break;
      try { await addPhotoTo(d, f); added++; } catch (err) { /* skip unreadable */ }
    }
    if (added) {
      toast(tr('{count} photo{suffix} spread across your doors 📸', { count: added, suffix: added === 1 ? '' : 's' }));
      A.Sound.init();
      A.Sound.sparkle(10);
    }
  });

  // ---------------- Season pass (mock checkout) ----------------
  function upsell(why) {
    $('upWhy').textContent = why || tr('You’ve used your {count} free photos.', { count: FREE_PHOTOS });
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
    toast(tr("Season Pass unlocked — every world and unlimited photos 🎉"));
    if (step === 'share') renderShare();
  });

  // ---------------- 3. Share ----------------
  const ZONES = ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Adelaide', 'Australia/Perth', 'Australia/Hobart', 'Australia/Darwin', 'Pacific/Auckland', 'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Chicago', 'America/Los_Angeles'];

  // Calendars open in the 3D world by default (it falls back to 2D on devices without WebGL).
  function linkFor(extra = '', page = '3d.html') {
    if (!extra.includes('preview') && (needsPass() || (A.DB.isCloud && !shareToken))) return '';
    const share = A.DB.isCloud && !extra.includes('preview') ? '&s=' + shareToken : '';
    return A.I18n.url(`${page}?c=${cal.id}${share}${extra}`);
  }

  let shareRevision = 0;
  async function prepareShare() {
    const revision = ++shareRevision;
    $('shareLink').placeholder = tr("Preparing your private link…");
    try {
      clearTimeout(saveT);
      await persist();
      if (needsPass()) return;
      const token = A.DB.isCloud ? await A.DB.shareCalendar(cal.id) : null;
      if (revision !== shareRevision || needsPass()) return;
      shareToken = token;
      $('shareLink').value = linkFor();
      $('copyBtn').disabled = false;
      $('nativeShare').disabled = false;
      $('saved').textContent = tr("Saved ✓");
    } catch {
      $('shareLink').value = '';
      $('shareLink').placeholder = tr("Couldn’t prepare the link. Go back and try again.");
      $('saved').textContent = tr("Couldn’t share");
    }
  }

  async function renderShare() {
    $('shareEmblem').textContent = A.THEMES[cal.theme].emblem;
    $('shareTitle').textContent = `${tr("Ready for")} ${cal.to}!`;
    const n = personalCount(), p = photoCount();
    $('shareSummary').innerHTML = `${tr("24 doors ·")} <b>${n}</b> ${tr("made by you ·")} <b>${p}</b> photo${p === 1 ? '' : 's'}<br>${tr("The first door opens on")} <b>${tr("1 December")}</b>.`;
    $('previewBtn').href = linkFor('&preview');
    $('previewBtn').textContent = `${tr("👀 Preview as")} ${cal.to}`;
    $('preview2dBtn').href = linkFor('&preview', 'index.html');
    ++shareRevision;
    const gated = needsPass();
    $('shareControls').hidden = gated;
    $('shareGateNotice').hidden = !gated;
    $('shareLink').value = '';
    $('copyBtn').disabled = true;
    $('nativeShare').disabled = true;
    if (!gated) await prepareShare();
    const tz = $('tz');
    const zones = ZONES.includes(cal.tz) ? ZONES : [cal.tz, ...ZONES];
    tz.innerHTML = zones.map((z) => `<option value="${esc(z)}"${z === cal.tz ? ' selected' : ''}>${esc(z.replace(/_/g, ' ').replace('/', ' — '))}</option>`).join('');

    const up = $('upgradeCard');
    if (cal.plan === 'season') {
      up.innerHTML = `<div class="paid"><span>🎉</span><div><b>${tr("Season Pass active")}</b><small>${tr("Every world, unlimited photos, no credit, open until 31 January.")}</small></div></div>`;
    } else {
      up.innerHTML = `
        <p class="kicker">${gated ? tr("Season Pass selected") : tr("Free calendar")}</p>
        <h3>${gated ? tr("Ready to share their Christmas magic?") : tr("Want to go all out?")}</h3>
        <ul class="perks">
          <li>${tr("✨ All seven Season Pass worlds, from Gingerbread Lane to Neon City")}</li>
          <li>${tr("📸 Unlimited photos (")}${p} ${tr("added; free sharing includes")} ${FREE_PHOTOS})</li>
          <li>${tr("✨ Remove the “Made with Tiny Doors” credit")}</li>
          <li>${tr("💛 One-time A$12.95 for this Christmas — no subscription")}</li>
        </ul>
        <button type="button" class="btn primary" id="upBtn">${gated ? tr("Unlock &amp; share · A$12.95") : tr("Get the Season Pass")}</button>
        ${gated ? `<button type="button" class="btn ghost" id="chooseFreeWorld">${tr("Choose a free world")}</button><p class="fine">${tr("Your messages and personal edits stay saved. Free sharing includes up to 3 photos; remove any extra photos before sharing.")}</p>` : ''}`;
      $('upBtn').addEventListener('click', () => upsell(tr("Unlock the Season Pass to share this calendar. Your edits are saved.")));
      if (gated) $('chooseFreeWorld').addEventListener('click', () => { go('start'); toast(tr("Choose Snowy village or Summer Christmas. Your personal edits stay saved.")); });
    }
  }

  $('tz').addEventListener('change', (e) => { cal.tz = e.target.value; save(); });
  $('copyBtn').addEventListener('click', async () => {
    if (needsPass() || !$('shareLink').value) return;
    const link = $('shareLink').value;
    try {
      await navigator.clipboard.writeText(link);
    } catch (e) {
      $('shareLink').select();
      try { document.execCommand('copy'); } catch (err) { /* ignore */ }
    }
    $('copyBtn').textContent = tr("Copied ✓");
    A.Sound.init();
    A.Sound.pop(600, 1200, 0.15);
    setTimeout(() => ($('copyBtn').textContent = tr("Copy")), 1800);
  });
  $('nativeShare').addEventListener('click', async () => {
    if (needsPass() || !$('shareLink').value) return;
    const data = { title: fill(A.THEMES[cal.theme].title), text: tr('{from} made you an advent calendar 🎄 A new door opens every day in December.', { from: cal.from }), url: linkFor() };
    if (navigator.share) {
      try { await navigator.share(data); } catch (e) { /* cancelled */ }
    } else {
      $('copyBtn').click();
      toast(tr("Link copied — paste it into a message"));
    }
  });

  // ---------------- Keyboard ----------------
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if ($('worldPreview').open) return;
    if (!$('upsell').hidden) $('upsell').hidden = true;
    else if (!$('sheet').hidden) closeSheet();
  });

  // ---------------- Boot ----------------
  go(cal ? (['doors', 'share'].includes(params.get('step')) ? params.get('step') : 'doors') : 'start', true);
  if (cal) $('saved').textContent = tr("Saved ✓");
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => step === 'doors' && layoutGrid());
})();
