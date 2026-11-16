# Holding-page signup: name, where from, optional running (16 November 2026)

Verdict: shipped and checked live. Commit 123db85 on main, production deploy costablancatrailcamp-l46ccww55 (Ready), https://www.costablancatrailcamp.com/

## What changed
- One inline form on the existing thank-you page, no modal. Fields: Your name, Where you're from (placeholder "Town or country"), Email, all required. "Tell us about your running (optional)" is a closed disclosure with a textarea.
- Headline, photo, sunrise valley, "Camp sign-ups are currently closed", signature, consent line and unsubscribe links are unchanged. Only intro sentence changed: "Tell us who you are and we'll be in touch when there's news."
- Two columns (name | where from) from 481px; one column on phones. Full-width button on phones.
- Visible labels, autocomplete name/address-level2/email, inline errors with aria-invalid + aria-describedby, focus moves to the first wrong field, success message gets focus. Disclosure icon animation off under reduced motion.
- Success only after the server returns ok; provider failure shows an error and keeps the data for retry. Button disabled while sending, so a double tap sends once.
- Server (/api/apply, formName future-interest): requires name 2–120 chars, where from 2–120, valid email, consent; rejects links/angle brackets in name and where from; running note max 1,000; returns `field` so errors land on the right input. Honeypot kept (fake success, nothing sent). New per-instance throttle: 5 submits per IP per 10 minutes, then 429. Same name+email+where+note within 10 minutes is not sent twice. No CAPTCHA or paid service. There was no rate limiting before this change; the new throttle is per serverless instance, so it slows bursts but is not global.
- Notification (Resend email to APPLY_TO_EMAIL, the only storage): subject "[CBTC] Future camp updates: <name> (<where from>)", body lines Name, Email, Where from, running note or "not given (optional)", consent line, page, time. reply_to is the signer's email.
- Privacy policy (dated 16 November 2026) now lists name, where you're from and the optional running note.
- build-home.mjs: the FAQ JSON-LD scraper now skips `<details class="extra">` so the form is not published as an FAQ.

## Verification
- npm test: 53 pass, 0 fail (handler tests with mocked Resend: delivery fields, running note, validation per field, links, length, email-only rejected, honeypot, provider 500/network error not reported as success, double submit sends one, burst gets 429).
- npm run build: ok.
- scripts/qa-holding.mjs (Playwright, /api/apply mocked) locally and against production at 320, 390, 768, 1024, 1440: no sideways scroll, images load, keyboard order brand → name → where → email → disclosure → button, empty-submit errors and focus, error clears while typing, bad email blocked client-side, payload contents, provider failure → alert and retry, server field error, double click → one request, success focus. 390 ran with reduced motion.
- scripts/verify-live-signup.mjs against production: homepage byte-identical to committed build, holding.js and holding.css hashes match, privacy text live, live API returns 400 with the right field for missing name, missing/linked where-from, long note, bad email, email-only payload; honeypot 200.
- Screenshots: /home/openclaw/.openclaw/workspace/media/cbtc-signup-2026-11-16/{local,live}/ (320–1440 full pages, 390-errors, 390-filled, 390-success, 1440-success).

## Not done / gaps
- No real notification email was sent on production (by design). Proof that fields reach Resend is the handler test with a mocked Resend call plus live validation hitting the new code; the production env has RESEND_API_KEY, APPLY_TO_EMAIL, APPLY_FROM_EMAIL set (vercel env ls). One real test signup by Marcel would confirm the inbox end to end.
- No physical iPhone Safari or screen-reader pass.
- Signups still live only as emails in the hosts' inbox (and Resend's log). There is no list or database.

## The two email-only signups from 15 November
Untouched: they exist only as the notification emails already received. Nothing was sent to them and no names were added. If the hosts want their name and location, the low-key route is to ask when they next write to them, or the people can fill in the form again with the same email; the hosts would then get a second, complete notification.
