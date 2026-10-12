import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const hero=html.split('<header id="top"')[1].split('</header>')[0];
test('approved short headline and dates CTA replace interest-list sales copy',()=>{
 assert.ok(hero.includes('<h1>Tired legs<br> Quiet head</h1>'));
 assert.match(html,/Send me the dates/);
 assert.doesNotMatch(html,/Join the interest list|Interest list open|proto-bar|h1-switcher/);
 assert.doesNotMatch(hero,/sauna|spa|four days/i);
});
test('confirmed January sauna does not imply confirmed spa or later-camp details',()=>{
 const january=html.split('id="january"')[1].split('</article>')[0];
 assert.match(january,/Sauna confirmed/);assert.match(january,/Prices provisional/);
 assert.match(january,/Hotel, final prices and full inclusions to follow/);
 assert.match(html,/The boutique hotel and any wider spa facilities/);
 assert.match(html,/January, whatever the weather/);assert.match(html,/Rain makes the sauna better/);
 assert.match(html,/only head out when it’s safe/);
 for(const month of ['february','march'])assert.doesNotMatch(html.split('id="'+month+'"')[1].split('</article>')[0].replace(/<[^>]*>/g,''),/sauna|spa|€|Sergio|Monika|Anna/i);
});
test('small shared motion controls have honest labels and graceful no-JS defaults',()=>{
 assert.equal((html.match(/class="motion-toggle" hidden aria-label="Pause animations"/g)||[]).length,2);
 assert.doesNotMatch(html,/aria-pressed|Pause photo|Pause coast/);
 assert.ok(html.includes('</video><button type="button" class="motion-toggle"'));
});

test('partner credit is distinct, January-specific and makes no legal claims',()=>{
 const partner=html.split('<div class="partner">')[1].split('</section>')[0];
 assert.match(partner,/In association with/);assert.match(partner,/Sergio, our local guiding partner/);
 assert.match(partner,/January camp/);assert.match(partner,/alt="SERPAclimbing"/);
 assert.doesNotMatch(partner,/href=|licensed|insured|certified|registered/i);
});
