// Form v2 (2026-08-18): the application form actually asks about your running,
// as the copy promises. Adds: where-from, running textarea (required), optional
// Strava/Instagram link. Adds name="" attributes so forms.js stops guessing
// field keys from placeholders. Routes form: email input gets name="email".
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../public/index.html', import.meta.url);
let html = readFileSync(FILE, 'utf8');

const INPUT =
  'min-h-[3rem] rounded-lg bg-black/30 px-4 text-ploy-text-inverse placeholder:text-ploy-text-inverse/50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] outline-none focus:shadow-[inset_0_0_0_2px_rgb(214,166,64)]';
const TEXTAREA =
  'min-h-[7rem] rounded-lg bg-black/30 px-4 py-3 text-ploy-text-inverse placeholder:text-ploy-text-inverse/50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] outline-none focus:shadow-[inset_0_0_0_2px_rgb(214,166,64)]';

// --- Apply form: rebuild the inner grid ---
const applyIdx = html.indexOf('data-form="apply"');
if (applyIdx < 0) { console.error('FAIL: apply form not found'); process.exit(1); }
const gridStart = html.indexOf('<div class="grid gap-3">', applyIdx);
const gridEnd = html.indexOf('</div></form>', gridStart);
if (gridStart < 0 || gridEnd < 0) { console.error('FAIL: apply grid bounds'); process.exit(1); }

const newGrid =
  '<div class="grid gap-3">' +
  `<input type="text" name="name" required placeholder="Your name" class="${INPUT}" value=""/>` +
  `<input type="email" name="email" required placeholder="Email address" class="${INPUT}" value=""/>` +
  `<input type="text" name="from" placeholder="Where would you fly from?" class="${INPUT}" value=""/>` +
  `<textarea name="running" required rows="4" placeholder="Your running: how much you run, any trail time, the race on your mind" class="${TEXTAREA}"></textarea>` +
  `<input type="text" name="link" placeholder="Strava or Instagram, if you have one" class="${INPUT}" value=""/>` +
  '<button type="submit" class="flex min-h-[3rem] items-center justify-center rounded-lg bg-ploy-accent-primary px-6 text-base font-extrabold text-ploy-text-on-accent-primary transition hover:-translate-y-px hover:shadow-[0_14px_28px_rgba(76,36,24,0.4)] disabled:opacity-70">Apply for a spot</button>' +
  '<p class="text-center text-xs text-ploy-text-inverse/60">2-minute application · no payment yet</p>' +
  '</div>';

html = html.slice(0, gridStart) + newGrid + html.slice(gridEnd + '</div>'.length);

// --- Routes form: give the email input a name ---
const routesIdx = html.indexOf('data-form="routes"');
if (routesIdx < 0) { console.error('FAIL: routes form not found'); process.exit(1); }
const routesEnd = html.indexOf('</form>', routesIdx);
const routesBlock = html.slice(routesIdx, routesEnd);
if (!routesBlock.includes('<input type="email"')) { console.error('FAIL: routes email input'); process.exit(1); }
const patchedRoutes = routesBlock.replace('<input type="email"', '<input type="email" name="email"');
html = html.slice(0, routesIdx) + patchedRoutes + html.slice(routesEnd);

writeFileSync(FILE, html);
console.log('form-v2 applied.');
