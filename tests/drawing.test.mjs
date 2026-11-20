import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function boot() {
  const context = vm.createContext({ location: { search: '' }, navigator: { languages: ['en'] }, document: { documentElement: {} }, localStorage: { getItem() {}, setItem() {} }, URL, URLSearchParams });
  context.window = context;
  for (const file of ['i18n.js', 'drawing.js']) vm.runInContext(readFileSync(new URL('../js/' + file, import.meta.url), 'utf8'), context);
  return context.Advent.Drawing;
}

test('drawings keep their stroke timing so the replay follows how they were drawn', () => {
  const D = boot();
  const [a, b] = D.clean([
    { c: '#26334a', w: 14, p: [0, 0, 10, 10, 20, 20], t: 0, d: [0, 40, 90] },
    { c: '#d22f4a', w: 6, p: [5, 5], t: 3000, d: [0] },
  ]);
  assert.equal(a.t, 0);
  assert.deepEqual([...a.d], [0, 40, 90]);
  assert.equal(b.t, 3000);
});

test('bad or partial timing falls back to a steady replay instead of breaking it', () => {
  const D = boot();
  const steady = (strokes) => D.clean(strokes).every((s) => !('t' in s) && !('d' in s));
  const ok = { c: '#26334a', w: 14, p: [0, 0, 10, 10], t: 0, d: [0, 20] };
  assert.ok(steady([ok, { c: '#26334a', w: 14, p: [1, 1] }]), 'one stroke without timing');
  assert.ok(steady([{ ...ok, d: [30, 10] }]), 'time running backwards');
  assert.ok(steady([{ ...ok, d: [0] }]), 'timing for fewer points than drawn');
  assert.ok(steady([{ ...ok, t: 500 }, { ...ok, t: 100 }]), 'strokes out of order');
  assert.ok(steady([{ ...ok, t: 'soon' }]), 'non-numeric start');
});

test('strokes outside the palette, pen sizes or canvas are cleaned', () => {
  const D = boot();
  const out = D.clean([
    { c: 'url(x)', w: 14, p: [0, 0] },
    { c: '#26334a', w: 99, p: [0, 0] },
    { c: '#26334a', w: 6, p: [-50, 9000, 2000, 10] },
  ]);
  assert.equal(out.length, 1);
  assert.deepEqual([...out[0].p], [0, 750, 1000, 10]);
});
