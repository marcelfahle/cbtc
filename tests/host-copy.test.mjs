import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

for (const path of ['public/index.html', 'src/pages/checklist.astro', 'src/pages/routes/benigembla.astro']) {
  test(`${path} describes runners and hosts rather than coaches`, () => {
    const copy = fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    assert.doesNotMatch(copy, /\bcoach(?:es|ed|ing)?\b/i);
  });
}
test('host introduction explicitly describes experienced trail runners', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(html, /experienced trail runners and your camp hosts/);
});
