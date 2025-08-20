// lib/api.js

// Helper genérico de fetch
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * Obtiene disponibilidad de horarios
 * @param {Object} params
 * @param {string} params.date - fecha única YYYY-MM-DD (si se pasa, ignora from/to)
 * @param {string} [params.serviceId] - id del servicio (ej. "1", "2", "3", "8")
 * @param {string} [params.from] - fecha inicial YYYY-MM-DD (para rango)
 * @param {string} [params.to] - fecha final YYYY-MM-DD (para rango)
 * @param {number} [params.duration] - duración override en minutos
 * @param {boolean} [params.debug] - si true devuelve extras
 */
export async function getAvailability(params = {}) {
  const sp = new URLSearchParams();

  if (params.date) sp.set("date", params.date);
  if (params.serviceId) sp.set("serviceId", params.serviceId);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.duration) sp.set("duration", params.duration);
  if (params.debug) sp.set("debug", "1");

  const url = `/api/availability?${sp.toString()}`;
  return fetchJSON(url);
}

/**
 * Envía una reserva al backend
 * Aquí deberías tener tu endpoint `/api/book` o `/api/reserve`.
 * Por ahora solo esqueleto.
 */
export async function bookAppointment(data) {
  const url = `/api/book`;
  return fetchJSON(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/**
 * Sincroniza con Google Sheets (ejemplo).
 * Este endpoint depende de cómo armes tu `/api/sheets`.
 */
export async function syncToSheets(data) {
  const url = `/api/sheets`;
  return fetchJSON(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/**
 * Enviar correo de confirmación (ejemplo).
 * Endpoint `/api/send-email` que llame a tu servicio SMTP/SendGrid/etc.
 */
export async function sendConfirmationEmail(data) {
  const url = `/api/send-email`;
  return fetchJSON(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

