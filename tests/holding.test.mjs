import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
test('approved holding copy, email only, authentic hosts image and no dated offers',()=>{
 const html=read('public/index.html');
 for(const copy of ['Thank you for all the love','Camp sign-ups are currently closed.','Keep me posted','Only camp updates. Unsubscribe anytime.','hosts-running-600.webp','mailto:hello@costablancatrailcamp.com?subject=Unsubscribe'])assert.ok(html.replace(/<[^>]*>/g,'').includes(copy)||html.includes(copy),copy);
 assert.doesNotMatch(html,/February|April|2027|EventScheduled|"@type":"Offer"|name="name"|name="camps"/);
 const graph=JSON.parse(html.split('<script type="application/ld+json">')[1].split('</script>')[0])['@graph'];
 assert.deepEqual(graph.map(n=>n['@type']),['Organization','WebSite']);
});
test('women-only camp context precedes thank-you and metadata uses Costa Blanca',()=>{
 const html=read('public/index.html');
 const intro="Women-only trail-running camps on Spain's Costa Blanca";
 assert.ok(html.includes('<p class="camp-intro">'+intro+'</p>'));
 assert.ok(html.includes('Mountain trails, time for yourself and a group of women to share it with.'));
 assert.ok(html.indexOf('<p class="camp-intro">')<html.indexOf('<h1'));
 for(const key of ['name="description"','property="og:description"','name="twitter:description"']) assert.ok(html.includes(key+' content="'+intro));
 assert.doesNotMatch(html,/Dénia|Denia/);
});
test('all obsolete entry routes redirect and privacy remains',()=>{
 const routes=JSON.parse(read('vercel.json')).redirects.map(r=>r.source);
 for(const route of ['/camp/:path*','/checklist','/routes/:path*','/hero-gallery/:path*','/index.html'])assert.ok(routes.includes(route));
 assert.match(read('src/pages/privacy.astro'),/Unsubscribe from camp updates/);
 assert.match(read('src/pages/api/rsvp.ts'),/status: 410/);
});
