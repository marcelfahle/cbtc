# Migration plan: ploy.ai → self-hosted (exact recreation)

**Goal:** own the site's code with zero visual drift. ploy.ai has no export, but it
serves a small static Astro build — so we transplant, we don't redesign. The
current aesthetic is good; the whole plan is built around preserving it exactly.

**Status:** plan written 2026-07-05. Execution deferred — user is still iterating
copy inside ploy. Trigger this plan when ploy-side editing is done.

---

## 1 · What the site is (recon, 2026-07-05)

| Piece | Finding |
|---|---|
| Framework | **Astro** (static output; `astro-island`, `/_ploy_static/_astro/` paths) |
| Styling | **Tailwind CSS v4** (utility classes shipped in the HTML; compiled CSS uses v4 `@layer`/`--tw-*` patterns) |
| Interactivity | One **React island** for the application form; Astro client runtime |
| Form | POSTs JSON to **`/_ploy/form-submit`** (`{formName, pageUrl, ...fields}`) — ploy's backend. The only real dependency to replace. |
| Fonts | Google Fonts: **Archivo** (400–900) + **Source Sans 3** (400–900) |
| Images | 3 total, hosted on **ploy's GCS bucket** (`storage.googleapis.com/ployai/92f654e6-.../user/...`): hero PNG (6.2 MB — see §5), two coach photos (webp) |
| Meta | `og:image` = the hero PNG; favicon at `/favicon.ico` |
| Edge | Served via Cloudflare (`server: cloudflare`, cache HIT) |
| Weight | 1 HTML page (44 KB) + 1 CSS (60 KB) + 2 JS (~212 KB) + images |

**Snapshot** of all of the above: `ploy-snapshot/2026-07-05/`
(html, css, both js files, 3 images, favicon). Known-good version predating the
current round of ploy edits.

### Re-snapshot commands (run again at port time — hashes change on every ploy publish)

```bash
BASE="https://www.costablancatrailcamp.com"
UA="Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/126.0 Safari/537.36"
curl -sL -A "$UA" "$BASE/" -o site.html
# CSS/JS paths: read them out of site.html. Gotchas that bit us:
#   1. URL-encode the @ signs in the CSS filename (%40)
#   2. pass --compressed (server is gzip-only; without it you get 0 bytes)
curl -s --compressed -A "$UA" "$BASE/_ploy_static/_astro/index%40_%40astro.<HASH>.css" -o site.css
# images: grep -oE 'https://storage.googleapis.com[^"'"'"' ]*' site.html
```

---

## 2 · Port (Astro + Tailwind v4)

1. **Scaffold** in this directory: `npm create astro@latest` (empty template) +
   Tailwind v4. Git init first commit = scaffold only.
2. **Transplant markup.** Copy the page's `<body>` from the fresh snapshot into
   Astro components (`Hero`, `Concept`, `Itinerary`, `Coaches`, `LongDay`,
   `Pricing`, `Apply`, `Footer`). The Tailwind classes travel with the markup —
   rendering is identical by construction, responsive breakpoints included.
3. **CSS strategy:** day one, also ship the snapshot's compiled `site.css`
   verbatim (byte-identical rendering as a safety net). Once parity is
   confirmed, switch to our own Tailwind build and delete the snapshot CSS.
   Diff-check: our generated CSS should cover every class present in the HTML.
4. **Self-host images** in the repo/`public` — the GCS bucket belongs to ploy
   and presumably dies with the subscription. (Snapshot already rescued today's
   versions; re-pull at port time in case they changed.)
5. **Self-host fonts** via `@fontsource-variable/archivo` +
   `@fontsource-variable/source-sans-3` (or static weights 400–900 to match).
   Bonus: removes the Google Fonts hotlink — the polite choice for an
   EU-audience site (German case law frowns on Fonts hotlinking).
6. **Head parity:** title, meta description, og:* tags, favicon, canonical.
   Check live site for `robots.txt` / `sitemap.xml` and replicate if present.

## 3 · Form replacement (the one moving part)

- Rebuild the form as an Astro island (keep the React component, or plain JS —
  it's one form) posting to **our own endpoint** (`/api/apply`, Astro server
  endpoint on Vercel).
- Endpoint does two things: email each application to us (Resend; set up
  SPF/DKIM on a subdomain so notifications don't land in spam) and append to a
  Google Sheet or simple store as backup. Honeypot field + basic rate limit.
- Same UX: same fields, same success/error states as the live form.
- **Before cancelling ploy: export all application submissions from ploy's
  dashboard.** They live in ploy's backend and are gone when the account is.

## 4 · Parity verification (before any DNS change)

- Deploy to Vercel → preview URL.
- Playwright screenshot diff, preview vs. live, at 375 / 768 / 1280 / 1920 px:
  full-page captures, compare visually and by diff.
- Manual pass: hover states, focus states, form validation + a real test
  submission, lighthouse run, mobile nav (if any), og preview.

## 5 · Improvements to smuggle in (invisible ones only, at port time)

- **Hero PNG is 6.2 MB.** Convert to AVIF/WebP (~200–400 KB), keep a
  1200×630 JPEG/PNG variant for `og:image`. Biggest single perf win available;
  visually identical.
- `loading="lazy"` on below-fold images, `fetchpriority="high"` on hero.
- Anything *visible* (new sections from `site-copy.md`) waits until parity is
  confirmed — never mix the port and the redesign in one step.

## 6 · Cutover & rollback

1. Keep ploy live and untouched throughout.
2. Add domain to the Vercel project; it issues the DNS records needed.
3. In DNS (appears Cloudflare-managed — confirm where the zone actually lives):
   drop TTL, repoint apex + `www` to Vercel. Keep the www↔apex redirect
   behavior identical to today's.
4. Rollback = repoint DNS back to ploy. That's the whole rollback plan; this is
   why ploy stays paid during overlap.
5. Overlap 1–2 weeks: watch form deliveries, 404 logs, Search Console. Then
   export ploy form data (again), download any remaining assets, cancel ploy.

## 7 · Effort & sequence

| Step | Estimate |
|---|---|
| Re-snapshot + scaffold + transplant + images/fonts | ~2–3 h |
| Form endpoint + email wiring | ~1 h |
| Parity screenshots + fixes | ~1 h |
| Cutover + overlap monitoring | minutes + calendar time |

Phase 2 (after parity, in our own repo): implement `site-copy.md` — dates +
spots counter, founding-rate block, guarantee, acceptance timeline, Long Day +
logbook, value stack, waitlist + GPX lead magnet (needs an email tool —
Buttondown/MailerLite), Founding Eight, solo pricing.

## 8 · Risks / gotchas

- **Asset hashes change on every ploy publish** — always re-snapshot immediately
  before porting; don't port from a stale snapshot.
- **User is currently feeding new copy into ploy** — the 2026-07-05 snapshot is
  a safety net, not the port source.
- **GCS bucket + form backend are ploy-owned** — images rescued; submissions
  must be exported before cancellation.
- **Fonts weights**: match exact families/weights or text re-flows subtly.
- **Cloudflare specifics**: confirm who controls the DNS zone before cutover
  day; if it's ploy-managed rather than user-managed, moving the zone is an
  extra (small) step.
