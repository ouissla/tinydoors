import test from 'node:test';
import assert from 'node:assert/strict';
import production from '../server/production.js';

test('www redirects to the canonical domain without losing recipient tokens or language', async () => {
  const response = await production.fetch(new Request('https://www.tinydoors.app/3d.html?c=calendar1234&s=private-token&lang=fr'));
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('Location'), 'https://tinydoors.app/3d.html?c=calendar1234&s=private-token&lang=fr');
});
test('the production home serves the French public page while preserving campaign parameters', async () => {
  const response = await production.fetch(new Request('https://tinydoors.app/?lang=fr&source=gift'), {
    ASSETS: { fetch(request) { assert.equal(request.url, 'https://tinydoors.app/home-fr.html?lang=fr&source=gift'); return new Response('editor'); } },
  });
  assert.equal(await response.text(), 'editor');
});
test('explicit calendar pages and API routes retain their behavior', async () => {
  const request = new Request('https://tinydoors.app/index.html?c=calendar1234&s=token');
  const response = await production.fetch(request, { ASSETS: { fetch(received) { assert.equal(received, request); return new Response('recipient'); } } });
  assert.equal(await response.text(), 'recipient');
  const health = await production.fetch(new Request('https://tinydoors.app/api/health'), {});
  assert.equal(health.status, 200);
  assert.equal((await health.json()).paidLaunchReady, false);
});
