import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

for (const path of ['public/index.html', 'src/pages/checklist.astro', 'src/pages/routes/benigembla.astro']) {
  test(`${path} has no outdated accommodation promises or venue disclosure`, () => {
    const copy = fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    assert.doesNotMatch(copy, /shared\s+(twin|rooms?)|end up sharing|own room most likely|most likely have your own room|\+€120|\bthe villa\b|boho|bungalow/iu);
  });
}
test('homepage explicitly includes a private room and personal retreat space', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(html, /Your own private room is included in the price/);
  assert.match(html, /Everyone has her own private room/);
  assert.match(html, /your own little oasis/);
});
test('packing checklist guarantees private occupancy', () => {
  const copy = fs.readFileSync(new URL('../src/pages/checklist.astro', import.meta.url), 'utf8');
  assert.match(copy, /your own private room/);
  assert.match(copy, /Your room is yours alone/);
});
