# Tiny Doors — SEO and favicon published, 19 November 2026

The SEO request is implemented and deployed to production and preview.

- Production root now serves a complete static marketing homepage (English `/`, French `/?lang=fr`), with a real snowy-village screenshot, creation steps, nine world links, features and FAQs. The editor remains at /editor.html, and saved editing/root query links keep routing to it. Explicit 2D/3D recipient URLs are unchanged.
- Added descriptive bilingual titles/descriptions, canonical URLs, reciprocal en/fr/x-default hreflang, Open Graph/Twitter cards, and valid WebSite/Organization JSON-LD.
- Added live /sitemap.xml (two public language pages only) and /robots.txt with the sitemap directive. App/private calendar/sign-in/payment-return pages are noindex via metadata and headers. Preview responses are all noindex; Wrangler's run_worker_first is true in both configs so static assets cannot bypass that middleware.
- Created a vector red-door favicon plus ICO 16/32/48, 48px PNG, Apple touch icon, 192/512px manifest icons, a manifest and bilingual 1200x630 social cards. Sources are in assets/brand; generated assets are included in the explicit public build.
- Local desktop and French mobile layouts passed, including a CTA opening the French editor. Live production English/French metadata and content, private/preview noindex headers, sitemap/robots and every icon/social/manifest asset were verified. Live homepage image loaded at 1280x720.
- All eight test files pass, including new indexing/build/routing coverage. Production deployment: 36dc2a20-999b-4a40-acea-c7a83d00044d. Preview: 74d9056a-3203-464d-98be-468e003f3c53. The paid-checkout configuration was not changed by this SEO work.
- Browser proof: /tmp/tinydoors-seo-homepage.jpg. Implementation and Search Console follow-up: docs/SEO.md.
- Google Search Console ownership/submission was not configured; it requires the owner's Google account. Verify tinydoors.app and submit https://tinydoors.app/sitemap.xml. No ranking or immediate Google favicon appearance is guaranteed.
- No commit was requested. Preserve all pre-existing/concurrent changes, including js3d/characters.js and css/editor.css.

Older updates below are historical and superseded where noted.

---

# Tiny Doors — custom domains connected, 19 November 2026

The user requested pointing the domains already hosted on Cloudflare. Completed:

- `https://tinydoors.app/` now serves the creator editor over verified HTTPS.
- `https://www.tinydoors.app/` redirects permanently (HTTP 308) to the main domain. Recipient paths, calendar tokens and language query parameters survive the redirect.
- Created a separate production Worker named `tinydoors`, leaving `tinydoors-preview` and its test billing configuration unchanged.
- Cloudflare Custom Domains created the DNS records and certificate bindings automatically; public A records now resolve to Cloudflare. No unrelated domain or email records were edited.
- New repository files: `wrangler.production.jsonc`, `server/production.js`, `tests/production.test.mjs`. Added `npm run deploy:production`. The wrapper opens the editor at `/` while explicit `/index.html` and `/3d.html` recipient pages keep working.
- All seven test files passed, including the three new production routing checks. Public HTTPS checks confirmed root/editor HTTP 200, production config APP_MODE=cloud and APP_URL=https://tinydoors.app, www redirect correctness, and the preview remaining in cloud mode with its own origin and test checkout enabled.
- Production has Supabase account settings and its server secret. **No Stripe secret, Price ID or webhook secret was installed on production**; checkoutAvailable is false and paidLaunchReady remains false. Domain connection is complete; live billing is not enabled.
- Production deployment before the account-secret update: f3d81f91-1740-4725-aefd-74e420810399. The secret upload creates a further deployed configuration version.

The user confirmed preview email sign-in works after updating Supabase URLs. The next Auth change is to add the production callbacks at https://tinydoors.app/auth.html (including ?lang=en and ?lang=fr) and switch Site URL to the production origin when ready. Keep preview callbacks if continued testing is wanted.

Remaining launch work: production Auth callback/delivery check, test/live entitlement isolation, live Stripe credentials/Price/webhook, privacy/refund/support pages, physical second-device checks, and server-side future-door filtering. No Git commit was requested or made. Older handovers below are historical and superseded by this update.

