import { chromium } from '/home/linuxbrew/.linuxbrew/lib/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const out=process.env.QA_OUT||'/home/openclaw/.openclaw/workspace/media/cbtc-holding-2026-11-15/local';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox']});
for(const width of [320,390,768,1024,1440]){
 const page=await browser.newPage({viewport:{width,height:800}});
 await page.goto(process.env.QA_URL||'http://localhost:4331');await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('h1').textContent(),'Thank you for all the love');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.ok(await page.locator('.polaroid img').evaluate(i=>i.complete&&i.naturalWidth>0));
 await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));await Promise.all(document.getAnimations().map(a=>a.finished));});
 assert.ok(await page.locator('.valley img').evaluate(i=>i.complete&&i.naturalWidth>0&&i.loading!=='lazy'));
 await page.screenshot({path:out+'/'+width+'.png',fullPage:true});
 await page.keyboard.press('Tab');assert.equal(await page.locator('.brand').evaluate(i=>i===document.activeElement),true);
 await page.keyboard.press('Tab');assert.equal(await page.locator('#email').evaluate(i=>i===document.activeElement),true);
 assert.equal(await page.locator('#email').evaluate(i=>getComputedStyle(i).outlineStyle),'solid');
 await page.locator('button').click();assert.equal(await page.locator('#email').evaluate(i=>i.validity.valueMissing),true);
 let requests=0;
 await page.route('**/api/apply',async route=>{requests++;const data=route.request().postDataJSON();assert.equal(data.formName,'future-interest');assert.equal(data.fields.consent,true);assert.ok(!data.fields.name);await route.fulfill({status:502,contentType:'application/json',body:'{"error":"Unavailable"}'});});
 await page.locator('#email').fill('test@example.com');await page.locator('button[type=submit]').click();await page.locator('[role=alert]').waitFor();assert.equal(await page.locator('button').isEnabled(),true);
 await page.unroute('**/api/apply');await page.route('**/api/apply',route=>route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}));
 await page.locator('button[type=submit]').click();await page.locator('[role=status]').waitFor();assert.equal(await page.locator('[role=status]').evaluate(el=>el===document.activeElement),true);
 assert.equal(requests,1);await page.close();console.log(width+' layout, mocked error/retry/success passed');
}
await browser.close();
