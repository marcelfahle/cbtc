import type { APIRoute } from 'astro';

export const prerender = false;

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
    },
  });

const env = (key: string) => process.env[key] ?? (import.meta.env as any)[key];

function publicHttpsUrl(value: unknown) {
  if (!value || typeof value !== 'string') return '';
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

export const GET: APIRoute = async () =>
  json(200, {
    fitCallUrl: publicHttpsUrl(env('FIT_CALL_URL')),
  });