---

# Tiny Doors — hosted preview update, 19 November 2026

The user updated the Cloudflare token; **the deployment blocker is resolved**.

- Preview: https://tinydoors-preview.christophe-cresson.workers.dev/editor.html?new
- Worker: tinydoors-preview; latest checked deployment version 285a1186-8b7c-4413-9b18-0acd77bda26b.
- Runtime: APP_MODE=cloud, APP_URL set to the preview HTTPS origin, Supabase variables installed, three server secrets installed. Deployment credentials are not Worker bindings.
- Stripe test webhook: we_1UdHiAFogonkf7hHdqw7Dkoh at the preview /api/stripe/webhook; enabled for checkout.session.completed, checkout.session.async_payment_succeeded, charge.refunded. Signing secret saved to Cloudflare and the ignored local .env. Local APP_MODE remains prototype.
- Actual hosted browser flow passed: magic-link callback via a generated test token (no email sent), create/save premium calendar, Stripe cancel returns to saved calendar, retry reuses original session, sandbox A$6.99 card purchase automatically returns to preview, server confirmation activates 1 of 5 slots and creates recipient link.
- The direct hosted payment webhook was independently confirmed in stripe_webhook_events; Stripe reported zero pending deliveries. No Stripe CLI/local forwarder was involved.
- Signed out and opened the shared 3D world in another browser tab without an account. This verifies signed-out recipient access, not a physical second device.
- Hosted full sandbox refund succeeded; its direct signed webhook was processed, the pass was revoked and the old premium share returned HTTP 402. Test creator, calendars, shares, pass and event fixtures were removed; refunded transactions remain in Stripe sandbox history. No real money was charged.
- Deployed API checks: health 200; unsigned Checkout 401; unsigned webhook 400; /.env and /server/payments.js both 404.
- Added keep_vars=true to wrangler.jsonc so routine deployments preserve runtime variables configured in Cloudflare. Verified the standard npm run deploy:preview command: all 38 tests passed, build/deploy succeeded, and the configured cloud mode/preview origin/Checkout availability survived.
- Browser evidence: /tmp/tinydoors-hosted-pass.jpg and /tmp/tinydoors-hosted-recipient.jpg.

## Next user configuration

**Supabase Auth redirects are still at localhost:3000.** Generated links requested for both preview and tinydoors.app fell back to http://localhost:3000. The browser test used a direct token-hash callback, so it bypassed this email-redirect configuration limitation without changing any auth settings.

Open https://supabase.com/dashboard/project/sfrrucfzrqgyjltfkyrs/auth/url-configuration. While testing, set Site URL to https://tinydoors-preview.christophe-cresson.workers.dev and allow /auth.html plus the exact ?lang=en and ?lang=fr variants on that origin. Then verify SMTP by requesting a real sign-in email. At launch switch to tinydoors.app and verify its callbacks.

Still before public launch: live Stripe credentials/Price/webhook, production domain/HTTPS, privacy/refund/support pages, real email delivery, physical second-device checks, and server-side future-door filtering. Preview uses the connected Supabase project; separate test/live data or enforce payment-mode isolation before live billing, so a test purchase cannot become a production entitlement.

No new Git commit was requested or made. Preserve existing changes, including the user's js3d/characters.js work. The earlier handovers below are historical and superseded by this update.

---

# Tiny Doors — current status, 19 November 2026

## Completed today

