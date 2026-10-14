import { chromium } from '/home/linuxbrew/.linuxbrew/lib/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.QA_URL || 'http://127.0.0.1:4348';
const out=process.env.QA_OUT || '/home/openclaw/.openclaw/workspace/research/cbtc-privacy-evidence/local';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox']});
for(const width of [320,390,768,1440]) {
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
 // Never send test analytics or email to real providers.
 await context.route(/facebook\.net|facebook\.com|plausible\.io/,r=>r.fulfill({status:200,body:'',contentType:'application/javascript'}));
 await context.route('**/api/apply',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,camps:[],preferenceSummary:'Month preference not specified'})}));
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.locator('[data-marketing-consent-banner]').waitFor();
 assert.equal(await page.evaluate(()=>typeof window.fbq),'undefined');
 const banner=page.locator('[data-marketing-consent-banner]');
 await banner.screenshot({path:out+'/banner-'+width+'.png'});
 await banner.locator('a[href="/privacy"]').click();await page.waitForURL('**/privacy');
 assert.equal(await page.locator('h1').textContent(),'Privacy policy');
 assert.equal(await page.evaluate(()=>localStorage.getItem('cbtc_marketing_consent')),null);
 await page.locator('[data-marketing-reject]').click();
 assert.equal(await page.evaluate(()=>localStorage.getItem('cbtc_marketing_consent')),'denied');
 assert.equal(await page.evaluate(()=>typeof window.fbq),'undefined');
 const text=await page.locator('article').innerText();
 for(const [s,n] of [['B72645211',1],['C/ Fora Mur 12',1],['hello@costablancatrailcamp.com',2]]) assert.equal(text.split(s).length-1,n);
 assert.ok(!text.includes('[['));
 assert.ok(text.includes('No Rules Software SL'));
 assert.ok(!text.includes('They act on our instructions only'));
 assert.doesNotMatch(text,/Draft by Jane|Notes for Al|Three blanks/);
 assert.doesNotMatch(await page.locator('footer').innerText(),/eight of you|Runner notes/);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:out+'/privacy-'+width+'.png',fullPage:true});
 await page.goto(base);
 assert.equal(await page.locator('[data-marketing-consent-banner]').count(),0);
 for(const selector of ['.form-foot a[href="/privacy"]','footer a[href="/privacy"]']) {
  const link=page.locator(selector);await link.scrollIntoViewIfNeeded();
  if(selector.startsWith('.form')) {assert.equal(await link.locator('..').innerText(),'We only use your details to send you the dates. Privacy policy.');await page.locator('.form-foot').screenshot({path:out+'/form-'+width+'.png'});}
  await link.click();await page.waitForURL('**/privacy');await page.goto(base);
 }
 await page.locator('[data-marketing-privacy]').click();await page.locator('[data-marketing-accept]').click();
 const calls=()=>page.evaluate(()=>window.fbq.queue.map(a=>Array.from(a)));
 assert.deepEqual(await calls(),[['init','1606630404144793'],['track','PageView']]);
 await page.locator('[data-marketing-privacy]').click();await page.locator('[data-marketing-accept]').click();
 assert.equal((await calls()).length,2);
 await page.locator('#name').fill('Privacy QA');await page.locator('#email').fill('privacy-qa@example.com');
 await page.locator('button[type="submit"]').click();await page.locator('form [role="status"]').waitFor();
 assert.equal((await calls()).filter(c=>c[1]==='Lead').length,1);
 await page.locator('[data-marketing-privacy]').click();await page.locator('[data-marketing-reject]').click();
 const before=(await calls()).length;await page.evaluate(()=>window.cbtcTrackMetaEvent('Lead'));assert.equal((await calls()).length,before);
 // Existing withdrawal behavior: already-loaded pixel remains until navigation.
 assert.equal(await page.locator('script[src*="connect.facebook.net"]').count(),1);
 await page.reload();assert.equal(await page.evaluate(()=>typeof window.fbq),'undefined');
 assert.equal(await page.locator('script[src*="connect.facebook.net"]').count(),0);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({width,links:3,approvedDetails:true,noOverflow:true,consent:'fresh/reject/persist/accept/deduplicate/lead/withdraw/reload passed',pageErrors:0}));
 await context.close();
}
await browser.close();
