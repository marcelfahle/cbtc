import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');
test('privacy policy includes approved controller details and excludes internal notes', () => {
 const page = read('src/pages/privacy.astro');
 assert.match(page, /<RunnerPage/);
 for (const [placeholder, count] of [['B72645211', 1], ['C/ Fora Mur 12', 1], ['hello@costablancatrailcamp.com', 4]]) assert.equal(page.split(placeholder).length - 1, count);
 assert.ok(!page.includes('[['));
 assert.ok(page.includes('No Rules Software SL'));
 assert.ok(!page.includes('They act on our instructions only'));
 assert.doesNotMatch(page, /Draft by Jane|Notes for Al|Three blanks|Once live|proposals, not vault facts/);
 assert.equal((page.match(/<h2>/g) || []).length, 8);
});
test('privacy links survive homepage generation and exist in shared footer and banner', () => {
 for (const path of ['src/home.html', 'public/index.html']) {
  const html = read(path);
  assert.ok(html.includes('By signing up, you agree to receive future camp updates by email.'));
  assert.ok(html.includes('>Privacy policy</a>'));
  assert.ok(html.split('</main>')[1].split('</footer>')[0].includes('href="/privacy"'));
 }
 assert.ok(read('src/layouts/RunnerPage.astro').includes('href="/privacy"'));
 assert.ok(read('public/scripts/meta-pixel-consent.js').includes('<a href="/privacy">Privacy policy</a>'));
});