- Reviewed the checkout integration and finished English/French usage, activation, exhaustion and refund messages.
- Updated Stripe Checkout to use `allowed_payment_method_types` with the current API. A real API test exposed that the old `payment_method_types` request is now rejected. Adaptive Pricing is explicitly disabled while server validation requires AUD 699 cents.
- Added prevention of repeat clicks, refreshed account/calendar entitlement state, retained pending Checkout IDs for retry, and rejected malformed request bodies and repeat checkout for a refunded seasonal pass.
- **Real Stripe sandbox Checkout succeeded for AUD A$6.99**, using Stripe's public test card. The signed `checkout.session.completed` event was forwarded by Stripe CLI to the local Worker, returned HTTP 200, and activated the account pass. The return handler verified payment, activated calendar 1 and produced its recipient link.
- **Five-calendar test passed with that actual sandbox purchase**: four more calendars activated; reactivating the first consumed no additional slot; the sixth returned HTTP 409 and its editor button was disabled; a free calendar still shared normally.
- **Actual full sandbox refund succeeded**. Its signed `charge.refunded` event returned HTTP 200, revoked the pass and all five calendar entitlements, blocked the old premium share link with HTTP 402, and kept the free link working (HTTP 200). The editor correctly shows “Season Pass refunded” and prevents another purchase of that refunded pass without support.
- Verified French UI and mobile width 390px without horizontal overflow (`documentWidth === innerWidth === 390`). Captured `/tmp/tinydoors-season-pass-mobile.jpg` while paid access was active.
- All six test files pass, including eleven payment cases. Worker bundle dry-run passes using the temporary Wrangler config directory. New live database fixtures and the temporary test creator were cleaned up; the refunded transaction remains only in Stripe test history.
- Added `supabase/.temp/` to .gitignore and rewrote docs/LAUNCH.md and README's outdated payment descriptions. Preserved user changes in js3d/characters.js.

## Blocker and remaining launch work

**Cloudflare refused initial preview deployment** at `tinydoors-preview/assets-upload-session`: “No access to the specified resource.” Token verification/account listing worked; no existing Worker was changed and Tiny Doors was not deployed. Give the deployment token **Workers product → Admin** for the intended account to create the preview Worker. After it exists, Editor can be scoped to that Worker. Alternatively, the user can create `tinydoors-preview` in the dashboard and give its token Editor access. Official guidance: https://developers.cloudflare.com/workers/authorization/workers/.

The expected preview origin is `https://tinydoors-preview.christophe-cresson.workers.dev`. After permissions are fixed: deploy the checked build, add preview runtime bindings/secrets (not deployment credentials), register the hosted Stripe **test** webhook at `/api/stripe/webhook`, and store its own `whsec_...`. No hosted webhook was registered while the endpoint remained unreachable.

The local test used the production APP_URL, so Stripe correctly attempted to redirect to tinydoors.app, which has no DNS/server yet. The signed payment event still succeeded. The local editor return path was opened manually with the real test Session ID and verified independently. **Actual hosted success/cancel redirects and a second-device browser flow still need verification after deployment.**

Production Supabase SMTP delivery, Auth Site URL/redirect allowlist, public privacy/refund/support information, live Stripe keys/Price/webhook and custom domain remain launch steps. Server-side future-door filtering remains unimplemented; browser locks alone do not hide future content from network inspection.

Local .env remains APP_MODE=prototype with the hosted webhook placeholder; the CLI signing secret was used only in a private temporary environment file. Test services are stopped at the end of the session. No live payment, public deployment or Git commit was made.

The original handover below is historical; this section supersedes its incomplete test/translation/build status and next-step ordering.

---

## Product decisions

- Domain/brand: **Tiny Doors**, https://tinydoors.app.
- **A$6.99 once per Christmas season**, not a subscription.
- A creator's Season Pass unlocks all seven premium worlds for **up to 5 premium calendars**. Each calendar can use a different world, recipient and rewards.
- Unlimited edits and resending an activated calendar. Sharing one calendar with multiple recipients still uses one slot.
- Free calendars and unactivated drafts do not use a slot. Explicit premium activation consumes a slot. Deleting an activated calendar does not restore the slot.
- Premium calendars and links expire at 1 February UTC following their calendar year (open through 31 January).
- Creators sign in using a Supabase email magic link. The stable `auth.users.id` owns calendars and the account/season pass; recipients need no account. Returning on another device with the same account restores access.
- User asked to complete as much as possible and leave blockers until the end, then explicitly paused implementation to continue tomorrow. Do not deploy live or claim launch is complete.

## Current implementation

New `server/payments.js` uses official Stripe SDK **23.1.0**, pinned in package.json/package-lock.json, with Fetch HTTP and Web Crypto for Cloudflare Workers.

