# Tiny Doors launch setup

Cloudflare Workers + Static Assets supports this plain HTML/CSS/JavaScript project. Supabase stores creator accounts, calendars and private photos; the Worker handles Checkout, verified payments and read-only recipient links.

## Implemented

- Searchable English/French public homepages, search/social metadata, canonical/language tags, site identity structured data, sitemap/crawler rules, app/preview noindex protection and a complete favicon set. See [SEO.md](SEO.md).
- Nine illustrated worlds, with two free and seven premium choices.
- Supabase email magic-link sign-in, cloud save/reload, account-specific calendar lists and private photos.
- Account-free recipient links with hashed tokens, expiry and signed photo URLs.
- **A$6.99 once for a Christmas Season Pass covering up to 5 premium calendars**, all premium worlds, unlimited photos and no Tiny Doors credit. A creator can edit and resend each calendar without consuming more slots. Free calendars and drafts do not count. Explicit activation uses a seasonal slot permanently, including if the calendar is later deleted.
- Authenticated Stripe Checkout, fixed return URLs, server-only price selection, signature-verified webhooks, server-confirmed return handling, durable checkout idempotency, transactional fulfillment and concurrent five-slot enforcement.
- Full refunds revoke the account pass and its allocated calendar entitlements; partial refunds retain access. Refunded passes currently need support for repurchase in the same season.
- English and French checkout/activation messages, including usage and exhaustion states.
- Public-only `dist/` build, pinned dependencies, syntax/unit tests and optional live Supabase integration tests.

## Current release status — 19 November 2026

