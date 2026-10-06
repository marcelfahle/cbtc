import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
test('availability replaces application deadlines throughout the homepage', () => {
  assert.doesNotMatch(html, /applications? close|registrations? clos|confirmed by|\bSeptember\b|\d+ of \d+ open/iu);
  assert.match(html, /Last spots available/);
  assert.equal(html.split('Apply for one of the last spots').length - 1, 2);
  assert.doesNotMatch(html, /Apply for one of 8 spots/);
  assert.equal(html.split('Last spots available.').length - 1, 4);
});
test('camp dates and group capacity stay unchanged with simplified deposit copy', () => {
  assert.match(html, /28 Oct – 2 Nov 2026/);
  assert.match(html, /28 October – 2 November 2026/);
  assert.match(html, /8 women max/);
  assert.match(html, /Once you&#x27;ve decided and feel comfortable joining us, the deposit secures your place/);
});
