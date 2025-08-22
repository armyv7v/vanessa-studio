// pages/api/book.js
export const config = { runtime: 'edge' };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

// Pequeño helper de timeout usando AbortController (Edge runtime lo soporta)
async function fetchWithTimeout(url, opts = {}, ms = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal, redirect: 'follow' });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req) {
  try {
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const envUrl = process.env.GAS_WEBAPP_URL || process.env.NEXT_PUBLIC_GAS_WEBAPP_URL;
    if (!envUrl) {
      return json({ error: 'GAS_WEBAPP_URL no configurada en .env.local' }, 500);
    }

    // Leemos el body tal como viene del front
    const payload = await req.json();

    // Validación mínima para no mandar requests vacíos a GAS
    const required = ['nombre', 'email', 'telefono', 'fecha', 'hora', 'serviceId'];
    const missing = required.filter((k) => !payload?.[k]);
    if (missing.length) {
      return json({ error: `Faltan campos: ${missing.join(', ')}` }, 400);
    }

    // Hacemos POST al Web App de GAS
    let gasResp;
    try {
      gasResp = await fetchWithTimeout(envUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }, 20000);
    } catch (err) {
      // Aquí cae el “TypeError: fetch failed” (DNS/TLS/timeout/URL mala)
      return json({
        error: 'No se pudo conectar con Google Apps Script (fetch failed)',
        hint: 'Revisa GAS_WEBAPP_URL y que el deployment está activo.',
        detail: String(err?.message || err),
      }, 502);
    }

    const text = await gasResp.text();
    // GAS siempre responde 200 con JSON de ContentService, pero por si acaso:
    if (!gasResp.ok) {
      return json({
        error: `GAS respondió ${gasResp.status}`,
        contentType: gasResp.headers.get('content-type') || '',
        body: text.slice(0, 2000),
      }, 502);
    }

    // Intentamos parsear JSON de GAS
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return json({
        error: 'GAS no devolvió JSON válido',
        bodySample: text.slice(0, 2000),
      }, 502);
    }

    if (data && data.success) {
      return json({ ok: true, ...data }, 200);
    }

    // GAS devolvió success:false u otro formato con error
    return json({
      error: data?.error || 'Error desconocido desde GAS',
      status: 200,
      contentType: 'application/json; charset=utf-8',
      hint: null,
      sent: payload,
    }, 200);

  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
}
