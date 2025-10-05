// pages/api/book.js

function isEmailValid(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method Not Allowed' }, 405);
    }

    const GAS_URL  = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL;
    const CALENDAR = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID || '';
    const TZ       = process.env.NEXT_PUBLIC_TZ || 'America/Santiago';

    if (!GAS_URL) {
      return jsonResponse({ error: 'Falta NEXT_PUBLIC_GAS_WEBHOOK_URL' }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const {
      serviceId,
      serviceName,
      date,
      start,
      durationMin,
      client,
      extraCupo,
      extraCup,
      durationOverrideMin,
    } = body;

    const normalizedClient = {
      name: client?.name ? String(client.name).trim() : '',
      email: client?.email ? String(client.email).trim() : '',
      phone: client?.phone ? String(client.phone).trim() : '',
    };

    if (!serviceId || !date || !start || !normalizedClient.name || !normalizedClient.email) {
      return jsonResponse({ error: 'Datos incompletos' }, 400);
    }
    if (!isEmailValid(normalizedClient.email)) {
      return jsonResponse({ error: 'Email invalido' }, 400);
    }

    const resolvedDurationMin = durationOverrideMin != null
      ? Number(durationOverrideMin)
      : durationMin != null
        ? Number(durationMin)
        : undefined;

    if (!Number.isFinite(resolvedDurationMin)) {
      return jsonResponse({ error: 'Duracion invalida' }, 400);
    }

    const payload = {
      client: normalizedClient,
      nombre: normalizedClient.name,
      email: normalizedClient.email,
      telefono: normalizedClient.phone,
      date,
      fecha: date,
      start,
      hora: start,
      serviceId: String(serviceId),
      serviceName: serviceName || '',
      extraCupo: extraCupo ?? extraCup ?? false,
      durationMin: resolvedDurationMin,
      calendarId: CALENDAR,
      tz: TZ,
    };

    const r = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!r.ok || data?.success === false) {
      const statusFromData = Number(data?.statusCode);
      const status = Number.isFinite(statusFromData) && statusFromData >= 400 ? statusFromData : (r.ok ? 500 : r.status);
      return jsonResponse({ error: data?.error || 'GAS error', data }, status);
    }
    return jsonResponse({ success: true, data });

  } catch (err) {
    console.error('Error en /api/book:', err);
    return jsonResponse({ error: String(err) }, 500);
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
