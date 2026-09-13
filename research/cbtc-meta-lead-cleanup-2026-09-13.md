# CBTC Meta Lead cleanup — 2026-09-13

## Summary

Implemented the Astro/static-site Meta Pixel cleanup for CBTC.

- Pixel ID remains the existing static constant: `1606630404144793`.
- Meta `PageView` remains consent-gated and one-shot per page JS context.
- Meta conversion tracking now sends `Lead`, not the retired registration event.
- `Lead` is sent only after a successful `/api/apply` response for the real application form.
- `Lead` is not sent for routes requests, failed responses, or honeypot pseudo-successes.
- Plausible tracking, cookie banner UI, and consent policy were left unchanged.
- No Next.js dependency, env indirection, CAPI, PII, or consent-bypassing noscript was added.

## Files changed

- `public/scripts/forms.js`
  - Replaced the Meta application conversion event with `Lead`.
  - Added a per-form `data-meta-lead-tracked` guard so a successful real application can only emit one Meta Lead from this page context.
  - Preserved existing duplicate-submit guard, Plausible events, honeypot skip, and analytics exception protection.
- `tests/analytics.test.mjs`
  - Added deterministic Node tests for Meta consent/PageView behavior and form conversion behavior.
- `package.json`
  - Added `npm test` using Node's built-in test runner.

## Architecture audit

This site is Astro, not Next.js.

Current production-relevant client architecture:

- `public/index.html` is the homepage source and loads:
  - Plausible snippet in `<head>`.
  - `/scripts/forms.js` at the end of `<body>`.
  - `/scripts/meta-pixel-consent.js` at the end of `<body>`.
- `src/layouts/RunnerPage.astro` is used by runner-note pages and loads `/scripts/meta-pixel-consent.js`.
- `/api/apply` is Astro server code in `src/pages/api/apply.ts`.

Meta loader findings:

- The Meta loader is already consent-gated behind `cbtc_marketing_consent === "granted"`.
- The official Meta noscript image is intentionally omitted, which is correct because it cannot be consent-gated.
- Duplicate loader execution is guarded by `window.__cbtcMetaPixelInitialized`.
- Duplicate PageView execution is guarded by `window.__cbtcMetaPixelPageViewTracked`.
- No client-side route/navigation system was found; this is effectively real page loads plus normal anchor jumps. Anchor/click activity does not emit Meta events.

## Cause / taxonomy note

The actual production issue changed here was event taxonomy: successful real applications were sending Meta's registration-style conversion event from `public/scripts/forms.js`. Marcel requested the application conversion be counted as `Lead` instead, and not double-counted under both names.

I did not find an existing code path that emitted both the old registration event and `Lead` before this change; `Lead` was not present in the production scripts. The cleanup fully replaces the old Meta conversion call and adds an explicit one-shot guard for the new Lead event.

Existing behavior that was preserved:

- Routes form success still only keeps its existing Plausible event.
- Failed `/api/apply` responses restore the form UI and do not emit Meta Lead.
- Honeypot pseudo-successes still do not emit Meta Lead because the client sees the filled hidden `website` field.
- Plausible remains unchanged, including its existing success events.

## Test evidence

Local deterministic tests:

```text
npm test

✔ Meta Pixel waits for marketing consent, then initializes and tracks PageView once
✔ Meta Pixel does not send events without granted marketing consent
✔ apply success tracks Meta Lead once, never the retired registration event, after the API succeeds
✔ failed apply response restores UI and sends no Meta Lead
✔ routes success and honeypot pseudo-success do not send Meta Lead
✔ analytics exceptions do not break successful apply UI
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

Build / syntax verification:

```text
npm run build

[build] Complete!
```

Build warning observed but not caused by this change:

```text
[@astrojs/vercel] The local Node.js version (26) is not supported by Vercel Serverless Functions.
Your project will use Node.js 24 as the runtime instead.
```

Production-string check:

```text
CompleteRegistration refs in production files: none
```

## Commit and push

Code/test commit:

- SHA: `ce3af96766b6ea13fdd9424fc3adb79711ad7d6e`
- URL: https://github.com/marcelfahle/cbtc/commit/ce3af96766b6ea13fdd9424fc3adb79711ad7d6e
- Remote main after push: `ce3af96766b6ea13fdd9424fc3adb79711ad7d6e`

## Deployment proof

Public deployed asset checked with bounded polling:

- URL: `https://www.costablancatrailcamp.com/scripts/forms.js`
- Result: deployed on attempt 3/18.
- Evidence: status `200`, `cbtcTrackMetaEvent('Lead')` present, `data-meta-lead-tracked` present, old registration event absent.
- Vercel proof header from successful attempt: `x-vercel-id: fra1::q4pg9-1789325860167-94ff1e5bf315`, `age: 0`.

## Browser instrumentation

I attempted to run an OpenClaw browser-based stubbed verification against a local static server so no real application write would occur. The browser tool was unavailable in this environment: managed Chromium failed to start CDP and then entered cooldown after repeated launch failures. I therefore did not claim browser/Event Manager confirmation.

The deterministic Node tests cover the same intended instrumentation boundaries without making real network writes: Meta loader calls are stubbed, form `/api/apply` responses are stubbed, and no real Resend/API submission is performed.

## Remaining limitations

- I did not verify Meta Events Manager because I do not have that account/browser access here.
- I did not send a real application form submission; tests intentionally stub `/api/apply` to avoid real writes.
- Public deployment proof verifies the served JS asset content, not Meta's downstream attribution pipeline.
