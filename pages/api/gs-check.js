// pages/api/gs-check.js
export const config = { runtime: 'edge' };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export default async function handler() {
  const url = process.env.GAS_WEBAPP_URL || process.env.NEXT_PUBLIC_GAS_WEBAPP_URL;
  if (!url) {
    return json({ ok: false, error: 'GAS_WEBAPP_URL no configurada.' }, 500);
  }

  // Enviamos un POST mínimo (GAS lo validará y debe responder JSON)
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

    return json({
      ok: true,
      status: r.status,
      contentType: r.headers.get('content-type'),
      parsed,
      rawSample: text.slice(0, 500),
    });
  } catch (err) {
    return json({ ok: false, error: String(err?.message || err) }, 502);
  }
}
