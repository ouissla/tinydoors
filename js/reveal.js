/* The surprise cards behind each door. Each format has its own little interaction. */
(function () {
  const A = (window.Advent = window.Advent || {});
  const tr = A.I18n.t;
  const { el, esc } = A;

  const fill = (s, ctx) => esc(s).replace(/\{to\}/g, esc(ctx.to)).replace(/\{from\}/g, esc(ctx.from));
  const paras = (s, ctx) => fill(s, ctx).split(/\n\n/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');

  function centerOf(node) {
    const r = node.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  }

  // ---- Photo: wipe away frost (snow) or sand (summer) ----
  function photo(day, item, ctx) {
    const src = ctx.photo || A.placeholderPhoto(ctx.theme, day);
    const node = el('div', 'photo-wrap', `
      <figure class="polaroid">
        <div class="photo">
          <img alt="" src="${src}">
          <canvas class="scratch"></canvas>
          <div class="scratch-hint"><span class="finger">👆</span>${esc(A.THEMES[ctx.theme].scratchHint)}</div>
        </div>
        <figcaption>${fill(item.caption, ctx)}</figcaption>
      </figure>`);
    const canvas = node.querySelector('canvas');
    const hint = node.querySelector('.scratch-hint');
    let done = false, g, moves = 0, last = null;

    function paint() {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      canvas.width = w; canvas.height = h;
      g = canvas.getContext('2d', { willReadFrequently: true });
      const r = A.rng(day * 99);
      const look = (A.THEMES[ctx.theme] && A.THEMES[ctx.theme].scratch) || 'frost';
      if (look === 'stardust') {
        // deep-space dust with twinkling stars
        const gr = g.createLinearGradient(0, 0, w, h);
        gr.addColorStop(0, '#1a0f3d'); gr.addColorStop(0.5, '#2b1a5a'); gr.addColorStop(1, '#0d0626');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 2600; i++) {
          g.fillStyle = ['#c77dff', '#7af7ff', '#ffffff', '#ff6fd8'][(r() * 4) | 0];
          g.globalAlpha = 0.15 + r() * 0.6;
          g.fillRect(r() * w, r() * h, 1.6, 1.6);
        }
        g.globalAlpha = 1;
        for (let i = 0; i < 30; i++) {
          const x = r() * w, y = r() * h, s = 2 + r() * 4;
          g.fillStyle = '#ffffff';
          g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.3, y); g.lineTo(x, y + s); g.lineTo(x - s * 0.3, y); g.fill();
        }
      } else if (look === 'frost' || look === 'icing') {
        const icing = look === 'icing';
        const gr = g.createLinearGradient(0, 0, w, h);
        if (icing) { gr.addColorStop(0, '#fff7fb'); gr.addColorStop(0.5, '#ffe3ef'); gr.addColorStop(1, '#fff2f8'); }
        else { gr.addColorStop(0, '#f4f9ff'); gr.addColorStop(0.5, '#d5e6fb'); gr.addColorStop(1, '#eef5ff'); }
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 1600; i++) {
          g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`;
          g.fillRect(r() * w, r() * h, 1.5, 1.5);
        }
        g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.4;
        for (let i = 0; i < 26; i++) {
          let x = r() * w, y = r() * h, a = r() * 6.28;
          g.beginPath(); g.moveTo(x, y);
          for (let k = 0; k < 6; k++) {
            x += Math.cos(a) * 14; y += Math.sin(a) * 14; g.lineTo(x, y);
            g.moveTo(x, y); g.lineTo(x + Math.cos(a + 0.8) * 7, y + Math.sin(a + 0.8) * 7); g.moveTo(x, y);
            a += (r() - 0.5) * 0.8;
          }
          g.stroke();
        }
        if (icing) {
          for (let i = 0; i < 120; i++) {
            g.save();
            g.translate(r() * w, r() * h);
            g.rotate(r() * 6.28);
            g.fillStyle = ['#ff6fa3', '#7cf29a', '#ffd23f', '#6fc9ff', '#c77dff'][(r() * 5) | 0];
            g.fillRect(-4, -1.2, 8, 2.4);
            g.restore();
          }
        }
      } else {
        const gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, '#f6d59a'); gr.addColorStop(1, '#e9b874');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        const cols = ['#c98f4f', '#fff2d2', '#b07a3e', '#f9e2b1', '#dca663'];
        for (let i = 0; i < 5000; i++) {
          g.fillStyle = cols[(r() * cols.length) | 0];
          g.globalAlpha = 0.25 + r() * 0.5;
          g.fillRect(r() * w, r() * h, 1.6, 1.6);
        }
        g.globalAlpha = 1;
        g.strokeStyle = 'rgba(160,110,50,.25)'; g.lineWidth = 3;
        for (let i = 0; i < 9; i++) {
          const y = r() * h;
          g.beginPath(); g.moveTo(0, y);
          g.bezierCurveTo(w * 0.3, y - 20, w * 0.6, y + 20, w, y - 6); g.stroke();
        }
      }
    }

    function brush(x, y) {
      g.globalCompositeOperation = 'destination-out';
      const rad = Math.max(26, canvas.width * 0.075);
      const rg = g.createRadialGradient(x, y, 0, x, y, rad);
      rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(0.6, 'rgba(0,0,0,.9)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg;
      if (last) {
        const dx = x - last[0], dy = y - last[1], dist = Math.hypot(dx, dy), steps = Math.ceil(dist / (rad / 3));
        for (let i = 1; i <= steps; i++) {
          const px = last[0] + (dx * i) / steps, py = last[1] + (dy * i) / steps;
          const rr = g.createRadialGradient(px, py, 0, px, py, rad);
          rr.addColorStop(0, 'rgba(0,0,0,1)'); rr.addColorStop(0.6, 'rgba(0,0,0,.9)'); rr.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = rr;
          g.beginPath(); g.arc(px, py, rad, 0, 6.29); g.fill();
        }
      } else {
        g.beginPath(); g.arc(x, y, rad, 0, 6.29); g.fill();
      }
      last = [x, y];
      if (++moves % 6 === 0) check();
    }

    function check() {
      const { width: w, height: h } = canvas;
      const data = g.getImageData(0, 0, w, h).data;
      let clear = 0, total = 0;
      for (let i = 3; i < data.length; i += 4 * 37) { total++; if (data[i] < 40) clear++; }
      if (clear / total > 0.5) finish();
    }

    function finish() {
      if (done) return;
      done = true;
      canvas.classList.add('gone');
      ctx.setPrimary(null);
      const [x, y] = centerOf(canvas);
      ctx.fx.burst(x, y, { count: 80, power: 0.8 });
      ctx.sound.chime();
      setTimeout(() => ctx.sound.sparkle(), 250);
    }

    function pos(e) {
      const r = canvas.getBoundingClientRect();
      return [((e.clientX - r.left) * canvas.width) / r.width, ((e.clientY - r.top) * canvas.height) / r.height];
    }
    let down = false;
    canvas.addEventListener('pointerdown', (e) => {
      if (done) return;
      down = true; last = null;
      hint.classList.add('hide');
      canvas.setPointerCapture(e.pointerId);
      ctx.sound.whoosh(0.4, 1200, 3500, 0.08);
      brush(...pos(e));
    });
    canvas.addEventListener('pointermove', (e) => { if (down && !done) brush(...pos(e)); });
    const up = () => { down = false; last = null; };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);

    return {
      node,
      shown() { paint(); },
      label: tr("Wipe it all away"),
      primary() {
        // TV / keyboard: sweep the frost away automatically.
        if (done) return false;
        hint.classList.add('hide');
        const w = canvas.width, h = canvas.height;
        let t = 0;
        last = null;
        const id = setInterval(() => {
          t += 1;
          const row = Math.floor(t / 10);
          const x = ((t % 10) / 9) * w;
          brush(row % 2 ? w - x : x, (row + 0.5) * (h / 6));
          if (t > 60 || done) { clearInterval(id); finish(); }
        }, 16);
        return true;
      },
    };
  }

  // ---- Message: tap the envelope ----
  function message(day, item, ctx) {
    const node = el('div', 'msg', `
      <button class="envelope" type="button" aria-label="${tr("Open the envelope")}">
        <span class="env-back"></span>
        <span class="letter-peek"><span>${tr("Dear")} ${esc(ctx.to)},</span></span>
        <span class="env-front"></span>
        <span class="flap"></span>
        <span class="seal">${ctx.theme === 'snow' ? '❄' : '♥'}</span>
      </button>
      <div class="letter">${paras(item.text, ctx)}<p class="sig">— ${esc(ctx.from)} x</p></div>`);
    const env = node.querySelector('.envelope');
    let opened = false;
    const open = () => {
      if (opened) return false;
      opened = true;
      ctx.setPrimary(null);
      env.classList.add('open');
      ctx.sound.whoosh(0.5, 500, 1800, 0.12);
      setTimeout(() => {
        node.classList.add('read');
        ctx.sound.chime();
        const [x, y] = centerOf(env);
        ctx.fx.burst(x, y, { count: 40, power: 0.6, scale: 0.8 });
      }, 750);
      return true;
    };
    env.addEventListener('click', open);
    return { node, primary: open, label: tr("Open the envelope") };
  }

  // ---- Riddle / joke: question, then the reveal ----
  function qa(day, item, ctx) {
    const isJoke = item.type === 'joke';
    const node = el('div', 'qa', `
      <div class="qa-emoji">${isJoke ? '🎉' : '🤔'}</div>
      <p class="question">${fill(item.q, ctx)}</p>
      <div class="answer" aria-live="polite"><span>${fill(item.a, ctx)}</span></div>`);
    let shown = false;
    const reveal = () => {
      if (shown) return false;
      shown = true;
      const ans = node.querySelector('.answer');
      ans.classList.add('shown');
      ctx.sound.pop(500, 900, 0.2);
      setTimeout(() => {
        ctx.sound.chime();
        const [x, y] = centerOf(ans);
        ctx.fx.burst(x, y, { count: 50, power: 0.7, scale: 0.9 });
      }, 200);
      ctx.setPrimary(null);
      return true;
    };
    return { node, primary: reveal, label: isJoke ? tr("Tell me! 😆") : tr("Reveal the answer") };
  }

  // ---- Activity / recipe ----
  function activity(day, item, ctx) {
    const node = el('div', 'activity', `
      <div class="act-emoji">${item.emoji}</div>
      <h2 class="act-title">${fill(item.title, ctx)}</h2>
      <p>${fill(item.body, ctx)}</p>
      ${item.steps ? `<ol class="steps">${item.steps.map((s) => `<li>${fill(s, ctx)}</li>`).join('')}</ol>` : ''}
      <div class="chips">${(item.chips || []).map((c) => `<span>${esc(c)}</span>`).join('')}</div>
      <div class="done-stamp">${tr("Done! ✓")}</div>`);
    let done = false;
    const markDone = () => {
      if (done) return false;
      done = true;
      node.classList.add('is-done');
      ctx.sound.thunk();
      setTimeout(() => ctx.sound.chime(), 120);
      const [x, y] = centerOf(node.querySelector('.done-stamp'));
      ctx.fx.burst(x, y, { count: 70 });
      ctx.setPrimary(null);
      return true;
    };
    return { node, primary: markDone, label: tr("We did it! ✓") };
  }

  // ---- Voucher ----
  function voucher(day, item, ctx) {
    const node = el('div', 'voucher-wrap', `
      <div class="voucher">
        <div class="v-main">
          <span class="v-label">${tr("Voucher")}</span>
          <h2>${fill(item.title, ctx)}</h2>
          <p>${fill(item.body, ctx)}</p>
          <p class="v-from">${tr("Issued with love by")} <b>${esc(ctx.from)}</b></p>
        </div>
        <div class="v-stub"><span>Nº ${String(day).padStart(3, '0')}</span></div>
        <div class="v-stamp">${tr("Yours!")}</div>
      </div>`);
    return {
      node,
      shown() {
        setTimeout(() => {
          node.classList.add('stamped');
          ctx.sound.thunk();
          const [x, y] = centerOf(node.querySelector('.v-stamp'));
          ctx.fx.burst(x, y, { count: 50, power: 0.6 });
        }, 700);
      },
    };
  }

  // ---- Christmas Eve finale ----
  function finale(day, item, ctx) {
    const node = el('div', 'finale', `
      <div class="finale-emoji">${A.THEMES[ctx.theme].finaleIcon}</div>
      <h2 class="shimmer">${tr("Merry Christmas,")}<br>${esc(ctx.to)}!</h2>
      <div class="hand">${paras(item.text, ctx)}</div>
      <p class="sig">${tr("— all my love,")} ${esc(ctx.from)}</p>`);
    return {
      node,
      shown() {
        ctx.sound.fanfare();
        ctx.fx.fireworks(8, () => ctx.sound.boom());
      },
    };
  }

  const game = (day, item, ctx) => A.Games.render(day, item, ctx);
  function link(day, item, ctx) {
    const url = A.safeLink(item.url);
    const node = el('div', 'activity link-surprise', `<div class="act-emoji">🔗</div><h2>${fill(item.title || tr('Open link'), ctx)}</h2>`);
    if (url) {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.className = 'btn primary';
      anchor.textContent = item.title || tr('Open link');
      node.appendChild(anchor);
    } else node.appendChild(el('p', '', tr('This link is unavailable.')));
    return { node };
  }

  function video(day, item, ctx) {
    const node = el('div', 'video-surprise');
    const player = document.createElement('video');
    player.controls = true;
    player.playsInline = true;
    player.preload = 'metadata';
    player.className = 'surprise-video';
    if (ctx.video) { player.src = ctx.video; node.appendChild(player); }
    else node.textContent = tr('This video is unavailable. Please refresh to try again.');
    return { node, closed() { player.pause(); player.removeAttribute('src'); player.load(); } };
  }

  // ---- Drawing: replays stroke by stroke, as if drawn in front of them ----
  function drawing(day, item, ctx) {
    const strokes = A.Drawing.clean(item.strokes);
    const node = el('div', 'drawing-surprise', `
      <figure class="sketch">
        <canvas class="sketch-canvas" role="img" aria-label="${tr('A drawing from {from}', { from: esc(ctx.from) })}"></canvas>
        ${item.caption ? `<figcaption>${fill(item.caption, ctx)}</figcaption>` : ''}
      </figure>`);
    const canvas = node.querySelector('canvas');
    let stop = () => {};
    const play = () => {
      stop();
      ctx.setPrimary(null);
      stop = A.Drawing.replay(canvas, strokes, () => {
        ctx.setPrimary(tr('Watch it again ✏️'));
        ctx.sound.chime();
      });
      return true;
    };
    play();
    return { node, primary: play, closed() { stop(); } };
  }

  const R = { drawing, link, video, photo, message, riddle: qa, joke: qa, activity, voucher, finale, game };

  A.Reveal = {
    render(day, item, ctx) {
      return R[item.type](day, item, ctx);
    },
  };
})();
