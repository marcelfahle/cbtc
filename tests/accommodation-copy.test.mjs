import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
for (const path of ['public/index.html', 'src/pages/checklist.astro', 'src/pages/routes/benigembla.astro']) {
  test(`${path} does not promise old private-only accommodation or disclose venue`, () => {
    const copy = fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    assert.doesNotMatch(copy, /Everyone has her own private room|Your room is yours alone|Your own private room is included|\+€120|\bthe villa\b|boho|bungalow/iu);
  });
}
test('holding homepage does not publish pricing', () => {
 const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');assert.doesNotMatch(html,/€|10% off/);
});
test('runner notes are retired without dated promotional content',()=>{
 for(const path of ['src/pages/checklist.astro','src/pages/routes/benigembla.astro'])assert.match(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'),/Astro.redirect/);
});
