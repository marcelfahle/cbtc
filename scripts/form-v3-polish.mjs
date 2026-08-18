// Form v3 polish (2026-08-18):
// - Plausible analytics snippet into <head>
// - a11y: aria-labels on placeholder-only inputs, resize-y textarea
// - input ergonomics: autocomplete, spellcheck, maxlength mirroring server caps
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../public/index.html', import.meta.url);
let html = readFileSync(FILE, 'utf8');

const INPUT =
  'min-h-[3rem] rounded-lg bg-black/30 px-4 text-ploy-text-inverse placeholder:text-ploy-text-inverse/50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] outline-none focus:shadow-[inset_0_0_0_2px_rgb(214,166,64)]';
const TEXTAREA =
  'min-h-[7rem] rounded-lg bg-black/30 px-4 py-3 text-ploy-text-inverse placeholder:text-ploy-text-inverse/50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] outline-none focus:shadow-[inset_0_0_0_2px_rgb(214,166,64)]';

const swaps = [
  // Plausible into <head>
  [
    '</head>',
    `<!-- Privacy-friendly analytics by Plausible -->
<script async src="https://plausible.io/js/pa-Ph375L-pQZDyOfoQSaRdy.js"></script>
<script>
  window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
  plausible.init()
</script>
</head>`,
  ],
  // Apply form fields
  [
    `<input type="text" name="name" required placeholder="Your name" class="${INPUT}" value=""/>`,
    `<input type="text" name="name" required placeholder="Your name" autocomplete="name" aria-label="Your name" maxlength="200" class="${INPUT}" value=""/>`,
  ],
  [
    `<input type="email" name="email" required placeholder="Email address" class="${INPUT}" value=""/>`,
    `<input type="email" name="email" required placeholder="Email address" autocomplete="email" spellcheck="false" aria-label="Email address" maxlength="200" class="${INPUT}" value=""/>`,
  ],
  [
    `<input type="text" name="from" placeholder="Where would you fly from?" class="${INPUT}" value=""/>`,
    `<input type="text" name="from" placeholder="Where would you fly from?" aria-label="Where would you fly from?" maxlength="200" class="${INPUT}" value=""/>`,
  ],
  [
    `<textarea name="running" required rows="4" placeholder="Your running: how much you run, any trail time, the race on your mind" class="${TEXTAREA}"></textarea>`,
    `<textarea name="running" required rows="4" placeholder="Your running: how much you run, any trail time, the race on your mind" aria-label="Your running" maxlength="4000" class="${TEXTAREA} resize-y"></textarea>`,
  ],
  [
    `<input type="text" name="link" placeholder="Strava or Instagram, if you have one" class="${INPUT}" value=""/>`,
    `<input type="text" name="link" placeholder="Strava or Instagram, if you have one" autocapitalize="none" spellcheck="false" aria-label="Strava or Instagram link" maxlength="300" class="${INPUT}" value=""/>`,
  ],
];

for (const [from, to] of swaps) {
  const parts = html.split(from);
  if (parts.length !== 2) {
    console.error(`FAIL (found ${parts.length - 1}x, need 1): ${from.slice(0, 70)}…`);
    process.exit(1);
  }
  html = parts.join(to);
}

// Routes form email input (contextual: inside the routes form block)
const rIdx = html.indexOf('data-form="routes"');
const rEnd = html.indexOf('</form>', rIdx);
const rBlock = html.slice(rIdx, rEnd);
if (!rBlock.includes('<input type="email" name="email"')) {
  console.error('FAIL: routes email input');
  process.exit(1);
}
html =
  html.slice(0, rIdx) +
  rBlock.replace(
    '<input type="email" name="email"',
    '<input type="email" name="email" autocomplete="email" spellcheck="false" aria-label="Email address" maxlength="200"'
  ) +
  html.slice(rEnd);

writeFileSync(FILE, html);
console.log('form-v3-polish applied.');
