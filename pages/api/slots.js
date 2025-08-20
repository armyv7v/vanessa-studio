// pages/api/slots.js
export const config = { runtime: 'edge' };

import { listPublicEvents } from '../../lib/google-calendar';

/**
 * Duración por servicio (minutos) — debe coincidir con tu UI/GAS.
 */
const SERVICE_DURATIONS = {
  '1': 120,
  '2': 180,
  '3': 180,
  '4': 180,
  '5': 180,
  '6': 150,
  '7': 150,
  '8': 90,
};

/**
 * Formatea HH:mm local (America/Santiago)
 */
function toHHmmLocal(d) {
  return new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Santiago',
  }).format(d);
}

/**
 * Genera slots cada 30' y marca disponibles solo si
 * hay bloques consecutivos suficientes para cubrir la duración del servicio.
 */
function generateTimeSlots({
  date,                // YYYY-MM-DD
  openHour = 10,       // 10:00
  closeHour = 19,      // 19:00
  slotMinutes = 30,    // intervalos de 30'
  serviceMinutes = 60, // duración requerida
  busy = [],           // [{start, end}...]
}) {
  const blocksNeeded = Math.ceil(serviceMinutes / slotMinutes);
  const slots = [];

  // Construimos el rango del día local
  const base = new Date(`${date}T00:00:00`);
  const dayStart = new Date(base);
  dayStart.setHours(openHour, 0, 0, 0);
  const dayEnd = new Date(base);
  dayEnd.setHours(closeHour, 0, 0, 0);

  // Normaliza busy a Date
  const busyRanges = (busy || [])
    .map((b) => ({ start: new Date(b.start), end: new Date(b.end) }))
    .filter((b) => !isNaN(b.start) && !isNaN(b.end));

  // Genera slots cada 30' desde openHour a closeHour
  for (let t = new Date(dayStart); t < dayEnd; t = new Date(t.getTime() + slotMinutes * 60000)) {
    const slotStart = new Date(t);
    const slotEnd = new Date(slotStart.getTime() + slotMinutes * 60000);

    // Verifica bloques consecutivos
    let ok = true;
    let endOfService = new Date(slotStart);
    for (let i = 0; i < blocksNeeded; i++) {
      const blockStart = new Date(slotStart.getTime() + i * slotMinutes * 60000);
      const blockEnd = new Date(blockStart.getTime() + slotMinutes * 60000);

      // no pasar del día
      if (blockEnd > dayEnd) {
        ok = false;
        break;
      }

      // solapamiento con eventos ocupados
      const overlapped = busyRanges.some((b) => blockStart < b.end && blockEnd > b.start);
      if (overlapped) {
        ok = false;
        break;
      }
      endOfService = blockEnd;
    }

    slots.push({
      start: slotStart.toISOString(),
      end: slotEnd.toISOString(),
      available: ok,
      // para debug opcional:
      // endOfServiceISO: endOfService.toISOString(),
    });
  }

  return slots;
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);

    // Compatibilidad con el antiguo endpoint (?date, ?serviceId)
    const date = searchParams.get('date'); // YYYY-MM-DD
    const serviceId = searchParams.get('serviceId') || '8';

    // Nuevos parámetros opcionales
    const openHour = parseInt(searchParams.get('openHour') || '10', 10);
    const closeHour = parseInt(searchParams.get('closeHour') || '19', 10);
    const slotMinutes = parseInt(searchParams.get('slotMinutes') || '30', 10);

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response(JSON.stringify({ error: 'Parámetro "date" (YYYY-MM-DD) es obligatorio' }), {
        headers: { 'content-type': 'application/json' },
        status: 400,
      });
    }

    const serviceMinutes = SERVICE_DURATIONS[serviceId] || 60;

    // Leer eventos del calendario público para "date"
    const { busy } = await listPublicEvents({ date });

    // Generar slots de 30' y bloquear por duración del servicio
    const slots = generateTimeSlots({
      date,
      openHour,
      closeHour,
      slotMinutes,
      serviceMinutes,
      busy,
    });

    // Legacy: lista simple de strings "HH:mm" para los slots disponibles
    const availableSlots = slots
      .filter((s) => s.available)
      .map((s) => toHHmmLocal(new Date(s.start)));

    // Legacy: "times" (mantener por compatibilidad)
    const times = availableSlots;

    const res = {
      from: date,
      to: date,
      openHour,
      closeHour,
      slotMinutes,
      serviceMinutes,
      busy,
      slots,
      availableSlots,
      times,
    };

    return new Response(JSON.stringify(res), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err.message || err) }), {
      headers: { 'content-type': 'application/json' },
      status: 500,
    });
  }
}


