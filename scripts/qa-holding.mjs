// Browser QA for the holding page form. /api/apply is mocked, so no notification email is sent.
import { chromium } from '/home/linuxbrew/.linuxbrew/lib/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const out=process.env.QA_OUT||'/home/openclaw/.openclaw/workspace/media/cbtc-signup-2026-11-16/local';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox']});
for(const width of [320,390,768,1024,1440]){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:width===390?'reduce':'no-preference'});
 await page.goto(process.env.QA_URL||'http://localhost:4331');await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('h1').textContent(),'Thank you for all the love');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no sideways scroll');
 assert.ok(await page.locator('.polaroid img').evaluate(i=>i.complete&&i.naturalWidth>0));
 await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));await Promise.all(document.getAnimations().map(a=>a.finished));});
 await page.screenshot({path:out+'/'+width+'.png',fullPage:true});
 // Keyboard order: brand, name, from, email, optional disclosure, submit.
 await page.keyboard.press('Tab');assert.ok(await page.locator('.brand').evaluate(i=>i===document.activeElement));
 for(const sel of ['#name','#from','#email','.extra summary','button[type=submit]']){await page.keyboard.press('Tab');assert.ok(await page.locator(sel).evaluate(i=>i===document.activeElement),sel+' focus order');}
 assert.equal(await page.locator('#name').evaluate(i=>i.autocomplete),'name');
 assert.equal(await page.locator('#email').evaluate(i=>i.autocomplete),'email');
 let requests=0,last;
 await page.route('**/api/apply',async route=>{requests++;last=route.request().postDataJSON();await route.fulfill({status:502,contentType:'application/json',body:'{"error":"Could not deliver your message. Please try again."}'});});
 // Empty submit: inline errors, focus on the first missing field, nothing sent.
 await page.locator('button[type=submit]').click();
 assert.ok(await page.locator('#name').evaluate(i=>i===document.activeElement));
 for(const id of ['name','from','email']){assert.equal(await page.locator('#'+id).getAttribute('aria-invalid'),'true');assert.ok(await page.locator('#'+id+'-error').isVisible());}
 if(width===390) await page.screenshot({path:out+'/390-errors.png',fullPage:true,clip:{x:0,y:await page.locator('form').evaluate(f=>f.getBoundingClientRect().top+scrollY-20),width:390,height:640}});
 assert.equal(requests,0);
 await page.locator('#name').fill('Synthetic Runner');assert.equal(await page.locator('#name').getAttribute('aria-invalid'),null,'error clears while typing');
 await page.locator('#from').fill('Test Town');await page.locator('#email').fill('bad');
 await page.locator('button[type=submit]').click();assert.ok(await page.locator('#email').evaluate(i=>i===document.activeElement));assert.equal(requests,0);
 await page.locator('#email').fill('test@example.com');
 await page.locator('.extra summary').click();await page.locator('#running').fill('Trails most weekends.');
 if(width===390) await page.screenshot({path:out+'/390-filled.png',fullPage:true,clip:{x:0,y:await page.locator('form').evaluate(f=>f.getBoundingClientRect().top+scrollY-20),width:390,height:700}});
 // Provider failure: no fake success, retry possible.
 await page.locator('button[type=submit]').click();await page.locator('[role=alert]').waitFor();assert.ok(await page.locator('button[type=submit]').isEnabled());assert.equal(await page.locator('[role=status]').count(),0);
 assert.deepEqual({...last.fields},{name:'Synthetic Runner',from:'Test Town',email:'test@example.com',running:'Trails most weekends.',website:'',consent:true});
 // Server field error is shown on the field.
 await page.unroute('**/api/apply');await page.route('**/api/apply',route=>route.fulfill({status:400,contentType:'application/json',body:'{"error":"Please use plain words, no links.","field":"from"}'}));
 await page.locator('button[type=submit]').click();await page.locator('#from-error:not([hidden])').waitFor();assert.ok(await page.locator('#from').evaluate(i=>i===document.activeElement));
 // Success only after the server says ok; double click sends once.
 let okRequests=0;await page.unroute('**/api/apply');await page.route('**/api/apply',async route=>{okRequests++;await new Promise(r=>setTimeout(r,300));await route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});});
 await page.locator('button[type=submit]').dblclick();await page.locator('[role=status]').waitFor();
 assert.equal(okRequests,1,'double click sends once');
 assert.match(await page.locator('[role=status]').textContent(),/Thank you, Synthetic!/);
 assert.ok(await page.locator('[role=status]').evaluate(el=>el===document.activeElement));
 if(width===390||width===1440) await page.screenshot({path:out+'/'+width+'-success.png',fullPage:false});
 await page.close();console.log(width+' layout, keyboard, validation, error/retry, double-submit and success passed');
}
await browser.close();
