/* Shared helpers. Plain scripts (no modules) so the prototype also works from file://. */
(function () {
  const A = (window.Advent = window.Advent || {});

  // Small deterministic PRNG so the village looks the same on every load.
  A.rng = function (seed) {
    let s = seed >>> 0 || 1;
    return function () {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  };

  A.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  A.dayCount = (cal) => cal?.days?.length === 12 ? 12 : 24;
  A.dayInterval = (cal) => A.dayCount(cal) === 12 && cal?.schedule === 'alternate' ? 2 : 1;
  A.startDay = (cal) => A.dayInterval(cal) === 2 ? 1 : 25 - A.dayCount(cal);
  // The early short calendar has a three-day gap before the Christmas Eve finale.
  A.doorDate = (cal, door) => door === A.dayCount(cal) ? 24 : A.startDay(cal) + (door - 1) * A.dayInterval(cal);
  A.availableDoors = (cal, decemberDay) => Array.from({ length: A.dayCount(cal) }, (_, i) => A.doorDate(cal, i + 1)).filter((date) => date <= decemberDay).length;
  A.safeLink = (value) => {
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
    } catch { return null; }
  };
  A.lerp = (a, b, t) => a + (b - a) * t;
  A.wait = (ms) => new Promise((r) => setTimeout(r, ms));

  A.reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Storage can throw (private mode, blocked site data) — never let it break the page.
  A.store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },
  };

  A.el = function (tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  // Shake detection. Works in any mobile browser over HTTPS (or localhost) — no app or PWA needed.
  // iPhones ask permission once, and only from a tap, so call request() inside a click handler.
  A.Motion = {
    handlers: [],
    listening: false,
    available: () => 'DeviceMotionEvent' in window && window.isSecureContext,
    request() {
      try {
        if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
          return DeviceMotionEvent.requestPermission()
            .then((p) => { if (p === 'granted') A.Motion.listen(); return p; })
            .catch(() => 'denied');
        }
      } catch (e) { return Promise.resolve('denied'); }
      A.Motion.listen();
      return Promise.resolve('granted');
    },
    listen() {
      if (A.Motion.listening) return;
      A.Motion.listening = true;
      let last = null, hits = [], lastShake = 0;
      window.addEventListener('devicemotion', (e) => {
        const a = e.accelerationIncludingGravity || e.acceleration;
        if (!a || a.x == null) return;
        if (last) {
          const jolt = Math.abs(a.x - last.x) + Math.abs(a.y - last.y) + Math.abs(a.z - last.z);
          const now = performance.now();
          if (jolt > 22) {
            hits = hits.filter((t) => now - t < 700);
            hits.push(now);
            // a few sharp jolts close together = a shake (not just picking the phone up)
            if (hits.length >= 3 && now - lastShake > 1200) {
              lastShake = now;
              hits = [];
              A.Motion.handlers.forEach((h) => h());
            }
          }
        }
        last = { x: a.x, y: a.y, z: a.z };
      });
    },
    onShake(fn) { A.Motion.handlers.push(fn); },
  };

  // A little word that pops up and floats away (e.g. "knock!").
  A.popText = function (x, y, text) {
    const n = A.el('span', 'pop-text', A.esc(text));
    n.style.left = x + 'px';
    n.style.top = y + 'px';
    n.style.setProperty('--tilt', (Math.random() * 16 - 8).toFixed(1) + 'deg');
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 900);
  };

  A.esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
})();
