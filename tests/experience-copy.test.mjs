import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
test('camp offers shared experience without individual coaching promises', () => {
  assert.match(html, /Find your feet in the mountains/);
  assert.match(html, /A real trail-running camp — with enough space to recover/);
  assert.match(html, /Hosted by two experienced trail runners who race internationally and know these mountains/);
  assert.doesNotMatch(html, /expert eyes|next twelve weeks|your fuell?ing numbers|booking four months|runner card|two focused sessions|group dinners|Get good at mountains/i);
});
test('local arrivals are welcome and form payload name is preserved', () => {
  assert.match(html, /Already live nearby\? Perfect\. No flight required\./);
  assert.match(html, /name="from" placeholder="Where are you coming from\?" aria-label="Where are you coming from\?"/);
  assert.doesNotMatch(html, /Where would you fly from/);
});
test('simple deposit copy and existing camp price and dates remain', () => {
  assert.match(html, /Once you&#x27;ve decided and feel comfortable joining us, the deposit secures your place/);
  assert.match(html, /€1,350/);
  assert.match(html, /28 Oct – 2 Nov 2026/);
  assert.match(html, /one group dinner/);
  assert.doesNotMatch(html, /balance by 9 October|deposit within/);
});
