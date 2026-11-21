import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import worker from '../server/worker.js';
import production from '../server/production.js';
import { renderHome } from '../tools/home.mjs';
import { build } from '../tools/build.mjs';

const htmlAssets = { ASSETS: { fetch(request) { return new Response('<html>public content</html>', {headers:{'Content-Type':'text/html; charset=utf-8'}}); } } };
const source = await readFile(new URL('../editor.html',import.meta.url),'utf8');
for (const locale of ['en','fr']) test(`${locale} public homepage contains crawlable copy, canonical alternates and valid site identity`, () => {
 const html=renderHome(locale,source);
 assert.ok(html.includes(`<html lang="${locale}">`));
 assert.ok(html.includes('<meta name="description"'));
 assert.ok(html.includes('<meta property="og:image" content="https://tinydoors.app/assets/brand/social-'+locale+'.png">'));
 assert.ok(html.includes('<meta name="twitter:card" content="summary_large_image">'));
 assert.match(html, /<link rel="canonical" href="https:\/\/tinydoors.app\/(?:\?lang=fr)?">/);
 for(const language of ['en','fr','x-default'])assert.ok(html.includes(`hreflang="${language}"`));
 assert.equal((html.match(/<h1>/g)||[]).length,1);
 assert.ok(!html.includes('<main id="main" hidden'));
 assert.equal((html.match(/class="world"/g)||[]).length,10);
 assert.match(html, /href="\/editor.html\?new&amp;lang=/);
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
 assert.equal(schema['@graph'][0]['@type'],'WebSite');assert.equal(schema['@graph'][0].name,'Tiny Doors');
 assert.ok(!html.includes('aggregateRating'));assert.ok(!html.includes('<iframe'));
 if(locale==='fr')assert.ok(html.includes('Créez un calendrier de l’Avent numérique personnalisé'));
});
test('production indexes the public homepage and excludes app pages, private query URLs and APIs',async()=>{
 for(const path of ['/','/?lang=fr','/?utm_source=social']){
  const response=await production.fetch(new Request('https://tinydoors.app'+path),htmlAssets);
  assert.equal(response.status,200);assert.equal(response.headers.get('X-Robots-Tag'),null);
 }
 for(const path of ['/editor.html','/editor.html?c=calendar1234','/3d.html?s=recipient-token','/auth.html?token_hash=secret','/index.html','/?c=calendar1234','/?checkout=success&session_id=secret','/api/health']){
  const response=await production.fetch(new Request('https://tinydoors.app'+path),htmlAssets);
  assert.match(response.headers.get('X-Robots-Tag'),/noindex/);
 }
});
test('preview responses stay noindex even if the same public landing HTML is requested',async()=>{
 for(const path of ['/home.html','/home-fr.html','/editor.html','/3d.html','/api/health']){
  const response=await worker.fetch(new Request('https://tinydoors-preview.example.dev'+path),htmlAssets);
  assert.match(response.headers.get('X-Robots-Tag'),/noindex/);
 }
});
test('sitemap lists only canonical English and French marketing pages; robots permits reading noindex directives',async()=>{
 const response=await production.fetch(new Request('https://tinydoors.app/sitemap.xml'),htmlAssets);
 assert.equal(response.status,200);assert.match(response.headers.get('Content-Type'),/application\/xml/);
 const sitemap=await response.text();assert.equal((sitemap.match(/<loc>/g)||[]).length,2);
 assert.ok(!/editor|auth\.html|3d\.html|calendar|token/.test(sitemap));
 assert.match(sitemap,/hreflang="fr"/);
 const robots=await (await production.fetch(new Request('https://tinydoors.app/robots.txt'),htmlAssets)).text();
 assert.match(robots,/Sitemap: https:\/\/tinydoors.app\/sitemap.xml/);
 assert.ok(!robots.includes('Disallow: /editor'));assert.ok(!robots.includes('Disallow: /3d'));assert.ok(robots.includes('Disallow: /api/'));
 const preview=await worker.fetch(new Request('https://preview.example.dev/sitemap.xml'),htmlAssets);assert.equal(preview.status,404);
});
test('direct generated homepage paths redirect to their canonical public URL',async()=>{
 for(const [path,target] of [['/home.html','https://tinydoors.app/'],['/home-fr.html','https://tinydoors.app/?lang=fr']]){
  const response=await production.fetch(new Request('https://tinydoors.app'+path),htmlAssets);assert.equal(response.status,308);assert.equal(response.headers.get('Location'),target);
 }
});
test('build publishes favicon variants, real social PNGs and noindex metadata for every application page',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'tinydoors-seo-'));
 try{
  await build(pathToFileURL(directory+'/'));
  const ico=await readFile(join(directory,'favicon.ico'));assert.deepEqual([...ico.subarray(0,4)],[0,0,1,0]);
  const manifest=JSON.parse(await readFile(join(directory,'site.webmanifest'),'utf8'));assert.equal(manifest.name,'Tiny Doors');
  for(const lang of ['en','fr']){const png=await readFile(join(directory,'assets/brand/social-'+lang+'.png'));assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);}
  for(const page of ['editor.html','auth.html','index.html','3d.html']){
   const html=await readFile(join(directory,page),'utf8');assert.match(html,/<meta name="robots" content="noindex/);assert.match(html,/rel="icon" href="\/favicon.ico"/);
  }
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('both deployed environments route HTML through the indexing middleware',async()=>{
 for(const file of ['wrangler.jsonc','wrangler.production.jsonc']){
  const config=JSON.parse(await readFile(new URL('../'+file,import.meta.url),'utf8'));
  assert.equal(config.assets.run_worker_first,true);
 }
});
