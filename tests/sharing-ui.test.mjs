import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/editor.js', import.meta.url), 'utf8');
const handlers = source.slice(source.indexOf('  function renderCheckoutButton()'), source.indexOf("  $('guestSave').addEventListener"));
function sharingUI({ limit = 5, used = 0, active = true, allocated = false, premium = true, photos = 0, guest = false, failActivation = false } = {}) {
  const nodes = new Map();
  const $ = id => {
    if (!nodes.has(id)) nodes.set(id, { dataset: {}, attrs: {}, listeners: {}, value: '', hidden: false,
      setAttribute(k, v) { this.attrs[k] = v; }, querySelectorAll() { return []; },
      addEventListener(k, v) { this.listeners[k] = v; } });
    return nodes.get(id);
  };
  const state = { activations: 0, shares: 0, saves: 0, failActivation, requests: [], allocated, used };
  const context = vm.createContext({ $, URL, Date, clearTimeout() {},
    A: { DB: { isCloud: true, isGuest: guest, async shareCalendar() { state.shares++; return 'private-token'; } },
      THEMES: { snow: { premium: false, emblem: 'snow' }, cyber: { premium: true, emblem: 'city' } },
      I18n: { locale: 'en', url: path => 'https://example.test/' + path }, startDay: () => 1, dayInterval: () => 1,
      Auth: { user: guest ? null : { id: 'creator' }, config: { checkoutAvailable: true }, async request(path, options) {
        state.requests.push(path);
        if (path === '/api/season-pass') {
          state.activations++;
          assert.equal(options.method, 'POST');
          assert.equal(JSON.parse(options.body).calendarId, 'calendar1234');
          if (state.failActivation) throw new Error('Please try again.');
          if (!state.allocated) { state.used++; state.allocated = true; }
          return { ok: true };
        }
        if (path.startsWith('/api/season-pass?')) return { active, limit, used: state.used, remaining: limit - state.used, calendars: state.allocated ? ['calendar1234'] : [] };
        throw new Error('Unexpected checkout request');
      } },
    },
    tr: (text, values = {}) => text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match), esc: text => text,
    priceLabel: () => 'A$6.99', seasonPass: null, checkoutBusy: false, cal: { id: 'calendar1234', year: 2090, plan: 'free', theme: premium ? 'cyber' : 'snow', days: Array(24).fill({}), to: 'Friend', tz: 'Australia/Sydney' },
    FREE_PHOTOS: 3, photoCount: () => photos, personalCount: () => 0, shareToken: null, saveT: null, step: 'share',
    persist: async () => { state.saves++; }, updatePassNotice() {}, toast() {}, promptSignIn() {},
    location: { assign() { throw new Error('Must not navigate to checkout'); } }, window: { addEventListener() {} },
  });
  vm.runInContext('const hasPass = () => cal.plan === "season"; const needsPass = () => !hasPass() && (A.THEMES[cal.theme].premium || photoCount() > FREE_PHOTOS);\n' + handlers, context);
  return { $, state, context, render: () => vm.runInContext('renderShare()', context) };
}

for (const limit of [5, 100]) {
  for (const premium of [true, false]) {
    test(`paid ${limit}-calendar account gets its link automatically on ${premium ? 'premium' : 'free'} world`, async () => {
      const ui = sharingUI({ limit, used: 2, premium });
      await ui.render();
      assert.equal(ui.state.activations, 1);
      assert.equal(ui.state.shares, 1);
      assert.match(ui.$('shareLink').value, /s=private-token/);
      assert.equal(ui.$('copyBtn').disabled, false);
      assert.equal(ui.$('shareControls').hidden, false);
      assert.equal(ui.$('shareGateNotice').hidden, true);
      assert.equal(ui.$('upgradeCard').hidden, false);
      assert.match(ui.$('upgradeCard').innerHTML, /Season Pass active/);
      assert.match(ui.$('upgradeCard').innerHTML, new RegExp(`1 of your ${limit}`));
      await ui.render();
      assert.equal(ui.state.activations, 1, 'reopening sharing must not allocate another slot');
      assert.equal(ui.state.used, 3);
      assert.equal(ui.state.requests.some(path => path.includes('checkout')), false);
    });
  }
}

