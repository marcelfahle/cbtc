import { validatePreferences, preferenceSummary } from '../../../public/scripts/camps.js';
import type { APIRoute } from 'astro';

export const prerender = false;

// Receives both site forms (data-form="waitlist" | "apply" | "routes") as JSON:
// { formName, pageUrl, fields: { name?, email } }
// Delivers by email via Resend. Required env: RESEND_API_KEY, APPLY_TO_EMAIL.
// Optional: APPLY_FROM_EMAIL (must be a Resend-verified sender).

// Light per-instance throttle for the holding-page form. Serverless instances do not share
// memory, so this only slows bursts from one address; the honeypot and validation do the rest.
const recent = new Map<string, number[]>();
const delivered = new Map<string, number>();
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;
const throttled = (ip: string, now: number) => {
  const hits = (recent.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();
  return hits.length > LIMIT;
};
const hasLink = (v: string) => /https?:|www\.|<|>/i.test(v);

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  let data: any;
  try {
    data = await request.json();
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  // Honeypot: bots fill the hidden "website" field; pretend success.
  if (data?.fields?.website) return json(200, { ok: true, ...(data.formName === 'interest' ? { preferenceSummary: 'Month preference not specified', camps: [] } : {}) });

  const formName = String(data?.formName ?? 'form').slice(0, 40);
  const email = String(data?.fields?.email ?? '').trim().slice(0, 200);
  const name = String(data?.fields?.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
  const from_ = String(data?.fields?.from ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
  const running = String(data?.fields?.running ?? '').trim().slice(0, 4000);
  const link = String(data?.fields?.link ?? '').trim().slice(0, 300);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: 'Please enter a valid email address.' });
  }
  if (formName === 'apply' && running.length < 5) {
    return json(400, { error: 'Tell us a line or two about your running.' });
  }

  if (formName === 'future-interest') {
    if (!name || name.length < 2 || name.length > 120) return json(400, { error: 'Please tell us your name.', field: 'name' });
    if (!from_ || from_.length < 2 || from_.length > 120) return json(400, { error: 'Please tell us where you’re from.', field: 'from' });
    if (hasLink(name) || hasLink(from_)) return json(400, { error: 'Please use plain words, no links.', field: hasLink(name) ? 'name' : 'from' });
    if (running.length > 1000) return json(400, { error: 'Please keep the running note under 1,000 characters.', field: 'running' });
    if (data?.fields?.consent !== true) return json(400, { error: 'Please agree to receive camp updates.' });
    const now = Date.now();
    const ip = String(request.headers?.get?.('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
    if (throttled(ip, now)) return json(429, { error: 'Too many tries. Please wait a few minutes.' });
    // A double tap or retry after a slow response must not send the hosts a second email.
    const key = [email.toLowerCase(), name.toLowerCase(), from_.toLowerCase(), running].join('|');
    for (const [k, t] of delivered) if (now - t > WINDOW_MS) delivered.delete(k);
    if (delivered.has(key)) return json(200, { ok: true });
  }

  let preferences: string[] = [];
  if (formName === 'interest') {
    if (!name) return json(400, { error: 'Please enter your name.' });
    try { preferences = validatePreferences(data?.fields?.camps); }
    catch (error) { return json(400, { error: (error as Error).message }); }
  }

  // process.env, not import.meta.env: Vite inlines the latter at build time,
  // which bakes in blanks when building locally without the secrets.
  const env = (k: string) => process.env[k] ?? (import.meta.env as any)[k];
  const apiKey = env('RESEND_API_KEY');
  // Comma-separated list of notification recipients.
  const to = String(env('APPLY_TO_EMAIL') ?? '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
  const from =
    env('APPLY_FROM_EMAIL') ?? 'Costa Blanca Trail Camp <onboarding@resend.dev>';

  if (!apiKey || to.length === 0) {
    console.error('apply endpoint not configured: missing RESEND_API_KEY / APPLY_TO_EMAIL');
    return json(500, { error: 'Signups are temporarily unavailable. Please try again later.' });
  }

  const subject =
    formName === 'future-interest'
      ? `[CBTC] Future camp updates: ${name} (${from_})`
      : formName === 'interest'
      ? `[CBTC] 2027 camp interest: ${name || email}`
      : formName === 'waitlist'
      ? `[CBTC] Winter 2027 waitlist: ${name || email}`
      : formName === 'apply'
      ? `[CBTC] Application: ${name || email}`
      : `[CBTC] Routes request: ${email}`;

  const text = [
    `Form: ${formName}`,
    name && `Name: ${name}`,
    `Email: ${email}`,
    formName === 'future-interest' && 'Consent: future camp updates by email (holding page form with name and location, 2026-11-16).',
    formName === 'future-interest' && 'Unsubscribe: remove requests to hello@costablancatrailcamp.com from future outreach. Include this unsubscribe address in every update. No dated camp campaigns.',
    formName === 'interest' && `Camp preferences: ${preferenceSummary(preferences)}`,
    from_ && (formName === 'future-interest' ? `Where from: ${from_}` : `Coming from: ${from_}`),
    formName === 'future-interest' && !running && 'Their running: not given (optional)',
    link && `Link: ${link}`,
    running && `Their running:\n${running}`,
    `Page: ${data?.pageUrl ?? ''}`,
    `Time: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join('\n');

  let res: Response;
  try {
  res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, reply_to: email, subject, text }),
  });

  } catch { return json(502, { error: 'Could not deliver your message. Please try again.' }); }

  if (!res.ok) {
    console.error('resend error', res.status);
    return json(502, { error: 'Could not deliver your message. Please try again.' });
  }

  if (formName === 'future-interest') delivered.set([email.toLowerCase(), name.toLowerCase(), from_.toLowerCase(), running].join('|'), Date.now());

  return json(200, { ok: true, ...(formName === 'interest' ? { camps: preferences, preferenceSummary: preferenceSummary(preferences) } : {}) });
};
