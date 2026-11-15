import { chromium } from '/home/linuxbrew/.linuxbrew/lib/node_modules/playwright/index.mjs';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const out=process.env.QA_OUT;fs.mkdirSync(out,{recursive:true});
const html=fs.readFileSync('src/home.html','utf8'),before=execFileSync('git',['show','c83113a:src/home.html'],{encoding:'utf8'});
const words=s=>s.split('<body>')[1].split('</body>')[0].replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
assert.equal(words(html),words(before));
assert.equal(html.match(/<form[\s\S]*?<\/form>/)[0],before.match(/<form[\s\S]*?<\/form>/)[0]);
const browser=await chromium.launch({args:['--no-sandbox']});
for(const reducedMotion of ['no-preference','reduce']){
 const page=await browser.newPage({viewport:{width:390,height:800},reducedMotion});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 await page.goto(process.env.QA_URL||'http://127.0.0.1:4331/index.html');
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));await Promise.all(document.getAnimations().map(a=>a.finished));});
 assert.deepEqual(errors,[]);
 assert.notEqual(await page.locator('footer').evaluate(e=>getComputedStyle(e).backgroundImage),'none');
 if(reducedMotion==='reduce')assert.equal(await page.locator('.valley img').evaluate(e=>getComputedStyle(e).animationName),'none');
 // Capture while valley is below the ordinary viewport, then compare its opaque region with a real scroll.
 const rect=await page.locator('.valley').boundingBox();const full=await page.screenshot({path:out+'/phone-'+reducedMotion+'.png',fullPage:true});
 await page.locator('.valley').scrollIntoViewIfNeeded();
 const scrolled=await page.locator('.valley').screenshot({path:out+'/valley-scrolled-'+reducedMotion+'.png'});
 const region={left:20,top:160,width:350,height:50};
 const a=await sharp(full).extract({...region,top:Math.round(rect.y)+160}).raw().toBuffer();
 const b=await sharp(scrolled).extract(region).raw().toBuffer();
 const delta=a.reduce((sum,v,i)=>sum+Math.abs(v-b[i]),0)/a.length;assert.ok(delta<5,'below-fold rendering differs: '+delta);
 console.log(reducedMotion+' below-fold/fullpage vs scrolled pixel delta '+delta.toFixed(2));
 await page.close();
}
const luminance=hex=>{const c=hex.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
for(const color of ['7A5512','3A4A3F']){const minimum=Math.min(...['A7BCCA','C2CFCD','E3DFC0','F4E2A6','F7D891'].map(bg=>contrast(color,bg)));assert.ok(minimum>=(color==='7A5512'?3:4.5));console.log(color+' worst sky-stop contrast '+minimum.toFixed(2));}
await browser.close();console.log('Exact body wording/form preservation passed.');
