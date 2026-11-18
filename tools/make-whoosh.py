#!/usr/bin/env python3
"""Generate the door-opening "magic whoosh" from scratch (no samples, so it's ours to use).

Shape (modelled on a reference whoosh, but synthesised independently):
  1. Rush   0.00-0.60s  filtered noise swelling and sweeping upwards, panning left -> right, with low body
  2. Sparkle 0.42s-     bell-like tones entering one after another (rising), with vibrato and a pulsing
                        shimmer, plus a dusting of high "glitter" ticks, fading over ~2.3s

Usage:  python3 tools/make-whoosh.py out.wav   (then encode, e.g. ffmpeg -i out.wav -b:a 160k door-whoosh.mp3)
Pure Python, standard library only.
"""
import math
import random
import struct
import sys
import wave

SR = 44100
LENGTH = 3.4  # seconds
N = int(SR * LENGTH)
rng = random.Random(1225)

left = [0.0] * N
right = [0.0] * N


def env_adsr(t, attack, peak_at, decay_to_zero):
    """Smooth swell up to `peak_at`, then a curved fade reaching zero at `decay_to_zero`."""
    if t < 0:
        return 0.0
    if t < attack:
        return (t / attack) ** 2 * (peak_at and 1.0)
    if t >= decay_to_zero:
        return 0.0
    k = (t - attack) / (decay_to_zero - attack)
    return (1 - k) ** 2.2


# ---------------- 1. The rush ----------------
class Biquad:
    """RBJ band-pass (constant 0 dB peak gain); coefficients can change over time."""

    def __init__(self):
        self.x1 = self.x2 = self.y1 = self.y2 = 0.0
        self.set(500, 1.0)

    def set(self, f, q):
        w = 2 * math.pi * f / SR
        alpha = math.sin(w) / (2 * q)
        a0 = 1 + alpha
        self.b0, self.b1, self.b2 = alpha / a0, 0.0, -alpha / a0
        self.a1, self.a2 = -2 * math.cos(w) / a0, (1 - alpha) / a0

    def __call__(self, x):
        y = self.b0 * x + self.b1 * self.x1 + self.b2 * self.x2 - self.a1 * self.y1 - self.a2 * self.y2
        self.x2, self.x1, self.y2, self.y1 = self.x1, x, self.y1, y
        return y


class OnePoleLP:
    def __init__(self, f):
        self.a = math.exp(-2 * math.pi * f / SR)
        self.y = 0.0

    def __call__(self, x):
        self.y = (1 - self.a) * x + self.a * self.y
        return self.y


# pink-ish noise (Paul Kellet's economy filter)
b0 = b1 = b2 = 0.0
bands = [Biquad(), Biquad(), Biquad()]
body = Biquad()
body.set(150, 0.8)
body_hp = Biquad()
body_hp.set(240, 0.7)
air = Biquad()
class HighPass(Biquad):
    def set(self, f, q):
        w = 2 * math.pi * f / SR
        alpha = math.sin(w) / (2 * q)
        a0 = 1 + alpha
        c = math.cos(w)
        self.b0, self.b1, self.b2 = (1 + c) / 2 / a0, -(1 + c) / a0, (1 + c) / 2 / a0
        self.a1, self.a2 = -2 * c / a0, (1 - alpha) / a0


rumble_cut, rumble_cut2 = HighPass(), HighPass()
rumble_cut.set(85, 0.707)
rumble_cut2.set(85, 0.707)  # phone speakers can't play it anyway; keeps headroom for the whoosh
RUSH_END = 0.62
for i in range(int(SR * RUSH_END)):
    t = i / SR
    white = rng.uniform(-1, 1)
    b0 = 0.99765 * b0 + white * 0.0990460
    b1 = 0.96300 * b1 + white * 0.2965164
    b2 = 0.57000 * b2 + white * 1.0526913
    pink = (b0 + b1 + b2 + white * 0.1848) * 0.25
    k = t / RUSH_END
    if i % 32 == 0:
        sweep = 1 + 1.3 * k ** 1.4  # the whole rush rises as it passes
        bands[0].set(280 * sweep, 2.2)
        bands[1].set(600 * sweep, 2.6)
        bands[2].set(1500 * sweep, 1.2)
        air.set(5200 + 2500 * k, 0.9)
    whoosh = bands[0](pink) * 1.0 + bands[1](pink) * 0.8 + bands[2](pink) * 0.35 + air(pink) * 0.5
    low = (body(pink) * 1.5 + body_hp(pink) * 0.9) * 1.9
    # swell: fast in, peak ~0.16s, gone by RUSH_END
    e = (t / 0.16) ** 1.6 if t < 0.16 else max(0.0, 1 - (t - 0.16) / (RUSH_END - 0.16)) ** 1.6
    # a little airflow flutter
    e *= 0.85 + 0.15 * math.sin(2 * math.pi * 23 * t + 1.3 * math.sin(2 * math.pi * 7 * t))
    s = rumble_cut2(rumble_cut((whoosh * 2.6 + low) * e))
    pan = min(1.0, max(0.0, (t - 0.03) / 0.5))  # left -> right as it flies past
    left[i] += s * math.cos(pan * math.pi / 2) * 1.25
    right[i] += s * math.sin(pan * math.pi / 2) * 1.25

