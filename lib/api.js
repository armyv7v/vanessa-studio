// lib/api.js

/**
 * Helper que garantiza respuesta JSON y errores claros.
 */
export async function safeFetchJSON(input, init) {
  const res = await fetch(input, init);
  const ct = res.headers.get('content-type') || '';
  const text = await res.text();
  if (!ct.includes('application/json')) {
    throw new Error(`Respuesta no-JSON (${ct}). Body: ${text.slice(0, 400)}`);
  }
  let json;
  try { json = JSON.parse(text); }
  catch (e) { throw new Error(`JSON inválido: ${e.message}\nBody: ${text.slice(0, 400)}`); }

  if (!res.ok) {
    throw new Error(json?.error || res.statusText);
  }
  return json;
}

/**
 * Obtiene disponibilidad para un día/servicio (compat con /api/slots).
 * Devuelve { availableSlots: ["HH:mm", ...], raw: <respuesta completa> }
 */
export async function fetchAvailability({ date, serviceId, signal } = {}) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (serviceId) params.set('serviceId', String(serviceId));

  const url = `/api/slots?${params.toString()}`;
  const json = await safeFetchJSON(url, { signal });

  // Compatibilidad: si la API ya regresa availableSlots, úsalo.
  const availableSlots = Array.isArray(json.availableSlots)
    ? json.availableSlots
    : Array.isArray(json.times) ? json.times.map((iso) => new Date(iso)) : [];

  return { availableSlots, raw: json };
}

/**
 * Envía la reserva a /api/book (que reenvía a tu Google Apps Script)
 */
export async function postBooking(payload) {
  const json = await safeFetchJSON('/api/book', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return json;
}