test('allocated calendar shares even when all slots are used', async () => {
  const ui = sharingUI({ used: 5, allocated: true });
  await ui.render();
  assert.equal(ui.state.activations, 0);
  assert.equal(ui.state.shares, 1);
  assert.equal(ui.$('copyBtn').disabled, false);
});

test('unallocated premium calendar stays gated when the pass is exhausted', async () => {
  const ui = sharingUI({ limit: 100, used: 100 });
  await ui.render();
  assert.equal(ui.state.activations, 0);
  assert.equal(ui.state.shares, 0);
  assert.equal(ui.$('shareControls').hidden, true);
  assert.equal(ui.$('upBtn').disabled, true);
  assert.match(ui.$('upgradeCard').innerHTML, /Up to 100 premium calendars/);
});

test('exhausted pass still permits free calendar sharing', async () => {
  const ui = sharingUI({ used: 5, premium: false });
  await ui.render();
  assert.equal(ui.state.activations, 0);
  assert.equal(ui.state.shares, 1);
});

for (const premium of [true, false]) {
  test(`inactive pass preserves ${premium ? 'premium gate' : 'free sharing'}`, async () => {
    const ui = sharingUI({ active: false, premium });
    await ui.render();
    assert.equal(ui.state.activations, 0);
    assert.equal(ui.state.shares, premium ? 0 : 1);
    assert.equal(ui.$('shareControls').hidden, premium);
  });
}

test('extra photos automatically use paid access on a free world', async () => {
  const ui = sharingUI({ premium: false, photos: 4 });
  await ui.render();
  assert.equal(ui.state.activations, 1);
  assert.equal(ui.state.shares, 1);
});

test('guest calendars never allocate a pass or create a share link', async () => {
  const ui = sharingUI({ guest: true, premium: false });
  await ui.render();
  assert.equal(ui.state.activations, 0);
  assert.equal(ui.state.shares, 0);
  assert.equal(ui.$('guestSave').hidden, false);
});

test('failed allocation keeps premium gated and can be retried', async () => {
  const ui = sharingUI({ failActivation: true });
  await ui.render();
  assert.equal(ui.state.shares, 0);
  assert.equal(ui.$('copyBtn').disabled, true);
  assert.equal(ui.$('shareGateNotice').textContent, 'Please try again.');
  ui.state.failActivation = false;
  await ui.render();
  assert.equal(ui.state.shares, 1);
  assert.equal(ui.$('copyBtn').disabled, false);
});

test('overlapping share renders allocate once and expose only the latest link', async () => {
  const ui = sharingUI();
  await Promise.all([ui.render(), ui.render()]);
  assert.equal(ui.state.activations, 1);
  assert.equal(ui.state.shares, 1);
  assert.match(ui.$('shareLink').value, /s=private-token/);
  assert.match(ui.$('upgradeCard').innerHTML, /Season Pass active/);
});

test('a second render during activation shares the pending request', async () => {
  const ui = sharingUI();
  let finishSave;
  ui.context.persist = () => new Promise(resolve => { finishSave = resolve; });
  const first = ui.render();
  await new Promise(resolve => setImmediate(resolve));
  const second = ui.render();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(ui.$('upgradeCard').hidden, true);
  assert.equal(ui.$('copyBtn').disabled, true);
  ui.context.persist = async () => {};
  finishSave();
  await Promise.all([first, second]);
  assert.equal(ui.state.activations, 1);
  assert.equal(ui.state.shares, 1);
  assert.equal(ui.$('copyBtn').disabled, false);
});

test('inactive pass cannot reuse a previously allocated premium calendar', async () => {
  const ui = sharingUI({ active: false, allocated: true });
  await ui.render();
  assert.equal(ui.state.activations, 0);
  assert.equal(ui.state.shares, 0);
  assert.equal(ui.$('shareLink').value, '');
  assert.equal(ui.$('shareControls').hidden, true);
});
