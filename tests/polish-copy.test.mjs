import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const hero=html.split('<header id="top"')[1].split('</header>')[0];
test('approved clear winter headline and dates CTA replace interest-list sales copy',()=>{
 assert.ok(hero.includes('<h1>Make room for<br> the mountains</h1>'));
 assert.ok(hero.includes("Women's trail running · Costa Blanca · Winter 2027"));
 assert.ok(hero.includes('Mountain trails, time for yourself and a women’s group to share it with. Three camps planned for January, February and March 2027.'));
 assert.match(html,/<title>Costa Blanca Trail Camp · Make room for the mountains · Winter 2027<\/title>/);
 assert.doesNotMatch(html,/Tired legs|Quiet head/);
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

test('partner credit is distinct, general and makes no legal claims',()=>{
 const partner=html.split('<div class="partner">')[1].split('</section>')[0];
 assert.match(partner,/In association with/);assert.match(partner,/Sergio, our partner/);
 assert.doesNotMatch(partner,/January|local guiding|all camps|every camp/i);assert.match(partner,/alt="SERPAclimbing"/);
 assert.doesNotMatch(partner,/href=|licensed|insured|certified|registered/i);
});
