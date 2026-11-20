import { renderHome } from './home.mjs';
import { iconLinks, socialTags, sitemap } from '../server/seo.js';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { build as bundle } from 'esbuild';

export const root = fileURLToPath(new URL('../', import.meta.url));
// Explicit public-file allowlist: never deploy the repository, .env, SQL, or tooling.
export async function build(destination = new URL('../dist/', import.meta.url)) {
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  for (const name of ['index.html', '3d.html', 'editor.html', 'auth.html', 'css', 'js', 'js3d', 'assets']) {
    await cp(new URL('../' + name, import.meta.url), new URL(name, destination), { recursive: true });
  }
  const editorSource = await readFile(new URL('../editor.html', import.meta.url), 'utf8');
  await writeFile(new URL('home.html', destination), renderHome('en', editorSource));
  await writeFile(new URL('home-fr.html', destination), renderHome('fr', editorSource));
  await cp(new URL('../assets/brand/favicon.ico', import.meta.url), new URL('favicon.ico', destination));
  await writeFile(new URL('site.webmanifest', destination), JSON.stringify({ name: 'Tiny Doors', short_name: 'Tiny Doors', description: 'Personal digital advent calendars', start_url: '/', display: 'standalone', background_color: '#fff9ed', theme_color: '#101a3e', icons: [{ src: '/assets/brand/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/assets/brand/icon-512.png', sizes: '512x512', type: 'image/png' }] }));
  await writeFile(new URL('sitemap.xml', destination), sitemap);
  await bundle({ entryPoints: [new URL('../js/supabase-client.js', import.meta.url).pathname], bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, outfile: new URL('js/vendor/supabase.js', destination).pathname, logLevel: 'silent' });
  // One fingerprinted, minified file with the world modules and Three.js itself: a single
  // same-origin download instead of a chain of CDN module requests before a world can start.
  await bundle({ entryPoints: [new URL('../js3d/main.js', import.meta.url).pathname], bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, alias: { 'three/addons': 'three/examples/jsm' }, outfile: new URL('js3d/main.js', destination).pathname, logLevel: 'silent' });
  // Fingerprint entry assets so existing visitors receive new releases immediately.
  for (const page of ['index.html', '3d.html', 'editor.html', 'auth.html', 'home.html', 'home-fr.html']) {
    let html = await readFile(new URL(page, destination), 'utf8');
    // The source pages keep a CDN import map for unbundled local previews; the bundle needs none.
    html = html.replace(/\s*<script type="importmap">[\s\S]*?<\/script>/, '');
    if (!page.startsWith('home')) html = html.replace('</head>', iconLinks + '\n' + socialTags('en') + '\n<meta name="robots" content="noindex,nofollow,noarchive">\n</head>');
    for (const match of [...html.matchAll(/(?:src|href)="(\/?(?:js|js3d|css)\/[^"?]+\.(?:js|css))"/g)]) {
      const path = match[1];
      const hash = createHash('sha256').update(await readFile(new URL(path.replace(/^\//, ''), destination))).digest('hex').slice(0, 12);
      html = html.replaceAll('"' + path + '"', '"' + path + '?v=' + hash + '"');
    }
    await writeFile(new URL(page, destination), html);
  }
  await writeFile(new URL('_headers', destination), await readFile(new URL('../server/headers.txt', import.meta.url)));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await build();
  console.log('Built public site in dist/ (no environment files or server secrets).');
}
