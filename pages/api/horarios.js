// pages/api/horarios.js
// Proxea al backend de Netlify con fallback a configuración local si el backend no responde



const DEFAULT_CONFIG = {
  horarioAtencion: {
    lunes: ['09:00', '22:00'],
    martes: ['09:00', '22:00'],
    miércoles: ['09:00', '22:00'],
    jueves: ['09:00', '22:00'],
    viernes: ['09:00', '22:00'],
    sábado: ['09:00', '22:00'],
    domingo: ['09:00', '22:00'],
  },
  disabledDays: [],
};

function getBackendBaseUrl() {
  if (typeof process !== 'undefined' && process?.env?.NEXT_PUBLIC_BACKEND_BASE_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
  }
  return 'https://vanessastudioback.netlify.app/.netlify/functions';
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getCookie(req, name) {
  const cookieHeader = (typeof req?.headers?.get === 'function'
    ? req.headers.get('cookie')
    : req?.headers?.cookie) || '';
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const match = cookies.find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function normalizeConfig(config) {
  return {
    horarioAtencion: config?.horarioAtencion || DEFAULT_CONFIG.horarioAtencion,
    disabledDays: Array.isArray(config?.disabledDays) ? config.disabledDays : [],
  };
}

export default async function handler(req) {
  const token = getCookie(req, 'admin_token');
  if (!token) return jsonResponse({ error: 'Unauthorized' }, 401);

  const backendUrl = `${getBackendBaseUrl()}/horarios`;

  try {
    const body = req.method === 'POST' ? await req.text() : undefined;
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }

    if (!response.ok) {
      // GET fallback: devolver config local sin crashear
      if (req.method === 'GET') {
        return jsonResponse({
          ...normalizeConfig(DEFAULT_CONFIG),
          degraded: true,
          warning: 'No se pudo leer la configuración remota. Se devolvió la configuración local del frontend.',
          backendStatus: response.status,
          backendError: data?.error || text || 'Backend unavailable',
        });
      }
      return jsonResponse({
        error: data?.error || 'Failed to communicate with backend',
        details: text || null,
      }, response.status);
    }

    return jsonResponse(normalizeConfig(data));
  } catch (error) {
    // GET fallback: nunca retorna 500 si el backend no responde
    if (req.method === 'GET') {
      return jsonResponse({
        ...normalizeConfig(DEFAULT_CONFIG),
        degraded: true,
        warning: 'No se pudo leer la configuración remota. Se devolvió la configuración local del frontend.',
        backendError: error?.message || 'Unknown error',
      });
    }
    return jsonResponse({
      error: 'Failed to communicate with backend',
      details: error?.message || 'Unknown error',
    }, 500);
  }
}
