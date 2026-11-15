import { chromium } from '/home/linuxbrew/.linuxbrew/lib/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import http from 'node:http';
const out=process.env.QA_OUT;fs.mkdirSync(out,{recursive:true});
// The photo and its accessible/social descriptions are the only HTML changes.
const normalize=s=>s.replace(/<figure class="polaroid">.*?<\/figure>/,'').replace(/<meta (?:property="og:image(?::alt)?"|name="twitter:image") content="[^"]*">/g,'');
assert.equal(normalize(fs.readFileSync('src/home.html','utf8')),normalize(execFileSync('git',['show','19ddb9f:src/home.html'],{encoding:'utf8'})));
const server=process.env.QA_URL?null:http.createServer((req,res)=>{const path='public'+(req.url==='/'?'/index.html':req.url);try{const data=fs.readFileSync(path);res.setHeader('Content-Type',path.endsWith('.css')?'text/css':path.endsWith('.js')?'text/javascript':path.endsWith('.html')?'text/html':path.endsWith('.svg')?'image/svg+xml':path.endsWith('.webp')?'image/webp':'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end();}}).listen(4333,'127.0.0.1');
const browser=await chromium.launch({args:['--no-sandbox']});
try{
for(const width of [320,390,768,900,1440]){
const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce',deviceScaleFactor:width===390?2:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
await page.route('**/api/apply',route=>route.abort());
await page.goto(process.env.QA_URL||'http://127.0.0.1:4333/');
await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
assert.deepEqual(errors,[]);
const image=await page.locator('.polaroid img').evaluate(i=>({src:i.currentSrc,fit:getComputedStyle(i).objectFit,ratio:i.clientWidth/i.clientHeight,loaded:i.complete&&i.naturalWidth>0}));
assert.match(image.src,/hosts-running-(600|1200).webp$/);assert.equal(image.fit,'contain');assert.ok(Math.abs(image.ratio-1.5)<0.01);assert.ok(image.loaded);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.screenshot({path:out+'/'+width+'.png',fullPage:true});console.log(width+'px: uncropped 3:2, correct running photo, loaded assets, no overflow/errors PASS',image);await page.close();
}
if(process.env.QA_URL){for(const path of ['/images/hosts-running-600.webp','/images/hosts-running-1200.webp','/styles/holding.css']){const response=await fetch(new URL(path,process.env.QA_URL));assert.equal(response.status,200);const hash=b=>createHash('sha256').update(b).digest('hex');assert.equal(hash(Buffer.from(await response.arrayBuffer())),hash(fs.readFileSync('public'+path)));console.log('Live hash matches '+path);}}
}finally{await browser.close();server?.close();}
console.log('All non-photo HTML preserved exactly; no form submitted.');
