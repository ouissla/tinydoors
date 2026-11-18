/* The recipient's view: village, door opening, cards, tilt, sound and family mode.
   index.html            → demo village (preset content, prototype controls)
   index.html?c=<id>     → a calendar made in the editor
   index.html?c=<id>&preview → the creator previewing it (every door unlocked, nothing saved) */
(async function () {
  const A = window.Advent;
  const tr = A.I18n.t;
  const $ = (id) => document.getElementById(id);
  const KEY = 'littledoors:v1';
  const params = new URLSearchParams(location.search);
  const saved = A.store.get(KEY, {});

  // ---------------- Load a real calendar, if the link has one ----------------
  const cid = params.get('c');
  const preview = params.has('preview');
  let cal = null;
  const photoURLs = {};
  if (cid) {
    try { await A.DBReady; cal = await A.DB.getCalendar(cid); }
    catch {
      document.body.classList.add('entered');
      document.getElementById('title').textContent = tr("Couldn’t open this calendar");
      document.getElementById('sub').textContent = tr("Please refresh to try again.");
      document.getElementById('splash').classList.add('gone');
      return;
    }
    if (!cal) {
      document.body.classList.add('entered');
      $('splash').innerHTML = `<div class="splash-inner"><div class="splash-emblem">🔍</div>
        <h2 class="splash-title" style="font-size:2.2rem">${tr("We couldn’t find")}<br>${tr("this calendar")}</h2>
        <p class="splash-note" style="max-width:340px;margin:0 auto 18px">${A.DB.isCloud ? tr("This link may have expired or been removed. Ask the person who made it for a fresh link.") : tr("In this prototype, calendars are saved on the device that made them. Open the link on that device, or make a new one.")}</p>
        <a class="btn primary" href="editor.html">${tr("Make a calendar ✨")}</a></div>`;
      A.Scene.build('snow', $('scene'), $('foreground'));
      return;
    }
    cal.days = cal.days.map(A.I18n.localizePreset);
    await Promise.all(cal.days.map(async (day, i) => {
      if (day.photoId) photoURLs[i + 1] = await A.DB.getPhotoURL(day.photoId);
    }));
  }

  // ---------------- Dates ----------------
  function partsIn(tz) {
    try {
      const s = new Intl.DateTimeFormat('en-CA', { timeZone: tz || undefined, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const [y, m, d] = s.split('-').map(Number);
      return { y, m, d };
    } catch (e) {
      const n = new Date();
      return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() };
    }
  }

  const realOpenKey = cal ? `littledoors:open:${cal.id}` : null;
  const state = {
    theme: cal ? cal.theme : params.get('theme') || saved.theme || 'snow',
    today: 9,
    unlockAll: preview || params.has('unlock') || (!cal && !!saved.unlockAll),
    sound: saved.sound !== false,
    to: cal ? cal.to : params.get('to') || saved.to || 'Emma',
    from: cal ? cal.from : params.get('from') || saved.from || tr("Grandma"),
    opened: cal ? { [cal.theme]: preview ? [] : A.store.get(realOpenKey, []) } : saved.opened || { snow: [], summer: [] },
    photos: [],
    cols: 4,
    focus: 1,
  };
  if (!A.THEMES[state.theme]) state.theme = 'snow';

  // How many sleeps until December `day` (25 = Christmas).
  let sleepsUntil;
  if (cal) {
    const t = partsIn(cal.tz);
    const year = cal.year;
    const todayUTC = Date.UTC(t.y, t.m - 1, t.d);
    sleepsUntil = (day) => Math.round((Date.UTC(year, 11, day) - todayUTC) / 86400000);
    state.today = A.clamp(24 - Math.max(0, sleepsUntil(24)), 0, 24);
    if (sleepsUntil(1) > 0) state.today = 0;
  } else {
    const n = new Date();
    const realToday = n.getMonth() === 11 && n.getDate() <= 24 ? n.getDate() : null;
    state.today = A.clamp(+(params.get('day') || saved.today || realToday || 9), 1, 24);
    sleepsUntil = (day) => day - state.today;
  }

  const save = () => {
    if (cal) {
      if (!preview) A.store.set(realOpenKey, state.opened[state.theme]);
      return;
    }
    A.store.set(KEY, {
      theme: state.theme, today: state.today, unlockAll: state.unlockAll, sound: state.sound,
      to: state.to, from: state.from, opened: state.opened,
    });
  };

  const items = () => (cal ? cal.days : A.CONTENT[state.theme]);
  const openedSet = () => new Set(state.opened[state.theme] || []);
  const isUnlocked = (d) => state.unlockAll || d <= state.today;
  const fill = (s) => s.replace(/\{to\}/g, state.to).replace(/\{from\}/g, state.from);
  const plural = (n, w) => `${n} ${tr(w)}${n === 1 ? '' : 's'}`;

  const grid = $('grid');
  let huts = [];

  // ---------------- Village ----------------
  function buildGrid() {
    grid.innerHTML = '';
    const list = items();
    huts = A.makeHuts(state.theme, (d) => A.iconFor(list[d - 1], state.theme), (d) => openDay(d));
    huts.forEach((b, i) => {
      b.addEventListener('focus', () => (state.focus = i + 1));
      grid.appendChild(b);
    });
    refresh();
    fit();
  }

  function refresh() {
    const op = openedSet();
    const list = items();
    huts.forEach((h, i) => {
      const d = i + 1;
      h.classList.toggle('open', op.has(d));
      h.classList.toggle('locked', !isUnlocked(d));
      h.classList.toggle('today', d === state.today && !op.has(d));
      h.classList.toggle('ready', isUnlocked(d) && !op.has(d));
      const label = op.has(d)
        ? `${tr("Day")} ${d}${tr(", opened.")} ${A.KIND_LABEL[list[i].type]}`
        : isUnlocked(d) ? `${tr("Day")} ${d}${tr(", ready to open")}` : `${tr("Day")} ${d}${tr(", opens in")} ${plural(sleepsUntil(d), 'day')}`;
      h.setAttribute('aria-label', label);
    });
    // Garland: one bulb per opened door.
    const g = $('garland');
    if (!g.querySelector('i')) {
      const wave = (t) => (Math.sin(t * Math.PI * 3) * 0.5 + 0.5) * 70;
      let d = '';
      for (let k = 0; k <= 60; k++) d += (k ? ' L' : 'M') + (2 + (k / 60) * 96).toFixed(2) + ',' + wave(k / 60).toFixed(2);
      g.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0,${wave(0)} L2,${wave(0)} ${d.slice(1)} L100,${wave(1)}" stroke="rgba(30,40,60,.55)" stroke-width="2" fill="none" vector-effect="non-scaling-stroke"/></svg>`;
      for (let i = 0; i < 24; i++) {
        const b = A.el('i');
        const t = i / 23;
        b.style.left = (2 + t * 96).toFixed(2) + '%';
        b.style.top = wave(t) + '%';
        b.style.setProperty('--c', ['#ff5d5d', '#ffd36b', '#6be3ff', '#7cf29a', '#ff8ad8'][i % 5]);
        b.style.animationDelay = (-i * 0.29).toFixed(2) + 's';
        g.appendChild(b);
      }
    }
    g.querySelectorAll('i').forEach((b, i) => b.classList.toggle('on', op.has(i + 1)));

    const T = A.THEMES[state.theme];
    $('title').textContent = fill(T.title);
    $('eyebrow').textContent = fill(T.eyebrow);
    const toXmas = sleepsUntil(25);
    let when;
    if (state.today === 0) when = `${tr("Doors start opening 1 December —")} ${plural(sleepsUntil(1), 'sleep')} ${tr("to go")}`;
    else if (toXmas <= 0) when = tr("Merry Christmas! 🎄");
    else if (toXmas === 1) when = tr("Christmas Eve! 🎅");
    else when = `${toXmas} ${tr("sleeps to Christmas")}`;
    $('sub').innerHTML = `<span>${op.size}${tr("/24 doors open")}</span><span class="dot">•</span><span>${when}</span>`;
    $('btnTheme').textContent = state.theme === 'snow' ? '☀️' : '❄️';
    $('btnTheme').setAttribute('aria-label', state.theme === 'snow' ? tr("Switch to summer") : tr("Switch to snowy"));
    $('btnSound').textContent = state.sound ? '🔊' : '🔇';
    $('btnSound').setAttribute('aria-label', tr(state.sound ? 'Sound off' : 'Sound on'));
  }

  function fit() {
    const family = document.documentElement.classList.contains('family');
    const availW = Math.min(window.innerWidth - 24, family ? 1700 : 1200);
    const availH = window.innerHeight - $('top').offsetHeight - (family ? 40 : 86) - (preview ? 44 : 0);
    state.cols = A.layoutHuts(grid, huts, state.theme, availW, availH).cols;
  }

  // ---------------- Opening a door ----------------
  let busy = false;

  async function openDay(d) {
    if (busy || !$('overlay').hidden) return;
    const hut = huts[d - 1];
    A.Sound.init();

    if (!isUnlocked(d)) {
      hut.classList.remove('rattle');
      void hut.offsetWidth;
      hut.classList.add('rattle');
      A.Sound.thunk();
      const n = sleepsUntil(d);
      toast(`${tr("Not yet! Door")} ${d} ${tr("opens in")} ${plural(n, 'sleep')} 💤`);
      return;
    }

    const op = openedSet();
    if (op.has(d)) {
      A.Sound.whoosh(0.4, 400, 1600, 0.12);
      showCard(d);
      return;
    }

    busy = true;
    await knockOn(hut);
    hut.classList.add('opening');
    A.Sound.doorOpen();
    await A.wait(A.reducedMotion ? 0 : 80); // swing with the rush of the whoosh
    hut.classList.add('open');
    hut.classList.remove('today', 'ready');
    await A.wait(A.reducedMotion ? 50 : 330);
    const door = hut.querySelector('.doorway').getBoundingClientRect();
    A.FX.burst(door.left + door.width / 2, door.top + door.height / 2, { count: 110, power: 1.05 });

    state.opened[state.theme] = [...op, d];
    save();
    refresh();
    const bulb = $('garland').querySelectorAll('i')[d - 1];
    bulb.classList.add('pop');
    setTimeout(() => bulb.classList.remove('pop'), 900);

    await A.wait(A.reducedMotion ? 100 : 520);
    hut.classList.remove('opening');
    busy = false;
    showCard(d);
  }

  // Knock knock: the door jolts in time with each knock in the sound.
  async function knockOn(hut) {
    A.Sound.init();
    A.Sound.knock();
    const r = hut.querySelector('.doorway').getBoundingClientRect();
    A.Sound.KNOCK_TIMES.forEach((t, i) => setTimeout(() => {
      hut.classList.remove('knock');
      void hut.offsetWidth;
      hut.classList.add('knock');
      A.popText(r.left + r.width * (0.3 + (i % 2) * 0.4), r.top + r.height * 0.25, tr("knock!"));
    }, t * 1000));
    await A.wait(A.Sound.KNOCK_LENGTH * 1000 + 120);
    hut.classList.remove('knock');
  }

  // ---------------- Cards ----------------
  let current = null;

  function showCard(d) {
    const item = items()[d - 1];
    const card = $('card');
    const overlay = $('overlay');
    card.innerHTML = '';
    card.className = `card type-${item.type}`;

    const head = A.el('div', 'card-head', `
      <span class="day-badge">${tr("Day")} ${d}</span>
      <span class="kind" id="cardTitle">${A.KIND_LABEL[item.type]}</span>
      <button class="close" type="button" aria-label="${tr("Close")}">×</button>`);
    const body = A.el('div', 'card-body');
    const foot = A.el('div', 'card-foot');
    const primaryBtn = A.el('button', 'btn primary', '');
    primaryBtn.type = 'button';
    const closeBtn = A.el('button', 'btn ghost', tr("Back to the village"));
    closeBtn.type = 'button';

    const ctx = {
      theme: state.theme, to: state.to, from: state.from,
      photo: item.type === 'photo' ? photoFor(d) : null,
      sound: A.Sound, fx: A.FX,
      setPrimary(label) {
        if (!label) { primaryBtn.hidden = true; return; }
        primaryBtn.hidden = false;
        primaryBtn.textContent = label;
      },
    };
    const r = A.Reveal.render(d, item, ctx);
    body.appendChild(r.node);
    ctx.setPrimary(r.primary ? r.label : null);
    primaryBtn.addEventListener('click', () => r.primary && r.primary());
    closeBtn.addEventListener('click', closeCard);
    head.querySelector('.close').addEventListener('click', closeCard);
    foot.append(primaryBtn, closeBtn);
    card.append(head, body, foot);

    overlay.hidden = false;
    document.body.classList.add('card-open');
    current = { d, r, primaryBtn };

    const from = huts[d - 1].querySelector('.doorway').getBoundingClientRect();
    const to = card.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const s = Math.max(0.05, from.width / to.width);
    if (!A.reducedMotion) {
      card.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotate(-8deg)`, opacity: 0 },
          { opacity: 1, offset: 0.25 },
          { transform: 'none', opacity: 1 },
        ],
        { duration: 700, easing: 'cubic-bezier(.2,1.25,.35,1)' }
      );
      overlay.querySelector('.backdrop').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
    }
    requestAnimationFrame(() => {
      r.shown && r.shown();
      (r.primary ? primaryBtn : closeBtn).focus({ preventScroll: true });
    });
  }

  async function closeCard() {
    if (!current) return;
    const { d } = current;
    current = null;
    const card = $('card');
    const overlay = $('overlay');
    A.Sound.whoosh(0.35, 2000, 500, 0.1);
    if (!A.reducedMotion) {
      const from = huts[d - 1].querySelector('.doorway').getBoundingClientRect();
      const to = card.getBoundingClientRect();
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top + from.height / 2 - (to.top + to.height / 2);
      const s = Math.max(0.05, from.width / to.width);
      overlay.querySelector('.backdrop').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, fill: 'forwards' });
      await card.animate(
        [{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0 }],
        { duration: 380, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }
      ).finished.catch(() => {});
    }
    overlay.hidden = true;
    document.body.classList.remove('card-open');
    card.getAnimations().forEach((a) => a.cancel());
    overlay.querySelector('.backdrop').getAnimations().forEach((a) => a.cancel());
    huts[d - 1].focus({ preventScroll: true });
  }

  function photoFor(d) {
    if (cal) return photoURLs[d] || null;
    const idx = A.PHOTO_DAYS.indexOf(d);
    return idx >= 0 && state.photos.length ? state.photos[idx % state.photos.length] : null;
  }

  // ---------------- Toast ----------------
  let toastT;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 2400);
  }

  // ---------------- Theme ----------------
  function applyTheme(theme) {
    state.theme = theme;
    if (!state.opened[theme]) state.opened[theme] = [];
    // Premium worlds reuse a base 2D scene (snowy or summer); colours and content are their own.
    const look = A.baseOf(theme);
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.base = look;
    document.querySelector('meta[name=theme-color]').content = look === 'snow' ? '#0b1638' : '#ff9a8b';
    A.Sound.theme = A.THEMES[theme].sound || look;
    A.FX.setTheme(look);
    A.Scene.build(look, $('scene'), $('foreground'));
    const T = A.THEMES[theme];
    $('splashEmblem').textContent = T.emblem;
    $('splashEyebrow').textContent = `${state.to}, ${state.from} ${tr("made you something")}`;
    $('splashTitle').innerHTML = T.splashTitle;
    document.querySelectorAll('[data-theme-pick]').forEach((b) => b.classList.toggle('on', b.dataset.themePick === theme));
    buildGrid();
    save();
    if (!cal) {
      const url = new URL(location.href);
      url.searchParams.set('theme', theme);
      history.replaceState(null, '', url);
    }
  }

  // ---------------- Tilt / parallax ----------------
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  function tiltLoop() {
    tilt.x = A.lerp(tilt.x, tilt.tx, 0.08);
    tilt.y = A.lerp(tilt.y, tilt.ty, 0.08);
    A.Scene.tilt(tilt.x, tilt.y);
    A.FX.tiltX = tilt.x;
    A.FX.tiltY = tilt.y;
    grid.style.transform = `translate3d(${(tilt.x * 6).toFixed(2)}px, ${(tilt.y * 3).toFixed(2)}px, 0)`;
    requestAnimationFrame(tiltLoop);
  }
  if (!A.reducedMotion) {
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      tilt.tx = (e.clientX / window.innerWidth - 0.5) * -2;
      tilt.ty = (e.clientY / window.innerHeight - 0.5) * -2;
    });
    requestAnimationFrame(tiltLoop);
  }

  function letItSnow() {
    A.FX.flurry();
    A.Sound.init();
    A.Sound.sparkle(8);
  }
  A.Motion.onShake(letItSnow);

  function enableMotion() {
    // Tilt for parallax, shake for snow. Both permissions have to be asked from this tap on iPhone.
    A.Motion.request();
    const listen = () => {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma == null) return;
        tilt.tx = A.clamp(e.gamma / 25, -1, 1) * -1;
        tilt.ty = A.clamp((e.beta - 45) / 25, -1, 1) * -1;
      });
    };
    try {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then((p) => p === 'granted' && listen()).catch(() => {});
      } else {
        listen();
      }
    } catch (e) { /* motion is a bonus */ }
  }

  // ---------------- Keyboard (and TV remotes, which send arrow keys) ----------------
  document.addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    if (!$('splash').classList.contains('gone')) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('splashGo') && $('splashGo').click(); }
      return;
    }
    if (current) {
      if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); closeCard(); }
      else if (e.key === ' ') {
        e.preventDefault();
        if (!(current.r.primary && current.r.primary())) closeCard();
      }
      return;
    }
    if (e.target.closest && e.target.closest('#panel')) return;
    if (e.key === 's' || e.key === 'S') { letItSnow(); return; }
    const moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: state.cols, ArrowUp: -state.cols };
    if (moves[e.key]) {
      e.preventDefault();
      const n = A.clamp(state.focus + moves[e.key], 1, 24);
      huts[n - 1].focus();
    }
  });

  // ---------------- Family / TV mode ----------------
  function setFamily(on) {
    document.documentElement.classList.toggle('family', on);
    try {
      if (on && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch (e) {}
    setTimeout(fit, 120);
    if (on) {
      toast(tr("Family mode — use the arrow keys or a remote"));
      const first = huts.find((h) => h.classList.contains('ready')) || huts[Math.max(0, state.today - 1)];
      first && first.focus();
    }
  }

  // ---------------- Controls ----------------
  $('btnSound').addEventListener('click', () => {
    state.sound = !state.sound;
    A.Sound.enabled = state.sound;
    A.Sound.init();
    refresh();
    if (!cal) save();
  });
  $('btnTheme').addEventListener('click', () => {
    A.Sound.init();
    A.Sound.whoosh(0.6, 300, 2500, 0.15);
    switchTheme(state.theme === 'snow' ? 'summer' : 'snow');
  });
  $('btnFamily').addEventListener('click', () => setFamily(!document.documentElement.classList.contains('family')));
  $('btnDemo').addEventListener('click', () => ($('panel').hidden = !$('panel').hidden));
  $('panelClose').addEventListener('click', () => ($('panel').hidden = true));
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) document.documentElement.classList.remove('family');
    setTimeout(fit, 100);
  });

  function switchTheme(t) {
    document.body.classList.add('swap');
    setTimeout(() => {
      applyTheme(t);
      enterHuts();
      document.body.classList.remove('swap');
    }, 280);
  }

  document.querySelectorAll('[data-theme-pick]').forEach((b) =>
    b.addEventListener('click', (e) => { e.preventDefault(); if (b.dataset.themePick !== state.theme) switchTheme(b.dataset.themePick); })
  );
  const dayRange = $('dayRange');
  dayRange.value = Math.max(1, state.today);
  $('dayOut').textContent = dayRange.value;
  dayRange.addEventListener('input', () => {
    state.today = +dayRange.value;
    $('dayOut').textContent = state.today;
    refresh();
    save();
  });
  $('unlockAll').checked = state.unlockAll;
  $('unlockAll').addEventListener('change', (e) => { state.unlockAll = e.target.checked; refresh(); save(); });
  $('toName').value = state.to;
  $('fromName').value = state.from;
  $('toName').addEventListener('input', (e) => { state.to = e.target.value || tr("you"); refresh(); save(); });
  $('fromName').addEventListener('input', (e) => { state.from = e.target.value || tr("someone"); refresh(); save(); });
  $('resetBtn').addEventListener('click', () => {
    state.opened[state.theme] = [];
    save();
    buildGrid();
    enterHuts();
    toast(tr("All doors closed again"));
  });

  $('photoInput').addEventListener('change', async (e) => {
    const files = [...e.target.files].slice(0, 8);
    if (!files.length) return;
    toast(tr("Preparing your photos…"));
    const out = [];
    for (const f of files) {
      try { out.push(URL.createObjectURL(await A.preparePhoto(f, 1400))); } catch (err) { /* skip unreadable files */ }
    }
    state.photos = out;
    toast(tr('{count} photo{suffix} added behind days {days} 📸', { count: out.length, suffix: out.length === 1 ? '' : 's', days: A.PHOTO_DAYS.join(', ') }));
  });

  $('credit').addEventListener('click', () => { location.href = A.I18n.url('editor.html?new'); });
  $('btn3d').href = A.I18n.url('3d.html' + location.search);
  // Same calendar, same flags, in the 3D world (theme follows the current one in demo mode)
  $('btn3d').addEventListener('click', (e) => {
    e.preventDefault();
    const q = new URLSearchParams(location.search);
    if (!cal) q.set('theme', state.theme);
    location.href = '3d.html?' + q.toString();
  });
  $('overlay').querySelector('.backdrop').addEventListener('click', closeCard);
  $('overlay').querySelector('.card-wrap').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeCard(); });

  // Real calendars: no prototype controls, no theme flipping; paid ones lose the credit.
  if (cal) {
    $('btnDemo').hidden = true;
    $('btnTheme').hidden = true;
    if (cal.plan === 'season') $('credit').hidden = true;
    document.title = fill(A.THEMES[cal.theme].title);
  }
  if (preview) {
    const bar = A.el('div', 'preview-bar', `<span>${tr("👀 Preview — this is what")} <b>${A.esc(state.to)}</b> ${tr("will see (every door unlocked)")}</span><a href="editor.html?lang=${A.I18n.locale}&c=${encodeURIComponent(cal.id)}&step=doors">${tr('✏️ Back to editing')}</a>`);
    document.body.appendChild(bar);
    document.body.classList.add('previewing');
  }

  // ---------------- Splash ----------------
  function enterHuts() {
    if (A.reducedMotion) return;
    huts.forEach((h) => {
      h.classList.remove('enter');
      void h.offsetWidth;
      h.classList.add('enter');
    });
    setTimeout(() => huts.forEach((h) => h.classList.remove('enter')), 1800);
  }

  $('splashGo').addEventListener('click', () => {
    A.Sound.enabled = state.sound;
    A.Sound.init();
    enableMotion();
    A.Sound.whoosh(0.9, 200, 3000, 0.2);
    setTimeout(() => A.Sound.chime(), 300);
    $('splash').classList.add('gone');
    document.body.classList.add('entered');
    enterHuts();
    const r = $('splashGo').getBoundingClientRect();
    A.FX.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 120, power: 1.2 });
    setTimeout(() => {
      const first = huts.find((h) => h.classList.contains('today')) || huts.find((h) => h.classList.contains('ready'));
      first && first.focus({ preventScroll: true });
    }, 900);
  });

  // ---------------- Boot ----------------
  A.FX.init($('ambient'), $('fx'));
  A.Sound.enabled = state.sound;
  applyTheme(state.theme);
  window.addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  if (params.has('skip')) {
    $('splash').classList.add('gone');
    document.body.classList.add('entered');
  }
})();
