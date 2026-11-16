// Live checks for the holding-page signup. Every API call here is rejected by validation
// or caught by the honeypot, so no notification email is sent to the hosts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const base='https://www.costablancatrailcamp.com';
const home=await (await fetch(base+'/',{cache:'no-store'})).text();
for(const s of ['name="name" type="text" autocomplete="name"','name="from"','Tell us about your running <span>(optional)</span>','Keep me posted','/scripts/holding.js?v=2','Thank you for <span class="accent">all the love'])assert.ok(home.includes(s),s);
assert.equal(home,fs.readFileSync('public/index.html','utf8'),'live homepage matches the committed build');
for(const p of ['/scripts/holding.js','/styles/holding.css']){const d=Buffer.from(await (await fetch(base+p)).arrayBuffer());assert.equal(createHash('sha256').update(d).digest('hex'),createHash('sha256').update(fs.readFileSync('public'+p)).digest('hex'),p);console.log('asset matches',p);}
assert.match(await (await fetch(base+'/privacy')).text(),/your name, where you&#39;re from|your name, where you're from/);
const post=fields=>fetch(base+'/api/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({formName:'future-interest',fields})});
const ok={name:'Synthetic validation only',from:'Nowhere',email:'synthetic@example.com',consent:true};
for(const [fields,field] of [[{email:'synthetic@example.com',consent:true},'name'],[{...ok,from:''},'from'],[{...ok,from:'https://spam.example'},'from'],[{...ok,running:'x'.repeat(1001)},'running']]){const r=await post(fields);const b=await r.json();assert.equal(r.status,400);assert.equal(b.field,field);console.log('expected 400',field,b.error);}
{const r=await post({...ok,email:'invalid'});assert.equal(r.status,400);console.log('expected 400 email',(await r.json()).error);}
{const r=await post({...ok,website:'bot'});assert.equal(r.status,200);console.log('honeypot 200, nothing sent');}
console.log('Live signup verification passed; no deliverable email submitted.');
