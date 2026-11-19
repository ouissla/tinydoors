import { crawlRules, indexingHeaders } from './seo.js';
import { publicConfiguration } from './config.js';
import { json, createShare, readShare } from './sharing.js';
import { checkout, confirmCheckout, seasonPassRoute, webhook, paymentError, paymentSettingsReady } from './payments.js';
async function handleRequest(request, env) {
    const rules = crawlRules(request);
    if (rules) return rules;
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/')) {
      let config;
      try { config = publicConfiguration(env); }
      catch { return json({ error: 'Account services are not configured yet. Please try again later.' }, 503); }
      if (path === '/api/config') {
        if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
        return json(config);
      }
      if (path === '/api/health') {
        if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'Method not allowed' }, 405);
        const response = json({ status: 'ok', storage: config.mode === 'cloud' ? 'supabase-configured' : 'browser-local', authentication: config.mode === 'cloud' ? 'email-magic-link' : 'none', payments: config.mode === 'cloud' ? (paymentSettingsReady(env) ? 'stripe-configured' : 'unavailable') : 'demo', paidLaunchReady: false });
        return request.method === 'HEAD' ? new Response(null, response) : response;
      }
      const paymentRoutes = { '/api/checkout': [checkout, ['POST']], '/api/checkout/confirm': [confirmCheckout, ['POST']], '/api/season-pass': [seasonPassRoute, ['GET', 'POST']], '/api/stripe/webhook': [webhook, ['POST']] };
      if (paymentRoutes[path]) {
        if (config.mode !== 'cloud') return json({ error: 'Cloud payments are not enabled.' }, 503);
        const [handler, methods] = paymentRoutes[path];
        if (!methods.includes(request.method)) return json({ error: 'Method not allowed' }, 405);
        try { return await handler(request, env); } catch (error) { return paymentError(error); }
      }
      const creator = path.match(/^\/api\/calendars\/([a-zA-Z0-9_-]{10,64})\/share$/);
      const recipient = path.match(/^\/api\/shared\/([a-f0-9]{64})$/);
      if (creator || recipient) {
        if (config.mode !== 'cloud') return json({ error: 'Cloud sharing is not enabled.' }, 503);
        if (request.method !== (creator ? 'POST' : 'GET')) return json({ error: 'Method not allowed' }, 405);
        try { return creator ? await createShare(request, creator[1], env) : await readShare(recipient[1], env); }
        catch { return json({ error: 'Could not reach your calendars. Please try again.' }, 503); }
      }
      return json({ error: 'API endpoint not implemented' }, 404);
    }
    return env.ASSETS.fetch(request);
}
export default {
  async fetch(request, env) { return indexingHeaders(request, await handleRequest(request, env)); },
};
