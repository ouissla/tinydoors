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

  A.esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
})();