**Custom domains are connected:** [tinydoors.app](https://tinydoors.app/) opens the public bilingual homepage over HTTPS (the editor is at /editor.html), and [www.tinydoors.app](https://www.tinydoors.app/) redirects to it while preserving paths and query parameters. They use the separate `tinydoors` Worker configured in `wrangler.production.jsonc`. Deploy subsequent production changes with `npm run deploy:production`; the default `npm run deploy:preview` still targets only the test preview. Production is configured for cloud accounts at APP_URL=https://tinydoors.app, with paid checkout disabled until live Stripe settings are installed.

The user confirmed preview email sign-in now works. Add the production `/auth.html`, `/auth.html?lang=en` and `/auth.html?lang=fr` URLs to Supabase's redirect allowlist and use https://tinydoors.app as Site URL when moving sign-in to the public domain. Keep the existing preview callback URLs for testing.

Local `.env` remains **APP_MODE=prototype**. It uses browser-only IndexedDB and a demo pass, so prototype links only work in the creating browser. Cloud mode is implemented and refuses incomplete configuration rather than falling back to local saves.

The connected Supabase database has all four migrations applied, including support for 12-door schedules and private video clips. Stripe's active test Price is one-time **AUD 699 cents**. The Worker bundle dry-run passes. `/api/health` reports configuration status and deliberately keeps `paidLaunchReady: false` until the remaining launch checks are complete.

**Preview is deployed:** [open the editor](https://tinydoors-preview.christophe-cresson.workers.dev/editor.html?new). Cloudflare permissions now work, and the three private runtime secrets are installed. `keep_vars: true` in wrangler.jsonc preserves dashboard-configured runtime variables on subsequent deployments; a normal `npm run deploy:preview` was verified after setup.

Stripe test webhook `we_1UdHiAFogonkf7hHdqw7Dkoh` is enabled at the preview's `/api/stripe/webhook` for the three supported events. Its signing secret is installed in Cloudflare and the ignored local .env; it is a hosted test secret, not the earlier CLI secret. Production still needs its own live webhook and signing secret.

**Hosted checks passed:** cancellation returns to the saved calendar without using a slot; retry reuses the same session; a real AUD A$6.99 sandbox purchase returns automatically to the editor and activates one slot; its signed payment webhook was processed with no pending deliveries. A signed-out recipient opened the shared 3D calendar. A full sandbox refund arrived through the hosted webhook, revoked the pass and blocked the old premium link. All 38 tests pass, and test accounts/app fixtures were removed; no real money was charged. The preview and webhook remain deployed.

**Production sign-in still needs its callback update:** preview email sign-in was confirmed working by the user. In [Supabase Auth URL Configuration](https://supabase.com/dashboard/project/sfrrucfzrqgyjltfkyrs/auth/url-configuration), add the production callback URLs listed above and verify a sign-in email on tinydoors.app. Before enabling live payments, separate preview/test data from production data, or explicitly exclude test purchases from production entitlement checks; the preview and production currently use the connected Supabase project.

## Account and payment ownership

The creator signs in with an email link. Supabase assigns a stable `auth.users.id`; calendars and the pass are attached to that ID, never to a browser or a client-supplied email address. Signing in with the same account on another device restores the collection. Recipients only need their read-only link.

The server validates the user's Supabase token, calendar ownership and season. It retrieves the configured Stripe Price and requires one-time AUD 699 cents. Checkout uses card payments; Adaptive Pricing is explicitly disabled while fulfillment requires the exact AUD amount. Changing price/currency requires updating server validation and UI together.

Return-page confirmation and webhooks retrieve authoritative Stripe state before granting the pass. Browser JSON cannot write a plan, claim another creator's payment, allocate a sixth calendar, or grant a pass from a success URL alone.

## Deploy changes

Run these commands in Terminal from your local checkout:

```sh
cd /home/chris/Sites/personal/advent
nvm use 24
npm run deploy:production
```

`deploy:production` runs the checks, builds the app, and publishes it to
[https://tinydoors.app](https://tinydoors.app), including the `www` domain,
using `wrangler.production.jsonc`. It deploys the current local files; commit
and push separately if you also want to save those changes to GitHub.
Pushing to GitHub alone does not automatically deploy this repository.

On a fresh checkout, run `npm ci` first to install dependencies. If Node 24
is not installed in nvm, run `nvm install 24`. If Cloudflare asks you to sign
in, run `npx wrangler login`, complete the browser sign-in, then retry the
deployment. Existing deployment credentials can also be used as described below.

For the separate test site, use:

```sh
npm run deploy:preview
```

This publishes to
[https://tinydoors-preview.christophe-cresson.workers.dev](https://tinydoors-preview.christophe-cresson.workers.dev)
using `wrangler.jsonc`.

After deploying, open the site and test the changed feature. If the browser
still shows an older version, reload the page. Database migrations are separate
from app deployment: when a change includes a new migration, apply it to the
intended Supabase project before deploying code that needs it. Do not reapply
the migrations listed as already applied in the Database section.

## Local development

Use Node 24 (see `.node-version`):

```sh
npm ci
npm run check
npm run dev
```

Open `http://localhost:8787/editor.html?new`. Rebuild/restart after source changes. Use this public-only Worker server once `.env` contains secrets; a static server pointed at the repository can expose dotfiles and has no Worker API.

For restricted local environments where Wrangler cannot write its normal config directory:

```sh
XDG_CONFIG_HOME=/tmp/little-doors-config WRANGLER_SEND_METRICS=false npm run deploy:dry-run
```

`.env.example` lists all settings. `.env` is ignored by Git; `npm run check:env` prints missing/placeholder names without revealing values. Hosted Checkout does not require a browser Stripe publishable key.

To test cloud mode locally, use a separate private environment file with `APP_MODE=cloud`, the Supabase settings, Stripe **test** key/Price and a Stripe CLI signing secret. `stripe listen --forward-to localhost:8787/api/stripe/webhook` forwards signed test events. Its `whsec_...` is separate from a hosted endpoint's signing secret. Localhost tests with production `APP_URL` must manually return to the local editor; hosted testing must verify the actual redirect.

## Database

These migrations are already applied to Tinydoors (`sfrrucfzrqgyjltfkyrs`); do not re-run them there:

1. `supabase/migrations/20261118104307_launch_foundation.sql`
2. `supabase/migrations/20261118105907_season_pass_checkout.sql`
3. `supabase/migrations/20261120024845_calendar_schedules_and_video.sql`
4. `supabase/migrations/20261121000000_season_pass_calendar_limit.sql`

The first creates owner-isolated calendars, per-calendar entitlements, hashed share tokens, payment-event records and a private 10 MiB JPEG bucket. The second adds account/season passes, an immutable allocation ledger, checkout reservations and service-only transactional functions. The third accepts 12 or 24 doors and enables private WebM/MP4 clips with the existing 10 MiB limit. New projects need all four migrations in order. Existing browser drafts are not uploaded automatically.

The fourth gives each Season Pass its own premium calendar limit (default 5, the paid amount).

### Give an account more premium calendars

To give an account (for example your own, for marketing calendars) more than five premium calendars for a Christmas, run this in the Supabase SQL editor after the migration above. Change the email, the season year (the Christmas the calendars are for) and the limit:

```sql
insert into public.season_passes (owner_id, season_year, stripe_checkout_session_id, stripe_payment_intent_id, status, expires_at, calendar_limit)
select id, 2026, 'manual:' || id || ':2026', 'manual:' || id || ':2026', 'active', make_timestamptz(2027, 2, 1, 0, 0, 0, 'UTC'), 100
from auth.users where email = 'you@example.com'
on conflict (owner_id, season_year) do update set calendar_limit = excluded.calendar_limit;
```

If the account has no pass yet, this creates an active one without a Stripe payment. If it already bought one, only the limit changes. The editor then shows the new total, and each activated calendar still uses one slot.

Every app table has RLS. Creators can manage only their calendars and read only their pass/slots. They cannot write payment data or invoke payment/activation functions directly. The Worker uses the server-only Supabase secret key. The three server-only tables intentionally have no browser grants/policies, explaining the informational [RLS-without-policy notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

`node --env-file=.env tools/test-season-pass.mjs` optionally runs live database checks with temporary confirmed accounts, no emails and no Stripe charges. It removes fixtures in `finally`. It verifies ownership, RLS, seven concurrent requests yielding exactly five allocations, replay/refund behavior and checkout reservation concurrency.

## Cloudflare preview

The configured Worker name is `tinydoors-preview`. Deploy the Worker and **only `dist/`** as its static assets:

```sh
npm run check
npm run deploy:dry-run
npm run deploy:preview
```

Wrangler can use local login or local/CI `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. These two credentials are for deployment, not Worker bindings. For Git builds, build with `npm ci && npm run check && npm run build`, then deploy with `npx wrangler deploy`.

Deploying does **not** upload `.env`. Add Worker secrets:

```sh
npx wrangler secret put SUPABASE_SECRET_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

Add Worker variables `APP_MODE=cloud`, `APP_URL` set to the exact preview HTTPS origin, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_STORAGE_BUCKET=calendar-photos` and `STRIPE_SEASON_PASS_PRICE_ID` (AUD). For local-currency pricing also add `STRIPE_SEASON_PASS_PRICE_ID_USD`, `_EUR`, `_GBP`, `_CAD`, `_NZD` and `_CHF`; each must match the amount in `server/pricing.js`, and any left unset falls back to AUD. Keep test and live settings separate: Price IDs differ between modes.

Register the reachable preview origin's `/api/stripe/webhook` in **Stripe test mode**, subscribing to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `charge.refunded`

Put that endpoint's signing secret in the preview Worker. Unpaid/failed payments never grant a pass. Checkout currently allows cards only; the async-success handler is present for future payment-method expansion.

## Before public launch

1. Configure production SMTP in Supabase Auth. Set Site URL to `https://tinydoors.app`, allow `https://tinydoors.app/auth.html` (including language query variants where needed), and verify real delivery. The default implicit magic-link template works; [magic-link-email.html](magic-link-email.html) is an optional token-hash template for cross-device links. Do not use a numeric OTP-only template with this link UI.
2. Verify the full preview flow: creator sign-in → save → test Checkout → five premium calendars → share → recipient on a different device; cancel/retry/refund, blocked sixth allocation, account isolation, private photos, mobile capture and 3D fallback.
3. Decide and implement server-side future-door filtering if future surprises must remain secret from recipients inspecting network responses. Current date locks are in the browser.
4. Add public privacy/refund/support information. Existing calendars expire at 1 February UTC following their Christmas year.
5. Create the live one-time AUD A$6.99 Price and live webhook; use live keys only after test payment/refund verification. Attach `tinydoors.app` as a Cloudflare custom domain and verify HTTPS, sign-in callback and Checkout return URLs on it. Keep the preview on test Stripe values.

## References

- [Cloudflare Static Assets](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Cloudflare secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Supabase passwordless email](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Stripe Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment)
- [Stripe webhook verification and retries](https://docs.stripe.com/events/manage-webhook-endpoints)
