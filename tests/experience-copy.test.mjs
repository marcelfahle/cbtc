import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
test('winter copy includes all requested sections and experience level', () => {
  for (const phrase of ['Winter Edition', 'What is it?', 'Who is it for?', 'What your days look like', 'What do we learn?', 'What if it rains?', 'Run outside. Recover properly.', 'A small group — on purpose.', 'Monika &amp; Anna', 'How it works', 'Meet us before you decide', 'Winter 2027 — coming soon', 'Four mountain days. A small group of women. Somewhere beautiful to come back to.', 'You already have some experience on trails.', '2–4 hours on the trails']) assert.ok(html.includes(phrase), phrase);
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
  assert.deepEqual(imgs, ['/images/hero.webp','/images/anna.webp','/images/monika.webp','/images/anna.webp']);
});
test('companion pages contain no old edition dates or video analysis', () => {
  for (const path of ['src/pages/checklist.astro','src/pages/routes/benigembla.astro','src/layouts/RunnerPage.astro']) {
    const copy = fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    assert.doesNotMatch(copy, /October|November|2026|video review|video gets filmed|Edition 1/);
  }
});
