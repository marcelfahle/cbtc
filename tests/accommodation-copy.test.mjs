import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
for (const path of ['public/index.html', 'src/pages/checklist.astro', 'src/pages/routes/benigembla.astro']) {
  test(`${path} does not promise old private-only accommodation or disclose venue`, () => {
    const copy = fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    assert.doesNotMatch(copy, /Everyone has her own private room|Your room is yours alone|Your own private room is included|\+€120|\bthe villa\b|boho|bungalow/iu);
  });
}
test('homepage publishes prices only for confirmed camps', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const row = id => html.split('id="' + id + '"')[1].split('</article>')[0];
  assert.match(row('february'), /€1,800/); assert.match(row('february'), /€2,200/); assert.match(row('february'), /10% off/);
  assert.doesNotMatch(row('spring'), /€/);
  assert.doesNotMatch(html.split('<header id="top"')[1].split('</header>')[0], /€/);
  assert.match(html, /What's included in the price/);
});
test('packing checklist is provisional and accommodates both room types', () => {
  const copy = fs.readFileSync(new URL('../src/pages/checklist.astro', import.meta.url), 'utf8');
  assert.match(copy, /Choose a shared or private room/);
  assert.match(copy, /provisional packing notes for winter/);
});
