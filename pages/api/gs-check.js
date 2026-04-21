// pages/api/gs-check.js
// Resiliente: nunca retorna 500. Siempre cae a DEFAULT_CONFIG si algo falla.



const NETLIFY_HORARIOS = 'https://vanessastudioback.netlify.app/.netlify/functions/horarios';

const DEFAULT_CONFIG = {
  ok: true,
  disabledDays: [],
  workingHours: { start: '10:00', end: '21:00' },
};

function jsonRes(body, status = 200) {
  return { body, status };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    const result = jsonRes({ error: 'Method Not Allowed' }, 405);
    return res.status(result.status).json(result.body);
  }

  const action = Array.isArray(req.query.action) ? req.query.action[0] : req.query.action;

  if (action !== 'getConfig') {
    const result = jsonRes({ message: 'gs-check operativo', ...DEFAULT_CONFIG });
    return res.status(result.status).json(result.body);
  }

  // action === 'getConfig': obtener días deshabilitados desde Netlify backend
  try {
    const response = await fetch(NETLIFY_HORARIOS, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`Backend status ${response.status}`);

    const data = await response.json();

    const result = jsonRes({
      ok: true,
      disabledDays: Array.isArray(data?.disabledDays) ? data.disabledDays : [],
      workingHours: data?.horarioAtencion || DEFAULT_CONFIG.workingHours,
    });
    return res.status(result.status).json(result.body);
  } catch {
    // Fallback silencioso: nunca 500, siempre 200 con config local
    const result = jsonRes(DEFAULT_CONFIG);
    return res.status(result.status).json(result.body);
  }
}
