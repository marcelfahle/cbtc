# Holding page: mobile reading order (16 November 2026)

Verdict: shipped and checked live. Commit 432983d on main, production deploy costablancatrailcamp-jimlcc57j (Ready), https://www.costablancatrailcamp.com/

## What changed
- Phones and tablets (under 900px) now read: logo → "Women-only trail-running camps on Spain's Costa Blanca" + "Mountain trails…" → photo → "Thank you for all the love", text, signature, form.
- Done in the source order, not with CSS `order`: the blaze and the two intro lines moved out of the thank-you section into `<div class="intro">` before the photo. Screen readers and keyboard follow the same order. Each line appears once.
- Desktop (900px and up): grid areas put intro and thank-you in the left column, photo spanning both rows on the right. Screenshots at 900, 1024 and 1440 are pixel-identical to before.
- Photo on phones: min(92%, 30rem) → min(80%, 26rem) (390px: 328 → 285px wide). `sizes` updated to match. Stylesheet link versioned (`holding.css?v=3`).
- No copy, form markup or form behaviour changed. Test added for source order and no duplicate intro.

## Verification
- npm test: 53 pass, 0 fail. npm run build: ok.
- Geometry + screenshots at 320, 390, 768, 900, 1024, 1440, locally and live: live identical to local; desktop identical to the pre-change build.
- scripts/qa-holding.mjs (mocked /api/apply) locally and on production at 320/390/768/1024/1440: no sideways scroll, keyboard order, validation, error/retry, double submit, success: pass.
- scripts/verify-live-signup.mjs: live HTML byte-identical to the build, API validation 400s and honeypot 200. No deliverable email submitted.
- Live accessibility tree at 390: banner → intro paragraphs → figure/img → region "Thank you for all the love".
- Note: scripts/qa-context-copy.mjs compares the body to an old commit (0693f39); it was already out of date after the signup form change.

## Screenshots
/home/openclaw/.openclaw/workspace/media/cbtc-mobile-order-2026-11-16/
- before/ (pre-change build), local/, live/ — full pages per width; live/320-top.png, live/390-top.png, live/768-top.png show the first screen
- local-form/, live-form/ — form QA states (390-errors, 390-filled, 390-success, 1440-success)
