import { chromium } from '/home/linuxbrew/.linuxbrew/lib/node_modules/playwright/index.mjs';
import sharp from 'sharp';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
await page.addInitScript(()=>localStorage.setItem('cbtc_marketing_consent','denied'));await page.goto('http://localhost:4322');
const luminance=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
for(const id of ['january','february','march']){
 await page.locator('#'+id).scrollIntoViewIfNeeded();await page.waitForTimeout(200);
 const boxes=await page.locator('#'+id+' .facts p, #'+id+' .fine').evaluateAll(es=>es.map(e=>({r:e.getBoundingClientRect().toJSON(),color:getComputedStyle(e).color})));
 await page.addStyleTag({content:'#'+id+' .body{visibility:hidden}'});
 const {data,info}=await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({resolveWithObject:true});let minimum=99;
 for(const {r,color} of boxes){const fg=luminance(color.match(/[0-9.]+/g).slice(0,3).map(Number));for(let y=Math.max(0,Math.ceil(r.top));y<Math.min(info.height,r.bottom);y+=2)for(let x=Math.max(0,Math.ceil(r.left));x<Math.min(info.width,r.right);x+=2){const n=(y*info.width+x)*3;const bg=luminance([...data.subarray(n,n+3)]);minimum=Math.min(minimum,(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05));}}
 console.log(id,'conservative whole-text-rectangle minimum contrast',minimum.toFixed(2));
}
await browser.close();
