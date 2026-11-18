import { createClient } from '@supabase/supabase-js';
export const json = (value, status = 200) => Response.json(value, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' },
});
export const adminClient = (env) => createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
export async function tokenHash(token) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export async function createShare(request, id, env, client = adminClient(env)) {
  const bearer = request.headers.get('Authorization')?.match(/^Bearer ([^\s]+)$/)?.[1];
  if (!bearer) return json({ error: 'Please sign in.' }, 401);
  const { data: auth, error: authError } = await client.auth.getUser(bearer);
  if (authError || !auth.user) return json({ error: 'Please sign in again.' }, 401);
  const { data: row, error } = await client.from('calendars').select('id,owner_id,document').eq('id', id).eq('owner_id', auth.user.id).maybeSingle();
  if (error) return json({ error: 'Could not load the calendar.' }, 503);
  if (!row) return json({ error: 'Calendar not found.' }, 404);
  const year = Number(row.document.year);
  if (!Number.isInteger(year) || year < 2020 || year > 2100) return json({ error: 'Check the calendar year before sharing.' }, 400);
  const expires = new Date(Date.UTC(year + 1, 1, 1)); // End of 31 January, UTC.
  if (expires.getTime() <= Date.now()) return json({ error: 'This calendar has expired.' }, 410);
  const token = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const { error: saveError } = await client.from('calendar_shares').insert({ token_hash: await tokenHash(token), calendar_id: id, expires_at: expires.toISOString() });
  if (saveError) return json({ error: 'Could not create the link. Please try again.' }, 503);
  return json({ token, expiresAt: expires.toISOString() });
}
export async function readShare(token, env, client = adminClient(env)) {
  const { data: share, error } = await client.from('calendar_shares').select('calendar_id,expires_at,revoked_at').eq('token_hash', await tokenHash(token)).maybeSingle();
  if (error) return json({ error: 'Could not load the calendar.' }, 503);
  if (!share || share.revoked_at) return json({ error: 'Calendar not found.' }, 404);
  if (Date.parse(share.expires_at) <= Date.now()) return json({ error: 'This link has expired.' }, 410);
  const { data: row, error: calError } = await client.from('calendars').select('id,owner_id,document,calendar_entitlements(status,expires_at)').eq('id', share.calendar_id).maybeSingle();
  if (calError) return json({ error: 'Could not load the calendar.' }, 503);
  if (!row) return json({ error: 'Calendar not found.' }, 404);
  const paths = [...new Set(row.document.days.map((day) => day.photoId).filter(Boolean))];
  // Administrative signing must never grant access to a different creator's photos.
  if (paths.some((path) => typeof path !== 'string' || !path.startsWith(row.owner_id + '/') || path.includes('..'))) return json({ error: 'This calendar has an invalid photo reference.' }, 422);
  const photos = {};
  if (paths.length) {
    const { data, error: photoError } = await client.storage.from(env.SUPABASE_STORAGE_BUCKET).createSignedUrls(paths, 3600);
    if (photoError || data.some((photo) => photo.error || !photo.signedUrl)) return json({ error: 'Could not load the photos. Please try again.' }, 503);
    data.forEach((photo) => { photos[photo.path] = photo.signedUrl; });
  }
  const entitlement = row.calendar_entitlements;
  const plan = entitlement?.status === 'active' && Date.parse(entitlement.expires_at) > Date.now() ? 'season' : 'free';
  return json({ calendar: { ...row.document, id: row.id, plan }, photos });
}
