import test from 'node:test';
import assert from 'node:assert/strict';
import { seasonPassPrice, priceById, publicPrice, SEASON_PASS_PRICES } from '../server/pricing.js';

const all = { STRIPE_SEASON_PASS_PRICE_ID: 'price_aud', ...Object.fromEntries(Object.entries(SEASON_PASS_PRICES).filter(([c]) => c !== 'aud').map(([c, p]) => [p.setting, 'price_' + c])) };

test('countries map to their local Season Pass price', () => {
  for (const [country, currency, amount] of [['AU', 'aud', 699], ['NZ', 'nzd', 799], ['US', 'usd', 499], ['CA', 'cad', 699], ['GB', 'gbp', 399], ['FR', 'eur', 499], ['BE', 'eur', 499], ['LU', 'eur', 499], ['IE', 'eur', 499], ['RE', 'eur', 499], ['CH', 'chf', 490], ['JP', 'usd', 499], ['XX', 'usd', 499], [undefined, 'usd', 499], ['fr', 'eur', 499]]) {
    assert.deepEqual(seasonPassPrice(all, country), { currency, amount, priceId: 'price_' + currency }, String(country));
  }
});

test('a currency without a configured Stripe price falls back to AUD', () => {
  const only = { STRIPE_SEASON_PASS_PRICE_ID: 'price_aud', STRIPE_SEASON_PASS_PRICE_ID_EUR: 'price_REPLACE_ME' };
  assert.equal(seasonPassPrice(only, 'FR').currency, 'aud');
  assert.equal(seasonPassPrice(only, 'US').priceId, 'price_aud');
});

test('paid prices map back to their currency, and the public price hides the Stripe ID', () => {
  assert.deepEqual(priceById(all, 'price_gbp'), { currency: 'gbp', amount: 399, priceId: 'price_gbp' });
  assert.equal(priceById(all, 'price_unknown'), null);
  assert.equal(priceById(all, undefined), null);
  assert.deepEqual(publicPrice(seasonPassPrice(all, 'CH')), { currency: 'chf', amount: 490 });
});
