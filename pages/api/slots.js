﻿const GAS_URL = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL;

export default async function handler(req, res) {
  if (!GAS_URL) {
    return res.status(500).json({ error: 'La URL del script de Google no está configurada.' });
  }

  try {
    const url = new URL(GAS_URL);
    Object.keys(req.query).forEach(key => url.searchParams.append(key, req.query[key]));

    // --- INICIO: Bloque de Diagnóstico ---
    const diagnosticInfo = {
      message: "Información de diagnóstico desde /api/slots",
      receivedQuery: req.query,
      finalUrlSentToGoogle: url.toString(),
    };
    console.log(diagnosticInfo);
    // --- FIN: Bloque de Diagnóstico ---

    const gasResponse = await fetch(url.toString());
    
    const text = await gasResponse.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Respuesta no-JSON de Google Apps Script:", text);
      // Devolvemos la información de diagnóstico junto con el error
      return res.status(502).json({ 
        error: "El servidor de Google devolvió una respuesta inesperada (no es JSON).",
        responseText: text,
        diagnosticInfo
      });
    }

    if (!gasResponse.ok || data.error) {
      // Devolvemos la información de diagnóstico junto con el error
      return res.status(gasResponse.status).json({
        error: data.error || 'Error en la respuesta de Google Apps Script.',
        diagnosticInfo
      });
    }

    res.status(200).json(data);
    
  } catch (error) {
    console.error('Error en /api/slots:', error);
    res.status(500).json({ error: error.message || 'Error interno al obtener los horarios.' });
  }
}
