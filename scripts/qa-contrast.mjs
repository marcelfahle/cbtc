import { chromium } from '/home/linuxbrew/.linuxbrew/lib/node_modules/playwright/index.mjs';
import sharp from 'sharp';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const luminance=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
// Entire text rectangles; both drift endpoints and midpoint, maximum light overlay.
let failures=0;
for(const width of [320,390,768,1024,1201,1440]) {
 const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'no-preference'});
 await page.addInitScript(()=>localStorage.setItem('cbtc_marketing_consent','denied'));
 await page.goto(process.env.QA_URL || 'http://localhost:4323');await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'html{scroll-behavior:auto!important}.nav,[data-marketing-privacy]{visibility:hidden!important}'});
 for(const id of ['january','february','march']) {
  const row=page.locator('#'+id);await row.evaluate(r=>r.scrollIntoView({block:'center',behavior:'instant'}));await row.locator('img').evaluate(i=>i.decode());await page.waitForTimeout(100);
  for(const phase of [0,.5,1]) {
   await row.evaluate((r,p)=>{for(const a of r.getAnimations({subtree:true})){a.pause();a.currentTime=Number(a.effect.getTiming().duration)*p;}r.querySelector('.light').style.setProperty('opacity','.22','important');},phase);
   const boxes=await row.locator('.facts p, .fine, .month small').evaluateAll(es=>es.map(e=>({r:e.getBoundingClientRect().toJSON(),color:getComputedStyle(e).color,kind:e.matches('.month small')?'year':'body'})));
   await row.locator('.body').evaluate(e=>e.style.visibility='hidden');
   const {data,info}=await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({resolveWithObject:true});const minimum={year:99,body:99};
   for(const {r,color,kind} of boxes){assert(r.top>=0&&r.bottom<=info.height,'whole text rectangle visible');const fg=luminance(color.match(/[0-9.]+/g).slice(0,3).map(Number));for(let y=Math.max(0,Math.ceil(r.top));y<Math.min(info.height,r.bottom);y++)for(let x=Math.max(0,Math.ceil(r.left));x<Math.min(info.width,r.right);x++){const n=(y*info.width+x)*3;const bg=luminance([...data.subarray(n,n+3)]);minimum[kind]=Math.min(minimum[kind],(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05));}}
   await row.locator('.body').evaluate(e=>e.style.visibility='');
   console.log(JSON.stringify({width,id,phase,year:+minimum.year.toFixed(2),body:+minimum.body.toFixed(2)}));
   if(minimum.year<4.5||minimum.body<4.5)failures++;
  }
 }
 await page.close();
}
await browser.close();assert.equal(failures,0,'contrast samples below 4.5:1');
