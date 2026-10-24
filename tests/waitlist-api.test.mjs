import { validatePreferences, preferenceSummary } from '../public/scripts/camps.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
const source = stripTypeScriptTypes(fs.readFileSync(new URL('../src/pages/api/apply.ts', import.meta.url), 'utf8'))
  .replace(/^import .*camps.js';/m, '')
  .replace(/export const /g, 'const ')
  .replaceAll('import.meta.env', '{}') + '\nglobalThis.handler = POST;';
function harness(providerOk = true, configured = true) {
  const deliveries = [];
  const context = vm.createContext({
    validatePreferences, preferenceSummary, Response, Date, console: { error() {} },
    process: { env: configured ? { RESEND_API_KEY: 'synthetic-test-only', APPLY_TO_EMAIL: 'host@example.com' } : {} },
    fetch: async (url, init) => {
      if (providerOk === 'throw') throw new Error('network down');
      assert.equal(url, 'https://api.resend.com/emails');
      deliveries.push(JSON.parse(init.body));
      return new Response(providerOk ? '{}' : 'test failure', { status: providerOk ? 200 : 500 });
    },
  });
  vm.runInContext(source, context);
  return { deliveries, post: async data => context.handler({ request: { json: async () => data } }) };
}
test('waitlist emails correct subject and arrival context without requiring running history', async () => {
  const h = harness();
  const res = await h.post({ formName: 'waitlist', fields: { name: 'Test', email: 'runner@example.com', from: 'Denia' } });
  assert.equal(res.status, 200);
  assert.equal(h.deliveries.length, 1);
  assert.equal(h.deliveries[0].subject, '[CBTC] Winter 2027 waitlist: Test');
  assert.match(h.deliveries[0].text, /Coming from: Denia/);
  assert.equal(h.deliveries[0].reply_to, 'runner@example.com');
});
test('invalid waitlist email is rejected without sending', async () => {
  const h = harness();
  assert.equal((await h.post({ formName: 'waitlist', fields: { email: 'invalid' } })).status, 400);
  assert.equal(h.deliveries.length, 0);
});
test('waitlist honeypot sends nothing', async () => {
  const h = harness();
  assert.equal((await h.post({ formName: 'waitlist', fields: { email: 'runner@example.com', website: 'bot' } })).status, 200);
  assert.equal(h.deliveries.length, 0);
});
test('provider failure is not reported as a successful signup', async () => {
  const h = harness(false);
  assert.equal((await h.post({ formName: 'waitlist', fields: { email: 'runner@example.com' } })).status, 502);
});
test('missing mail configuration is reported, not silently accepted', async () => {
  const h = harness(true, false);
  assert.equal((await h.post({ formName: 'waitlist', fields: { email: 'runner@example.com' } })).status, 500);
  assert.equal(h.deliveries.length, 0);
});

for (const [preferences, summary] of [[['february'], '2–7 February 2027'], [['spring'], 'Late March to early April 2027'], [['february','spring'], '2–7 February 2027, Late March to early April 2027'], [['january'], 'January 2027 (earlier option, no longer offered)'], [['march'], 'March 2027 (earlier option, now late March to early April)'], [['january','march'], 'January 2027 (earlier option, no longer offered), March 2027 (earlier option, now late March to early April)'], [['later'], 'Later camps only (none of the listed months)'], [[], 'Month preference not specified']]) {
  test('interest email and response retain ' + summary, async () => {
    const h=harness(); const res=await h.post({formName:'interest',fields:{name:'Runner',email:'test@example.com',from:'Denia',camps:preferences}});
    assert.equal(res.status,200); const body=await res.json(); assert.equal(body.preferenceSummary,summary); assert.deepEqual(body.camps,preferences);
    assert.ok(h.deliveries[0].text.includes('Camp preferences: '+summary)); assert.match(h.deliveries[0].subject,/2027 camp interest/); assert.match(h.deliveries[0].text,/Coming from: Denia/);
  });
}
for(const camps of ['january',['unknown'],['later','january'],[null],{},['__proto__']]) test('rejects malformed preferences '+JSON.stringify(camps),async()=>{const h=harness();assert.equal((await h.post({formName:'interest',fields:{name:'Runner',email:'test@example.com',camps}})).status,400);assert.equal(h.deliveries.length,0)});
test('interest requires name and does not disguise provider errors',async()=>{assert.equal((await harness().post({formName:'interest',fields:{email:'test@example.com'}})).status,400);assert.equal((await harness(false).post({formName:'interest',fields:{name:'Runner',email:'test@example.com'}})).status,502)});

test('network exception gives retryable error, not success',async()=>{assert.equal((await harness('throw').post({formName:'interest',fields:{name:'Runner',email:'test@example.com'}})).status,502)});
