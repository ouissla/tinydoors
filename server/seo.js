export const SITE = 'https://tinydoors.app';
export const homeUrl = (locale = 'en') => SITE + (locale === 'fr' ? '/?lang=fr' : '/');
export const metadata = {
  en: { title: 'Create a Personalised Digital Advent Calendar | Tiny Doors', description: 'Create a free digital advent calendar with your photos, personal notes and mini games. Choose a magical 3D world and share a new surprise every day in December.', imageAlt: 'Tiny Doors: 24 little doors. One big smile. Personalised digital advent calendars.' },
  fr: { title: 'Créez un calendrier de l’Avent personnalisé | Tiny Doors', description: 'Créez un calendrier de l’Avent numérique gratuit avec vos photos, petits mots et mini-jeux. Choisissez un univers en 3D et partagez une surprise chaque jour de décembre.', imageAlt: 'Tiny Doors : 24 petites portes. Un grand sourire. Calendriers de l’Avent personnalisés.' },
};
export const iconLinks = `<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
  <link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml" sizes="any">
  <link rel="icon" href="/assets/brand/favicon-48.png" type="image/png" sizes="48x48">
  <link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png" sizes="180x180">
  <link rel="manifest" href="/site.webmanifest">`;
const attr = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
export function socialTags(locale = 'en') {
  const m = metadata[locale];
  return `<meta name="description" content="${attr(m.description)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Tiny Doors">
  <meta property="og:title" content="${attr(m.title)}">
  <meta property="og:description" content="${attr(m.description)}">
  <meta property="og:url" content="${homeUrl(locale)}">
  <meta property="og:locale" content="${locale === 'fr' ? 'fr_FR' : 'en_AU'}">
  <meta property="og:locale:alternate" content="${locale === 'fr' ? 'en_AU' : 'fr_FR'}">
  <meta property="og:image" content="${SITE}/assets/brand/social-${locale}.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${attr(m.imageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${attr(m.title)}">
  <meta name="twitter:description" content="${attr(m.description)}">
  <meta name="twitter:image" content="${SITE}/assets/brand/social-${locale}.png">
  <meta name="twitter:image:alt" content="${attr(m.imageAlt)}">`;
}
export const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${['en', 'fr'].map(locale => `  <url><loc>${homeUrl(locale)}</loc>${['en', 'fr', 'x-default'].map(lang => `<xhtml:link rel="alternate" hreflang="${lang}" href="${homeUrl(lang)}"/>`).join('')}</url>`).join('\n')}
</urlset>`;
export function crawlRules(request) {
  const url = new URL(request.url);
  if (url.pathname === '/robots.txt') return new Response(`User-agent: *\nAllow: /\nDisallow: /api/\n${url.hostname === 'tinydoors.app' ? '\nSitemap: ' + SITE + '/sitemap.xml\n' : ''}`, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
  if (url.pathname === '/sitemap.xml') return url.hostname === 'tinydoors.app' ? new Response(sitemap, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } }) : new Response('Not found', { status: 404 });
}
export function indexingHeaders(request, response) {
  const url = new URL(request.url);
  const html = response.headers.get('Content-Type')?.includes('text/html');
  const appPage = /\/(?:editor|index|3d|auth)\.html$/.test(url.pathname);
  const privateQuery = ['c', 's', 'token_hash', 'session_id', 'checkout', 'preview', 'bg', 'step', 'new', 'theme', 'code', 'error'].some(key => url.searchParams.has(key));
  if (url.hostname !== 'tinydoors.app' || appPage || privateQuery || url.pathname.startsWith('/api/') || (html && response.status >= 400)) {
    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  return response;
}
