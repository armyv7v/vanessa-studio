// pages/api/gs-check.js
// Resiliente: nunca retorna 500. Siempre cae a DEFAULT_CONFIG si algo falla.

import { getBackendHorariosUrl } from '../../lib/backendRouting';
import horariosConfig from '../../config/horarios.json';

const DEFAULT_CONFIG = {
  ok: true,
  disabledDays: [],
  disabledDates: [],
  blackoutRanges: [],
  workingHours: horariosConfig.horarioAtencion || {},
  extraCuposConfig: horariosConfig.extraCuposConfig || {
    enabled: true,
    start: '18:00',
    end: '20:00',
    daysToShow: 35,
    extraChargeClp: 5000,
  },
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

  try {
    const response = await fetch(getBackendHorariosUrl(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`Backend status ${response.status}`);

    const data = await response.json();

    const result = jsonRes({
      ok: true,
      disabledDays: Array.isArray(data?.disabledDays) ? data.disabledDays : [],
      disabledDates: Array.isArray(data?.disabledDates) ? data.disabledDates : [],
      blackoutRanges: Array.isArray(data?.blackoutRanges) ? data.blackoutRanges : [],
      workingHours: data?.horarioAtencion || DEFAULT_CONFIG.workingHours,
      extraCuposConfig: data?.extraCuposConfig || DEFAULT_CONFIG.extraCuposConfig,
    });
    return res.status(result.status).json(result.body);
  } catch {
    const result = jsonRes(DEFAULT_CONFIG);
    return res.status(result.status).json(result.body);
  }
}
