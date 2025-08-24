// pages/api/book.js
export const config = { runtime: 'edge' };

/**
 * Reenvía la reserva al Google Apps Script (GAS) Web App
 * Env vars requeridas:
 *  - GAS_WEBAPP_URL   (URL del deploy de tu script)
 */

const SERVICE_MAP = {
  '1': { name: 'Retoque (Mantenimiento)', duration: 120 },
  '2': { name: 'Reconstrucción Uñas Mordidas (Onicofagía)', duration: 180 },
  '3': { name: 'Uñas Acrílicas', duration: 180 },
  '4': { name: 'Uñas Polygel', duration: 180 },
  '5': { name: 'Uñas Softgel', duration: 180 },
  '6': { name: 'Kapping o Baño Polygel o Acrílico sobre uña natural', duration: 150 },
  '7': { name: 'Reforzamiento Nivelación Rubber', duration: 150 },
  '8': { name: 'Esmaltado Permanente', duration: 90 },
};

export default async function handler(req) {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Sólo POST' }), {
        status: 405,
        headers: { 'content-type': 'application/json' },
      });
    }

    const body = await req.json();
    const { serviceId, date, start, client } = body || {};
    if (!serviceId || !date || !start || !client?.name || !client?.email) {
      return new Response(JSON.stringify({ error: 'Parámetros incompletos' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const svc = SERVICE_MAP[String(serviceId)] || { name: 'Servicio', duration: 60 };
    const payload = {
      nombre: client.name,
      email: client.email,
      telefono: client.phone || '',
      fecha: date,       // YYYY-MM-DD
      hora: start,       // HH:mm
      serviceId: String(serviceId),
      servicio: svc.name,
      durationMin: svc.duration,
    };

    const gasUrl = process.env.GAS_WEBAPP_URL;
    if (!gasUrl) {
      return new Response(JSON.stringify({ error: 'Falta GAS_WEBAPP_URL' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch {
      return new Response(JSON.stringify({ error: `GAS no-JSON: ${text.slice(0, 300)}` }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    if (!res.ok || json?.success === false) {
      return new Response(JSON.stringify({ error: json?.error || res.statusText }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, ...json }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
