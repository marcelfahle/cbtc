import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
test('winter copy includes all requested sections and experience level', () => {
  for (const phrase of ['Winter Edition', '4 mountain days', 'Small women’s group', 'Boutique stay + spa recovery', 'You already run.', 'Morning', 'Trail', 'Recover', 'Evening', 'Tired legs. Quiet head.', 'Nowhere else you need to be.', 'Some days are blue sky.', 'Some days are wet shoes.', 'Safety comes before any itinerary.', 'Run outside.<br>Recover properly.', 'A small group.<br>Time to know each other.', 'Monika &amp; Anna', 'How it works', 'Meet us before you decide', 'Make room for the mountains.', 'You already have some experience on trails.', '2–4 hours on the trails']) assert.ok(html.includes(phrase), phrase);
});
test('travel question welcomes all arrivals, no old performance or age copy remains', () => {
  assert.match(html, /name="from" placeholder="Where are you coming from\?" aria-label="Where are you coming from\?"/);
  assert.doesNotMatch(html, /Where would you fly from|W45|expert eyes|next twelve weeks|your fuell?ing numbers|runner card|Get good at mountains|video review|video analysis|assistant guides|individual training plan|race craft/i);
});
test('waitlist and Q&A are truthful about future openings', () => {
  assert.match(html, /data-qa-cta hidden/);
  assert.match(html, /data-qa-pending/);
  assert.match(html, /Booking opens when applications open/);
  assert.match(html, /several relaxed online meeting times available each week/);
  assert.match(html, /relaxed online group session before the camp/);
  assert.match(html, /no payment or commitment/);
});
test('existing photographs are retained', () => {
  const imgs = [...html.matchAll(/<img[^>]*src="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual([...new Set(imgs)], ['/images/hero.webp','/images/anna.webp','/images/monika.webp']);
  assert.equal(imgs.length, 6); // Existing trail image reused for the photo break and weather.
  assert.doesNotMatch(html.match(/<section id="hotel"[\s\S]*?<\/section>/)[0], /<img/); // No confirmed venue photographs exist.
});
test('companion pages contain no old edition dates or video analysis', () => {
  for (const path of ['src/pages/checklist.astro','src/pages/routes/benigembla.astro','src/layouts/RunnerPage.astro']) {
    const copy = fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    assert.doesNotMatch(copy, /October|November|2026|video review|video gets filmed|Edition 1/);
  }
});

test("hero leads with the experience without repeating the brand or tagline", () => {
  assert.match(html, /<h1[^>]*>The mountains first\.<br>The sauna afterwards\.<\/h1>/);
  assert.equal((html.match(/The mountains first\./g) || []).length, 1);
  assert.match(html, /Winter Edition · Costa Blanca · 2027/);
});
