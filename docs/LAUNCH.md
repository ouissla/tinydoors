# Cloudflare launch setup

Cloudflare Workers + Static Assets fits this project: the front end is plain HTML/CSS/JavaScript, and Three.js renders on the visitor's device. Use Supabase for accounts, calendars and private photos, and a Worker for Stripe and recipient access. No framework migration or Node server is needed.

## What is ready

- All nine world choices have illustrated thumbnails; free worlds and the seven-world Season Pass have separate sections.
- A repeatable public-only `dist/` build, a pinned Wrangler dependency/lockfile, Node version, syntax checks and deployment tests.
- A Cloudflare Worker with public configuration, health checks, authenticated share-link creation and account-free, read-only recipient access. Hosting uses the `ASSETS` binding; `/api/*` reaches the Worker.
- Supabase magic-link sign-in, callback/error screens, restored sessions, account-specific calendar lists, cloud calendar/photo storage, and signed photo URLs.
- `.env` for your local placeholders and `.env.example` for the tracked template. No keys are embedded in the built site.
- A Supabase migration with creator-only calendars, separate server-managed entitlements, hashed share tokens, webhook deduplication and a private photo bucket.

## Current release boundary

**The default remains `APP_MODE=prototype`.** It uses IndexedDB and the demo upgrade, so its links work on the creating browser only. Set `APP_MODE=cloud` after applying the migration and configuring Supabase. Cloud mode uses the implemented sign-in, persistent storage and recipient-sharing paths. It refuses incomplete cloud configuration instead of silently falling back to local storage.

**Stripe Checkout is not implemented yet.** The cloud-mode upgrade button is disabled, and `/api/health` always reports `paidLaunchReady: false`. Adding Stripe keys does not implement payments. Credentials, email delivery and database policies must still be verified against your project before launch.

The confirmed account model is **Supabase email magic-link sign-in for creators, with no account needed for recipients**. The migration assumes creators have an `auth.users` identity. No changes have been made to your live Supabase, Stripe or Cloudflare accounts.

## Install and preview

Use Node 24 (see `.node-version`).

```sh
npm ci
npm run check
npm run dev
```

Wrangler serves the local app, normally at `http://localhost:8787/editor.html?new`. Restart it or rebuild after source changes; this is intentionally a simple static build, not a live-reload framework.

The existing `python3 -m http.server 5178` preview still works for source files, but has no Worker API. `.env` contains placeholders only. Once you add real credentials, use `npm run dev`: a general-purpose file server serving the repository root can expose dotfiles.

## Preview deployment

```sh
npx wrangler login
npm run deploy:dry-run
npm run deploy:preview
```

The configured Worker is `tinydoors-preview`; use its returned `workers.dev` URL and append `/editor.html?new`. To use Cloudflare's Git build integration, select this repository, build with `npm ci && npm run check && npm run build`, and deploy with `npx wrangler deploy`.

Upload **only `dist/`** as static assets. The build intentionally excludes `.env`, Git metadata, SQL migrations, source tooling and this document. Keep the Worker alongside its static assets, rather than uploading the whole repository to Pages. Both Cloudflare Workers and Pages can host the front end, but the included deployment configuration targets Workers so API routes can live on the same origin.

## Fill in the environment

`.env` already exists with placeholders. If starting on a fresh checkout:

```sh
cp .env.example .env
```

| Setting | Where to find it | Intended use |
| --- | --- | --- |
| `APP_MODE` | Default `prototype`; change to `cloud` after Supabase setup | Select local prototype or account-backed storage |
| `APP_URL` | `https://tinydoors.app` | Fixed origin for authentication and Checkout redirects |
| `SUPABASE_URL` | Supabase project Data API settings | Project endpoint |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase API Keys | Browser/auth client; legacy `anon` also works |
| `SUPABASE_SECRET_KEY` | Supabase API Keys | Worker only; privileged database and photo-signing requests |
| `SUPABASE_STORAGE_BUCKET` | Default: `calendar-photos` | Must match the migration and Storage policies |
| `STRIPE_SECRET_KEY` | Stripe API keys, initially test mode | Worker-only Checkout session creation |
| `STRIPE_SEASON_PASS_PRICE_ID` | Stripe product catalogue | One-time A$12.95 Season Pass price, AUD |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint signing secret | Signature verification; separate test/live/CLI values |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account | Optional CLI/CI deployment credential |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Tokens | Optional scoped Workers deployment credential |

