import { chromium } from '/home/linuxbrew/.linuxbrew/lib/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import http from 'node:http';
const out=process.env.QA_OUT;fs.mkdirSync(out,{recursive:true});
const html=fs.readFileSync('src/home.html','utf8'),before=execFileSync('git',['show','0693f39:src/home.html'],{encoding:'utf8'});
const body=s=>s.split('<body>')[1].split('</body>')[0];
assert.equal(body(html).replace(/<p class="camp-(?:intro|purpose)">.*?<\/p>\n/g,''),body(before));
const server=process.env.QA_URL?null:http.createServer((req,res)=>{const path='public'+(req.url==='/'?'/index.html':req.url);try{const data=fs.readFileSync(path);res.setHeader('Content-Type',path.endsWith('.css')?'text/css':path.endsWith('.js')?'text/javascript':path.endsWith('.html')?'text/html':path.endsWith('.svg')?'image/svg+xml':path.endsWith('.webp')?'image/webp':'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end();}}).listen(4332,'127.0.0.1');
const browser=await chromium.launch({args:['--no-sandbox']});
try{
for(const width of [320,390,768,900,1440]){
const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
await page.route('**/api/apply',route=>route.abort());
await page.goto(process.env.QA_URL||'http://127.0.0.1:4332/');
await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
assert.deepEqual(errors,[]);
assert.equal(await page.locator('.camp-intro').textContent(),"Women-only trail-running camps on Spain's Costa Blanca");
assert.equal(await page.locator('.camp-purpose').textContent(),'Mountain trails, time for yourself and a group of women to share it with.');
const intro=await page.locator('.camp-intro').boundingBox(),purpose=await page.locator('.camp-purpose').boundingBox(),heading=await page.locator('h1').boundingBox();
assert.ok(intro.y+intro.height<=purpose.y);assert.ok(purpose.y+purpose.height<heading.y);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
assert.equal(await page.locator('h1').count(),1);
await page.screenshot({path:out+'/'+width+'.png',fullPage:true});console.log(width+'px: exact copy, loaded assets, hierarchy, no overflow/errors PASS');await page.close();
}
}finally{await browser.close();server?.close();}
console.log('Original body preserved exactly apart from the two approved additions; no form submission.');
