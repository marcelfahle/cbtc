import type { APIRoute } from 'astro';

export const prerender = false;

// Receives both site forms (data-form="apply" | "routes") as JSON:
// { formName, pageUrl, fields: { name?, email } }
// Delivers by email via Resend. Required env: RESEND_API_KEY, APPLY_TO_EMAIL.
// Optional: APPLY_FROM_EMAIL (must be a Resend-verified sender).

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
  if (data?.fields?.website) return json(200, { ok: true });

  const formName = String(data?.formName ?? 'form').slice(0, 40);
  const email = String(data?.fields?.email ?? '').trim().slice(0, 200);
  const name = String(data?.fields?.name ?? '').trim().slice(0, 200);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: 'Please enter a valid email address.' });
  }

  const apiKey = import.meta.env.RESEND_API_KEY;
  const to = import.meta.env.APPLY_TO_EMAIL;
  const from =
    import.meta.env.APPLY_FROM_EMAIL ??
    'Costa Blanca Trail Camp <onboarding@resend.dev>';

  if (!apiKey || !to) {
    console.error('apply endpoint not configured: missing RESEND_API_KEY / APPLY_TO_EMAIL');
    return json(500, { error: 'Form backend not configured yet.' });
  }

  const subject =
    formName === 'apply'
      ? `[CBTC] Application: ${name || email}`
      : `[CBTC] Routes request: ${email}`;

  const text = [
    `Form: ${formName}`,
    name && `Name: ${name}`,
    `Email: ${email}`,
    `Page: ${data?.pageUrl ?? ''}`,
    `Time: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], reply_to: email, subject, text }),
  });

  if (!res.ok) {
    console.error('resend error', res.status, await res.text());
    return json(502, { error: 'Could not deliver your message. Please try again.' });
  }

  return json(200, { ok: true });
};