`npm run check:env` lists missing/placeholder names without printing values. It checks presence and HTTPS URL format; it cannot validate account access, a Stripe Price, database policies, or integration completeness. Hosted Stripe Checkout does not need a browser publishable key. Supabase-managed email sign-in does not require a separate email API key in this app; configure a production SMTP provider in Supabase Auth when enabling it.

Wrangler reads `.env` for local development. It does **not** upload `.env` when deploying. After the backend is connected, put private values in the intended Worker's Cloudflare secrets:

```sh
npx wrangler secret put SUPABASE_SECRET_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

Use the Worker's Settings → Variables and Secrets for `APP_MODE`, `APP_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_STORAGE_BUCKET`, and `STRIPE_SEASON_PASS_PRICE_ID`. Keep Cloudflare deployment credentials in your local environment or CI secret store, not in the browser or Worker bindings. Use separate test and live Stripe credentials.

## Finish the cloud integration before selling

1. Review and apply `supabase/migrations/202611180001_launch_foundation.sql` to your intended Supabase project (the file has not been applied). It creates new tables and does not migrate existing IndexedDB calendars. The bucket name is fixed in this initial migration; change both SQL and environment together if using another name.
2. Enable Email in Supabase Auth and configure production SMTP. Set Auth’s Site URL to the HTTPS `APP_URL` and add `APP_URL/auth.html` to the redirect allowlist. The default magic-link email works with the implemented implicit callback. For an explicit token-hash link that opens on any device, copy [the email template](magic-link-email.html) into Auth → Email Templates → Magic Link. Do not change it to a numeric OTP-only template: this UI expects a link.
3. Set the Supabase environment values and switch `APP_MODE=cloud`. The implemented adapter in `js/cloud-db.js` takes over from `js/db.js`; it never uploads local IndexedDB calendars automatically. Sign in and create a new cloud calendar. Existing prototype drafts remain on their original browser. Test save/reload, owner isolation, sign-out, expired-link recovery and all five calendar/photo methods against your live policies.
4. Verify the implemented Worker recipient endpoints: authenticated `POST /api/calendars/:id/share` creates a 256-bit token, stored only as a SHA-256 hash; `GET /api/shared/:token` returns read-only content and one-hour signed photo URLs. No public table/bucket policies are needed. Links expire after 31 January following the calendar year. The current date locks are still enforced by the viewer: add server-side filtering if future surprises must be inaccessible even to someone inspecting network responses or using `?preview`.
5. Create the one-time AUD Stripe Price and an authenticated `POST /api/checkout` route. The server selects the Price from its own environment and verifies calendar ownership. Use `APP_URL` to build fixed success/cancel URLs. Connect `buyBtn` to this route and replace the cloud-mode “coming soon” state. Keep the prototype demo grant out of the cloud flow.
6. Implement `POST /api/stripe/webhook` using Stripe's SDK: verify the signature against the **raw request body**, confirm the expected Price/currency/payment status and calendar owner, then transactionally record the event and activate the calendar entitlement. Handle duplicate/retried events, asynchronous payment success/failure and refunds. Never grant access just because the browser lands on the success URL.
7. Subscribe the Stripe endpoint to the payment/refund events actually handled by that implementation. Do not configure an endpoint at the current placeholder URL: it returns 404 until implemented.
8. Test on two browsers/devices: create → save → share → recipient opens the right doors/photos; owner A cannot read/edit owner B; a recipient cannot edit; unpaid clients cannot forge a pass; successful/retried/refunded test payments update access correctly. Verify mobile photo capture, 3D fallback and timezone boundaries.
9. Update the current prototype notices, demo checkout copy and launch/privacy/refund terms to match the working service. Use live Stripe keys/Price/webhook secret only after a complete test purchase passes. Attach `tinydoors.app` as the Cloudflare custom domain. Set Supabase’s Site URL to `https://tinydoors.app`, allow `https://tinydoors.app/auth.html`, and use `https://tinydoors.app/api/stripe/webhook` once that endpoint is implemented.

## Reference documentation

- [Cloudflare Static Assets bindings](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Cloudflare secrets and local environment files](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase private storage](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Stripe Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment)
- [Stripe webhook verification and retries](https://docs.stripe.com/events/manage-webhook-endpoints)
