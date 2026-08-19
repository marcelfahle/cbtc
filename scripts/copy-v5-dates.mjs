// Copy v5 (2026-08-19): dates move to Option B, anchored one week after the
// Valencia Half (Sun Oct 25). Arrive Wed 28 Oct, 4 coached days Thu 29 Oct to
// Sun 1 Nov, depart Mon 2 Nov. Applications close pulled to 13 Sep (keeps a
// 6-week prep arc), balance date to 1 Oct, prep arc copy 8 -> 6 weeks.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../public/index.html', import.meta.url);
let html = readFileSync(FILE, 'utf8');

const one = [
  ['>25–30 Nov 2026</dd>', '>28 Oct – 2 Nov 2026</dd>'],
  ['>Edition 1 · 25–30 November 2026</p>', '>Edition 1 · 28 October – 2 November 2026</p>'],
  ['>25–30 November</p>', '>28 October – 2 November</p>'],
  ['Edition 1 · 25–30 November 2026 · Marina Alta', 'Edition 1 · 28 October – 2 November 2026 · Marina Alta'],
  ['Applications close 30 September; the eight are confirmed by 1 October.', 'Applications close 13 September; the eight are confirmed by 14 September.'],
  ['>30 September</dd>', '>13 September</dd>'],
  ['>1 October</dd>', '>14 September</dd>'],
  ['the balance by 1 November, in one or two payments', 'the balance by 1 October, in one or two payments'],
  ['December → your goal race', 'November → your goal race'],
  ['Weeks 1–8', 'Weeks 1–6'],
];

for (const [from, to] of one) {
  const parts = html.split(from);
  if (parts.length !== 2) {
    console.error(`FAIL (found ${parts.length - 1}x, need 1): ${from.slice(0, 60)}…`);
    process.exit(1);
  }
  html = parts.join(to);
}

// Meta + og + twitter descriptions (3 identical instances)
const metaParts = html.split('November sun');
if (metaParts.length !== 4) {
  console.error(`FAIL: "November sun" found ${metaParts.length - 1}x, need 3`);
  process.exit(1);
}
html = metaParts.join('autumn sun');

writeFileSync(FILE, html);
console.log('copy-v5-dates applied.');
