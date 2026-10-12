import { chromium } from '/home/linuxbrew/.linuxbrew/lib/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.QA_URL || 'http://localhost:4321';
const out=process.env.QA_OUT || '/home/openclaw/.openclaw/workspace/media/cbtc-opus-polish'; fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let checks=0;const check=(v,m)=>{assert.ok(v,m);checks++};
for(const width of [320,375,390,768,1024,1201,1440]) {
 const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/apply',route=>route.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'Mock delivery failure'})}));
 await page.goto(base);await page.waitForTimeout(450);await page.screenshot({path:out+'/fresh-'+width+'.png'});
 check(await page.locator('[data-marketing-consent-banner]').isVisible(),'consent visible');
 check(!(await page.evaluate(()=>!!window.fbq)),'no preconsent pixel');
 await page.locator('[data-marketing-reject]').click();
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);
 check((await page.locator('h1').textContent()).replace(/\s+/g,' ').trim()==='Tired legs Quiet head','headline words unchanged');
 check(await page.locator('.partner-logo').evaluate(async i=>{await i.decode();const r=i.getBoundingClientRect();return i.naturalWidth>0&&r.height>=84&&r.left>=0&&r.right<=innerWidth}),'partner logo decoded and fits');
 check(await page.locator('.partner').evaluate(e=>e.scrollWidth<=e.clientWidth),'partner text fits');
 if(width>1200)check(await page.locator('.camp .facts').evaluateAll(xs=>new Set(xs.map(x=>Math.round(x.getBoundingClientRect().left))).size===1),'aligned fact columns');
 await page.locator('#january').scrollIntoViewIfNeeded();await page.locator('.camp .media img').evaluateAll(xs=>Promise.all(xs.map(x=>x.decode())));await page.screenshot({path:out+'/departures-'+width+'.png'});
 await page.locator('[data-camp="january"]').click();await page.locator('input[value="january"]').waitFor();
 check(await page.locator('input[value="january"]').isChecked(),'row preselect');
 await page.locator('input[value="march"]').check();await page.locator('input[value="later"]').check();
 check(await page.locator('input[name="camps"]:checked').count()===1,'later exclusive');
 await page.locator('input[value="february"]').check();check(!(await page.locator('input[value="later"]').isChecked()),'month clears later');
 await page.locator('#name').fill('Synthetic browser test');await page.locator('#email').fill('test@example.com');
 await page.locator('button[type="submit"]').click();await page.locator('[data-form-error]').waitFor();check(await page.locator('button[type="submit"]').isEnabled(),'failure retryable');
 await page.unroute('**/api/apply');let payload;
 await page.route('**/api/apply',route=>{payload=route.request().postDataJSON();return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,camps:['february'],preferenceSummary:'February 2027'})});});
 await page.screenshot({path:out+'/form-'+width+'.png'});await page.locator('button[type="submit"]').click();await page.locator('form [role="status"]').waitFor();
 check(payload.fields.camps.join(',')==='february','preferences reach API');check((await page.locator('form').innerText()).includes('dates and details for February 2027'),'actual success');check(await page.evaluate(()=>document.activeElement.getAttribute('role')==='status'),'success focus');check(errors.length===0,errors.join(','));await page.close();
}
for(const mode of ['reduce','saveData','2g','slow-2g','normal']) {
 const context=await browser.newContext({reducedMotion:mode==='reduce'?'reduce':'no-preference'});
 await context.addInitScript(mode=>{localStorage.setItem('cbtc_marketing_consent','denied');if(['saveData','2g','slow-2g'].includes(mode))Object.defineProperty(navigator,'connection',{value:{saveData:mode==='saveData',effectiveType:mode,addEventListener(){}}});},mode);
 const page=await context.newPage();const videos=[];page.on('request',r=>{if(r.url().includes('.mp4'))videos.push(r.url())});
 await page.goto(base);await page.locator('video').scrollIntoViewIfNeeded();await page.waitForTimeout(1600);
 if(mode!=='normal'){check(videos.length===0,mode+' no download');check(await page.locator('video').getAttribute('src')===null,mode+' no source');check(await page.locator('.motion-toggle:visible').count()===0,mode+' hidden controls');check(await page.locator('.camp.live').count()===0,mode+' static rows');}
 else{
 check(await page.getByRole('button',{name:'Pause animations',exact:true}).count()===2,'honest shared scope');
 check(await page.locator('.motion-toggle').evaluateAll(bs=>bs.every(b=>{const r=b.getBoundingClientRect();return r.width===44&&r.height===44&&!b.hasAttribute('aria-pressed')})),'44px targets and no mixed toggle semantics');
 await page.locator('.coastal-film .motion-toggle').focus();check(await page.locator('.coastal-film .motion-toggle').evaluate(b=>b.matches(':focus-visible')&&getComputedStyle(b).outlineWidth==='3px'),'visible keyboard focus');
 check(videos.length>0,'normal loads');check(await page.locator('video').evaluate(v=>!v.paused),'video plays');await page.locator('.coastal-film .motion-toggle').click();check(await page.locator('video').evaluate(v=>v.paused),'pause control');check(await page.getByRole('button',{name:'Resume animations',exact:true}).count()===2,'both labels updated');check(await page.locator('.camp.live').count()===0,'pause stops all photos');await page.locator('.coastal-film .motion-toggle').click();await page.locator('video').scrollIntoViewIfNeeded();await page.waitForTimeout(400);await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(400);check(await page.locator('video').evaluate(v=>v.paused),'offscreen pauses');}
 await context.close();
}
for(const month of ['january','february','march','january,march','invalid,%22%5D']){const page=await browser.newPage();await page.goto(base+'/?camp='+month+'#interest');const selected=await page.locator('input[name="camps"]:checked').evaluateAll(xs=>xs.map(x=>x.value));check(selected.join(',')===(month.startsWith('invalid')?'':month),'query '+month);await page.close();}
for(const [ids, summary] of [[[], 'Month preference not specified'], [['later'],'Later camps only (none of the listed months)'], [['january','march'],'January 2027, March 2027']]) {
 const page=await browser.newPage();await page.addInitScript(()=>localStorage.setItem('cbtc_marketing_consent','denied'));let payload;
 await page.route('**/api/apply',r=>{payload=r.request().postDataJSON();return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,preferenceSummary:summary,camps:ids})});});
 await page.goto(base);for(const id of ids)await page.locator('input[value="'+id+'"]').check();await page.locator('#name').fill('Synthetic');await page.locator('#email').fill('test@example.com');await page.locator('button[type="submit"]').click();await page.locator('form [role="status"]').waitFor();check(JSON.stringify(payload.fields.camps)===JSON.stringify(ids),'edge selection preserved');check((await page.locator('form').innerText()).includes(ids.length === 0 ? 'general camp updates' : ids[0] === 'later' ? 'dates and details for later camps' : summary),'edge success accurate');await page.close();
}
console.log('Browser checks passed:',checks);await browser.close();
