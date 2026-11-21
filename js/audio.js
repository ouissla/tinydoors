/* Warm Web Audio effects, with a related but distinct palette for each world.
   Door recordings have synthesised fallbacks for offline/file:// use. */
(function () {
  const A = (window.Advent = window.Advent || {});
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);
  // Most worlds use warm struck instruments; Space and Sakura have their own synthesis voices.
  const PALETTES = {
    snow:        { tune: 0,  decay: 1.05, air: 0.12, cutoff: 3200, knock: 1600, partials: [[1, 1], [2, 0.16], [3.01, 0.055]] },
    summer:      { tune: -1, decay: 0.7,  air: 0.08, cutoff: 2800, knock: 1250, partials: [[1, 1], [2.98, 0.12], [4, 0.025]] },
    gingerbread: { tune: -1, decay: 0.8,  air: 0.07, cutoff: 2600, knock: 1100, partials: [[1, 1], [2, 0.1], [3, 0.04]] },
    toys:        { tune: 1,  decay: 0.65, air: 0.1,  cutoff: 3000, knock: 1800, partials: [[1, 1], [2, 0.2], [4, 0.035]] },
    space:       { instrument: 'alien', tune: -4, decay: 0.65, air: 0.14, cutoff: 2600, knock: 1400, partials: [[1, 1], [1.5, 0.12], [2, 0.08]] },
    workshop:    { tune: -1, decay: 0.75, air: 0.08, cutoff: 2700, knock: 1350, partials: [[1, 1], [2.02, 0.18], [3, 0.035]] },
    jungle:      { tune: -2, decay: 0.8,  air: 0.1,  cutoff: 2600, knock: 1000, partials: [[1, 1], [2.75, 0.1], [4, 0.025]] },
    ocean:       { tune: 3, decay: 0.95, air: 0.16, cutoff: 2900, knock: 1150, partials: [[1, 1], [2.4, 0.12], [4.1, 0.03]] },
    japan:       { instrument: 'voice', tune: 5, decay: 0.2, air: 0.1, cutoff: 3800, knock: 1500, partials: [[1, 1], [2, 0.1], [3.8, 0.035]] },
    cyber:       { tune: -3, decay: 0.85, air: 0.12, cutoff: 2500, knock: 1900, partials: [[1, 1], [2, 0.24], [3, 0.06]] },
  };
  const MOTIFS = {
    chime: [[0, 4, 7, 12], [4, 7, 9, 12], [0, 7, 4, 12], [7, 4, 9, 12]],
    sparkle: [[12, 7, 9, 4, 7, 12], [7, 12, 9, 7, 4, 9], [9, 7, 4, 12, 9, 7], [4, 9, 7, 12, 7, 9]],
    fanfare: [[0, 4, 7, 12, 9, 7, 12], [0, 7, 9, 12, 7, 9, 12], [4, 7, 9, 12, 9, 7, 12]],
  };

  const WORLD_MOTIFS = {
    space: {
      chime: [[0, 7, 2, 9], [0, 2, 7, 14], [7, 2, 9, 0]],
      sparkle: [[14, 7, 2, 9, 0, 7], [9, 2, 14, 7, 0, 2]],
      fanfare: [[0, 2, 7, 9, 14, 9, 7], [0, 7, 2, 9, 7, 14, 12]],
    },
    japan: {
      chime: [[7, 12, 9, 12], [4, 7, 12, 7], [9, 7, 4, 12]],
      sparkle: [[12, 7, 12, 9, 7, 4], [7, 9, 12, 7, 4, 7]],
      fanfare: [[0, 7, 4, 9, 7, 12, 12], [4, 7, 12, 9, 7, 9, 12]],
    },
  };

  const S = {
    ctx: null,
    master: null,
    enabled: true,
    theme: 'snow',
    lastMotif: {},
    lastPlayed: {},
    palette() { return PALETTES[this.theme] || PALETTES.snow; },

    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      this.ctx = new C();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 18;
      comp.ratio.value = 4;
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.toneFilter = this.ctx.createBiquadFilter();
      this.toneFilter.type = 'lowpass';
      this.toneFilter.frequency.value = this.palette().cutoff;
      this.toneFilter.Q.value = 0.5;
      this.master.connect(this.toneFilter).connect(comp);
      comp.connect(this.ctx.destination);
      const len = Math.ceil(this.ctx.sampleRate * 1.5);
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.loadSamples();
    },

    SAMPLES: { knock: 'assets/sounds/door-knock.mp3', open: 'assets/sounds/door-whoosh.mp3' },
    // Keep the recording at its original speed: these times also drive the door jolts.
    KNOCK_TIMES: [0.02, 0.235, 0.455, 0.68],
    KNOCK_LENGTH: 0.85,
    buffers: {},
    loadSamples() {
      Object.entries(this.SAMPLES).forEach(([name, url]) => {
        fetch(url)
          .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
          .then((b) => new Promise((res, rej) => this.ctx.decodeAudioData(b, res, rej)))
          .then((buf) => { this.buffers[name] = buf; })
          .catch(() => { /* synthesised fallback */ });
      });
    },
    sample(name, vol = 0.9) {
      const buf = this.buffers[name];
      if (!buf || !this.ok()) return false;
      const p = this.palette();
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = name === 'knock' ? 1 : rand(0.88, 0.95) * Math.pow(2, p.tune / 48);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = (name === 'knock' ? p.knock : p.cutoff * 0.7) * rand(0.92, 1.08);
      filter.Q.value = 0.5;
      const g = this.ctx.createGain();
      g.gain.value = vol * rand(0.88, 1);
      src.connect(filter).connect(g).connect(this.master);
      src.start();
      return true;
    },

    knock() {
      if (!this.ok()) return;
      if (this.palette().instrument === 'alien') {
        const t = this.ctx.currentTime + 0.01;
        this.KNOCK_TIMES.forEach((k) => this.alienTone(rand(155, 185), t + k, 0.18, 0.12));
        return;
      }
      if (this.sample('knock', 0.85)) return;
      const t = this.ctx.currentTime + 0.01, p = this.palette();
      this.KNOCK_TIMES.forEach((k) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        const pitch = Math.pow(2, p.tune / 12) * rand(0.94, 1.06);
        o.frequency.setValueAtTime(170 * pitch, t + k);
        o.frequency.exponentialRampToValueAtTime(65 * pitch, t + k + 0.08);
        g.gain.setValueAtTime(0, t + k);
        g.gain.linearRampToValueAtTime(rand(0.32, 0.42), t + k + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, t + k + 0.12);
        o.connect(g).connect(this.master);
        o.start(t + k);
        o.stop(t + k + 0.15);
      });
    },
    doorOpen() {
      if (!this.ok()) return;
      const t = this.ctx.currentTime + 0.01;
      if (this.palette().instrument === 'alien') {
        this.whoosh(0.8, 1400, 180, 0.17);
        this.alienTone(165, t, 0.14, 0.65);
        this.alienTone(247, t + 0.18, 0.09, 0.5);
        return;
      }
      if (this.palette().instrument === 'voice') {
        this.whoosh(0.45, 900, 280, 0.1);
        this.voiceTone(620, t + 0.1, 0.12);
        this.voiceTone(780, t + 0.27, 0.1);
        return;
      }
      if (!this.sample('open', 0.72)) { this.creak(); this.whoosh(0.65, 180, 1200, 0.12); }
    },
    ok() {
      if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return false;
      if (this.toneFilter) this.toneFilter.frequency.setTargetAtTime(this.palette().cutoff, this.ctx.currentTime, 0.08);
      return true;
    },

    // Gentler attacks and quieter upper partials avoid the old piercing bell sound.
    strike(freq, t, vol, partials, dur) {
      const c = this.ctx;
      partials.forEach(([ratio, amp]) => {
        if (freq * ratio > Math.min(6000, c.sampleRate * 0.45)) return;
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine';
        o.frequency.value = freq * ratio;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol * amp, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur / Math.sqrt(ratio));
        o.connect(g).connect(this.master);
        o.start(t);
        o.stop(t + dur + 0.05);
      });
    },
    // Soft FM warbles: an inharmonic modulator, pitch drift and a gentle tremolo.
    alienTone(freq, t, vol, dur = 0.65) {
      const c = this.ctx, carrier = c.createOscillator(), mod = c.createOscillator();
      const depth = c.createGain(), amp = c.createGain(), trem = c.createOscillator(), tremDepth = c.createGain();
      const filter = c.createBiquadFilter(), envelope = c.createGain();
      carrier.frequency.setValueAtTime(freq * 0.82, t);
      carrier.frequency.exponentialRampToValueAtTime(freq * 1.08, t + dur * 0.35);
      carrier.frequency.exponentialRampToValueAtTime(freq, t + dur);
      mod.frequency.setValueAtTime(freq * rand(1.38, 1.44), t);
      depth.gain.setValueAtTime(freq * 0.85, t);
      depth.gain.exponentialRampToValueAtTime(freq * 0.06, t + dur);
      mod.connect(depth).connect(carrier.frequency);
      amp.gain.value = 0.72;
      trem.frequency.value = rand(7, 11);
      tremDepth.gain.value = 0.22;
      trem.connect(tremDepth).connect(amp.gain);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, t);
      filter.frequency.exponentialRampToValueAtTime(850, t + dur);
      filter.Q.value = 0.6;
      envelope.gain.setValueAtTime(0, t);
      envelope.gain.linearRampToValueAtTime(vol * 0.85, t + 0.015);
      envelope.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      carrier.connect(amp).connect(filter).connect(envelope).connect(this.master);
      [carrier, mod, trem].forEach((o) => { o.start(t); o.stop(t + dur + 0.03); });
    },
    // Original creature-like syllables, shaped with vowel resonances rather than a bell.
    voiceTone(freq, t, vol, dur = 0.2) {
      const c = this.ctx, o = c.createOscillator(), envelope = c.createGain();
      o.type = 'sawtooth';
      const bend = rand(0.92, 1.04);
      o.frequency.setValueAtTime(freq * 0.82, t);
      o.frequency.exponentialRampToValueAtTime(freq * 1.12, t + dur * 0.28);
      o.frequency.exponentialRampToValueAtTime(freq * bend, t + dur * 0.7);
      o.frequency.exponentialRampToValueAtTime(freq * 0.9, t + dur);
      // An "wa/ya" vowel sweep, with the upper formant kept quiet.
      [[rand(850, 1050), rand(1350, 1650), 0.48], [2100, 2600, 0.16]].forEach(([from, to, level]) => {
        const formant = c.createBiquadFilter(), mix = c.createGain();
        formant.type = 'bandpass';
        formant.Q.value = 2.5;
        formant.frequency.setValueAtTime(from, t);
        formant.frequency.exponentialRampToValueAtTime(to, t + dur * 0.55);
        mix.gain.value = level;
        o.connect(formant).connect(mix).connect(envelope);
      });
      const body = c.createBiquadFilter(), bodyGain = c.createGain();
      body.type = 'lowpass'; body.frequency.value = 950; body.Q.value = 0.5;
      bodyGain.gain.value = 0.25;
      o.connect(body).connect(bodyGain).connect(envelope);
      envelope.gain.setValueAtTime(0, t);
      envelope.gain.linearRampToValueAtTime(vol, t + 0.018);
      envelope.gain.linearRampToValueAtTime(vol * 0.55, t + dur * 0.55);
      envelope.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      envelope.connect(this.master);
      o.start(t); o.stop(t + dur + 0.025);
    },
    note(freq, t, vol = 0.18) {
      const p = this.palette();
      if (p.instrument === 'alien') return this.alienTone(freq, t, vol, p.decay);
      if (p.instrument === 'voice') return this.voiceTone(freq, t, vol, p.decay);
      this.strike(freq, t, vol, p.partials, p.decay);
    },
    melody(kind, count, gap, vol, root) {
      if (!this.ok()) return;
      const t = this.ctx.currentTime + 0.01;
      // Coalesce rapid taps instead of stacking long tails of the same effect.
      if (t - (this.lastPlayed[kind] ?? -Infinity) < (kind === 'fanfare' ? 0.6 : 0.18)) return;
      this.lastPlayed[kind] = t;
      const choices = (WORLD_MOTIFS[this.theme] || MOTIFS)[kind], key = this.theme + ':' + kind;
      const previous = this.lastMotif[key];
      let index = (Math.random() * choices.length) | 0;
      if (index === previous) index = (index + 1) % choices.length;
      this.lastMotif[key] = index;
      const notes = choices[index], p = this.palette();
      const tuning = Math.pow(2, (p.tune + rand(-0.08, 0.08)) / 12);
      const spacing = gap * rand(0.94, 1.06) * (p.instrument === 'voice' ? 1.3 : p.instrument === 'alien' ? 1.15 : 1);
      for (let i = 0; i < count; i++) {
        const freq = root * tuning * Math.pow(2, notes[i % notes.length] / 12);
        this.note(freq, t + i * spacing, vol * rand(0.88, 1) * (1 - 0.2 * i / count));
      }
      if (kind === 'fanfare') this.note(root * tuning / 2, t + count * spacing, vol * 0.65);
    },
    // A single struck wind bell, independent of each world's musical instrument.
    bell() {
      if (!this.ok()) return;
      const t = this.ctx.currentTime + 0.01;
      if (t - (this.lastPlayed.bell ?? -Infinity) < 0.25) return;
      this.lastPlayed.bell = t;
      this.strike(880, t, 0.18, [[1, 1], [2.76, 0.38], [5.4, 0.12]], 3.2);
    },
    chime() { this.melody('chime', 4, 0.115, 0.16, 329.63); },
    sparkle(n = 6) { this.melody('sparkle', Math.max(1, Math.min(12, n)), 0.085, 0.065, 392); },
    fanfare() { this.melody('fanfare', 7, 0.15, 0.18, 329.63); },

    creak() {
      if (!this.ok()) return;
      const c = this.ctx, t = c.currentTime + 0.01, p = this.palette();
      const o = c.createOscillator();
      o.type = 'sawtooth';
      const pitch = Math.pow(2, p.tune / 12) * rand(0.94, 1.06);
      o.frequency.setValueAtTime(65 * pitch, t);
      o.frequency.linearRampToValueAtTime(95 * pitch, t + 0.25);
      o.frequency.linearRampToValueAtTime(72 * pitch, t + 0.5);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = p.knock * 0.45;
      bp.Q.value = 1.8;
      const am = c.createGain();
      am.gain.value = 0.55;
      const lfo = c.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(rand(17, 21), t);
      lfo.frequency.linearRampToValueAtTime(rand(28, 34), t + 0.5);
      const lg = c.createGain();
      lg.gain.value = 0.25;
      lfo.connect(lg).connect(am.gain);
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.05);
      g.gain.linearRampToValueAtTime(0.1, t + 0.4);
      g.gain.linearRampToValueAtTime(0, t + 0.58);
      o.connect(bp).connect(am).connect(g).connect(this.master);
      o.start(t); lfo.start(t);
      o.stop(t + 0.6); lfo.stop(t + 0.6);
    },
    whoosh(dur = 0.6, from = 300, to = 2600, vol = 0.25) {
      if (!this.ok()) return;
      const c = this.ctx, t = c.currentTime + 0.01, p = this.palette();
      const src = c.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 0.65;
      const pitch = Math.pow(2, p.tune / 12) * rand(0.9, 1);
      bp.frequency.setValueAtTime(Math.max(60, from * pitch * 0.7), t);
      bp.frequency.exponentialRampToValueAtTime(Math.max(60, to * pitch * 0.7), t + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * p.air * 5 * rand(0.9, 1), t + dur * 0.4);
      g.gain.linearRampToValueAtTime(0, t + dur);
      src.connect(bp).connect(g).connect(this.master);
      src.start(t, rand(0, 0.5));
      src.stop(t + dur + 0.05);
    },
    pop(f0 = 700, f1 = 140, vol = 0.3) {
      if (!this.ok()) return;
      const c = this.ctx, t = c.currentTime + 0.01;
      const p = this.palette();
      if (p.instrument === 'alien') return this.alienTone(Math.max(95, Math.min(650, Math.sqrt(f0 * f1))), t, vol * 0.7, 0.22);
      if (p.instrument === 'voice') return this.voiceTone(Math.max(280, Math.min(1000, Math.sqrt(f0 * f1) * 1.4)), t, vol * 0.85, 0.18);
      const pitch = 0.75 * Math.pow(2, this.palette().tune / 12) * rand(0.96, 1.04);
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(f0 * pitch, t);
      o.frequency.exponentialRampToValueAtTime(f1 * pitch, t + 0.14);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * rand(0.85, 1), t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + 0.22);
    },
    thunk() { this.pop(160, 55, 0.35); },
    boom() {
      if (!this.ok()) return;
      this.whoosh(0.35, 600, 160, 0.18);
      this.pop(240, 45, 0.3);
      setTimeout(() => this.sparkle(4), 120);
    },
  };
  A.Sound = S;
})();
