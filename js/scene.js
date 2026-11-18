/* The illustrated backdrop: layered "paper-cut" scenes that shift with tilt / mouse. */
(function () {
  const A = (window.Advent = window.Advent || {});

  const SVG = (inner, attrs = '') =>
    `<svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMax slice" ${attrs}>${inner}</svg>`;

  // Smooth rolling hill path across the 1000-wide stage.
  function hill(r, base, amp, step = 50, freq = 1) {
    const pts = [];
    const p1 = r() * 6, p2 = r() * 6;
    for (let x = -step; x <= 1000 + step; x += step) {
      const y = base + amp * (Math.sin((x / 1000) * Math.PI * 2 * freq + p1) * 0.65 + Math.sin((x / 1000) * Math.PI * 5 * freq + p2) * 0.35);
      pts.push([x, y]);
    }
    let d = `M${pts[0][0]},1000 L${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      d += ` Q${x0},${y0} ${(x0 + x1) / 2},${(y0 + y1) / 2}`;
    }
    d += ` L${pts[pts.length - 1][0]},1000 Z`;
    const at = (x) => {
      for (let i = 1; i < pts.length; i++) {
        if (pts[i][0] >= x) {
          const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
          return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
        }
      }
      return base;
    };
    return { d, at };
  }

  function pine(x, y, h) {
    const w = h * 0.6;
    let d = '';
    for (let i = 0; i < 3; i++) {
      const ty = y - h + i * h * 0.27;
      const tw = w * (0.5 + i * 0.25);
      const by = ty + h * 0.42;
      d += `M${x},${ty} L${x + tw / 2},${by} Q${x},${by - h * 0.05} ${x - tw / 2},${by} Z `;
    }
    d += `M${x - h * 0.045},${y - h * 0.16} h${h * 0.09} v${h * 0.16} h${-h * 0.09} Z`;
    return d;
  }

  function cottage(x, y, s) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <rect x="-14" y="-18" width="28" height="18" fill="#3b2f57"/>
      <path d="M-18,-17 L0,-32 L18,-17 Z" fill="#2a2140"/>
      <path d="M-18,-17 L0,-32 L18,-17 L14,-19 L0,-28 L-14,-19Z" fill="#fff"/>
      <rect x="6" y="-30" width="5" height="9" fill="#2a2140"/>
      <rect x="-9" y="-13" width="7" height="7" fill="#ffd36b" class="lit"/>
      <rect x="3" y="-13" width="7" height="7" fill="#ffd36b" class="lit"/>
    </g>`;
  }

  // ---------- SNOW ----------
  function snowScene(r) {
    // Far mountains (jagged) with snowcaps via clip.
    let m = 'M-20,1000 L-20,640';
    for (let x = -20; x <= 1040; x += 70) {
      const peak = 470 + r() * 90;
      const valley = 600 + r() * 50;
      m += ` L${x + 35},${peak} L${x + 70},${valley}`;
    }
    m += ' L1040,1000 Z';
    const far = SVG(`
      <defs><clipPath id="mtnClip"><path d="${m}"/></clipPath></defs>
      <path d="${m}" fill="#7186c4"/>
      <g clip-path="url(#mtnClip)">
        <rect x="-20" y="0" width="1080" height="545" fill="#e9f0ff"/>
        <rect x="-20" y="545" width="1080" height="24" fill="#c7d4f4" opacity=".7"/>
      </g>`);

    const mh = hill(r, 745, 28, 60, 0.9);
    let trees = '';
    for (let x = 10; x < 1000; x += 18 + r() * 34) {
      if (r() < 0.25) continue;
      trees += `<path d="${pine(x, mh.at(x) + 6, 46 + r() * 50)}"/>`;
    }
    const cottages = [300, 470, 640].map((x) => cottage(x, mh.at(x) + 3, 1.4 + r() * 0.4)).join('');
    const mid = SVG(`
      <path d="${mh.d}" fill="#bccbee"/>
      <g fill="#2c4672">${trees}</g>
      ${cottages}`);

    const nh = hill(r, 865, 24, 70, 1.1);
    let ntrees = '';
    for (let x = 0; x < 1000; x += 40 + r() * 70) {
      if (x > 330 && x < 670 && r() < 0.8) continue;
      const h = 110 + r() * 120;
      const y = nh.at(x) + 8;
      ntrees += `<path d="${pine(x, y, h)}" fill="#1f4d42"/>`;
    }
    const near = SVG(`
      <path d="${nh.d}" fill="#e3ecff"/>
      <g>${ntrees}</g>`);

    const fh = hill(r, 968, 12, 80, 1.3);
    const fore = SVG(`<path d="${fh.d}" fill="#f6f9ff"/>`);

    let stars = '';
    for (let i = 0; i < 80; i++) {
      const s = r() < 0.12 ? 3 : 1.5 + r();
      stars += `<i style="left:${(r() * 100).toFixed(2)}%;top:${(r() * 55).toFixed(2)}%;width:${s}px;height:${s}px;animation-delay:${(-r() * 4).toFixed(2)}s;animation-duration:${(2 + r() * 3).toFixed(2)}s"></i>`;
    }

    return {
      layers: [
        { depth: 3, html: `<div class="stars">${stars}</div><div class="aurora"></div>` },
        { depth: 7, html: `<div class="moon"></div><div class="sleigh">${sleighSVG()}</div>` },
        { depth: 12, html: far },
        { depth: 20, html: mid },
        { depth: 30, html: near + edgeSnow() },
      ],
      fore: { depth: 44, html: fore },
    };
  }

  function edgeSnow() {
    const tree = (h, x) => `<path d="${pine(x, 600, h)}" fill="#18443a"/>
      <g fill="#fff">${[0, 1, 2].map((i) => {
        const ty = 600 - h + i * h * 0.27, tw = h * 0.6 * (0.5 + i * 0.25), by = ty + h * 0.42;
        return `<path d="M${x},${ty} L${x + tw * 0.22},${ty + (by - ty) * 0.42} Q${x},${ty + (by - ty) * 0.5} ${x - tw * 0.22},${ty + (by - ty) * 0.42} Z"/>`;
      }).join('')}</g>`;
    const bulbs = (cx, h) => {
      let s = '';
      const cols = ['#ff5d5d', '#ffd36b', '#6be3ff', '#7cf29a'];
      for (let i = 0; i < 9; i++) {
        const t = 0.25 + (i / 9) * 0.7;
        const y = 600 - h + h * t;
        const half = h * 0.6 * (0.3 + t * 0.55) * 0.5;
        const x = cx + (i % 2 ? half : -half) * 0.6;
        s += `<circle cx="${x}" cy="${y}" r="5" fill="${cols[i % 4]}" class="bulb" style="animation-delay:${-i * 0.37}s"/>`;
      }
      return s;
    };
    const snowman = `<g transform="translate(150,600)">
      <ellipse cx="0" cy="-2" rx="62" ry="10" fill="#dfe8ff"/>
      <circle cx="0" cy="-48" r="48" fill="#fff"/>
      <circle cx="0" cy="-122" r="36" fill="#fff"/>
      <circle cx="0" cy="-180" r="26" fill="#fff"/>
      <path d="M-18,-200 h36 v-30 h-36 Z M-28,-200 h56 v6 h-56Z" fill="#2a2140"/>
      <path d="M-28,-160 Q0,-150 28,-160 L28,-150 Q0,-140 -28,-150 Z" fill="#e2483d"/>
      <path d="M14,-156 l10,34 l-14,0 Z" fill="#c8302a"/>
      <circle cx="-9" cy="-186" r="3.5" fill="#2a2140"/><circle cx="9" cy="-186" r="3.5" fill="#2a2140"/>
      <path d="M0,-180 l26,5 l-26,4 Z" fill="#ff8a2b"/>
      <circle cx="0" cy="-128" r="4" fill="#2a2140"/><circle cx="0" cy="-112" r="4" fill="#2a2140"/>
      <path d="M-34,-124 L-80,-150 M-62,-140 l-6,-14 M34,-124 L82,-146" stroke="#5a3b2a" stroke-width="5" stroke-linecap="round"/>
    </g>`;
    return `<div class="edge edge-l"><svg viewBox="0 0 300 600">${tree(520, 130)}${bulbs(130, 520)}</svg></div>
            <div class="edge edge-r"><svg viewBox="0 0 300 600">${tree(330, 210)}${snowman}</svg></div>`;
  }

  function sleighSVG() {
    const deer = (x) => `<g transform="translate(${x},28)">
      <ellipse cx="0" cy="0" rx="13" ry="5.5"/>
      <path d="M9,-2 L15,-11 L19,-10 L14,-1Z"/>
      <circle cx="18" cy="-11" r="3.4"/>
      <path d="M17,-14 l-3,-7 m3,7 l1,-8 m-1,-1 l3,-3 M15,-19 l-4,-2" stroke="currentColor" stroke-width="1.4" fill="none"/>
      <path d="M-9,3 l-5,9 M-5,3 l-1,10 M6,3 l5,9 M9,2 l2,10" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>`;
    return `<svg viewBox="0 0 260 60" fill="currentColor">
      <path d="M8,40 Q4,50 16,50 L96,50 Q106,50 108,44" stroke="currentColor" stroke-width="3" fill="none"/>
      <path d="M22,44 L18,20 Q30,14 40,22 L84,22 Q92,22 96,30 L98,44 Z"/>
      <circle cx="50" cy="12" r="9"/><path d="M44,6 L54,-4 L60,4Z"/>
      <path d="M62,20 Q66,10 78,14 L80,22Z"/>
      <path d="M98,32 L250,24" stroke="currentColor" stroke-width="1.2"/>
      ${deer(140)}${deer(180)}${deer(222)}
    </svg>`;
  }

  // ---------- SUMMER ----------
  function wave(y, amp, period, color, cls, dur) {
    let d = `M-500,${y}`;
    for (let x = -500; x < 1500; x += period) {
      d += ` Q${x + period / 4},${y - amp} ${x + period / 2},${y} T${x + period},${y}`;
    }
    d += ' L1500,1000 L-500,1000 Z';
    return `<path class="${cls}" style="animation-duration:${dur}s" d="${d}" fill="${color}"/>`;
  }

  function surfSanta() {
    return `<g class="surfer"><g class="bob">
      <path d="M-46,8 Q0,22 50,6 Q8,-2 -46,8Z" fill="#ffd23f" stroke="#e98a00" stroke-width="2"/>
      <path d="M-14,4 L-8,-28 L10,-28 L14,4 Z" fill="#e2483d"/>
      <rect x="-9" y="-16" width="20" height="5" fill="#2a2140"/>
      <path d="M-6,4 l-8,-2 M8,4 l8,-2" stroke="#e2483d" stroke-width="5" stroke-linecap="round"/>
      <circle cx="1" cy="-38" r="10" fill="#ffd2b0"/>
      <path d="M-9,-36 Q1,-18 11,-36 Q1,-30 -9,-36Z" fill="#fff"/>
      <path d="M-11,-44 Q2,-66 22,-56 L12,-44Z" fill="#e2483d"/>
      <circle cx="23" cy="-56" r="4" fill="#fff"/>
      <rect x="-12" y="-46" width="24" height="5" rx="2.5" fill="#fff"/>
      <path d="M-8,-24 L-30,-38 M10,-24 L30,-40" stroke="#e2483d" stroke-width="5" stroke-linecap="round"/>
    </g></g>`;
  }

  function palmSVG(hat) {
    const leaves = [-160, -125, -95, -60, -25, 10, 40].map((rot, i) =>
      `<path transform="rotate(${rot})" d="M0,0 Q70,-46 150,-6 Q148,4 140,8 Q120,-6 112,2 Q96,-10 88,0 Q70,-12 60,-2 Q40,-10 0,0Z" fill="${i % 2 ? '#1f8a57' : '#2fae6a'}"/>`
    ).join('');
    const cols = ['#ff4f81', '#ffd23f', '#2ec4ff', '#7cf29a', '#ff9f1c'];
    let bulbs = '';
    for (let i = 0; i < 10; i++) {
      const t = 0.08 + i * 0.09;
      const x = 60 + 160 * t * t - 10 * Math.sin(t * 12);
      const y = 600 - 470 * t;
      bulbs += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${cols[i % cols.length]}" class="bulb" style="animation-delay:${-i * 0.31}s"/>`;
    }
    return `<svg viewBox="0 0 300 600">
      <path d="M60,610 Q70,330 220,130" stroke="#9a6a43" stroke-width="26" fill="none" stroke-linecap="round"/>
      <path d="M60,610 Q70,330 220,130" stroke="#7a4f2f" stroke-width="27" fill="none" stroke-dasharray="3 15"/>
      ${bulbs}
      <g transform="translate(220,128)">${leaves}
        <circle cx="-8" cy="12" r="10" fill="#6b4226"/><circle cx="8" cy="14" r="10" fill="#7d4f2e"/><circle cx="0" cy="24" r="9" fill="#5e3a21"/>
        ${hat ? '<g transform="translate(-6,-12) rotate(-12)"><path d="M-22,0 Q-4,-56 30,-34 L20,0Z" fill="#e2483d"/><circle cx="31" cy="-35" r="8" fill="#fff"/><rect x="-26" y="-4" width="52" height="11" rx="5.5" fill="#fff"/></g>' : ''}
      </g>
    </svg>`;
  }

  function summerScene(r) {
    const far = SVG(`
      <path d="M560,700 Q640,690 690,640 Q740,600 820,602 L1040,598 L1040,700 Z" fill="#c4679c"/>
      <path d="M690,640 Q740,600 820,602 L1040,598 L1040,612 L820,616 Q760,616 700,648Z" fill="#df8bb6"/>
      <g transform="translate(900,600)">
        <path d="M-12,0 L-8,-70 L8,-70 L12,0Z" fill="#fff"/>
        <path d="M-11,-18 L11,-18 L10.5,-30 L-10.5,-30Z M-9.5,-46 L9.5,-46 L9,-58 L-9,-58Z" fill="#e2483d"/>
        <rect x="-11" y="-82" width="22" height="12" fill="#ffd23f" class="lamp"/>
        <path d="M-13,-82 L0,-96 L13,-82Z" fill="#e2483d"/>
      </g>
      <path d="M-40,700 Q60,672 160,690 Q220,700 260,700Z" fill="#b65a90"/>
      <g transform="translate(120,684)"><path d="M0,0 Q4,-40 18,-62" stroke="#6b3a5c" stroke-width="5" fill="none"/>
        <g transform="translate(18,-62)" fill="#6b3a5c">${[-150, -110, -60, -20, 20].map((a) => `<path transform="rotate(${a})" d="M0,0 Q20,-12 42,-2 Q20,-4 0,0Z"/>`).join('')}</g></g>
      <rect x="-40" y="699" width="1080" height="4" fill="#fff" opacity=".45"/>`);

    const sea = SVG(`
      <defs><linearGradient id="seaG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4fd6d6"/><stop offset="1" stop-color="#1590b4"/></linearGradient></defs>
      <rect x="-40" y="700" width="1080" height="300" fill="url(#seaG)"/>
      <g class="glints">${Array.from({ length: 22 }, () => `<rect x="${(r() * 1000) | 0}" y="${(705 + r() * 60) | 0}" width="${(10 + r() * 30) | 0}" height="2.5" rx="1.2" fill="#fff" style="animation-delay:${(-r() * 3).toFixed(2)}s"/>`).join('')}</g>
      ${wave(760, 8, 120, '#2fb6c8', 'wave w1', 9)}
      <g transform="translate(0,770)">${surfSanta()}</g>
      ${wave(805, 10, 150, '#1ea0bd', 'wave w2', 7)}
      ${wave(812, 4, 150, 'rgba(255,255,255,.55)', 'wave w2 foam', 7)}`);

    const sh = hill(r, 900, 14, 80, 1);
    let shells = '';
    for (let i = 0; i < 14; i++) {
      const x = r() * 1000, y = sh.at(x) + 18 + r() * 60;
      shells += r() < 0.5
        ? `<path transform="translate(${x | 0},${y | 0}) scale(${(0.6 + r() * 0.6).toFixed(2)})" d="M0,-10 L3,-3 L10,-3 L4,2 L6,10 L0,5 L-6,10 L-4,2 L-10,-3 L-3,-3Z" fill="#ff8a5b"/>`
        : `<path transform="translate(${x | 0},${y | 0}) scale(${(0.6 + r() * 0.6).toFixed(2)})" d="M-9,4 Q0,-14 9,4 Z M-6,3 L0,-8 M0,3 L0,-9 M6,3 L0,-8" fill="#fff1e0" stroke="#e7b48d" stroke-width="1.4"/>`;
    }
    const sand = SVG(`
      <path d="${hill(r, 886, 12, 80, 1).d}" fill="#ffffff" opacity=".7" class="foamline"/>
      <path d="${sh.d}" fill="#ffd796"/>
      <path d="${hill(r, 940, 10, 90, 1.4).d}" fill="#ffca7a"/>
      ${shells}`);

    const fore = SVG(`<path d="${hill(r, 975, 8, 90, 1.2).d}" fill="#ffc46b"/>`);

    const clouds = [0, 1, 2, 3].map((i) =>
      `<div class="cloud c${i}" style="top:${8 + i * 9 + r() * 6}%;animation-delay:${(-r() * 90).toFixed(1)}s;animation-duration:${(70 + r() * 50).toFixed(0)}s;--s:${(0.7 + r() * 0.7).toFixed(2)}"></div>`
    ).join('');
    const gulls = [0, 1, 2].map((i) =>
      `<svg class="gull" style="top:${14 + i * 7}%;animation-delay:${-i * 6}s" viewBox="0 0 40 14"><path d="M0,10 Q10,0 20,9 Q30,0 40,10" stroke="#5b2a5f" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>`
    ).join('');

    return {
      layers: [
        { depth: 4, html: `<div class="sun"><div class="rays"></div><div class="disc"></div></div>` },
        { depth: 8, html: clouds + gulls },
        { depth: 12, html: far },
        { depth: 20, html: sea },
        { depth: 30, html: sand + `<div class="edge edge-l palm">${palmSVG(true)}</div><div class="edge edge-r palm">${palmSVG(false)}</div>` },
      ],
      fore: { depth: 44, html: fore },
    };
  }

  A.Scene = {
    layers: [],
    build(theme, sceneEl, foreEl) {
      const r = A.rng(theme === 'snow' ? 1225 : 2512);
      const s = theme === 'snow' ? snowScene(r) : summerScene(r);
      sceneEl.innerHTML = '';
      foreEl.innerHTML = '';
      this.layers = [];
      s.layers.forEach((l) => {
        const d = A.el('div', 'layer', l.html);
        d.dataset.depth = l.depth;
        sceneEl.appendChild(d);
        this.layers.push(d);
      });
      const f = A.el('div', 'layer', s.fore.html);
      f.dataset.depth = s.fore.depth;
      foreEl.appendChild(f);
      this.layers.push(f);
    },
    tilt(x, y) {
      for (const l of this.layers) {
        const d = +l.dataset.depth;
        l.style.transform = `translate3d(${(x * d).toFixed(2)}px, ${(y * d * 0.5).toFixed(2)}px, 0)`;
      }
    },
  };

  // Illustrated stand-in photos, so the frost/sand reveal has something to show before you add your own.
  A.placeholderPhoto = function (theme, day) {
    theme = A.baseOf ? A.baseOf(theme) : theme;
    const hue = (day * 47) % 360;
    const svg = theme === 'snow'
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
          <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${220 + (hue % 30)},55%,22%)"/><stop offset="1" stop-color="hsl(${230 + (hue % 20)},45%,55%)"/></linearGradient></defs>
          <rect width="800" height="1000" fill="url(#g)"/>
          <circle cx="600" cy="220" r="90" fill="#fff6d8"/>
          <path d="M0,700 Q200,600 400,680 T800,640 L800,1000 L0,1000Z" fill="#e8f0ff"/>
          <g transform="translate(360,700)"><rect x="-110" y="-120" width="220" height="130" fill="#7a2e2a"/><path d="M-140,-115 L0,-230 L140,-115Z" fill="#fff"/>
          <rect x="-70" y="-90" width="50" height="50" fill="#ffd36b"/><rect x="20" y="-90" width="50" height="50" fill="#ffd36b"/></g>
          <path d="M120,760 l40,-150 l40,150Z M640,800 l50,-190 l50,190Z" fill="#1f4d42"/>
          <text x="400" y="940" text-anchor="middle" font-family="sans-serif" font-size="34" fill="#2a3a66" opacity=".7">Sample photo — add yours in ⚙️</text>
        </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
          <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${190 + (hue % 20)},80%,62%)"/><stop offset="1" stop-color="#ffe2a8"/></linearGradient></defs>
          <rect width="800" height="1000" fill="url(#g)"/>
          <circle cx="220" cy="230" r="110" fill="#fff3a6"/>
          <rect y="560" width="800" height="200" fill="#1fb3c9"/>
          <path d="M0,600 q50,-20 100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0 t100,0" stroke="#fff" stroke-width="8" fill="none"/>
          <path d="M0,740 Q400,690 800,740 L800,1000 L0,1000Z" fill="#ffd796"/>
          <g transform="translate(520,820)"><path d="M0,0 L0,-240" stroke="#555" stroke-width="8"/><path d="M-170,-220 Q0,-330 170,-220Z" fill="#ff4f81"/><path d="M-60,-245 Q0,-330 60,-245" fill="#fff"/></g>
          <text x="400" y="940" text-anchor="middle" font-family="sans-serif" font-size="34" fill="#8a5a2b" opacity=".75">Sample photo — add yours in ⚙️</text>
        </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };
})();
