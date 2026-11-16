import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
test('approved holding copy, compact name/location/email form, authentic hosts image and no dated offers',()=>{
 const html=read('public/index.html');
 for(const copy of ['Thank you for all the love','Camp sign-ups are currently closed.','Keep me posted','Only camp updates. Unsubscribe anytime.','hosts-running-600.webp','mailto:hello@costablancatrailcamp.com?subject=Unsubscribe'])assert.ok(html.replace(/<[^>]*>/g,'').includes(copy)||html.includes(copy),copy);
 assert.doesNotMatch(html,/February|April|2027|EventScheduled|"@type":"Offer"|name="camps"/);
 for(const field of ['name="name" type="text" autocomplete="name"','name="from"','name="email" type="email"']) assert.ok(html.includes(field)&&html.split(field)[1].split('>')[0].includes('required'),field);
 assert.match(html,/<details class="extra"><summary>Tell us about your running <span>\(optional\)<\/span>/);
 assert.doesNotMatch(html.split('id="running"')[1].split('>')[0],/required/);
 for(const id of ['name','from','email']) assert.ok(html.includes('<label for="'+id+'">'),id+' has a visible label');
 const graph=JSON.parse(html.split('<script type="application/ld+json">')[1].split('</script>')[0])['@graph'];
 assert.deepEqual(graph.map(n=>n['@type']),['Organization','WebSite']);
});
test('women-only camp context precedes thank-you and metadata uses Costa Blanca',()=>{
 const html=read('public/index.html');
 const intro="Women-only trail-running camps on Spain's Costa Blanca";
 assert.ok(html.includes('<p class="camp-intro">'+intro+'</p>'));
 assert.ok(html.includes('Mountain trails, time for yourself and a group of women to share it with.'));
 assert.ok(html.indexOf('<p class="camp-intro">')<html.indexOf('<h1'));
 // Phone reading order follows the source: intro, then photo, then thank-you. Intro appears once.
 assert.equal(html.split('class="camp-intro"').length,2);assert.equal(html.split('class="camp-purpose"').length,2);
 assert.ok(html.indexOf('<div class="intro">')<html.indexOf('<figure class="polaroid">'));
 assert.ok(html.indexOf('class="camp-purpose"')<html.indexOf('<figure class="polaroid">'));
 assert.ok(html.indexOf('<figure class="polaroid">')<html.indexOf('<section class="copy"'));
 for(const key of ['name="description"','property="og:description"','name="twitter:description"']) assert.ok(html.includes(key+' content="'+intro));
 assert.doesNotMatch(html,/Dénia|Denia/);
});
test('all obsolete entry routes redirect and privacy remains',()=>{
 const routes=JSON.parse(read('vercel.json')).redirects.map(r=>r.source);
 for(const route of ['/camp/:path*','/checklist','/routes/:path*','/hero-gallery/:path*','/index.html'])assert.ok(routes.includes(route));
 assert.match(read('src/pages/privacy.astro'),/Unsubscribe from camp updates/);
 assert.match(read('src/pages/api/rsvp.ts'),/status: 410/);
});
