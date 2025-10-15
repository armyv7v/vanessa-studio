// pages/api/gs-check.js

export const runtime = 'nodejs';

export default async function handler(req, res) {
  const url = process.env.GAS_WEBAPP_URL || process.env.NEXT_PUBLIC_GAS_WEBAPP_URL;
  if (!url) {
    return res.status(500).json({ ok: false, error: 'GAS_WEBAPP_URL no configurada.' });
  }

  // Forma correcta y estándar de obtener los query params en Next.js API Routes
  const { action } = req.query;

  // Nueva lógica para obtener la configuración de días deshabilitados
  if (action === 'getConfig') {
    try {
      const configUrl = new URL(url);
      configUrl.searchParams.set('action', 'getConfig');
      const apiRes = await fetch(configUrl.toString());
      const data = await apiRes.json();
      if (!apiRes.ok) {
        throw new Error(data?.error || 'Error al obtener la configuración desde Google Script.');
      }
      return res.status(200).json(data);
    } catch (err) {
      return res.status(502).json({ ok: false, error: String(err?.message || err) });
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
    try { parsed = JSON.parse(text); } catch (e) { /* Ignorar si no es JSON */ }

    return res.status(200).json({
      ok: true,
      status: r.status,
      contentType: r.headers.get('content-type'),
      parsed,
      rawSample: text.slice(0, 500),
    });
  } catch (err) {
    return res.status(502).json({ ok: false, error: String(err?.message || err) });
  }
}
