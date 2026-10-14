import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');
test('privacy draft preserves all placeholders and excludes internal notes', () => {
 const page = read('src/pages/privacy.astro');
 assert.match(page, /<RunnerPage/);
 for (const [placeholder, count] of [['[[NIF]]', 1], ['[[postal address]]', 1], ['[[contact email]]', 2]]) assert.equal(page.split(placeholder).length - 1, count);
 assert.doesNotMatch(page, /Draft by Jane|Notes for Al|Three blanks|Once live|proposals, not vault facts/);
 assert.equal((page.match(/<h2>/g) || []).length, 7);
});
test('privacy links survive homepage generation and exist in shared footer and banner', () => {
 for (const path of ['src/home.html', 'public/index.html']) {
  const html = read(path);
  assert.ok(html.includes('We only use your details to send you the dates. <a href="/privacy"'));
  assert.ok(html.includes('>Privacy policy.</a>'));
  assert.ok(html.split('</main><footer>')[1].includes('href="/privacy"'));
 }
 assert.ok(read('src/layouts/RunnerPage.astro').includes('href="/privacy"'));
 assert.ok(read('public/scripts/meta-pixel-consent.js').includes('<a href="/privacy">Privacy policy</a>'));
});
