import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
const source = stripTypeScriptTypes(fs.readFileSync(new URL('../src/pages/api/apply.ts', import.meta.url), 'utf8'))
  .replace(/export const /g, 'const ')
  .replaceAll('import.meta.env', '{}') + '\nglobalThis.handler = POST;';
function harness(providerOk = true, configured = true) {
  const deliveries = [];
  const context = vm.createContext({
    Response, Date, console: { error() {} },
    process: { env: configured ? { RESEND_API_KEY: 'synthetic-test-only', APPLY_TO_EMAIL: 'host@example.com' } : {} },
    fetch: async (url, init) => {
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
