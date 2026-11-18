/* Shared language selection. Load before content and any application scripts. */
(function () {
  const A = window.Advent = window.Advent || {};
  const KEY = 'tinydoors:language';
  const supported = ['en', 'fr'];
  const params = new URLSearchParams(location.search);
  let saved;
  try { saved = localStorage.getItem(KEY); } catch { /* Storage may be blocked. */ }
  const browser = (navigator.languages || [navigator.language || 'en'])
    .map((language) => language.toLowerCase().split('-')[0]).find((language) => supported.includes(language));
  const requested = params.get('lang');
  const locale = supported.includes(requested) ? requested : supported.includes(saved) ? saved : browser || 'en';
  if (supported.includes(requested)) {
    try { localStorage.setItem(KEY, locale); } catch { /* URLs work without storage. */ }
  }
  const catalogs = { en: {}, fr: {} };
  let englishByFrench;
  const i18n = A.I18n = {
    locale, catalogs,
    letters(value) {
      return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/œ/gi, 'oe').replace(/æ/gi, 'ae').toUpperCase();
    },
    localizePreset(item) {
      if (item.personal) return item;
      englishByFrench ||= new Map(Object.entries(catalogs.fr).map(([en, fr]) => [fr, en]));
      const translate = (value) => {
        if (Array.isArray(value)) return value.map(translate);
        if (typeof value !== 'string') return value;
        return i18n.t(englishByFrench.get(value) || value);
      };
      const result = { ...item };
      for (const field of ['text', 'title', 'body', 'q', 'a', 'caption', 'steps', 'chips', 'words']) {
        if (field in item) result[field] = translate(item[field]);
      }
      return result;
    },
    t(key, values = {}) {
      const text = (catalogs[locale] && Object.hasOwn(catalogs[locale], key)) ? catalogs[locale][key] : key;
      return String(text).replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
    },
    url(input) {
      const url = new URL(input, location.href);
      if (url.origin === location.origin) url.searchParams.set('lang', locale);
      return url.href;
    },
    async setLocale(next) {
      if (!supported.includes(next) || next === locale) return;
      if (i18n.beforeChange) {
        try { await i18n.beforeChange(); }
        catch {
          const picker = document.getElementById('languageSelect');
          if (picker) picker.value = locale;
          return;
        }
      }
      try { localStorage.setItem(KEY, next); } catch { /* The URL still keeps the preference. */ }
      const url = new URL(location.href);
      url.searchParams.set('lang', next);
      location.assign(url.href);
    },
    // Only server-authored HTML is translated here, before application boot. User content is never scanned.
    init() {
      document.documentElement.lang = locale;
      const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      for (const node of nodes) {
        if (node.parentElement.closest('script, style, svg')) continue;
        const key = node.textContent.trim();
        if (key) node.textContent = node.textContent.replace(key, () => i18n.t(key));
      }
      for (const node of document.querySelectorAll('[aria-label], [placeholder], [title], [data-description]')) {
        for (const attr of ['aria-label', 'placeholder', 'title', 'data-description']) {
          if (node.hasAttribute(attr)) node.setAttribute(attr, i18n.t(node.getAttribute(attr)));
        }
      }
      for (const anchor of document.querySelectorAll('a[href]')) {
        const url = new URL(anchor.href, location.href);
        if (url.origin === location.origin && /\/(?:index|3d|editor|auth)\.html$/.test(url.pathname)) anchor.href = i18n.url(anchor.href);
      }
      const picker = document.createElement('select');
      picker.id = 'languageSelect';
      picker.className = 'language-select';
      picker.setAttribute('aria-label', locale === 'fr' ? 'Langue' : 'Language');
      for (const [value, label] of [['en', 'English'], ['fr', 'Français']]) {
        const option = document.createElement('option');
        option.value = value; option.textContent = label; option.lang = value;
        option.selected = value === locale; picker.appendChild(option);
      }
      picker.addEventListener('change', () => i18n.setLocale(picker.value));
      const header = document.querySelector('.ed-top');
      if (header) header.appendChild(picker);
      else {
        const box = document.createElement('div');
        box.className = 'language-picker'; box.appendChild(picker); document.body.appendChild(box);
      }
    },
  };
  document.documentElement.lang = locale;
})();
