// Copy v6 (2026-09-02): drop the trailing full stop from every h1/h2 headline.
// Mid-headline periods that separate two sentences stay; only the closing dot
// goes. The h3 labels never had one.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../public/index.html', import.meta.url);
let html = readFileSync(FILE, 'utf8');

const one = [
  ['Get good at mountains.</h1>', 'Get good at mountains</h1>'],
  ['Dark at 4pm where you live. Nineteen degrees here.</h2>', 'Dark at 4pm where you live. Nineteen degrees here</h2>'],
  ['A training camp, not a spa week. (There&#x27;s still paella.)</h2>', 'A training camp, not a spa week. (There&#x27;s still paella)</h2>'],
  ['You&#x27;re not booking four days.</h2>', 'You&#x27;re not booking four days</h2>'],
  ['Four days with a clear arc.</h2>', 'Four days with a clear arc</h2>'],
  ['The Long Day.</h2>', 'The Long Day</h2>'],
  ['Who it&#x27;s for.</h2>', 'Who it&#x27;s for</h2>'],
  ['Who should not come.</h2>', 'Who should not come</h2>'],
  ['Hosted by women who race for real.</h2>', 'Hosted by women who race for real</h2>'],
  ['The ratio is the product.</h2>', 'The ratio is the product</h2>'],
  ['The terms.</h2>', 'The terms</h2>'],
  ['You probably are. So is everyone else.</h2>', 'You probably are. So is everyone else</h2>'],
  ['Questions worth answering early.</h2>', 'Questions worth answering early</h2>'],
  ['Apply for the first Costa Blanca cohort.</h2>', 'Apply for the first Costa Blanca cohort</h2>'],
];

for (const [from, to] of one) {
  const parts = html.split(from);
  if (parts.length !== 2) {
    console.error(`FAIL (found ${parts.length - 1}x, need 1): ${from.slice(0, 60)}…`);
    process.exit(1);
  }
  html = parts.join(to);
}

writeFileSync(FILE, html);
console.log(`ok: ${one.length} headlines updated`);
