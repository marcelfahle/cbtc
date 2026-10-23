import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const hero=html.split('<header id="top"')[1].split('</header>')[0];
test('approved light hero with Winter–Spring timing and dates CTA',()=>{
 assert.ok(hero.includes('<h1>Make room for<span class="accent"> the mountains</span></h1>'));
 assert.ok(hero.includes("Women's trail running · Costa Blanca · Winter–Spring 2027"));
 assert.ok(hero.includes('Mountain trails, time for yourself and a women’s group to share it with. Two camps planned: February and late March to early April 2027.'));
 assert.ok(hero.includes('February and late March to early April 2027. Exact dates coming soon.'));
 assert.match(hero,/sunrise-valley-2200\.webp/);
 assert.match(html,/<title>Costa Blanca Trail Camp · Make room for the mountains · Winter–Spring 2027<\/title>/);
 assert.match(html,/href="\/styles\/light\.css"/);
 assert.doesNotMatch(html,/Tired legs|Quiet head/);
 assert.match(html,/Send me the dates/);
 assert.doesNotMatch(html,/Join the interest list|Interest list open|proto-bar|h1-switcher/);
 assert.doesNotMatch(hero,/sauna|\bspa\b|four days/i);
});
test('unconfirmed February details (sauna, days, hours, prices) are not published',()=>{
 const text=html.replace(/<style[\s\S]*?<\/style>/g,'').replace(/<[^>]*>/g,' ');
 assert.doesNotMatch(text,/Sauna confirmed|Sauna on|sauna better|Four mountain days|2–4 hours|€/);
 assert.match(text,/The hotel, rooms and any sauna or spa/);
 assert.match(text,/Whatever the weather/);assert.match(text,/Rain makes the coffee taste better/);
 assert.match(html,/only head out when it’s safe/);
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
