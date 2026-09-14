# CBTC application confirmation + fit-call CTA — 2026-09-14

## Commit

- Implementation: `7b248170a9403e58dcd7e2cf22cdcff43f00dd4f`

## What changed

- Replaced the cramped post-submit application message with a calm success panel:
  - Heading: `Application received`
  - Keeps the existing 48-hour promise: a real reply from Monika or Anna
  - Adds only logical next steps: we read the notes, explain fit/spot-hold if yes, nothing to pay or fill in now
  - Uses `role="status"`, `aria-live="polite"`, and focuses the success region after submit
- Added an optional secondary fit-call CTA near the application copy:
  - Hidden by default when no booking URL is configured
  - Revealed only after `/api/site-config` returns a valid HTTPS URL
  - No placeholder/fake/dead href is shipped
- Added `FIT_CALL_URL` as the runtime configuration key, exposed publicly only as a sanitized HTTPS URL through `/api/site-config`
- Kept submit behavior intact: `/api/apply` still posts first; Plausible fires after success; Meta `Lead` fires once after successful apply submission and only when consent tracking is available

## Setting to wire when Monika has the link

Set this environment variable in the deployment environment:

```bash
FIT_CALL_URL="https://calendar.google.com/..."
```

The CTA will remain hidden until that value is present and starts with `https://`.

## Checks

- `npm test` — 8 passing
- `npm run build` — passing
  - Note: build emits the existing local warning that Node 26 is not Vercel's function runtime; Vercel will use Node 24

## Screenshot artifacts

- Desktop mocked success state: `research/screenshots/apply-success-desktop.png`
- Mobile mocked success state: `research/screenshots/apply-success-mobile.png`

Mocking note: screenshots used a local static/API mock server returning `{ ok: true }` for `/api/apply`; no real application email or external form delivery was sent.

## Blockers / not done

- Booking URL is still missing, so production will correctly hide the secondary fit-call CTA until `FIT_CALL_URL` is set.
- No push or deploy performed.
