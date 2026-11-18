/* Every sound is synthesised with Web Audio — no audio files to license or download. */
(function () {
  const A = (window.Advent = window.Advent || {});

  const S = {
    ctx: null,
    master: null,
    enabled: true,
    theme: 'snow',

    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      this.ctx = new C();
      const comp = this.ctx.createDynamicsCompressor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.6;
      this.master.connect(comp);
      comp.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 1.5;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    },

    ok() {
      return this.enabled && this.ctx && this.ctx.state === 'running';
    },

    // A struck tone built from partials: bells (snow) or marimba (summer).
    strike(freq, t, vol, partials, dur) {
      const c = this.ctx;
      partials.forEach(([ratio, amp]) => {
        if (freq * ratio > 18000) return; // inaudible, and above some devices' range
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = 'sine';
        o.frequency.value = freq * ratio;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol * amp, t + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur / Math.sqrt(ratio));
        o.connect(g).connect(this.master);
        o.start(t);
        o.stop(t + dur + 0.1);
      });
    },

    note(freq, t, vol = 0.25) {
      if (this.theme === 'summer') this.strike(freq, t, vol, [[1, 1], [3.95, 0.3], [9.2, 0.06]], 0.9);
      else this.strike(freq, t, vol, [[1, 1], [2.76, 0.45], [5.4, 0.22], [8.93, 0.1]], 2.2);
    },

    chime() {
      if (!this.ok()) return;
      const t = this.ctx.currentTime + 0.01;
      const base = this.theme === 'summer' ? [523.25, 659.25, 783.99, 1046.5] : [1046.5, 1318.5, 1568, 2093];
      base.forEach((f, i) => this.note(f, t + i * 0.085, 0.22));
    },

    sparkle(n = 6) {
      if (!this.ok()) return;
      const t = this.ctx.currentTime + 0.01;
      const scale = [2093, 2349, 2637, 3136, 3520, 4186];
      for (let i = 0; i < n; i++) this.note(scale[(Math.random() * scale.length) | 0], t + i * 0.055, 0.07);
    },

    fanfare() {
      if (!this.ok()) return;
      const t = this.ctx.currentTime + 0.01;
      const seq = this.theme === 'summer'
        ? [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5]
        : [783.99, 1046.5, 1318.5, 1568, 1318.5, 1568, 2093];
      seq.forEach((f, i) => this.note(f, t + i * 0.12, 0.22));
      this.strike(seq[0] / 2, t + seq.length * 0.12, 0.2, [[1, 1], [2, 0.4], [3, 0.2]], 2.5);
    },

    creak() {
      if (!this.ok()) return;
      const c = this.ctx, t = c.currentTime + 0.01;
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(70, t);
      o.frequency.linearRampToValueAtTime(110, t + 0.25);
      o.frequency.linearRampToValueAtTime(80, t + 0.5);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = this.theme === 'summer' ? 1100 : 750;
      bp.Q.value = 5;
      // Stick-slip flutter of an old hinge.
      const am = c.createGain();
      am.gain.value = 0.5;
      const lfo = c.createOscillator();
      lfo.type = 'square';
      lfo.frequency.setValueAtTime(20, t);
      lfo.frequency.linearRampToValueAtTime(36, t + 0.5);
      const lg = c.createGain();
      lg.gain.value = 0.5;
      lfo.connect(lg).connect(am.gain);
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.22, t + 0.05);
      g.gain.linearRampToValueAtTime(0.14, t + 0.4);
      g.gain.linearRampToValueAtTime(0, t + 0.58);
      o.connect(bp).connect(am).connect(g).connect(this.master);
      o.start(t); lfo.start(t);
      o.stop(t + 0.6); lfo.stop(t + 0.6);
    },

    whoosh(dur = 0.6, from = 300, to = 2600, vol = 0.25) {
      if (!this.ok()) return;
      const c = this.ctx, t = c.currentTime + 0.01;
      const src = c.createBufferSource();
      src.buffer = this.noise;
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(from, t);
      bp.frequency.exponentialRampToValueAtTime(to, t + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + dur * 0.4);
      g.gain.linearRampToValueAtTime(0, t + dur);
      src.connect(bp).connect(g).connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.05);
    },

    pop(f0 = 700, f1 = 140, vol = 0.3) {
      if (!this.ok()) return;
      const c = this.ctx, t = c.currentTime + 0.01;
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + 0.12);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + 0.2);
    },

    thunk() {
      this.pop(160, 55, 0.4);
    },

    boom() {
      if (!this.ok()) return;
      this.whoosh(0.35, 800, 200, 0.18);
      this.pop(300, 40, 0.35);
      setTimeout(() => this.sparkle(4), 120);
    },
  };

  A.Sound = S;
})();
