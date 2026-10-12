import { chromium } from '/home/linuxbrew/.linuxbrew/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out=process.env.QA_OUT || '/home/openclaw/.openclaw/workspace/media/cbtc-opus-polish';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--no-sandbox']});
for(const width of [320,390,768,1024,1201,1440]) {
 const p=await b.newPage({viewport:{width,height:1000},reducedMotion:'no-preference'});
 await p.addInitScript(()=>localStorage.setItem('cbtc_marketing_consent','denied'));
 await p.goto(process.env.QA_URL || 'http://localhost:4323');await p.evaluate(()=>document.fonts.ready);
 await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
 await p.locator('.camp img').evaluateAll(xs=>Promise.all(xs.map(x=>x.decode())));
 await p.screenshot({path:out+'/build-hero-'+width+'.png'});
 const hideChrome=await p.addStyleTag({content:'.nav,[data-marketing-privacy]{visibility:hidden!important}'});
 await p.locator('#camps').screenshot({path:out+'/build-board-'+width+'.png'});
 await p.locator('.coastal-film').scrollIntoViewIfNeeded();await p.waitForTimeout(600);
 await p.locator('.coastal-film .motion-toggle').focus();
 await p.locator('.coastal-film').screenshot({path:out+'/build-film-'+width+'.png'});
 await p.locator('#hosts').screenshot({path:out+'/build-hosts-'+width+'.png'});
 console.log(width,JSON.stringify(await p.locator('#camps').boundingBox()));await p.close();
}
await b.close();
