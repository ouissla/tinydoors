import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the real checkout handlers with delayed services, without creating a payment.
const source = readFileSync(new URL('../js/editor.js', import.meta.url), 'utf8');
const handlers = source.slice(source.indexOf('  function renderCheckoutButton()'), source.indexOf('  // ---------------- 3. Share'));
function checkoutUI(request) {
  const nodes = new Map(), events = {};
  const $ = id => {
    if (!nodes.has(id)) nodes.set(id, { attrs: {}, listeners: {},
      setAttribute(k, v) { this.attrs[k] = v; }, querySelectorAll() { return []; },
      addEventListener(k, v) { this.listeners[k] = v; } });
    return nodes.get(id);
  };
  const state = { destination: null };
  const context = vm.createContext({ $, URL, Date, clearTimeout() {},
    A: { DB: { isCloud: true }, I18n: { locale: 'en' }, Auth: { user: { id: 'creator' }, config: { checkoutAvailable: true }, request } },
    tr: (text, values = {}) => text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match), priceLabel: () => 'A$6.99', seasonPass: null, checkoutBusy: false, cal: { id: 'calendar1234', year: 2090 }, saveT: null, step: 'share',
    persist: async () => {}, updatePassNotice() {}, renderShare() {},
    location: { assign(url) { state.destination = url; } },
    window: { addEventListener(name, fn) { events[name] = fn; } },
  });
  vm.runInContext(handlers, context);
  return { $, state, events, click: () => $('buyBtn').listeners.click() };
}
const freePass = { active: false, refunded: false, remaining: 5, used: 0, calendars: [] };

test('spinner starts immediately, survives pass refresh, and stays during Stripe navigation', async () => {
  let finishPass, finishCheckout, requests = 0;
  const ui = checkoutUI(path => {
    requests++;
    return path.startsWith('/api/season-pass') ? new Promise(resolve => { finishPass = resolve; }) : new Promise(resolve => { finishCheckout = resolve; });
  });
  const pending = ui.click();
  assert.equal(ui.$('buyBtn').attrs['aria-busy'], 'true');
  assert.equal(ui.$('buyBtn').textContent, 'Opening checkout…');
  await ui.click(); assert.equal(requests, 1);
  finishPass(freePass);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(ui.$('buyBtn').attrs['aria-busy'], 'true');
  assert.equal(ui.$('buyBtn').disabled, true);
  finishCheckout({ url: 'https://checkout.stripe.com/c/pay/test' });
  await pending;
  assert.equal(ui.state.destination, 'https://checkout.stripe.com/c/pay/test');
  assert.equal(ui.$('buyBtn').attrs['aria-busy'], 'true');
  ui.events.pageshow({ persisted: true });
  assert.equal(ui.$('buyBtn').attrs['aria-busy'], 'false');
  assert.equal(ui.$('buyBtn').disabled, false);
});

test('checkout errors stop the spinner and allow a retry', async () => {
  const ui = checkoutUI(async path => {
    if (path.startsWith('/api/season-pass')) return freePass;
    throw new Error('Checkout could not be opened.');
  });
  await ui.click();
  assert.equal(ui.$('buyBtn').attrs['aria-busy'], 'false');
  assert.equal(ui.$('buyBtn').disabled, false);
  assert.equal(ui.$('buyBtn').textContent, 'Unlock for A$6.99');
  assert.equal(ui.$('checkoutMessage').textContent, 'Checkout could not be opened.');
});
