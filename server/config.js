export const requiredSettings = [
  'APP_URL', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY',
  'SUPABASE_STORAGE_BUCKET', 'STRIPE_SECRET_KEY', 'STRIPE_SEASON_PASS_PRICE_ID', 'STRIPE_WEBHOOK_SECRET',
];
export function validateEnvironment(env) {
  return requiredSettings.filter((name) => {
    const value = env[name];
    if (!value || /REPLACE_ME|YOUR_|\.example\b/.test(value)) return true;
    if (name.endsWith('_URL')) {
      try { return new URL(value).protocol !== 'https:'; } catch { return true; }
    }
    return false;
  });
}

export function publicConfiguration(env) {
  if (!env.APP_MODE || env.APP_MODE === 'prototype') return { mode: 'prototype' };
  if (env.APP_MODE !== 'cloud') throw new Error('Invalid application mode');
  const missing = validateEnvironment(env).filter((name) => name.startsWith('SUPABASE_') || name === 'APP_URL');
  if (missing.length) throw new Error('Cloud account settings are incomplete');
  const key = env.SUPABASE_PUBLISHABLE_KEY;
  let publicKey = key.startsWith('sb_publishable_');
  if (!publicKey && key.split('.').length === 3) {
    try { publicKey = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'anon'; } catch { /* invalid legacy JWT */ }
  }
  if (!publicKey) throw new Error('A public Supabase key is required');
  const app = new URL(env.APP_URL);
  const supabase = new URL(env.SUPABASE_URL);
  if (app.username || app.password || app.search || app.hash || !['', '/'].includes(app.pathname) || supabase.username || supabase.password) throw new Error('Invalid project origin');
  return { mode: 'cloud', checkoutAvailable: ['STRIPE_SECRET_KEY', 'STRIPE_SEASON_PASS_PRICE_ID', 'STRIPE_WEBHOOK_SECRET'].every((name) => !validateEnvironment(env).includes(name)), appUrl: app.origin, supabaseUrl: supabase.origin, supabasePublishableKey: key, photoBucket: env.SUPABASE_STORAGE_BUCKET };
}
