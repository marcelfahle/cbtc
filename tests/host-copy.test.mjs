import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

for (const path of ['public/index.html', 'src/pages/checklist.astro', 'src/pages/routes/benigembla.astro']) {
  test(`${path} describes runners and hosts rather than coaches`, () => {
    const copy = fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    // Explicit disclaimers are permitted; positive coaching claims remain forbidden.
    const claims = copy.replace('not certified coaches', '').replace('rather than an ongoing individual coaching service', '');
    assert.doesNotMatch(claims, /\bcoach(?:es|ed|ing)?\b/i);
  });
}
test('host introduction explicitly describes experienced trail runners', () => {
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(html, /Hosted by two experienced trail runners who race internationally and know these mountains/);
});
