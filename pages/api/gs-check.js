﻿﻿﻿// pages/api/gs-check.js

export const runtime = 'nodejs';

export default async function handler(req) {
  const url = process.env.GAS_WEBAPP_URL || process.env.NEXT_PUBLIC_GAS_WEBAPP_URL;
  if (!url) {
    return jsonResponse({ ok: false, error: 'GAS_WEBAPP_URL no configurada.' }, 500);
  }

  // Forma correcta y estándar de obtener los query params en Next.js API Routes
  const { action } = req.query;

  // Nueva lógica para obtener la configuración de días deshabilitados
  if (action === 'getConfig') {
    try {
      const configUrl = new URL(url);
      configUrl.searchParams.set('action', 'getConfig');
      const res = await fetch(configUrl.toString());
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Error al obtener la configuración desde Google Script.');
      }
      return jsonResponse(data);
    } catch (err) {
      return jsonResponse({ ok: false, error: String(err?.message || err) }, 502);
    }
  }

  const probeBody = {
    nombre: 'Ping',
    email: 'ping@example.com',
    telefono: '000',
    fecha: '2025-08-21',
    hora: '10:00',
    serviceId: '8',
    durationMin: 30,
  };

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(probeBody),
      redirect: 'follow',
    });
    const text = await r.text();
    let parsed = null;
    try { parsed = JSON.parse(text); } catch (_) {}

    return jsonResponse({
      ok: true,
      status: r.status,
      contentType: r.headers.get('content-type'),
      parsed,
      rawSample: text.slice(0, 500),
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err?.message || err) }, 502);
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
