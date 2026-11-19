import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function formHarness(send) {
  const elements = new Map(), timers = new Map();
  let now = 1000, timer = 0;
  const element = id => {
    if (!elements.has(id)) elements.set(id, { value: 'creator@example.test', events: {},
      addEventListener(name, fn) { this.events[name] = fn; },
      setAttribute(name, value) { this[name] = value; },
    });
    return elements.get(id);
  };
  const context = vm.createContext({
    window: { Advent: { I18n: { t: (text, args) => text.replace('{seconds}', args?.seconds) } } },
    document: { getElementById: element, addEventListener() {} },
    location: { protocol: 'file:' },
    Date: class extends Date { static now() { return now; } },
    setInterval(fn) { timers.set(++timer, fn); return timer; },
    clearInterval(id) { timers.delete(id); },
  });
  vm.runInContext(readFileSync(new URL('../js/auth.js', import.meta.url), 'utf8'), context);
  context.window.Advent.Auth.signIn = send;
  return { element, submit: () => element('accountForm').events.submit({ preventDefault() {} }),
    advance(ms) { now += ms; for (const fn of timers.values()) fn(); } };
}

test('only one sign-in request is sent while an email request is pending', async () => {
  let calls = 0, finish;
  const harness = formHarness(() => { calls++; return new Promise(resolve => { finish = resolve; }); });
  const first = harness.submit();
  await harness.submit();
  assert.equal(calls, 1);
  finish(); await first;
  await harness.submit();
  assert.equal(calls, 1);
  assert.equal(harness.element('sendMagicLink').disabled, true);
});

test('429 explains the delivery limit and prevents repeated requests during cooldown', async () => {
  let calls = 0;
  const harness = formHarness(async () => { calls++; throw { status: 429, code: 'over_email_send_rate_limit' }; });
  await harness.submit();
  assert.match(harness.element('accountMessage').textContent, /temporarily limited/);
  assert.equal(harness.element('accountMessage').role, 'alert');
  assert.equal(harness.element('sendMagicLink').disabled, true);
  await harness.submit(); assert.equal(calls, 1);
  harness.advance(60000);
  assert.equal(harness.element('sendMagicLink').disabled, false);
  await harness.submit(); assert.equal(calls, 2);
});

test('ordinary send errors allow the user to correct their address and retry', async () => {
  const harness = formHarness(async () => { throw { status: 400 }; });
  await harness.submit();
  assert.match(harness.element('accountMessage').textContent, /Check your email address/);
  assert.equal(harness.element('sendMagicLink').disabled, false);
});
