import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
test('winter waitlist replaces old dates, scarcity and founding price', () => {
  assert.match(html, /Winter 2027/);
  assert.match(html, /late January \/ February 2027/);
  assert.match(html, /Exact dates coming soon/);
  assert.match(html, /data-form="waitlist"/);
  assert.doesNotMatch(html, /Last spots|Edition 1|October|November|2026|€1,350|founding runner|founding eight|48 hours|applications? close/i);
  assert.doesNotMatch(html, /data-form="apply"|name="running"/);
});
test('waitlist anchors, prices and provisional inclusions are consistent', () => {
  assert.match(html, /Shared room from €1,800/);
  assert.match(html, /Private room from €2,200/);
  assert.match(html, /Final pricing and exact inclusions will be announced together with the winter dates/);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), `Missing anchor ${id}`);
  assert.match(html, /Once you decide and feel comfortable joining us, your deposit secures your place/);
});
