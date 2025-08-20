// pages/api/availability.js
export const config = { runtime: "edge" };

import { listPublicEvents } from "../../lib/google-calendar";

// ===== Helpers de fecha local =====
function parseLocalDate(yyyy_mm_dd) {
  const [y, m, d] = (yyyy_mm_dd || '').split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1); // Date local a medianoche (del sistema)
}

// ===== Reglas de negocio =====
const SERVICE_DURATIONS = { "1": 60, "2": 90, "3": 120, "8": 60 };

// Ignora all‑day salvo si el título indica cierre/bloqueo
function filterBusyAllDay(items) {
  const keywords = ["cerrado", "bloqueo", "bloqueado", "closed"];
  return (items || []).filter(ev => {
    const isAllDay =
      (typeof ev.start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ev.start)) ||
      (typeof ev.end   === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ev.end));
    if (!isAllDay) return true;
    const t = (ev.summary || "").toLowerCase();
    return keywords.some(k => t.includes(k)); // solo bloquea si el título lo indica
  });
}

// Genera slots usando base LOCAL; toISOString() resultará en Z correcto
function generateTimeSlots({ from, to, openHour, closeHour, slotMinutes, busy }) {
  const slots = [];
  const start = parseLocalDate(from);
  const end   = parseLocalDate(to);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    for (let h = openHour; h < closeHour; h++) {
      const slotStart = new Date(d);
      slotStart.setHours(h, 0, 0, 0);             // h:00 local
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotMinutes);

      const overlapped = (busy || []).some((b) => {
        const bStart = new Date(b.start);         // soporta ISO o YYYY-MM-DD
        const bEnd   = new Date(b.end);
        return slotStart < bEnd && slotEnd > bStart;
      });

      slots.push({
        start: slotStart.toISOString(),
        end:   slotEnd.toISOString(),
        available: !overlapped,
      });
    }
  }
  return slots;
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);

    // Compatibilidad: ?date=YYYY-MM-DD (un solo día)
    const date = searchParams.get("date");
    // Servicio (para duración)
    const serviceId = searchParams.get("serviceId");

    // Ventanas opcionales
    const fromParam = searchParams.get("from");
    const toParam   = searchParams.get("to");

    // Horario de atención (override por query si quieres testear)
    const openHour  = Number(searchParams.get("openHour") || 10);
    const closeHour = Number(searchParams.get("closeHour") || 19);

    // Depuración opcional
    const debug = searchParams.get("debug");

    // Resuelve ventana [from, to]
    let from, to;
    if (date) {
      from = date;
      to   = date;
    } else {
      from = fromParam || new Date().toISOString().slice(0,10);
      to   = toParam   || new Date(Date.now() + 7*86400000).toISOString().slice(0,10);
    }

    // Duración del slot (por servicio o override ?duration=90)
    const slotMinutesOverride = searchParams.get("duration");
    const slotMinutes =
      (slotMinutesOverride && Number(slotMinutesOverride)) ||
      (serviceId && SERVICE_DURATIONS[serviceId]) ||
      60;

    // 1) Eventos ocupados desde Calendar (la lib ya convierte a ISO correcto por día LOCAL)
    const { busy } = await listPublicEvents({ timeMin: from, timeMax: to });

    // 2) Reglas de negocio para all‑day
    const busyFiltered = filterBusyAllDay(busy);

    // 3) Generación de slots (base local)
    const slots = generateTimeSlots({
      from, to, openHour, closeHour, slotMinutes, busy: busyFiltered,
    });

    // 4) Payload nuevo + compat: `times` (inicios disponibles)
    const availableStarts = slots.filter(s => s.available).map(s => s.start);

    const payload = {
      from, to, openHour, closeHour, slotMinutes,
      busy: busyFiltered,
      slots,
      times: availableStarts,   // compat para front viejo
    };

    if (debug) {
      payload.slots_count     = slots.length;
      payload.available_count = availableStarts.length;
      payload.sample          = availableStarts.slice(0, 8);
    }

    return new Response(JSON.stringify(payload), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Availability ERROR:", err);
    const msg = String(err?.message || err);
    const hint =
      msg.includes("403") ? "Key: Application restrictions=None; API restrictions=Google Calendar API." :
      msg.includes("404") ? "GCAL_ID incorrecto o calendario no público." :
      "Verifica GCAL_ID / GCAL_KEY y que el calendario sea público.";
    return new Response(JSON.stringify({ error: msg, hint }), {
      headers: { "content-type": "application/json" },
      status: 500,
    });
  }
}
