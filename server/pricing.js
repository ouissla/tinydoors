// Season Pass prices per currency. Each currency has its own Stripe Price; the amounts here are the
// authoritative check, so a mis-edited Stripe price fails closed instead of charging the wrong amount.
export const SEASON_PASS_PRICES = {
  aud: { amount: 699, setting: 'STRIPE_SEASON_PASS_PRICE_ID' },
  usd: { amount: 499, setting: 'STRIPE_SEASON_PASS_PRICE_ID_USD' },
  eur: { amount: 499, setting: 'STRIPE_SEASON_PASS_PRICE_ID_EUR' },
  gbp: { amount: 399, setting: 'STRIPE_SEASON_PASS_PRICE_ID_GBP' },
  cad: { amount: 699, setting: 'STRIPE_SEASON_PASS_PRICE_ID_CAD' },
  nzd: { amount: 799, setting: 'STRIPE_SEASON_PASS_PRICE_ID_NZD' },
  chf: { amount: 490, setting: 'STRIPE_SEASON_PASS_PRICE_ID_CHF' },
};

const EURO_COUNTRIES = 'AD AT BE BL CY DE EE ES FI FR GF GP GR HR IE IT LT LU LV MC ME MF MQ MT NL PM PT RE SI SK SM VA XK YT';
const COUNTRY_CURRENCY = {
  AU: 'aud', CX: 'aud', CC: 'aud', NF: 'aud', NR: 'aud', KI: 'aud', TV: 'aud',
  NZ: 'nzd', CK: 'nzd', NU: 'nzd', TK: 'nzd',
  GB: 'gbp', IM: 'gbp', JE: 'gbp', GG: 'gbp',
  CA: 'cad', US: 'usd', CH: 'chf', LI: 'chf',
  ...Object.fromEntries(EURO_COUNTRIES.split(' ').map((code) => [code, 'eur'])),
};

const configured = (env, currency) => {
  const id = env[SEASON_PASS_PRICES[currency].setting];
  return id && !/REPLACE_ME|YOUR_/.test(id) ? id : null;
};

// The visitor's country comes from Cloudflare (request.cf), never from the browser. Countries without
// their own currency pay in USD; any currency whose Stripe Price is not configured falls back to AUD.
export function seasonPassPrice(env, country) {
  const wanted = COUNTRY_CURRENCY[String(country || '').toUpperCase()] || 'usd';
  const currency = configured(env, wanted) ? wanted : 'aud';
  return { currency, amount: SEASON_PASS_PRICES[currency].amount, priceId: configured(env, currency) };
}

// Fulfilment: map a paid Stripe Price back to the currency and amount it must have been charged at.
export function priceById(env, id) {
  if (!id) return null;
  const currency = Object.keys(SEASON_PASS_PRICES).find((code) => configured(env, code) === id);
  return currency ? { currency, amount: SEASON_PASS_PRICES[currency].amount, priceId: id } : null;
}

export const publicPrice = ({ currency, amount }) => ({ currency, amount });
