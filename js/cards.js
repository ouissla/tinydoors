/* Surprise card overlay that flies out of a point on screen (used by the 3D view). */
(function () {
  const A = (window.Advent = window.Advent || {});
  const tr = A.I18n.t;
  const $ = (id) => document.getElementById(id);
  let current = null;

  function fromTransform(card, origin) {
    const to = card.getBoundingClientRect();
    const dx = origin.x - (to.left + to.width / 2);
    const dy = origin.y - (to.top + to.height / 2);
    const s = Math.max(0.05, (origin.size || 60) / to.width);
    return `translate(${dx}px, ${dy}px) scale(${s})`;
  }

  A.Cards = {
    isOpen: () => !!current,

    show({ day, item, theme, to, from, photo, origin, onClosed }) {
      const card = $('card');
      const overlay = $('overlay');
      card.innerHTML = '';
      card.className = `card type-${item.type}`;
      const head = A.el('div', 'card-head', `
        <span class="day-badge">${tr("Day")} ${day}</span>
        <span class="kind" id="cardTitle">${A.KIND_LABEL[item.type]}</span>
        <button class="close" type="button" aria-label="${tr("Close")}">×</button>`);
      const body = A.el('div', 'card-body');
      const foot = A.el('div', 'card-foot');
      const primaryBtn = A.el('button', 'btn primary', '');
      primaryBtn.type = 'button';
      const closeBtn = A.el('button', 'btn ghost', tr("Back to the village"));
      closeBtn.type = 'button';
      const ctx = {
        theme, to, from, photo, sound: A.Sound, fx: A.FX,
        setPrimary(label) {
          primaryBtn.hidden = !label;
          if (label) primaryBtn.textContent = label;
        },
      };
      const r = A.Reveal.render(day, item, ctx);
      body.appendChild(r.node);
      ctx.setPrimary(r.primary ? r.label : null);
      primaryBtn.addEventListener('click', () => r.primary && r.primary());
      closeBtn.addEventListener('click', () => A.Cards.close());
      head.querySelector('.close').addEventListener('click', () => A.Cards.close());
      foot.append(primaryBtn, closeBtn);
      card.append(head, body, foot);
      overlay.hidden = false;
      document.body.classList.add('card-open');
      current = { r, origin, onClosed };
      if (!A.reducedMotion) {
        card.animate(
          [{ transform: fromTransform(card, origin) + ' rotate(-8deg)', opacity: 0 }, { opacity: 1, offset: 0.25 }, { transform: 'none', opacity: 1 }],
          { duration: 700, easing: 'cubic-bezier(.2,1.25,.35,1)' }
        );
        overlay.querySelector('.backdrop').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
      }
      requestAnimationFrame(() => {
        r.shown && r.shown();
        (r.primary ? primaryBtn : closeBtn).focus({ preventScroll: true });
      });
    },

    async close() {
      if (!current) return;
      const { origin, onClosed } = current;
      current = null;
      const card = $('card');
      const overlay = $('overlay');
      A.Sound.whoosh(0.35, 2000, 500, 0.1);
      if (!A.reducedMotion) {
        overlay.querySelector('.backdrop').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, fill: 'forwards' });
        await card.animate([{ transform: 'none', opacity: 1 }, { transform: fromTransform(card, origin), opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }).finished.catch(() => {});
      }
      overlay.hidden = true;
      document.body.classList.remove('card-open');
      card.getAnimations().forEach((a) => a.cancel());
      overlay.querySelector('.backdrop').getAnimations().forEach((a) => a.cancel());
      onClosed && onClosed();
    },

    // Escape closes; Space runs the card's main action (or closes). Returns true if handled.
    key(e) {
      if (!current) return false;
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        A.Cards.close();
        return true;
      }
      if (e.key === ' ') {
        e.preventDefault();
        if (!(current.r.primary && current.r.primary())) A.Cards.close();
        return true;
      }
      return false;
    },
  };

  if ($('overlay')) {
    $('overlay').querySelector('.backdrop').addEventListener('click', () => A.Cards.close());
    $('overlay').querySelector('.card-wrap').addEventListener('click', (e) => { if (e.target === e.currentTarget) A.Cards.close(); });
  }
})();
