// pages/api/gs-check.js
// Proxy al backend de Netlify para obtener configuración del calendario

export const runtime = 'edge';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_WORKER_URL ||
  process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL ||
  'https://vanessastudioback.netlify.app/.netlify/functions/api';

const DEFAULT_CONFIG = {
  ok: true,
  disabledDays: [],
  workingHours: {
    start: '10:00',
    end: '21:00',
  },
};

export default function handler(req) {
  const url = req.nextUrl || new URL(req.url);

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const action = url.searchParams.get('action');

  if (action === 'getConfig') {
    return fetchCalendarConfig();
  }

  return new Response(JSON.stringify({ message: 'gs-check operativo', ...DEFAULT_CONFIG }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function fetchCalendarConfig() {
  try {
    const backendUrl = new URL(BACKEND_URL.replace(/\/api$/, '/horarios'));
    const response = await fetch(backendUrl.toString(), { method: 'GET' });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || `Backend config error (${response.status})`);
    }

    return new Response(JSON.stringify({
      ok: true,
      disabledDays: Array.isArray(data?.disabledDays) ? data.disabledDays : [],
      workingHours: data?.horarioAtencion || DEFAULT_CONFIG.workingHours,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // Fallback silencioso: nunca retorna 500 al cliente
    return new Response(JSON.stringify(DEFAULT_CONFIG), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
