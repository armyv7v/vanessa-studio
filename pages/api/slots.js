// pages/api/slots.js
// Resiliente: si el backend falla, retorna { busy: [] } con 200 (muestra todos los horarios disponibles)

import { getBackendApiUrl } from '../../lib/backendRouting';

export default async function handler(req, res) {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'El parámetro date es obligatorio (YYYY-MM-DD).' });
  }

  try {
    const backendUrl = new URL(getBackendApiUrl());
    backendUrl.searchParams.set('date', date);

    const response = await fetch(backendUrl.toString());

    if (!response.ok) {
      // Backend no disponible: mostrar todos los horarios como disponibles
      return res.status(200).json({ busy: [], degraded: true });
    }

    const payload = await response.json().catch(() => null);
    return res.status(200).json({ busy: payload?.busy || [] });
  } catch {
    // Fallback silencioso: nunca 500
    return res.status(200).json({ busy: [], degraded: true });
  }
}
