import { sessionById, sessionLabel, buildIcs, camp, googleCalendarUrl, sessions } from '../public/scripts/qa-sessions.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';

const source = stripTypeScriptTypes(fs.readFileSync(new URL('../src/pages/api/rsvp.ts', import.meta.url), 'utf8'))
  .replace(/^import .*qa-sessions.js';/m, '')
  .replace(/export const /g, 'const ')
  .replaceAll('import.meta.env', '{}') + '\nglobalThis.handler = POST;';

function harness(env = { RESEND_API_KEY: 'synthetic-test-only', APPLY_TO_EMAIL: 'host@example.com', QA_MEET_URL: 'https://meet.google.com/abc-defg-hij' }) {
  const deliveries = [];
  const context = vm.createContext({
    sessionById, sessionLabel, buildIcs, camp, Response, Date, Buffer, Promise, console: { error() {} },
    process: { env },
    fetch: async (url, init) => { assert.equal(url, 'https://api.resend.com/emails'); deliveries.push(JSON.parse(init.body)); return new Response('{}', { status: 200 }); },
  });
  vm.runInContext(source, context);
  return { deliveries, post: async data => context.handler({ request: { json: async () => data } }) };
}

test('retired RSVP always returns closed and never sends invitations',async()=>{
 const h=harness(); for(const data of [{}, {session:'tue-10',fields:{name:'Test',email:'runner@example.com'}},{fields:{website:'bot'}}])assert.equal((await h.post(data)).status,410);
 assert.equal(h.deliveries.length,0);
});
