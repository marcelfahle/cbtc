import { sessionById, sessionLabel, buildIcs, camp } from '../../../public/scripts/qa-sessions.js';
import type { APIRoute } from 'astro';

export const prerender = false;

// RSVP for a live Q&A session: { session, fields: { name, email, question?, website? (honeypot) } }
// Sends two emails via Resend: a note to the hosts and a confirmation to the runner
// with the Google Meet link and a calendar invitation (.ics, METHOD:REQUEST) attached.
// Required env: RESEND_API_KEY, APPLY_TO_EMAIL. Optional: APPLY_FROM_EMAIL, QA_MEET_URL
// (one link for all four sessions unless a session sets its own `link`).

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const toBase64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');

export const POST: APIRoute = async ({ request }) => {
  let data: any;
  try { data = await request.json(); } catch { return json(400, { error: 'Invalid JSON' }); }

  const session = sessionById(String(data?.session ?? ''));
  const name = String(data?.fields?.name ?? '').trim().slice(0, 120);
  const email = String(data?.fields?.email ?? '').trim().slice(0, 200);
  const question = String(data?.fields?.question ?? '').trim().slice(0, 2000);

  // Honeypot: bots fill the hidden "website" field; pretend success.
  if (data?.fields?.website) return json(200, { ok: true, session: session?.id ?? null, zoom: '' });

  if (!session) return json(400, { error: 'Pick one of the four sessions.' });
  if (name.length < 2) return json(400, { error: 'Please enter your name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: 'Please enter a valid email address.' });

  const env = (k: string) => process.env[k] ?? (import.meta.env as any)[k];
  const apiKey = env('RESEND_API_KEY');
  const to = String(env('APPLY_TO_EMAIL') ?? '').split(',').map((s: string) => s.trim()).filter(Boolean);
  const from = env('APPLY_FROM_EMAIL') ?? 'Costa Blanca Trail Camp <onboarding@resend.dev>';
  const zoom = String(session?.link || env('QA_MEET_URL') || '').trim();
  const replyTo = 'hello@costablancatrailcamp.com';
  const organizerEmail = (String(from).match(/<([^>]+)>/)?.[1] ?? String(from)).trim();

  if (!apiKey || to.length === 0) {
    console.error('rsvp endpoint not configured: missing RESEND_API_KEY / APPLY_TO_EMAIL');
    return json(500, { error: 'RSVPs are temporarily unavailable. Please try again later.' });
  }

  const when = sessionLabel(session);
  const hostText = [
    `Q&A RSVP: ${when}`,
    `Name: ${name}`,
    `Email: ${email}`,
    question && `Their question:\n${question}`,
    `Page: ${data?.pageUrl ?? camp.page}`,
    `Time: ${new Date().toISOString()}`,
  ].filter(Boolean).join('\n');

  const runnerText = [
    `Hi ${name.split(' ')[0]},`,
    '',
    `You're in for the live Q&A on ${when} (Spain time). It runs about 45 minutes on Google Meet.`,
    '',
    zoom ? `Join here: ${zoom}` : 'We will send the Google Meet link a day before.',
    '',
    'The invitation is attached, so one tap puts it in your calendar. We talk through the February week day by day, the trails, rooms, prices and travel, and then it is your questions. Nothing to prepare, nothing to decide on the call.',
    '',
    question && `You asked: "${question}". We will make sure it gets answered.`,
    question && '',
    'If the date stops working, reply to this email and we will move you to another one.',
    '',
    'Monika and Anna',
    'Costa Blanca Trail Camp',
  ].filter(v => v !== false).join('\n');

  const ics = buildIcs(session, { zoom, organizerEmail, attendeeEmail: email, attendeeName: name });

  const send = (body: unknown) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  let hostRes: Response, runnerRes: Response;
  try {
    [hostRes, runnerRes] = await Promise.all([
      send({ from, to, reply_to: email, subject: `[CBTC] Q&A RSVP ${session.weekday} ${session.day}: ${name}`, text: hostText }),
      send({
        from, to: [email], reply_to: replyTo,
        subject: `Your seat for the live Q&A, ${session.weekday} ${session.day} ${session.month}`,
        text: runnerText,
        attachments: [{ filename: 'costa-blanca-trail-camp-qa.ics', content: toBase64(ics), content_type: 'text/calendar; method=REQUEST; charset=utf-8' }],
      }),
    ]);
  } catch { return json(502, { error: 'Could not save your seat. Please try again.' }); }

  if (!hostRes.ok || !runnerRes.ok) {
    console.error('resend error', hostRes.status, runnerRes.status);
    return json(502, { error: 'Could not save your seat. Please try again.' });
  }

  return json(200, { ok: true, session: session.id, when, zoom });
};
