import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { camps } from '../public/scripts/camps.js';
const read = path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const html = read('public/index.html');
const site = 'https://www.costablancatrailcamp.com';
test('robots.txt points at a sitemap that exists and lists the homepage', () => {
 assert.match(read('public/robots.txt'), new RegExp(`Sitemap: ${site}/sitemap\\.xml`));
 const map = read('public/sitemap.xml');
 assert.match(map, new RegExp(`<loc>${site}/</loc>`));
 for (const path of ['/checklist', '/routes/benigembla']) assert.ok(!map.includes(site + path + '<'), path + ' is noindex and stays out of the sitemap');
});
test('homepage title and description target the search and fit the results page', () => {
 const title = html.match(/<title>([^<]*)<\/title>/)[1];
 assert.ok(title.length <= 60, title);
 assert.match(title, /Trail Running Camp/);
 const desc = html.match(/<meta name="description" content="([^"]*)"/)[1];
 assert.ok(desc.length >= 120 && desc.length <= 160, String(desc.length));
 for (const tag of ['og:url', 'og:type', 'og:site_name', 'og:image', 'twitter:image']) assert.ok(html.includes(`"${tag}"`), tag);
});
test('structured data is valid JSON and matches the confirmed camp data', () => {
 const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
 assert.equal(blocks.length, 1);
 const graph = JSON.parse(blocks[0][1])['@graph'];
 const types = graph.map(n => n['@type']);
 for (const t of ['Organization', 'WebSite', 'Event', 'FAQPage']) assert.ok(types.includes(t), t);
 const events = graph.filter(n => n['@type'] === 'Event');
 const dated = camps.filter(c => c.dates?.start);
 assert.equal(events.length, dated.length, 'only camps with confirmed dates get an Event');
 for (const c of dated) {
  const e = events.find(e => e.startDate === c.dates.start);
  assert.ok(e && e.endDate === c.dates.end, c.id);
  assert.deepEqual(e.offers.map(o => o.price), c.price.rows.map(([, a]) => a.replace(/\D/g, '')));
 }
 const faq = graph.find(n => n['@type'] === 'FAQPage');
 assert.equal(faq.mainEntity.length, (html.match(/<details>/g) || []).length);
 assert.ok(faq.mainEntity.every(q => q.name && q.acceptedAnswer.text && !/[<>]/.test(q.acceptedAnswer.text)));
});
test('every content image has alt text and the camp photos ship responsive sizes', () => {
 for (const c of camps.filter(c => c.photo)) assert.ok(c.alt, c.id + ' needs alt text');
 assert.equal(html.split('sizes="(min-width:64rem) 52vw, 100vw"').length - 1, camps.filter(c => c.photo).length);
});
test('the 404 page is branded and links home', () => {
 const page = read('src/pages/404.astro');
 assert.match(page, /noindex/);
 assert.match(page, /href="\/"/);
});
