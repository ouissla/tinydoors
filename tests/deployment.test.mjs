import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from '../tools/build.mjs';
import worker from '../server/worker.js';
import { requiredSettings, validateEnvironment } from '../server/config.js';

test('deployment includes public assets and excludes credentials and backend sources', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'little-doors-build-'));
  try {
    await build(pathToFileURL(directory + '/'));
    assert.deepEqual((await readdir(directory)).sort(), ['3d.html','auth.html','_headers','assets','css','editor.html','index.html','js','js3d','home.html','home-fr.html','favicon.ico','site.webmanifest','sitemap.xml'].sort());
    assert.match(await readFile(join(directory,'editor.html'),'utf8'), /data-theme-pick="cyber"/);
  } finally { await rm(directory, {recursive:true,force:true}); }
});
test('health is explicit about prototype limitations and never returns secrets', async () => {
  const response = await worker.fetch(new Request('https://example.com/api/health'), { STRIPE_SECRET_KEY:'private-value' });
  assert.equal(response.status,200);
  const body = await response.json();
  assert.equal(body.paidLaunchReady,false);
  assert.equal(body.storage,'browser-local');
  assert.ok(!JSON.stringify(body).includes('private-value'));
});
test('unknown APIs do not accidentally return an HTML page', async () => {
  const response = await worker.fetch(new Request('https://example.com/api/does-not-exist'), {});
  assert.equal(response.status,404);
});
test('static request keeps its query string and uses the asset binding', async () => {
  const request = new Request('https://example.com/3d.html?theme=space');
  const response = await worker.fetch(request,{ASSETS:{fetch(r){assert.equal(r.url,request.url);return new Response('scene');}}});
  assert.equal(await response.text(),'scene');
});
test('environment checker rejects missing, placeholder and insecure settings', () => {
  assert.deepEqual(validateEnvironment({}),requiredSettings);
  assert.ok(validateEnvironment({APP_URL:'http://live.test'}).includes('APP_URL'));
  assert.ok(validateEnvironment({SUPABASE_SECRET_KEY:'sb_secret_REPLACE_ME'}).includes('SUPABASE_SECRET_KEY'));
});

test('world chooser includes two free and seven premium illustrated options', async () => {
  const html = await readFile(new URL('../editor.html', import.meta.url), 'utf8');
  const cards = [...html.matchAll(/<button[^>]+data-theme-pick="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)];
  assert.deepEqual(cards.map((card) => card[1]).sort(), ['snow','summer','gingerbread','toys','space','workshop','jungle','japan','cyber'].sort());
  for (const card of cards) {
    if (['snow','summer'].includes(card[1])) assert.match(card[2], /<svg/);
    else {
      assert.match(card[2], /<img[^>]+class="world-thumbnail"/);
      const path = card[2].match(/src="([^"]+)"/)[1];
      const image = await readFile(new URL('../' + path.replace(/^\//, ''), import.meta.url));
      assert.deepEqual([...image.subarray(0,2)], [255,216]);
    }
  }
  assert.equal(cards.filter((card) => /class="world-access free-access">Free</.test(card[2])).length, 2);
  assert.equal(cards.filter((card) => /class="world-access paid-access">Season Pass</.test(card[2])).length, 7);
  assert.match(html, /id="selectedWorld" aria-live="polite"/);
});
