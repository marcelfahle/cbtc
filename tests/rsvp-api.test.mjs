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

function harness(env = { RESEND_API_KEY: 'synthetic-test-only', APPLY_TO_EMAIL: 'host@example.com', QA_ZOOM_URL: 'https://zoom.us/j/123' }) {
  const deliveries = [];
  const context = vm.createContext({
    sessionById, sessionLabel, buildIcs, camp, Response, Date, Buffer, Promise, console: { error() {} },
    process: { env },
    fetch: async (url, init) => { assert.equal(url, 'https://api.resend.com/emails'); deliveries.push(JSON.parse(init.body)); return new Response('{}', { status: 200 }); },
  });
  vm.runInContext(source, context);
  return { deliveries, post: async data => context.handler({ request: { json: async () => data } }) };
}

test('a valid RSVP emails the hosts and sends the runner an invitation with the Zoom link', async () => {
  const h = harness();
  const res = await h.post({ session: 'thu-12', fields: { name: 'Hanna Test', email: 'runner@example.com', question: 'Poles?' } });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.session, 'thu-12');
  assert.equal(body.zoom, 'https://zoom.us/j/123');
  assert.equal(h.deliveries.length, 2);
  const host = h.deliveries.find(d => d.to.includes('host@example.com'));
  const runner = h.deliveries.find(d => d.to.includes('runner@example.com'));
  assert.match(host.subject, /Q&A RSVP Thursday 12: Hanna Test/);
  assert.match(host.text, /Their question:\nPoles\?/);
  assert.match(runner.text, /Thursday 12 November, 18:00 CET/);
  assert.match(runner.text, /https:\/\/zoom.us\/j\/123/);
  const ics = Buffer.from(runner.attachments[0].content, 'base64').toString('utf8');
  assert.match(ics, /METHOD:REQUEST/);
  assert.match(ics, /DTSTART:20261112T170000Z/);
  assert.match(ics, /DTEND:20261112T174500Z/);
  assert.match(ics, /ATTENDEE;CN=Hanna Test.*mailto:runner@example.com/);
});

test('unknown session, short name and bad email are rejected without sending', async () => {
  const h = harness();
  assert.equal((await h.post({ session: 'sun-99', fields: { name: 'Hanna', email: 'runner@example.com' } })).status, 400);
  assert.equal((await h.post({ session: 'tue-10', fields: { name: 'H', email: 'runner@example.com' } })).status, 400);
  assert.equal((await h.post({ session: 'tue-10', fields: { name: 'Hanna', email: 'nope' } })).status, 400);
  assert.equal(h.deliveries.length, 0);
});

test('honeypot sends nothing but looks successful', async () => {
  const h = harness();
  assert.equal((await h.post({ session: 'tue-10', fields: { name: 'Bot', email: 'bot@example.com', website: 'x' } })).status, 200);
  assert.equal(h.deliveries.length, 0);
});

test('missing mail configuration is reported', async () => {
  const h = harness({});
  assert.equal((await h.post({ session: 'tue-10', fields: { name: 'Hanna', email: 'runner@example.com' } })).status, 500);
});

test('sessions are four distinct evenings at 18:00 Spain time with working calendar links', () => {
  assert.equal(sessions.length, 4);
  assert.equal(new Set(sessions.map(s => s.utc)).size, 4);
  for (const s of sessions) {
    assert.equal(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }).format(new Date(s.utc)), s.time);
    assert.equal(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', weekday: 'long' }).format(new Date(s.utc)), s.weekday);
    assert.match(googleCalendarUrl(s), /^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE/);
  }
});
