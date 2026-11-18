/* Canvas particles: ambient weather (snow / summer glints) and celebration bursts. */
(function () {
  const A = (window.Advent = window.Advent || {});
  const TAU = Math.PI * 2;

  const PALETTES = {
    snow: ['#ffd36b', '#ffffff', '#ff6b5e', '#a8e4ff', '#86e3ad', '#ffe9a8'],
    summer: ['#ff6f91', '#ffd23f', '#2ec4b6', '#9b5de5', '#00bbf9', '#ffffff', '#ff9f1c'],
  };

  function sprite(size, draw) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const x = c.getContext('2d');
    draw(x, size);
    return c;
  }

  const flake = sprite(64, (x, s) => {
    x.translate(s / 2, s / 2);
    x.strokeStyle = '#fff';
    x.lineCap = 'round';
    x.lineWidth = 3.2;
    x.shadowColor = 'rgba(180,220,255,.9)';
    x.shadowBlur = 6;
    for (let i = 0; i < 6; i++) {
      x.rotate(TAU / 6);
      x.beginPath();
      x.moveTo(0, 0); x.lineTo(0, -26);
      x.moveTo(0, -12); x.lineTo(-7, -19);
      x.moveTo(0, -12); x.lineTo(7, -19);
      x.moveTo(0, -20); x.lineTo(-4, -25);
      x.moveTo(0, -20); x.lineTo(4, -25);
      x.stroke();
    }
  });

  const glow = sprite(64, (x, s) => {
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,240,1)');
    g.addColorStop(0.25, 'rgba(255,236,170,.75)');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
  });

  function flower(color) {
    return sprite(64, (x, s) => {
      x.translate(s / 2, s / 2);
      x.fillStyle = color;
      for (let i = 0; i < 5; i++) {
        x.rotate(TAU / 5);
        x.beginPath();
        x.ellipse(0, -13, 9, 14, 0, 0, TAU);
        x.fill();
      }
      x.fillStyle = '#ffd23f';
      x.beginPath(); x.arc(0, 0, 6, 0, TAU); x.fill();
    });
  }
  const flowers = ['#ff4f81', '#ff9f1c', '#ffffff'].map(flower);

  function starPath(ctx, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r;
      const a = (i / 10) * TAU - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  const FX = {
    theme: 'snow',
    tiltX: 0,
    tiltY: 0,
    ambient: [],
    parts: [],
    dpr: Math.min(window.devicePixelRatio || 1, 2),

    init(ambientCanvas, fxCanvas) {
      this.ac = ambientCanvas;
      this.fc = fxCanvas;
      this.a = ambientCanvas.getContext('2d');
      this.f = fxCanvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
      let last = performance.now();
      const tick = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        this.step(dt, now / 1000);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },

    resize() {
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      [this.ac, this.fc].forEach((c) => {
        c.width = this.w * this.dpr;
        c.height = this.h * this.dpr;
      });
      this.a.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.f.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.seedAmbient();
    },

    setTheme(t) {
      this.theme = t;
      this.seedAmbient();
    },

    seedAmbient() {
      const area = this.w * this.h;
      const n = this.theme === 'snow'
        ? Math.min(170, Math.round(area / 8000))
        : Math.min(55, Math.round(area / 26000));
      const count = A.reducedMotion ? Math.round(n / 4) : n;
      this.ambient = [];
      for (let i = 0; i < count; i++) this.ambient.push(this.newMote(true));
    },

    newMote(anywhere) {
      const z = Math.random();
      if (this.theme === 'snow') {
        return {
          x: Math.random() * this.w,
          y: anywhere ? Math.random() * this.h : -10,
          z,
          r: 0.7 + z * 2.8,
          vy: 18 + z * 55,
          ph: Math.random() * TAU,
          sw: 8 + z * 22,
          big: z > 0.88,
        };
      }
      return {
        x: Math.random() * this.w,
        y: anywhere ? Math.random() * this.h : this.h + 10,
        z,
        r: 4 + z * 10,
        vy: -(6 + z * 16),
        ph: Math.random() * TAU,
        sw: 10 + z * 20,
      };
    },

    step(dt, t) {
      const a = this.a, f = this.f;
      a.clearRect(0, 0, this.w, this.h);
      const tx = this.tiltX, ty = this.tiltY;

      // Ambient
      for (const m of this.ambient) {
        m.y += m.vy * dt;
        const ox = Math.sin(t * 0.8 + m.ph) * m.sw + tx * 30 * m.z;
        const oy = ty * 16 * m.z;
        if (this.theme === 'snow') {
          if (m.y > this.h + 10) Object.assign(m, this.newMote(false));
          if (m.big) {
            const s = m.r * 4.2;
            a.globalAlpha = 0.85;
            a.save();
            a.translate(m.x + ox, m.y + oy);
            a.rotate(t * 0.4 + m.ph);
            a.drawImage(flake, -s / 2, -s / 2, s, s);
            a.restore();
          } else {
            a.globalAlpha = 0.35 + m.z * 0.55;
            a.fillStyle = '#fff';
            a.beginPath();
            a.arc(m.x + ox, m.y + oy, m.r, 0, TAU);
            a.fill();
          }
        } else {
          if (m.y < -20) Object.assign(m, this.newMote(false));
          const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.6 + m.ph));
          a.globalAlpha = tw * (0.35 + m.z * 0.5);
          const s = m.r * 2;
          a.drawImage(glow, m.x + ox - s / 2, m.y + oy - s / 2, s, s);
        }
      }
      a.globalAlpha = 1;

      // Bursts
      f.clearRect(0, 0, this.w, this.h);
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        if (p.delay > 0) { p.delay -= dt; continue; }
        p.life += dt;
        if (p.life >= p.max) { this.parts.splice(i, 1); continue; }
        p.vx *= Math.pow(p.drag, dt * 60);
        p.vy = p.vy * Math.pow(p.drag, dt * 60) + 900 * p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        const k = p.life / p.max;
        f.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
        f.save();
        f.translate(p.x, p.y);
        f.rotate(p.rot);
        const s = p.size;
        switch (p.kind) {
          case 'rect':
            f.scale(1, Math.cos(p.life * 9 + p.rot));
            f.fillStyle = p.color;
            f.fillRect(-s / 2, -s / 4, s, s / 2);
            break;
          case 'circle':
            f.fillStyle = p.color;
            f.beginPath(); f.arc(0, 0, s / 3, 0, TAU); f.fill();
            break;
          case 'star':
            f.fillStyle = p.color;
            starPath(f, s / 2);
            f.fill();
            break;
          case 'spark':
            f.globalCompositeOperation = 'lighter';
            f.drawImage(glow, -s, -s, s * 2, s * 2);
            f.globalCompositeOperation = 'source-over';
            break;
          default:
            f.drawImage(p.img, -s / 2, -s / 2, s, s);
        }
        f.restore();
      }
      f.globalAlpha = 1;
    },

    pickKind() {
      const r = Math.random();
      if (this.theme === 'snow') {
        if (r < 0.32) return { kind: 'img', img: flake };
        if (r < 0.55) return { kind: 'star' };
        if (r < 0.72) return { kind: 'spark' };
        if (r < 0.86) return { kind: 'circle' };
        return { kind: 'rect' };
      }
      if (r < 0.42) return { kind: 'rect' };
      if (r < 0.62) return { kind: 'img', img: flowers[(Math.random() * flowers.length) | 0] };
      if (r < 0.76) return { kind: 'star' };
      if (r < 0.88) return { kind: 'spark' };
      return { kind: 'circle' };
    },

    burst(x, y, opts = {}) {
      const count = Math.round((opts.count || 90) * (A.reducedMotion ? 0.3 : 1));
      const power = opts.power || 1;
      const pal = PALETTES[this.theme];
      for (let i = 0; i < count; i++) {
        const ang = opts.angle != null
          ? opts.angle + (Math.random() - 0.5) * (opts.spread || 1.4)
          : Math.random() * TAU;
        const sp = (220 + Math.random() * 520) * power;
        const k = this.pickKind();
        this.parts.push({
          x, y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - (opts.lift != null ? opts.lift : 260) * power,
          rot: Math.random() * TAU,
          vr: (Math.random() - 0.5) * 10,
          size: (k.kind === 'img' ? 16 + Math.random() * 18 : 7 + Math.random() * 10) * (opts.scale || 1),
          life: 0,
          max: 1.4 + Math.random() * 1.3,
          drag: 0.955,
          g: opts.g != null ? opts.g : 0.55,
          color: pal[(Math.random() * pal.length) | 0],
          delay: (opts.stagger || 0) * Math.random(),
          ...k,
        });
      }
    },

    fireworks(n, onEach) {
      for (let i = 0; i < n; i++) {
        setTimeout(() => {
          const x = this.w * (0.15 + Math.random() * 0.7);
          const y = this.h * (0.12 + Math.random() * 0.35);
          this.burst(x, y, { count: 70, power: 0.9, lift: 40, g: 0.3 });
          onEach && onEach(i);
        }, i * 420 + Math.random() * 200);
      }
    },

    // A big flurry from the top of the screen — used for "shake your phone".
    flurry() {
      for (let i = 0; i < 70; i++) {
        const k = this.theme === 'snow' ? { kind: 'img', img: flake } : this.pickKind();
        this.parts.push({
          x: Math.random() * this.w,
          y: -20 - Math.random() * 120,
          vx: (Math.random() - 0.5) * 80,
          vy: 120 + Math.random() * 200,
          rot: Math.random() * TAU,
          vr: (Math.random() - 0.5) * 4,
          size: 14 + Math.random() * 18,
          life: 0,
          max: 3 + Math.random() * 1.5,
          drag: 0.99,
          g: 0.08,
          color: PALETTES[this.theme][i % PALETTES[this.theme].length],
          delay: Math.random() * 0.6,
          ...k,
        });
      }
    },
  };

  A.FX = FX;
})();
