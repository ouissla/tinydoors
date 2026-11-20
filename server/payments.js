import Stripe from 'stripe';
import { adminClient, json } from './sharing.js';
import { seasonPassPrice, priceById } from './pricing.js';

export const stripeClient = (env) => new Stripe(env.STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient(), maxNetworkRetries: 2 });
export const paymentSettingsReady = (env) => ['STRIPE_SECRET_KEY', 'STRIPE_SEASON_PASS_PRICE_ID', 'STRIPE_WEBHOOK_SECRET'].every((key) => env[key] && !/REPLACE_ME|YOUR_/.test(env[key]));
const failure = (message, status = 400) => Object.assign(new Error(message), { status });
const checked = ({ data, error }) => { if (error) throw failure('Could not update your Season Pass. Please try again.', 503); return data; };
export async function creatorUser(request, client) {
  const token = request.headers.get('Authorization')?.match(/^Bearer ([^\s]+)$/)?.[1];
  if (!token) throw failure('Please sign in.', 401);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw failure('Please sign in again.', 401);
  return data.user;
}
async function bodyOf(request) {
  if (Number(request.headers.get('Content-Length')) > 4096) throw failure('Request too large.', 413);
  try { const text = await request.text(); if (text.length > 4096) throw failure('Request too large.', 413); const body = JSON.parse(text); if (!body || typeof body !== 'object' || Array.isArray(body)) throw failure('Invalid request.'); return body; }
  catch (error) { if (error.status) throw error; throw failure('Invalid request.'); }
}
function seasonYear(value) {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 2020 || year > 2100 || Date.UTC(year + 1, 1, 1) <= Date.now()) throw failure('Choose a current Christmas season.');
  return year;
}
async function calendarFor(client, owner, id) {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{10,64}$/.test(id)) throw failure('Choose a saved calendar first.');
  const row = checked(await client.from('calendars').select('id,owner_id,document').eq('id', id).eq('owner_id', owner).maybeSingle());
  if (!row) throw failure('Calendar not found.', 404);
  seasonYear(row.document.year);
  return row;
}
export async function passStatus(client, owner, year) {
  const pass = checked(await client.from('season_passes').select('status,expires_at,calendar_limit').eq('owner_id', owner).eq('season_year', year).maybeSingle());
  const slots = checked(await client.from('season_pass_calendars').select('calendar_id').eq('owner_id', owner).eq('season_year', year));
  const limit = pass?.calendar_limit || 5;
  return { year, refunded: pass?.status === 'revoked', active: pass?.status === 'active' && Date.parse(pass.expires_at) > Date.now(), used: slots.length, limit, remaining: Math.max(0, limit - slots.length), calendars: slots.map((slot) => slot.calendar_id) };
}
export async function activateCalendar(client, owner, id) {
  const result = checked(await client.rpc('activate_season_calendar', { p_owner: owner, p_calendar: id }));
  if (!result.ok) throw failure(result.error, result.code || 402);
  return result;
}
export async function seasonPassRoute(request, env, client = adminClient(env)) {
  const user = await creatorUser(request, client);
  if (request.method === 'GET') return json(await passStatus(client, user.id, seasonYear(new URL(request.url).searchParams.get('year'))));
  const body = await bodyOf(request);
  return json(await activateCalendar(client, user.id, body.calendarId));
}
export async function checkout(request, env, client = adminClient(env), stripe = stripeClient(env)) {
  if (!paymentSettingsReady(env)) throw failure('Checkout is not configured yet. Your calendar is saved.', 503);
  const user = await creatorUser(request, client);
  const body = await bodyOf(request);
  const cal = await calendarFor(client, user.id, body.calendarId);
  const year = Number(cal.document.year);
  const pass = await passStatus(client, user.id, year);
  if (pass.active) return json({ activated: await activateCalendar(client, user.id, cal.id) });
  if (pass.refunded) throw failure('This Season Pass was refunded. Please contact support before purchasing again for this Christmas.', 409);
  // The currency follows the visitor's country as Cloudflare reports it; the browser cannot choose it.
  const local = seasonPassPrice(env, request.cf?.country);
  const price = await stripe.prices.retrieve(local.priceId);
  if (!price.active || price.type !== 'one_time' || price.currency !== local.currency || price.unit_amount !== local.amount) throw failure('The Season Pass price needs checking. Your calendar is saved.', 503);
  // A durable attempt plus Stripe's idempotency key prevents repeated clicks/tabs creating multiple charges.
  let attempt = checked(await client.rpc('reserve_season_checkout', { p_owner: user.id, p_year: year, p_calendar: cal.id, p_lang: body.lang === 'fr' ? 'fr' : 'en', p_expired_session: null }));
  const create = async () => {
    const success = new URL('/editor.html', env.APP_URL);
    success.searchParams.set('c', attempt.calendar_id); success.searchParams.set('step', 'share'); success.searchParams.set('checkout', 'success');
    success.searchParams.set('lang', attempt.lang);
    const cancel = new URL(success); cancel.searchParams.set('checkout', 'cancelled');
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', adaptive_pricing: { enabled: false }, locale: attempt.lang, line_items: [{ price: price.id, quantity: 1 }], allowed_payment_method_types: ['card'],
      client_reference_id: user.id,
      metadata: { tinydoors: 'season-pass-v1', owner_id: user.id, season_year: String(year) },
      payment_intent_data: { metadata: { tinydoors: 'season-pass-v1', owner_id: user.id, season_year: String(year) } },
      success_url: success.href + '&session_id={CHECKOUT_SESSION_ID}', cancel_url: cancel.href,
      custom_text: { submit: { message: `All premium worlds for up to 5 calendars for Christmas ${year}. One payment, no subscription.` } },
    }, { idempotencyKey: 'tinydoors-season-' + attempt.request_key });
    checked(await client.from('season_checkouts').update({ stripe_session_id: session.id }).eq('owner_id', user.id).eq('season_year', year).eq('request_key', attempt.request_key));
    return session;
  };
  // Reuse the original parameters when another calendar initiates checkout for the same pass.
  let session = attempt.stripe_session_id ? await stripe.checkout.sessions.retrieve(attempt.stripe_session_id) : await create();
  if (session.status === 'complete') {
    await fulfillSession(session.id, env, client, stripe);
    return json({ activated: await activateCalendar(client, user.id, cal.id) });
  }
  if (session.status === 'expired') {
    attempt = checked(await client.rpc('reserve_season_checkout', { p_owner: user.id, p_year: year, p_calendar: cal.id, p_lang: body.lang === 'fr' ? 'fr' : 'en', p_expired_session: session.id }));
    session = attempt.stripe_session_id ? await stripe.checkout.sessions.retrieve(attempt.stripe_session_id) : await create();
  }
  if (!session.url || session.status !== 'open') throw failure('Checkout is still processing. Please try again shortly.', 409);
  return json({ url: session.url });
}
export async function fulfillSession(id, env, client, stripe, eventId = 'checkout:' + id) {
  // Retrieve authoritative Stripe state even for a signed webhook; event order is not guaranteed.
  const session = await stripe.checkout.sessions.retrieve(id, { expand: ['line_items.data.price', 'payment_intent.latest_charge'] });
  if (session.metadata?.tinydoors !== 'season-pass-v1') return { ignored: true };
  const owner = session.metadata.owner_id, year = Number(session.metadata.season_year);
  if (session.client_reference_id !== owner || !/^[a-f0-9-]{36}$/.test(owner || '') || !Number.isInteger(year) || year < 2020 || year > 2100) throw failure('Invalid checkout identity.');
  if (session.mode !== 'payment' || session.status !== 'complete' || session.payment_status !== 'paid') return { pending: true };
  const items = session.line_items?.data;
  const paidPrice = priceById(env, items?.[0]?.price?.id);
  if (items?.length !== 1 || session.line_items.has_more || !paidPrice || items[0].quantity !== 1 || session.currency !== paidPrice.currency || session.amount_total !== paidPrice.amount) throw failure('Unexpected checkout price.');
  if (session.livemode !== !env.STRIPE_SECRET_KEY.startsWith('sk_test_')) throw failure('Payment mode mismatch.');
  const intent = session.payment_intent;
  if (!intent?.id || typeof intent.latest_charge !== 'object' || !intent.latest_charge) throw failure('Payment details are unavailable.', 503);
  const revoked = intent.latest_charge.refunded === true;
  return checked(await client.rpc('fulfill_season_pass', {
    p_event: eventId, p_owner: owner, p_year: year, p_session: session.id, p_payment_intent: intent.id, p_revoked: revoked,
  }));
}
export async function confirmCheckout(request, env, client = adminClient(env), stripe = stripeClient(env)) {
  const user = await creatorUser(request, client);
  const body = await bodyOf(request);
  if (typeof body.sessionId !== 'string' || !/^cs_(test_|live_)?[a-zA-Z0-9_]+$/.test(body.sessionId)) throw failure('Invalid checkout.');
  const session = await stripe.checkout.sessions.retrieve(body.sessionId);
  if (session.client_reference_id !== user.id) throw failure('Checkout not found.', 404);
  const result = await fulfillSession(session.id, env, client, stripe);
  return json(result);
}
export async function webhook(request, env, client = adminClient(env), stripe = stripeClient(env)) {
  if (!paymentSettingsReady(env)) throw failure('Payments are not configured.', 503);
  const raw = await request.text();
  if (raw.length > 262144) throw failure('Request too large.', 413);
  let event;
  try { event = await stripe.webhooks.constructEventAsync(raw, request.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET, 300, Stripe.createSubtleCryptoProvider()); }
  catch { throw failure('Invalid webhook signature.'); }
  if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
    await fulfillSession(event.data.object.id, env, client, stripe, event.id);
  } else if (event.type === 'charge.refunded') {
    const paymentIntent = event.data.object.payment_intent;
    if (paymentIntent) {
      const sessions = await stripe.checkout.sessions.list({ payment_intent: typeof paymentIntent === 'string' ? paymentIntent : paymentIntent.id, limit: 10 });
      for (const session of sessions.data) await fulfillSession(session.id, env, client, stripe, event.id);
    }
  }
  return json({ received: true });
}
export const paymentError = (error) => json({ error: error.status ? error.message : 'Could not complete the payment request. Your calendar is saved. Please try again.' }, error.status || 503);
