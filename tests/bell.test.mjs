import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function soundHarness() {
  const context = vm.createContext({ window: {} });
  vm.runInContext(readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8'), context);
  const sound = context.window.Advent.Sound;
  const oscillators = [];
  sound.theme = 'japan';
  sound.ctx = {
    state: 'running', currentTime: 10, sampleRate: 48000,
    createOscillator() {
      const o = { frequency: {}, connect() { return this; }, start(t) { this.started = t; }, stop(t) { this.stopped = t; } };
      oscillators.push(o); return o;
    },
    createGain() {
      return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() { return this; } };
    },
  };
  sound.master = {};
  sound.voiceTone = () => assert.fail('The physical bell must not use the Sakura voice instrument');
  return { sound, oscillators };
}

test('Sakura bell plays a single metallic strike with a ringing decay', () => {
  const { sound, oscillators } = soundHarness();
  sound.bell();
  assert.equal(oscillators.length, 3);
  assert.equal(oscillators[0].frequency.value, 880);
  assert.ok(oscillators[1].frequency.value / oscillators[0].frequency.value > 2.5);
  assert.ok(oscillators.every((o) => o.stopped - o.started > 3));
});

test('bell respects mute and audio availability, and allows another strike after its short cooldown', () => {
  const { sound, oscillators } = soundHarness();
  sound.enabled = false; sound.bell(); assert.equal(oscillators.length, 0);
  sound.enabled = true; sound.ctx.state = 'suspended'; sound.bell(); assert.equal(oscillators.length, 0);
  sound.ctx.state = 'running'; sound.bell(); sound.bell(); assert.equal(oscillators.length, 3);
  sound.ctx.currentTime += 0.3; sound.bell(); assert.equal(oscillators.length, 6);
});