# ---------------- 2. The sparkle ----------------
# (freq Hz, entry s, level, decay s, pan) — a bright C-major-9 shimmer that climbs as it enters
NOTES = [
    (523.25, 0.40, 0.55, 2.1, 0.45),   # C5  — warm core, pulses
    (783.99, 0.44, 0.34, 1.9, 0.30),   # G5
    (880.00, 0.50, 0.30, 1.8, 0.65),   # A5
    (1046.5, 0.47, 0.42, 1.9, 0.55),   # C6
    (1174.7, 0.58, 0.22, 1.6, 0.35),   # D6
    (1318.5, 0.66, 0.20, 1.5, 0.70),   # E6
    (2093.0, 0.48, 0.30, 1.9, 0.50),   # C7
    (2637.0, 0.56, 0.20, 1.6, 0.25),   # E7
    (3136.0, 0.62, 0.20, 1.5, 0.80),   # G7
    (3520.0, 0.72, 0.14, 1.3, 0.40),   # A7
    (3951.1, 0.80, 0.13, 1.2, 0.65),   # B7
    (4186.0, 0.88, 0.12, 1.1, 0.20),   # C8
]
for f, start, level, decay, pan in NOTES:
    a = int(start * SR)
    vib_rate = 5.2 + rng.random() * 1.2
    vib_depth = 0.0025 + rng.random() * 0.0015
    trem_rate = 4.6 if f < 600 else 6.5 + rng.random() * 2
    trem_depth = 0.55 if f < 600 else 0.18
    phase = rng.random() * 2 * math.pi
    lg, rg = math.cos(pan * math.pi / 2), math.sin(pan * math.pi / 2)
    decay *= 1.35  # the shimmer hangs on a little longer
    if f >= 2000:
        level *= 2.1  # brighter top bells
    end = min(N, a + int((decay + 0.05) * SR))
    for i in range(a, end):
        t = (i - a) / SR
        att = min(1.0, t / 0.025)
        e = att * math.exp(-t * 4.2 / decay) * (1 - t / (decay + 0.05))
        if e <= 0:
            continue
        phase += 2 * math.pi * f * (1 + vib_depth * math.sin(2 * math.pi * vib_rate * t)) / SR
        trem = 1 - trem_depth * (0.5 + 0.5 * math.sin(2 * math.pi * trem_rate * t))
        v = (math.sin(phase) + 0.18 * math.sin(2 * phase + 0.7)) * level * e * trem
        left[i] += v * lg
        right[i] += v * rg

# Glitter: tiny bright ticks scattered through the sparkle, thinning out
hp_state = 0.0
for k in range(90):
    t0 = 0.45 + (rng.random() ** 1.7) * 2.3
    a = int(t0 * SR)
    f = 5000 + rng.random() * 6000
    amp = 0.09 * max(0.0, 1 - (t0 - 0.45) / 2.4)
    pan = rng.random()
    for j in range(int(0.012 * SR)):
        i = a + j
        if i >= N:
            break
        att = min(1.0, j / (0.0015 * SR))
        v = math.sin(2 * math.pi * f * j / SR) * amp * att * math.exp(-j / (0.004 * SR))
        left[i] += v * math.cos(pan * math.pi / 2)
        right[i] += v * math.sin(pan * math.pi / 2)

# ---------------- Master: gentle fade-out, normalise to -1 dBFS ----------------
fade = int(0.25 * SR)
for i in range(N - fade, N):
    g = (N - i) / fade
    left[i] *= g
    right[i] *= g
peak = max(max(abs(v) for v in left), max(abs(v) for v in right))
gain = (10 ** (-1 / 20)) / peak
out = wave.open(sys.argv[1] if len(sys.argv) > 1 else 'door-whoosh.wav', 'w')
out.setnchannels(2)
out.setsampwidth(2)
out.setframerate(SR)
frames = bytearray()
for l, r in zip(left, right):
    frames += struct.pack('<hh', int(max(-1, min(1, l * gain)) * 32767), int(max(-1, min(1, r * gain)) * 32767))
out.writeframes(bytes(frames))
out.close()
print(f'wrote {LENGTH}s stereo, gain {gain:.2f}')
