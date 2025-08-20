// pages/api/book.js
export const config = { runtime: 'edge' };

/**
 * Mapa de servicios (id -> nombre + duración en minutos).
 * Debe coincidir con lo que usas en UI y con GAS.
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

/**
 * Convierte a HH:mm en America/Santiago.
 * Acepta "HH:mm" o ISO datetime.
 */
function toHHmmLocal(value) {
  if (!value) return '';
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (isNaN(d)) return '';
  return new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Santiago',
  }).format(d);
}

function badRequest(message) {
  return new Response(JSON.stringify({ error: message }), {
    headers: { 'content-type': 'application/json' },
    status: 400,
  });
}

export default async function handler(req) {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método no permitido' }), {
        headers: { 'content-type': 'application/json' },
        status: 405,
      });
    }

    // Prefiere BOOK_GAS_URL; si no, usa NEXT_PUBLIC_GAS_BOOK_URL
    const GAS_URL = process.env.BOOK_GAS_URL || process.env.NEXT_PUBLIC_GAS_BOOK_URL;
    if (!GAS_URL) {
      return new Response(JSON.stringify({ error: 'Falta BOOK_GAS_URL (o NEXT_PUBLIC_GAS_BOOK_URL)' }), {
        headers: { 'content-type': 'application/json' },
        status: 500,
      });
    }

    const payload = await req.json();
    const serviceId = String(payload?.serviceId ?? '');
    const date = payload?.date || '';      // YYYY-MM-DD
    const startRaw = payload?.start || ''; // HH:mm o ISO
    const client = payload?.client || {};

    const svc = SERVICE_MAP[serviceId];
    if (!svc) return badRequest('serviceId inválido');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return badRequest('date debe ser YYYY-MM-DD');
    if (!startRaw) return badRequest('Falta hora de inicio (start)');
    if (!client?.name || !client?.email) return badRequest('Faltan datos de cliente (name, email)');

    const hora = toHHmmLocal(startRaw);
    if (!/^\d{2}:\d{2}$/.test(hora)) return badRequest('Hora inválida');

    // Payload para tu GAS (Apps Script Web App)
    const gasBody = {
      nombre: client.name,
      email: client.email,
      telefono: client.phone || '',
      fecha: date,                // YYYY-MM-DD
      hora,                       // HH:mm
      servicio: svc.name,
      serviceId,
      durationMin: svc.duration,  // fuente de verdad para bloquear en Calendar
    };

    const upstream = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(gasBody),
    });

    const contentType = upstream.headers.get('content-type') || '';
    const text = await upstream.text();
    const looksLikeHtml =
      contentType.includes('text/html') || /^<!doctype html>/i.test(text.trim());

    let body;
    if (!looksLikeHtml && contentType.includes('application/json')) {
      try { body = JSON.parse(text); } catch { body = { message: text }; }
    } else {
      body = { message: text };
    }

    if (!upstream.ok || looksLikeHtml || body?.success === false) {
      const hint = looksLikeHtml
        ? 'Tu Web App de Google Apps Script no está desplegado con acceso "Anyone". Re‑deploy y actualiza BOOK_GAS_URL.'
        : null;

      return new Response(JSON.stringify({
        error: body?.error || body?.message || `Error ${upstream.status}`,
        status: upstream.status,
        contentType,
        hint,
        sent: {
          serviceId,
          date,
          hora,
          client: { name: client.name, email: client.email, phone: client.phone || '' },
          durationMin: svc.duration,
        },
      }), {
        headers: { 'content-type': 'application/json' },
        status: upstream.status || 500,
      });
    }

    // OK: GAS debió crear evento, escribir en Sheets y mandar correos
    return new Response(JSON.stringify({
      ok: true,
      ...body,
      message: body?.message || 'Reserva confirmada',
    }), { headers: { 'content-type': 'application/json' }, status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'content-type': 'application/json' },
      status: 500,
    });
  }
}

