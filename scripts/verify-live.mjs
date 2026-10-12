import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const base='https://www.costablancatrailcamp.com';
for(const path of ['/','/checklist','/routes/benigembla','/api/site-config']){const r=await fetch(base+path);assert.equal(r.status,200);console.log('200',path);if(path==='/'){const h=await r.text();assert.ok(h.includes('Make room for'));assert.ok(h.includes('data-form="interest"'));}}
for(const path of ['/scripts/forms.js','/scripts/camps.js','/scripts/interest.js','/scripts/meta-pixel-consent.js','/styles/three-camps.css','/media/coast-loop.mp4','/media/coast-poster.webp','/fonts/Archivo-var.woff2','/fonts/SourceSans3-var.woff2']){const r=await fetch(base+path);assert.equal(r.status,200);const data=Buffer.from(await r.arrayBuffer());const local=fs.readFileSync('public'+path);assert.equal(createHash('sha256').update(data).digest('hex'),createHash('sha256').update(local).digest('hex'));console.log('asset hash matches',path,data.length);}
// Invalid payloads exercise deployed server validation without sending email.
for(const fields of [{name:'Synthetic validation only',email:'invalid',camps:['january']},{name:'Synthetic validation only',email:'test@example.com',camps:['invalid']},{name:'Synthetic validation only',email:'test@example.com',camps:['later','march']}]){const r=await fetch(base+'/api/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({formName:'interest',fields})});assert.equal(r.status,400);console.log('expected 400',await r.text());}
console.log('Live verification passed; no deliverable email submitted.');
