// pages/api/slots.js
// Proxea al backend de Netlify que consulta Google Calendar

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_WORKER_URL ||
  process.env.GAS_WEBHOOK_URL ||
  'https://vanessastudioback.netlify.app/.netlify/functions/api';

export const runtime = 'edge';

export default async function handler(req) {
  const url = req.nextUrl || new URL(req.url);
  const date = url.searchParams.get('date');

  if (!date) {
    return new Response(JSON.stringify({ error: 'El parámetro date es obligatorio (YYYY-MM-DD).' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const backendUrl = new URL(BACKEND_URL);
    backendUrl.searchParams.set('date', String(date));

    const backendResponse = await fetch(backendUrl.toString());
    const payload = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return new Response(JSON.stringify({
        error: payload?.error || 'Error obteniendo eventos del calendario.',
      }), {
        status: backendResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ busy: payload?.busy || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || 'Error interno del servidor obteniendo los horarios.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
