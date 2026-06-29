import { verifyAdminRequest } from '../../lib/adminSession';
import { getBackendHorariosUrl } from '../../lib/backendRouting';
import { enforceAllowedOrigin, handleCorsPreflight, setCorsHeaders } from '../../lib/cors';

const DEFAULT_CONFIG = {
  horarioAtencion: {
    lunes: ['10:00', '21:00'],
    martes: ['10:00', '21:00'],
    miercoles: ['10:00', '21:00'],
    jueves: ['10:00', '21:00'],
    viernes: ['10:00', '21:00'],
    sabado: ['10:00', '21:00'],
    domingo: ['10:00', '21:00'],
  },
  disabledDays: [],
  disabledDates: [],
  blackoutRanges: [],
  extraCuposConfig: {
    enabled: true,
    start: '18:00',
    end: '20:00',
    daysToShow: 35,
    extraChargeClp: 5000,
  },
};

function normalizeConfig(config) {
  return {
    horarioAtencion: config?.horarioAtencion || DEFAULT_CONFIG.horarioAtencion,
    disabledDays: Array.isArray(config?.disabledDays) ? config.disabledDays : [],
    disabledDates: Array.isArray(config?.disabledDates) ? config.disabledDates : [],
    blackoutRanges: Array.isArray(config?.blackoutRanges) ? config.blackoutRanges : [],
    extraCuposConfig: config?.extraCuposConfig || DEFAULT_CONFIG.extraCuposConfig,
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

  const backendUrl = getBackendHorariosUrl();

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