Worker routes:

- `POST /api/checkout`: verifies Supabase bearer token and calendar ownership/year; retrieves server-configured Stripe Price and requires active one-time AUD 699 cents; uses fixed APP_URL return URLs; creates/reuses durable Stripe Checkout attempts with idempotency keys; an existing active pass activates a slot instead of charging again.
- `POST /api/checkout/confirm`: verifies signed-in checkout ownership and retrieves authoritative Stripe payment state. A success URL alone never grants access.
- `GET /api/season-pass?year=YYYY`: returns that creator's pass status, usage and allocated calendar IDs.
- `POST /api/season-pass` with `{calendarId}`: atomically allocates a premium calendar.
- `POST /api/stripe/webhook`: verifies raw-body signature, handles checkout.session.completed, checkout.session.async_payment_succeeded and charge.refunded. Re-fetches Stripe session/payment/charge state; validates price, quantity, paid status, amount, currency and test/live mode before fulfillment. Full refunds revoke the pass and its calendar entitlements; partial refunds currently retain access. A late success event cannot restore a revoked purchase.

`server/config.js` exposes only a boolean `checkoutAvailable` in addition to existing safe public account config. `server/worker.js` health reports `stripe-configured` if the three Stripe settings are present; `paidLaunchReady` intentionally remains false until actual launch verification.

Editor wiring in `js/editor.js` and `editor.html`:

- Checkout replaces the disabled cloud “coming soon” button, but remains unavailable with an unset webhook secret.
- Saves before leaving for Stripe; returns to the calendar; confirms payment server-side; activates the calendar; handles cancellation and pending/error messages.
- Shows account/season usage and an activation button for existing pass holders.
- Free sharing remains available; premium sharing still requires server-written per-calendar entitlement.
- Prototype mode retains an explicitly labeled demo grant.
- New English UI copy says up to 5 premium calendars. **French translations for the new strings still need adding** to `js/locales/fr.js` (English fallback works).

## Supabase: already applied remotely

Project **Tinydoors**, ref `sfrrucfzrqgyjltfkyrs`.

Migration history now:

1. `20261118104307_launch_foundation.sql` (previous work).
2. **`20261118105907_season_pass_checkout.sql`** (this session).

The new file was generated with the CLI, applied through the hosted migration tool and renamed to match the hosted timestamp. Do not apply it again to this project.

New tables:

- `season_passes`: primary key owner UUID + season year; Stripe session/payment-intent IDs; active/revoked; expiry.
- `season_pass_calendars`: immutable five-slot allocation ledger retained after calendar deletion. Unique calendar ID.
- `season_checkouts`: private durable checkout reservation, request key, Stripe session ID, original return calendar/language.

Existing `calendar_entitlements` now links to the account pass; its Stripe checkout session column is no longer unique because one purchase covers five calendars.

Service-only, SECURITY INVOKER functions:

- `reserve_season_checkout`: reuses attempts and renews an expired checkout safely.
- `fulfill_season_pass`: serializes fulfillment/refunds, writes the pass and event record transactionally, revokes all allocated entitlements when refunded.
- `activate_season_calendar`: locks the calendar and pass, checks ownership/year/expiry, allocates at most five slots even across concurrent requests, writes entitlement.

A trigger prevents changing the owner/year of an allocated premium calendar. RLS is enabled everywhere; creators can read only their own pass/slots, cannot write payment records or call privileged functions. Service-only tables deliberately have no browser policies.

## Verification completed

