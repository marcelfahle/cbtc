import { chromium } from '/home/linuxbrew/.linuxbrew/lib/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const out=process.env.QA_OUT || '/home/openclaw/.openclaw/workspace/media/cbtc-hero-partner-correction/local';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox']});
for(const width of [320,375,390,600,768,1024,1201,1440]) {
 const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
 await page.addInitScript(()=>localStorage.setItem('cbtc_marketing_consent','denied'));
 await page.goto(process.env.QA_URL || 'http://localhost:4331');
 await page.evaluate(()=>document.fonts.ready);
 await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
 assert.equal(await page.locator('.hero .kicker').textContent(),"Women's trail running · Costa Blanca · Winter 2027");
 assert.equal((await page.locator('h1').textContent()).replace(/\s+/g,' ').trim(),'Make room for the mountains');
 const lines=await page.locator('h1').evaluate(el=>{
  const lines=new Map(); const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()) {const node=walker.currentNode;for(const match of node.textContent.matchAll(/\S+/g)) {const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);const r=range.getBoundingClientRect();const top=Math.round(r.top);lines.set(top,[...(lines.get(top)||[]),match[0]]);if(r.left<0||r.right>innerWidth)throw Error('Clipped headline');}}
  return [...lines.values()].map(words=>words.join(' '));
 });
 assert.deepEqual(lines,['Make room for','the mountains']);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:out+'/hero-'+width+'.png',fullPage:false});
 const partner=page.locator('.partner');
 await partner.scrollIntoViewIfNeeded();
 await page.locator('.partner-logo').evaluate(async i=>{i.loading='eager';await i.decode()});
 assert.equal(await partner.locator('h3').textContent(),'Sergio, our partner');
 assert.doesNotMatch(await partner.innerText(),/January|local guiding|certified|insured|all camps|every camp/i);
 assert.ok(await partner.evaluate(el=>el.scrollWidth<=el.clientWidth));
 assert.ok(await page.locator('.partner-logo').evaluate(i=>{const r=i.getBoundingClientRect();return i.naturalWidth>0&&r.height>=84&&r.left>=0&&r.right<=innerWidth}));
 await page.addStyleTag({content:'.nav,[data-marketing-privacy]{visibility:hidden!important}'});
 await partner.screenshot({path:out+'/partner-'+width+'.png'});
 console.log(JSON.stringify({width,headlineLines:lines,partner:'passed',overflow:false}));
 await page.close();
}
await browser.close();
