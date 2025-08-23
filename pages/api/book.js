// pages/api/book.js
// Envia la reserva al Web App de Google Apps Script (doPost), que:
//  - Inserta el evento en el Calendar secundario
//  - Envía emails (cliente + owner)
//  - Registra en Google Sheets

export const config = { runtime: 'edge' };

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
      return new Response(JSON.stringify({ error: 'Método no permitido' }), {
        status: 405,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }

    const body = await req.json();
    const { serviceId, date, start, client } = body || {};
    if (!serviceId || !date || !start || !client?.name || !client?.email) {
      return new Response(JSON.stringify({ error: 'Faltan datos obligatorios (serviceId, date, start, client.name, client.email)' }), {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }

    const svc = SERVICE_MAP[String(serviceId)] || { name: 'Servicio', duration: 60 };
    const GS_WEBHOOK_URL = process.env.GS_WEBHOOK_URL;
    if (!GS_WEBHOOK_URL) {
      return new Response(JSON.stringify({ error: 'GS_WEBHOOK_URL no configurada' }), {
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }

    const payload = {
      nombre: client.name,
      email: client.email,
      telefono: client.phone || '',
      fecha: date,            // YYYY-MM-DD
      hora: start,            // HH:mm
      servicio: svc.name,
      serviceId: String(serviceId),
      durationMin: svc.duration,
    };

    const res = await fetch(GS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const txt = await res.text().catch(() => '');
    const data = (() => { try { return JSON.parse(txt); } catch { return { raw: txt }; } })();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Apps Script ${res.status}`, detail: data }), {
        status: 502,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }

    return new Response(JSON.stringify({ ok: true, result: data }), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
}
