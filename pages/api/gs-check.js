// pages/api/gs-check.js
// Resiliente: nunca retorna 500. Siempre cae a DEFAULT_CONFIG si algo falla.



const NETLIFY_HORARIOS = 'https://vanessastudioback.netlify.app/.netlify/functions/horarios';

const DEFAULT_CONFIG = {
  ok: true,
  disabledDays: [],
  workingHours: { start: '10:00', end: '21:00' },
};

function jsonRes(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(req) {
  if (req.method !== 'GET') return jsonRes({ error: 'Method Not Allowed' }, 405);

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action !== 'getConfig') {
    return jsonRes({ message: 'gs-check operativo', ...DEFAULT_CONFIG });
  }

  // action === 'getConfig': obtener días deshabilitados desde Netlify backend
  try {
    const response = await fetch(NETLIFY_HORARIOS, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`Backend status ${response.status}`);

    const data = await response.json();

    return jsonRes({
      ok: true,
      disabledDays: Array.isArray(data?.disabledDays) ? data.disabledDays : [],
      workingHours: data?.horarioAtencion || DEFAULT_CONFIG.workingHours,
    });
  } catch {
    // Fallback silencioso: nunca 500, siempre 200 con config local
    return jsonRes(DEFAULT_CONFIG);
  }
}
