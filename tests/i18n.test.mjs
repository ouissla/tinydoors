import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function boot({ search = '', saved, languages = ['en-AU'], blocked = false } = {}) {
  const storage = new Map(saved ? [['tinydoors:language', saved]] : []);
  const location = { search, href: 'https://tinydoors.test/editor.html' + search, origin: 'https://tinydoors.test', assign(url) { this.assigned = url; } };
  const context = vm.createContext({ URL, URLSearchParams, location,
    navigator: { languages }, document: { documentElement: {} },
    localStorage: { getItem(key) { if (blocked) throw Error('blocked'); return storage.get(key); }, setItem(key, value) { if (blocked) throw Error('blocked'); storage.set(key, value); } },
  });
  context.window = context;
  for (const file of ['i18n.js', 'locales/fr.js', 'content.js']) {
    vm.runInContext(readFileSync(new URL('../js/' + file, import.meta.url), 'utf8'), context);
  }
  return { A: context.Advent, context, location, storage };
}

test('language priority: explicit link, saved choice, supported browser language, English fallback', () => {
  assert.equal(boot({ search: '?lang=en', saved: 'fr', languages: ['fr-FR'] }).A.I18n.locale, 'en');
  assert.equal(boot({ saved: 'fr' }).A.I18n.locale, 'fr');
  assert.equal(boot({ languages: ['de-DE', 'fr-CA'] }).A.I18n.locale, 'fr');
  assert.equal(boot({ search: '?lang=xx', saved: 'xx', languages: ['de'] }).A.I18n.locale, 'en');
  assert.equal(boot({ search: '?lang=fr', blocked: true }).A.I18n.locale, 'fr');
});

test('translations preserve placeholders and names, with English fallback for missing keys', () => {
  const { A, context } = boot({ search: '?lang=fr' });
  assert.equal(context.document.documentElement.lang, 'fr');
  assert.equal(A.I18n.t('Copy'), 'Copier');
  assert.equal(A.I18n.t('Day {day} is back to its original surprise', { day: 4 }), 'La surprise d’origine du jour 4 a été rétablie');
  assert.equal(A.I18n.t('{from} made this for you', { from: 'Chloé & Zoë' }), 'Chloé & Zoë a créé ceci pour vous');
  assert.equal(A.I18n.t('Unknown text'), 'Unknown text');
  assert.equal(A.I18n.t("{to}'s Christmas Village"), 'Le village de Noël de {to}');
});

test('every world keeps 24 playable doors, localized presets and stable technical identifiers', () => {
  const en = boot().A, fr = boot({ search: '?lang=fr' }).A;
  for (const theme of en.THEME_ORDER) {
    assert.equal(fr.CONTENT[theme].length, 24);
    for (const key of ['base', 'sound', 'scratch', 'premium']) assert.equal(fr.THEMES[theme][key], en.THEMES[theme][key]);
    for (let i = 0; i < 24; i++) {
      const original = en.CONTENT[theme][i], translated = fr.CONTENT[theme][i];
      assert.equal(translated.type, original.type);
      for (const field of ['text', 'title', 'body', 'q', 'a', 'caption']) {
        if (original[field]) assert.notEqual(translated[field], original[field], `${theme} day ${i + 1}: ${field}`);
      }
      if (translated.game === 'wordsearch') for (const word of translated.words) assert.match(word, /^[A-Z]{2,10}$/);
    }
  }
  assert.ok(fr.CONTENT.snow[7].words.includes('CADEAU'));
  assert.equal(fr.I18n.letters('Noël, forêt, cœur, æther'), 'NOEL, FORET, COEUR, AETHER');
});

test('language links keep calendar IDs, share tokens, preview flags and fragments', async () => {
  const { A, location } = boot({ search: '?c=abc&s=secret&preview#ignored', blocked: true });
  const url = new URL(A.I18n.url('3d.html?c=abc&s=secret&preview#door-2'));
  assert.equal(url.searchParams.get('lang'), 'en');
  assert.equal(url.searchParams.get('s'), 'secret');
  assert.ok(url.searchParams.has('preview'));
  assert.equal(url.hash, '#door-2');
  let saved = false;
  A.I18n.beforeChange = async () => { saved = true; };
  await A.I18n.setLocale('fr');
  assert.ok(saved);
  const next = new URL(location.assigned);
  assert.equal(next.searchParams.get('lang'), 'fr');
  assert.equal(next.searchParams.get('c'), 'abc');
  assert.equal(next.searchParams.get('s'), 'secret');
});

test('a failed editor save prevents navigation during a language switch', async () => {
  const { A, context, location } = boot();
  const picker = { value: 'fr' };
  context.document.getElementById = () => picker;
  A.I18n.beforeChange = async () => { throw Error('offline'); };
  await A.I18n.setLocale('fr');
  assert.equal(location.assigned, undefined);
  assert.equal(picker.value, 'en');
});

test('switching languages translates existing presets while preserving personal messages and photos', () => {
  const en = boot().A, fr = boot({ search: '?lang=fr' }).A;
  for (const theme of en.THEME_ORDER) {
    for (let i = 0; i < 24; i++) {
      const translated = fr.I18n.localizePreset(en.CONTENT[theme][i]);
      const restored = en.I18n.localizePreset(translated);
      for (const field of ['text', 'title', 'body', 'q', 'a', 'caption']) {
        if (en.CONTENT[theme][i][field]) assert.equal(restored[field], en.CONTENT[theme][i][field], `${theme} day ${i + 1}: ${field}`);
      }
    }
  }
  const personal = { type: 'message', text: 'Copy', personal: true };
  assert.equal(fr.I18n.localizePreset(personal), personal);
  const photo = { type: 'photo', caption: 'Our special day', photoId: 'private-photo', personal: true };
  assert.equal(en.I18n.localizePreset(photo), photo);
});
