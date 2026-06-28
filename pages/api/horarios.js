import { verifyAdminRequest } from '../../lib/adminSession';
import { enforceAllowedOrigin, handleCorsPreflight, setCorsHeaders } from '../../lib/cors';

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
  disabledDates: [],
  blackoutRanges: [],
};

function getBackendBaseUrl() {
  return process.env.BACKEND_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
    'https://vanessastudioback.netlify.app/.netlify/functions';
}

function normalizeConfig(config) {
  return {
    horarioAtencion: config?.horarioAtencion || DEFAULT_CONFIG.horarioAtencion,
    disabledDays: Array.isArray(config?.disabledDays) ? config.disabledDays : [],
    disabledDates: Array.isArray(config?.disabledDates) ? config.disabledDates : [],
    blackoutRanges: Array.isArray(config?.blackoutRanges) ? config.blackoutRanges : [],
  };
}

export default async function handler(req, res) {
  if (handleCorsPreflight(req, res, { methods: 'GET, POST, OPTIONS' })) return;
  setCorsHeaders(req, res, { methods: 'GET, POST, OPTIONS' });

  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!enforceAllowedOrigin(req, res)) return;

  if (!(await verifyAdminRequest(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const backendUrl = `${getBackendBaseUrl()}/horarios`;

  try {
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: req.method === 'POST' ? JSON.stringify(req.body || {}) : undefined,
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      if (req.method === 'GET') {
        return res.status(200).json({
          ...normalizeConfig(DEFAULT_CONFIG),
          degraded: true,
          warning: 'No se pudo leer la configuración remota. Se devolvió la configuración local del frontend.',
          backendStatus: response.status,
          backendError: data?.error || text || 'Backend unavailable',
        });
      }

      return res.status(response.status).json({
        error: data?.error || 'Failed to communicate with backend',
        details: text || null,
      });
    }

    return res.status(200).json(normalizeConfig(data));
  } catch (error) {
    if (req.method === 'GET') {
      return res.status(200).json({
        ...normalizeConfig(DEFAULT_CONFIG),
        degraded: true,
        warning: 'No se pudo leer la configuración remota. Se devolvió la configuración local del frontend.',
        backendError: error?.message || 'Unknown error',
      });
    }

    return res.status(500).json({
      error: 'Failed to communicate with backend',
      details: error?.message || 'Unknown error',
    });
  }
}
