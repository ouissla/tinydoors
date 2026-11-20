/* The creator's editor: who + theme → 24 pre-filled doors → personalise → preview & share. */
(async function () {
  const A = window.Advent;
  const tr = A.I18n.t;
  const $ = (id) => document.getElementById(id);
  const esc = A.esc;
  const params = new URLSearchParams(location.search);
  let LAST = 'littledoors:last';
  // Calendars made before signing in live in this browser; these keys bring them into the account.
  const GUEST = 'littledoors:guest', GUEST_NEXT = 'littledoors:guest-next', GUEST_NUDGED = 'littledoors:guest-nudged';
  let adoptedNext = null;
  let shareToken = null;
  let seasonPass = null;
  let checkoutBusy = false;
  const FREE_PHOTOS = 3;
  // The server picks the Season Pass currency from the visitor's country; A$6.99 is the default.
  const priceLabel = () => {
    const price = A.Auth?.config?.price || { currency: 'aud', amount: 699 };
    try { return new Intl.NumberFormat(A.I18n.locale, { style: 'currency', currency: price.currency.toUpperCase() }).format(price.amount / 100); }
    catch { return 'A$6.99'; }
  };
  function applyPriceLabels() {
    const price = priceLabel();
    document.querySelector('.world-pass-summary strong').textContent = tr('Season Pass · {price} once', { price });
    $('worldPassNotice').textContent = tr('Season Pass · {price} once for up to 5 premium calendars this Christmas. Free to customise and preview; pay when you’re ready to share.', { price });
    $('buyBtn').textContent = tr('Unlock for {price}', { price });
  }
  applyPriceLabels();

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
    const count = Number($('fLength').value);
    const key = t + ':' + count;
    if (!webgl || location.protocol === 'file:' || key === bgTheme) return;
    bgTheme = key;
    const box = $('bg3d');
    const f = document.createElement('iframe');
    f.tabIndex = -1;
    f.setAttribute('aria-hidden', 'true');
    f.title = '';
    f.src = A.I18n.url(`3d.html?theme=${encodeURIComponent(t)}&doors=${count}&bg`);
    f._show = () => {
      if (bgTheme !== key) { f.remove(); return; } // picked another world meanwhile
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
  applyPriceLabels(); // Config (and with it the local price) has loaded by now.
  if (A.DB.isCloud) {
    document.querySelectorAll('.proto-note').forEach((node) => { node.textContent = tr("Your link is read-only. Recipients do not need to sign in."); });
    $('buyBtn').disabled = !A.Auth.config.checkoutAvailable;
    $('goDoors').nextElementSibling.textContent = A.Auth.user
      ? tr("Save your calendar to your account. Recipients open their link without signing in.")
      : tr("No account needed to start. Save it to your account when you’re ready to share.");
    $('checkoutNote').textContent = A.Auth.config.checkoutAvailable ? tr("Secure payment with Stripe. {price} once for up to 5 premium calendars this Christmas.", { price: priceLabel() }) : tr("Checkout is being set up. Your calendar is saved.");
    if (!A.Auth.user) LAST = GUEST;
    A.Auth.onSignInClick = () => promptSignIn(step);
    if (A.Auth.user) {
      LAST += ':' + A.Auth.user.id;
      await adoptGuestCalendar();
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
  async function adoptGuestCalendar() {
    const guestId = A.store.get(GUEST, null);
    if (!guestId) return;
    try {
      const adopted = await A.DB.adoptGuestCalendar(guestId);
      if (adopted) {
        A.store.set(LAST, adopted.id);
        adoptedNext = A.store.get(GUEST_NEXT, null);
        toast(tr('Your calendar is saved to your account ✓'));
      }
      A.store.set(GUEST, null);
      A.store.set(GUEST_NEXT, null);
    } catch {
      $('accountMessage').textContent = tr("Couldn’t move your calendar into your account. Refresh to try again.");
      $('accountMessage').setAttribute('role', 'alert');
    }
  }
  // Ask for an account only when it's needed, and come back to the same step after the email link.
  function promptSignIn(next) {
    if (cal) {
      clearTimeout(saveT);
      persist().then(() => A.store.set(GUEST, cal.id)).catch(() => {});
      A.store.set(GUEST_NEXT, next === 'checkout' ? 'share' : next || step);
    }
    A.Auth.prompt(next === 'checkout' ? tr('Save your calendar to your account, then unlock the Season Pass.')
      : next === 'share' ? tr('Save your calendar to your account to get their private link.')
      : cal ? tr('Don’t lose your progress: save your calendar to your account.') : tr('Sign in to see your saved calendars on any device.'));
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
    await Promise.all([...cal.days, ...Object.values(cal.savedDays || {}).flat()].map(async (d) => {
      const id = d.photoId || d.videoId;
      if (id && !photoURL[id]) {
        try { photoURL[id] = await A.DB.getPhotoURL(id); }
        catch { $('accountMessage').textContent = tr("Some photos couldn’t load. Refresh to try again."); }
      }
    }));
    setTheme(cal.theme);
    $('fTo').value = cal.to;
    $('fFrom').value = cal.from;
    $('fLength').value = A.dayCount(cal);
    $('fSchedule').value = cal.schedule || 'daily';
  } else {
    setTheme(params.get('theme') || 'snow');
  }

  function updateLengthChoice() {
    const short = $('fLength').value === '12';
    $('scheduleField').hidden = !short;
    setBackdrop(theme);
    $('goDoors').textContent = tr('Fill my {count} doors ✨', { count: $('fLength').value });
    $('scheduleHint').textContent = $('fSchedule').value === 'alternate'
      ? tr('12 doors on 1, 3, 5…21 December, then the final door on 24 December.')
      : tr('12 doors, opening daily from 13 December to Christmas Eve.');
  }
  $('fLength').addEventListener('change', updateLengthChoice);
  $('fSchedule').addEventListener('change', updateLengthChoice);
  updateLengthChoice();

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
    if (A.DB.isGuest) $('accountSignIn').textContent = cal ? tr('Save my calendar') : tr('Sign in');
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
    notice.textContent = seasonPass?.active
      ? (seasonPass.remaining ? tr('Your Season Pass is ready. Activate this calendar when you’re ready to share; {remaining} of 5 slots are available.', { remaining: seasonPass.remaining }) : tr('All 5 premium calendars are used. Keep editing those calendars, or choose a free world for this one.'))
      : tr("Season Pass selected · {price} once for up to 5 premium calendars this Christmas. Free to customise and preview; pay when you’re ready to share.", { price: priceLabel() });
  }
  function openPreview(src, title) {
    $('worldPreviewTitle').textContent = title;
    $('worldPreviewFrame').src = A.I18n.url(src);
    $('worldPreview').showModal();
  }
  $('worldPreviewBtn').addEventListener('click', () => openPreview(`3d.html?theme=${encodeURIComponent(theme)}&doors=${$('fLength').value}&skip&unlock`, A.THEMES[theme].name));
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
    const count = Number($('fLength').value);
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
        days: A.presetDays(theme, count),
      };
    } else {
      cal.to = to;
      cal.from = from || cal.from;
      if (cal.days.length !== count) {
        cal.days = A.resizeDays(cal, count, theme);
      }
      if (cal.theme !== theme) {
        // Keep everything they made; swap the untouched presets for the new world's pack.
        cal.days = cal.days.map((d, i) => (d.personal ? d : A.presetDays(theme, count)[i]));
        cal.theme = theme;
      }
    }
    cal.schedule = count === 12 ? $('fSchedule').value : 'daily';
    save();
    celebrate($('goDoors'), 110);
    go('doors');
  });

  // ---------------- 2. Doors ----------------
  const grid = $('edGrid');

  function renderDoors(animate) {
    $('dTitle').textContent = fill(A.THEMES[cal.theme].title);
    updatePassNotice();
    $('doorsIntro').innerHTML = tr('All {count} doors already have a surprise behind them.', { count: cal.days.length }) + ' <b>' + tr('Tap any door to make it personal.') + '</b>';
    grid.innerHTML = '';
    huts = A.makeHuts(cal.theme, (d) => A.iconFor(cal.days[d - 1], cal.theme), (d) => openSheet(d), cal.days.length);
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
    if (!cal.days[cal.days.length - 1].personal) tips.push({ label: tr("💌 Write the Christmas Eve letter"), run: () => openSheet(cal.days.length, 'note') });
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
      case 'link': return { title: day.title || tr('Open link'), text: day.url };
      case 'video': return { title: day.caption || tr('A video for you'), text: tr('Your short video · up to 10 seconds') };
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
    sheetMode = mode || (day.photoId ? 'photo' : day.videoId ? 'video' : day.type === 'link' ? 'link' : 'home');
    renderSheet();
    $('sheet').hidden = false;
    document.body.classList.add('sheet-open');
    A.Sound.pop(500, 800, 0.12);
    requestAnimationFrame(() => {
      const f = $('shBody').querySelector('textarea, input[type=text], button');
      f && f.focus({ preventScroll: true });
    });
  }

  let recording = null;
  function stopRecording() { recording?.cancel(); recording = null; }

  function closeSheet() {
    stopRecording();
    $('sheet').hidden = true;
    document.body.classList.remove('sheet-open');
    if (sheetDay && huts[sheetDay - 1]) huts[sheetDay - 1].focus({ preventScroll: true });
    sheetDay = null;
    setTimeout(promptAfterSheet, 0);
  }
  let signInAfterSheet = false;
  function promptAfterSheet() {
    if (!signInAfterSheet || !$('sheet').hidden || !A.DB.isGuest) return;
    signInAfterSheet = false;
    promptSignIn(step);
  }

  function renderSheet() {
    stopRecording();
    const d = sheetDay;
    const day = cal.days[d - 1];
    $('shDay').textContent = tr('Door {door} · {date} December', { door: d, date: A.doorDate(cal, d) });
    $('shKind').textContent = A.doorDate(cal, d) === 24 ? tr("Christmas Eve") : day.personal ? tr("Made by you ♥") : tr("Ready-made surprise");
    const body = $('shBody');
    const s = summary(day);
    const isEve = A.doorDate(cal, d) === 24;

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
          <button type="button" data-act="link"><span>🔗</span><b>${tr("Add a link")}</b><small>${tr("YouTube or any website")}</small></button>
          <button type="button" data-act="video"><span>🎥</span><b>${tr("Record a video")}</b><small>${tr("Up to 10 seconds")}</small></button>
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
    } else if (sheetMode === 'link') {
      body.innerHTML = `
        <label class="field">${tr("Website or YouTube link")}<input id="linkURL" type="url" maxlength="2048" placeholder="https://www.youtube.com/watch?v=…" value="${esc(day.type === 'link' ? day.url : '')}"></label>
        <label class="field">${tr("Button text")}<input id="linkTitle" type="text" maxlength="80" placeholder="${tr('Open link')}" value="${esc(day.type === 'link' ? day.title || '' : '')}"></label>
        <p class="hint" id="linkHint" role="status">${tr("Opens in a new tab when they click. Use a full http:// or https:// address.")}</p>
        <div class="sheet-foot"><button type="button" class="link" data-act="home">${tr("Back")}</button><button type="button" class="btn primary" data-act="saveLink">${tr("Save link")}</button></div>`;
    } else if (sheetMode === 'video') {
      body.innerHTML = `
        <video id="videoPreview" class="surprise-video" playsinline ${day.videoId ? `controls src="${esc(photoURL[day.videoId] || '')}"` : 'muted'}></video>
        <p class="hint" id="recordStatus" role="status" aria-live="polite">${tr("Record a personal video, up to 10 seconds. Allow your camera and microphone when asked.")}</p>
        <div class="row-btns"><button type="button" class="btn primary" data-act="recordVideo">${day.videoId ? tr("Record again") : tr("Start recording")}</button><button type="button" class="btn ghost" id="stopVideo" data-act="stopVideo" hidden>${tr("Stop recording")}</button></div>
        <div class="sheet-foot"><button type="button" class="link" data-act="home">${tr("Back")}</button>${day.videoId ? `<button type="button" class="link" data-act="reset">${tr("Remove video")}</button>` : ''}<button type="button" class="btn primary" data-act="done">${tr("Done")}</button></div>`;
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
      if (A.DB.isGuest && !A.store.get(GUEST_NUDGED, false)) {
        A.store.set(GUEST_NUDGED, true);
        signInAfterSheet = true; // Ask once the door sheet closes, so the prompt isn't hidden behind it.
        if ($('sheet').hidden) setTimeout(promptAfterSheet, 0);
      }
    } else save();
    const oldMedia = old.photoId || old.videoId;
    if (oldMedia && oldMedia !== (next.photoId || next.videoId) && !Object.values(cal.savedDays || {}).flat().some((item) => (item.photoId || item.videoId) === oldMedia)) {
      A.DB.deletePhoto(oldMedia).catch(() => {});
      if (photoURL[oldMedia]) URL.revokeObjectURL(photoURL[oldMedia]);
      delete photoURL[oldMedia];
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
      case 'note': case 'voucher': case 'presets': case 'words': case 'link': case 'video': sheetMode = act; renderSheet(); break;
      case 'games': sheetMode = 'presets'; presetFilter = tr("Games"); renderSheet(); break;
      case 'saveLink': {
        const url = A.safeLink($('linkURL').value.trim());
        if (!url) { $('linkHint').textContent = tr('Enter a full http:// or https:// link.'); $('linkURL').focus(); return; }
        await setDay(d, { type: 'link', url, title: $('linkTitle').value.trim() || tr('Open link'), personal: true }, { celebrate: true });
        closeSheet(); toast(tr('Link saved 🔗')); break;
      }
      case 'recordVideo': {
        if (recording) return;
        const previewNode = $('videoPreview'), status = $('recordStatus'), stopButton = $('stopVideo');
        const button = $('shBody').querySelector('[data-act="recordVideo"]');
        button.disabled = true;
        recording = A.recordVideo({
          preview: previewNode,
          onTick(seconds) { status.textContent = tr('Recording… {seconds}/10 seconds', { seconds }); },
          async onComplete(blob) {
            recording = null;
            stopButton.hidden = true;
            status.textContent = tr('Saving your video…');
            let id;
            try {
              id = await A.DB.putVideo(blob);
              await setDay(d, { type: 'video', videoId: id, personal: true }, { celebrate: true });
              photoURL[id] = URL.createObjectURL(blob);
              if (sheetDay === d) { sheetMode = 'video'; renderSheet(); }
              toast(tr('Video saved 🎥'));
            } catch {
              if (id) A.DB.deletePhoto(id).catch(() => {});
              status.textContent = tr('Couldn’t save your video. Please record again.');
              button.disabled = false;
            }
          },
          onError() {
            recording = null;
            button.disabled = false;
            stopButton.hidden = true;
            status.textContent = tr('Couldn’t record. Allow camera and microphone access and use a browser that supports video recording.');
          },
          onReady() { stopButton.hidden = false; },
        });
        break;
      }
      case 'stopVideo': recording?.stop(); break;
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
        await setDay(d, { type: d === cal.days.length ? 'finale' : 'message', text, personal: true }, { celebrate: true });
        closeSheet();
        toast(A.doorDate(cal, d) === 24 ? tr("Christmas Eve letter saved 💌") : tr("Note saved 💌"));
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

  const resetItem = (d) => A.presetDays(cal.theme, cal.days.length)[d - 1];

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
    cal.days.forEach((d, i) => { if (!d.personal && d.type !== 'photo' && i > 0 && i < cal.days.length - 1) slots.push(i + 1); });
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

  // ---------------- Account Season Pass and Stripe Checkout ----------------
  function renderCheckoutButton() {
    const button = $('buyBtn');
    button.disabled = checkoutBusy || seasonPass?.refunded || (seasonPass?.active ? seasonPass.remaining === 0 && !seasonPass.calendars.includes(cal?.id) : !A.Auth.config.checkoutAvailable);
    button.setAttribute('aria-busy', String(checkoutBusy));
    button.textContent = checkoutBusy ? tr('Opening checkout…') : seasonPass?.refunded ? tr('Season Pass refunded') : seasonPass?.active ? tr('Use a Season Pass calendar') : tr('Unlock for {price}', { price: priceLabel() });
    // The share panel's own button starts checkout directly, so it shows the same busy state.
    const up = $('upBtn');
    if (up?.dataset && !up.dataset.locked) {
      up.disabled = checkoutBusy;
      up.setAttribute('aria-busy', String(checkoutBusy));
      up.textContent = checkoutBusy ? tr('Opening checkout…') : up.dataset.label;
    }
  }
  function checkoutMessage(text) {
    $('checkoutMessage').textContent = text;
    if (text && $('upsell').hidden) toast(text);
  }
  window.addEventListener('pageshow', (event) => {
    if (event.persisted && A.DB.isCloud) { checkoutBusy = false; renderCheckoutButton(); }
  });
  function upsell(why) {
    $('checkoutMessage').textContent = '';
    $('upWhy').textContent = why || tr('You’ve used your {count} free photos.', { count: FREE_PHOTOS });
    $('upsell').hidden = false;
    A.Sound.init();
    A.Sound.pop(400, 900, 0.15);
  }
  $('upsell').querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => ($('upsell').hidden = true)));
  async function refreshSeasonPass() {
    if (!A.DB.isCloud || !A.Auth.user) return;
    const now = new Date();
    const year = cal?.year || (now.getMonth() < 2 ? now.getFullYear() - 1 : now.getFullYear());
    seasonPass = await A.Auth.request('/api/season-pass?year=' + year);
    $('accountPassStatus').textContent = seasonPass.active
      ? tr('Christmas {year} Season Pass · {used} of 5 premium calendars used', { year, used: seasonPass.used })
      : seasonPass.refunded ? tr('Christmas {year} · Season Pass refunded', { year }) : tr('Christmas {year} · Free account', { year });
    if (cal) cal.plan = seasonPass.active && seasonPass.calendars.includes(cal.id) ? 'season' : 'free';
    renderCheckoutButton();
    if (seasonPass.active) $('checkoutNote').textContent = tr('{remaining} of 5 premium calendars available. Activating this calendar uses one slot; editing and resending it do not.', { remaining: seasonPass.remaining });
  }
  async function activatePremium() {
    clearTimeout(saveT);
    await persist();
    await A.Auth.request('/api/season-pass', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ calendarId: cal.id }) });
    cal.plan = 'season';
    await refreshSeasonPass();
    $('upsell').hidden = true;
    updatePassNotice();
    if (step === 'share') renderShare();
  }
  async function unlockSeasonPass() {
    if (A.DB.isCloud) {
      if (checkoutBusy) return;
      if (!A.Auth.user) { $('upsell').hidden = true; promptSignIn('checkout'); return; }
      if (!cal) { $('upsell').hidden = true; go('start'); toast(tr('Save a calendar first, then unlock your Season Pass.')); return; }
      checkoutBusy = true;
      renderCheckoutButton();
      $('checkoutMessage').textContent = tr('Preparing your Season Pass…');
      let redirecting = false;
      try {
        await refreshSeasonPass();
        if (seasonPass.active) { await activatePremium(); return; }
        clearTimeout(saveT);
        await persist();
        const result = await A.Auth.request('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ calendarId: cal.id, lang: A.I18n.locale }) });
        if (result.activated) { cal.plan = 'season'; await refreshSeasonPass(); $('upsell').hidden = true; renderShare(); return; }
        const target = new URL(result.url);
        if (target.protocol !== 'https:' || target.hostname !== 'checkout.stripe.com') throw new Error(tr('Could not open checkout. Please try again.'));
        location.assign(target.href);
        redirecting = true;
      } catch (error) {
        checkoutMessage(error.message);
      } finally {
        if (!redirecting) { checkoutBusy = false; renderCheckoutButton(); }
      }
      return;
    }
    if (cal) { cal.plan = 'season'; save(); } else { pendingPass = true; }
    celebrate($('buyBtn'), 140);
    A.Sound.fanfare();
    $('upsell').hidden = true;
    toast(tr('Demo Season Pass unlocked — no payment taken'));
    if (step === 'share') renderShare();
  }
  $('buyBtn').addEventListener('click', unlockSeasonPass);

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
    $('shareSummary').innerHTML = `${cal.days.length} ${tr("doors ·")} <b>${n}</b> ${tr("made by you ·")} <b>${p}</b> photo${p === 1 ? '' : 's'}<br>${tr("The first door opens on")} <b>${tr("{day} December", { day: A.startDay(cal) })}</b>. ${A.dayInterval(cal) === 2 ? tr("Doors open every second day through 21 December, then the final door opens on 24 December.") : tr("A new door opens every day.")}`;
    $('previewBtn').href = linkFor('&preview');
    $('previewBtn').textContent = `${tr("👀 Preview as")} ${cal.to}`;
    $('preview2dBtn').href = linkFor('&preview', 'index.html');
    ++shareRevision;
    const gated = needsPass();
    const guest = !!A.DB.isGuest && !gated;
    $('shareControls').hidden = gated || guest;
    $('shareGateNotice').hidden = !gated && !guest;
    $('guestSave').hidden = !guest;
    $('shareGateNotice').textContent = seasonPass?.active
      ? (seasonPass.remaining ? tr('Your Season Pass is ready. Activate this calendar when you’re ready to share; {remaining} of 5 slots are available.', { remaining: seasonPass.remaining }) : tr('All 5 premium calendars are used. Keep editing those calendars, or choose a free world for this one.'))
      : seasonPass?.refunded ? tr('Your Season Pass was refunded. Your calendars are saved; choose a free world to share this calendar, or contact support.')
      : guest ? tr('Your calendar is saved on this device. Save it to your account to get their private link.')
      : tr('Free to customise and preview. Unlock the Season Pass below when you’re ready to share.');
    $('shareLink').value = '';
    $('copyBtn').disabled = true;
    $('nativeShare').disabled = true;
    if (!gated && !guest) await prepareShare();
    const tz = $('tz');
    const zones = ZONES.includes(cal.tz) ? ZONES : [cal.tz, ...ZONES];
    tz.innerHTML = zones.map((z) => `<option value="${esc(z)}"${z === cal.tz ? ' selected' : ''}>${esc(z.replace(/_/g, ' ').replace('/', ' — '))}</option>`).join('');

    const up = $('upgradeCard');
    if (cal.plan === 'season') {
      up.innerHTML = `<div class="paid"><span>🎉</span><div><b>${tr("Season Pass active")}</b><small>${tr("Every world, unlimited photos, no credit, open until 31 January. This calendar uses 1 of your 5 seasonal slots.")}</small></div></div>`;
    } else {
      up.innerHTML = `
        <p class="kicker">${gated ? tr("Season Pass selected") : tr("Free calendar")}</p>
        <h3>${seasonPass?.active ? tr('Your Season Pass') : gated ? tr("Ready to share their Christmas magic?") : tr("Want to go all out?")}</h3>
        <ul class="perks">
          <li>${tr("🎁 Up to 5 premium calendars for this Christmas")}</li>
          <li>${tr("✨ All seven Season Pass worlds, from Gingerbread Lane to Neon City")}</li>
          <li>${tr("📸 Unlimited photos (")}${p} ${tr("added; free sharing includes")} ${FREE_PHOTOS})</li>
          <li>${tr("✨ Remove the “Made with Tiny Doors” credit")}</li>
          ${seasonPass?.active ? '' : `<li>${tr("💛 One-time {price} for this Christmas — no subscription", { price: priceLabel() })}</li>`}
        </ul>
        <div class="upgrade-actions">
          <button type="button" class="btn primary" id="upBtn">${gated ? tr("Unlock &amp; share · {price}", { price: priceLabel() }) : tr("Get the Season Pass")}</button>
          ${gated ? `<button type="button" class="btn ghost" id="chooseFreeWorld">${tr("Choose a free world")}</button>` : ''}
        </div>
        ${gated ? `<p class="fine">${tr("Your messages and personal edits stay saved. Free sharing includes up to 3 photos; remove any extra photos before sharing.")}</p>` : ''}`;
      if (A.DB.isCloud && seasonPass?.active) {
        $('upBtn').textContent = seasonPass.remaining > 0 ? tr('Activate premium · {remaining} of 5 available', { remaining: seasonPass.remaining }) : tr('All 5 premium calendars used');
        $('upBtn').disabled = seasonPass.remaining === 0;
      }
      if (A.DB.isCloud && seasonPass?.refunded) { $('upBtn').textContent = tr('Season Pass refunded'); $('upBtn').disabled = true; }
      // The perks are already listed here, so this button goes straight to checkout (or activation).
      $('upBtn').dataset.label = $('upBtn').textContent;
      if ($('upBtn').disabled) $('upBtn').dataset.locked = 'true';
      $('upBtn').addEventListener('click', unlockSeasonPass);
      if (gated) $('chooseFreeWorld').addEventListener('click', () => { go('start'); toast(tr("Choose Snowy village or Summer Christmas. Your personal edits stay saved.")); });
    }
  }

  $('guestSave').addEventListener('click', () => promptSignIn('share'));
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
  if (A.DB.isCloud && A.Auth.user) {
    try {
      const sessionId = params.get('session_id');
      if (params.get('checkout') === 'success' && sessionId) {
        $('saved').textContent = tr('Checking your payment…');
        const result = await A.Auth.request('/api/checkout/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
        if (result.pending) toast(tr('Your payment is processing. Refresh shortly to check your Season Pass.'));
        else if (result.active && cal) await activatePremium();
      }
      await refreshSeasonPass();
      if (params.get('checkout') === 'cancelled') toast(tr('Checkout cancelled. Your edits are saved and no calendar slot was used.'));
      const clean = new URL(location.href);
      // Keep a pending checkout available for confirmation when the creator refreshes.
      if (params.get('checkout') !== 'success' || seasonPass?.active) { clean.searchParams.delete('session_id'); clean.searchParams.delete('checkout'); }
      history.replaceState(null, '', clean);
    } catch (error) {
      $('accountPassStatus').textContent = error.message;
      // Preserve the session ID for a retry after a temporary payment/network failure.
    }
  }
  const startStep = ['doors', 'share'].includes(adoptedNext) ? adoptedNext : params.get('step');
  go(cal ? (['doors', 'share'].includes(startStep) ? startStep : 'doors') : 'start', true);
  if (cal) $('saved').textContent = tr("Saved ✓");
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => step === 'doors' && layoutGrid());
})();