- `npm run check` passes: accounts, bell, cloud-db, deployment, i18n and new payments test files.
- `tests/payments.test.mjs`: nine cases covering authentication, ownership, server-only price selection, fixed redirects/idempotency, existing pass, payment validation, refunds, checkout confirmation isolation, genuine/tampered webhook signatures and slot-limit errors.
- **Live Supabase integration test passed** using `tools/test-season-pass.mjs`. Verified seven simultaneous activation requests produce exactly five successes, owner isolation, browser write/RPC denial, repeated activation, deletion retaining slot usage, season protection, duplicate fulfillment, full refund/revocation, late success replay and concurrent checkout reservation/renewal.
- Integration fixtures used artificial confirmed accounts and server-side payment fixtures. **No email sent, no Stripe session or charge created. All test users and payment event fixtures were removed successfully.**
- Re-run optional integration check with Node 24: `node --env-file=.env tools/test-season-pass.mjs`. Requires network access; only run against the intended project.
- `tests/season-pass.sql` is an additional rollback-only SQL test script. The hosted SQL tool returned an expired confirmation twice; it did not run. The successful API integration test covers its key cases and concurrency.
- Supabase security advisor has only INFO RLS-without-policy notices for calendar_shares, stripe_webhook_events and season_checkouts, intentionally service-only: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy.
- `npm run deploy:dry-run` built the static site successfully but Wrangler could not write under the read-only default ~/.config directory. **Re-run with `XDG_CONFIG_HOME=/tmp/little-doors-config WRANGLER_SEND_METRICS=false`**, as earlier sessions did. This is a local tooling-path issue; the new Stripe Worker bundle has not yet completed dry-run verification.

## Next work, in order

1. Review the new payment code and UI, add missing French translations, and update launch docs. `docs/LAUNCH.md` has a status note pointing here, but its older detailed instructions still say Checkout is unimplemented and need rewriting.
2. Finish Worker bundle dry-run with the temporary config directory. Node executable lives at `/home/chris/.nvm/versions/node/v24.18.0/bin/node`; prepend that directory to PATH for npm/Wrangler.
3. Test the actual editor flow in cloud mode, including existing pass activation, five-slot exhaustion, cancellation, returning from Stripe, network failure/retry and mobile layout. No browser/UI validation of this new flow has happened yet.
4. Configure a **test** Stripe webhook endpoint at the reachable preview origin `/api/stripe/webhook`, subscribe to the three handled events, store its `whsec_...` in the preview Worker and local .env if applicable. The existing `.env` webhook secret was a placeholder; no webhook endpoint has been registered by this implementation.
5. Run a real Stripe **test-mode Checkout** end to end, including retries and a full test refund. Unit tests use Stripe's real signature verifier but mocked Checkout/payment responses; actual Stripe Checkout has not been exercised.
6. Check edge cases before release: reused checkout started for calendar A then reopened from B returns to A (intentional original return target); repeat purchase after a full refund is currently rejected/requires support because a revoked account/season pass is terminal; decide whether self-service repurchase is needed. Do not charge twice for the same season. Signed recipient read still checks entitlements on every load.
7. Confirm production Supabase SMTP delivery, Site URL and callback allowlist. User supplied credentials but email delivery and redirects remain unverified. `.env` deliberately still uses `APP_MODE=prototype`.
8. Deploy a preview Worker with **test** Stripe values and preview APP_URL, then verify creator and recipient on different devices. Cloudflare deploy credentials are already in local .env. Environment files are not uploaded automatically; use Worker bindings/secrets. Do not expose secrets in logs/static output.
9. Before public launch: live Stripe Price/keys/live webhook, custom domain, privacy/refund/support details, actual sign-in/delivery, and a deliberate choice about server-side future-door filtering. Future-door locks currently live in the browser, so inspecting recipient responses can reveal future surprises.

## Files and working tree

Nothing was committed in this session. User did not request a new commit here.

New files: `server/payments.js`, new Season Pass migration, `tests/payments.test.mjs`, `tests/season-pass.sql`, `tools/test-season-pass.mjs`, this handover.

Changed here: `package.json`, lockfile, `server/config.js`, `server/worker.js`, `editor.html`, `js/editor.js`, `tests/deployment.test.mjs` (unknown-endpoint test now uses an actually unknown endpoint).

Pre-existing uncommitted work includes price changes in README/editor/French strings, launch docs and the foundation migration filename correction. **`js3d/characters.js` contains user/concurrent work: preserve it; do not attribute it to this task or overwrite it.**

Supabase CLI generated an untracked `supabase/.temp/` directory; inspect/exclude it before committing. `.env` is ignored and must never be committed. No deployment, actual payment, live email or Git commit was made.
