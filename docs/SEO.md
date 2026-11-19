# Tiny Doors search setup

Implemented 19 November 2026.

## Public pages

- English: https://tinydoors.app/
- French: https://tinydoors.app/?lang=fr
- Sitemap: https://tinydoors.app/sitemap.xml
- Crawler rules: https://tinydoors.app/robots.txt

The homepage is generated as complete HTML by tools/home.mjs during the public-only build. It contains a product explanation, a real screenshot of the 3D village, a three-step creation guide, nine linked world previews, original feature descriptions, FAQs and links to the editor. It needs no JavaScript or WebGL to show its content. Existing editor and recipient URLs remain available.

Each language has a descriptive title and meta description, a self-canonical URL, reciprocal English/French/x-default language links, Open Graph and Twitter image metadata, and WebSite/Organization JSON-LD. There are no fabricated ratings, reviews or availability claims. The sitemap lists only these two canonical marketing pages, with their language alternates. Tracking variants canonicalize to the relevant language page.

## Application pages and previews

Editor, sign-in and recipient pages carry noindex/nofollow/noarchive metadata and response headers. Private calendar and payment-return query variants are also noindex. The entire preview deployment is noindex, including generated marketing HTML and static responses. Both Wrangler configurations run requests through the Worker before assets so the indexing middleware cannot be bypassed by static serving.

robots.txt allows crawlers to read noindex directives on app pages; it does not block those pages from crawling. /api/ is disallowed and API responses also carry noindex. This is search visibility control, not authentication or a replacement for existing owner checks, private storage and share-token authorization.

## Brand assets

assets/brand/favicon.svg is the editable vector master: a cream-framed red little door, gold handle and star on navy. Published variants include the root /favicon.ico (16/32/48px), a 48px PNG for search, 180px Apple touch icon, and 192/512px manifest icons. Every built application page links to them, as do both homepages.

English and French 1200×630 social cards are available at /assets/brand/social-en.png and social-fr.png. The matching SVG sources are retained. The hero photo is an actual Tiny Doors snowy-world screenshot, not an AI-generated product screen.

## Search Console follow-up

Verify the tinydoors.app domain in Google Search Console with the owner's Google account, submit https://tinydoors.app/sitemap.xml, and inspect the English/French homepage URLs to request indexing. Search Console ownership has not been configured by this change. Rankings and favicon appearance depend on Google's subsequent crawling; no ranking guarantee is implied.

Monitor indexing, search queries and Core Web Vitals in Search Console after launch. The public page avoids loading the 3D engine, but a measured Lighthouse/Core Web Vitals audit has not been performed.

## Verification

Tests cover complete bilingual HTML, canonical/language tags and valid JSON-LD, private/public indexing boundaries, preview exclusions, sitemap scope, canonical redirects, favicon binary format, social image dimensions and the actual deployment middleware configuration. Production and preview should also be checked after deployment because Cloudflare's managed robots.txt may prepend its own comments.
