import app from './worker.js';

// Keep the public domain separate from the Stripe test preview.
export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    if (url.hostname === 'www.tinydoors.app') {
      url.protocol = 'https:';
      url.hostname = 'tinydoors.app';
      return Response.redirect(url.href, 308);
    }
    // Public marketing pages are rendered at build time; private editing URLs stay private.
    if (['/home.html', '/home-fr.html'].includes(url.pathname)) {
      const french = url.pathname === '/home-fr.html';
      url.pathname = '/';
      if (french) url.searchParams.set('lang', 'fr'); else url.searchParams.delete('lang');
      return Response.redirect(url.href, 308);
    }
    if (url.pathname === '/') {
      const editing = ['c','s','new','theme','step','checkout','session_id'].some(key => url.searchParams.has(key));
      url.pathname = editing ? '/editor.html' : url.searchParams.get('lang') === 'fr' ? '/home-fr.html' : '/home.html';
      request = new Request(url, request);
    }
    return app.fetch(request, env, context);
  },
};
