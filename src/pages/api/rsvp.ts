import type { APIRoute } from 'astro';
export const prerender = false;
// Dated Q&A registration is closed; never send obsolete invitations.
export const POST: APIRoute = async () => new Response(JSON.stringify({ error: 'Camp sign-ups are currently closed.' }), {status: 410, headers: {'Content-Type': 'application/json'}});
