# Three-camp homepage

Edit `src/home.html` for evergreen content and `public/scripts/camps.js` for camp facts/status. `npm run build:home` regenerates `public/index.html`; full build does this automatically. Only interest_open and details_soon are supported today; adding applications requires a separately approved flow, not merely a status change.

Form contract remains POST /api/apply `{formName, pageUrl, fields}`. New interest form uses `fields.camps: string[]` with january/february/march or exclusive later; omission means unspecified. Shared labels drive notification and success. Existing waitlist/apply/routes contracts remain supported.

Video: user-supplied authentic coastal footage, no location/itinerary claim. Jane’s stabilized slowed forward/reverse edit, re-encoded 540×960 H26424fps faststart silent, 13.75sec, 1,291,975 bytes. Original portrait composition is preserved in a 360px-wide story slot; never enlarged into a blurry wide hero. Poster is Jane’s first-frame WebP. One video only, no audio, no source assigned until on-screen and allowed; reduced-motion/save-data/2g keep poster, hidden/offscreen pause, both motion buttons pause all animations.

QA scripts use preinstalled Playwright on Albert (absolute import), no added browser dependencies. `QA_URL=http://localhost:4322 node scripts/qa-three-camps.mjs` after serving public on 4322. All browser form calls intercepted, no host email. Astro dev serves this historical public/index.html at /index.html, not /; use static server for homepage QA. Production Vercel filesystem serves / correctly. `node scripts/qa-contrast.mjs` samples backgrounds under text bounding rectangles.

Consent logic/Pixel ID unchanged; homepage banner now occupies document flow before hero instead of covering CTA. Companion pages retain original overlay behavior. No canonical vault changes.
