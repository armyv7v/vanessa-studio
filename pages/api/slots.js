﻿const GAS_URL = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!GAS_URL) {
    return res.status(500).json({ error: 'La URL del script de Google no está configurada.' });
  }

  try {
    // Reenviamos todos los parámetros de la consulta (date, serviceId, mode) a Google Apps Script
    const url = new URL(GAS_URL);
    Object.keys(req.query).forEach(key => url.searchParams.append(key, req.query[key]));

    const gasResponse = await fetch(url.toString());
    const data = await gasResponse.json();

    if (!gasResponse.ok) {
      throw new Error(data?.error || 'Error al contactar el servicio de Google para obtener horarios.');
    }

    // Devolvemos la misma respuesta que nos da Google Apps Script
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Error en /api/slots:', error);
    res.status(500).json({ error: error.message || 'Error interno al obtener los horarios.' });
  }
}
