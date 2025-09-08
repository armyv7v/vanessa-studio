// pages/api/slots.js
import { DateTime, Interval } from "luxon";
import { listPublicEvents } from "../../lib/google-calendar";

export const config = { runtime: "edge" };

// Zona horaria base del negocio
const TZ = "America/Santiago";

// Duración por servicio (minutos)
const SERVICE_DURATIONS = {
  "1": 120,
  "2": 180,
  "3": 180,
  "4": 180,
  "5": 180,
  "6": 150,
  "7": 150,
  "8": 90, // Esmaltado Permanente
};

// Ventanas de inicio permitidas (inclusivas), en minutos desde 00:00
const HALF_HOUR = 30;

// Normal: 10:00 → 17:30 (inclusive)
const NORMAL_START_MIN = 10 * 60;       // 600
const NORMAL_LAST_START_MIN = 17 * 60 + 30; // 1050

// Extra cupo: 18:00 → 20:00 (inclusive)
const EXTRA_START_MIN = 18 * 60;        // 1080
const EXTRA_LAST_START_MIN = 20 * 60;   // 1200

// Helper: genera minutos [a, b] cada 30
function rangeMinutesEvery30(a, b) {
  const out = [];
  for (let m = a; m <= b; m += HALF_HOUR) out.push(m);
  return out;
}

// Normaliza ocupados desde Google Calendar items o busy[]
function normalizeBusy(resp) {
  // Soporta {items:[{start/end}]} o {busy:[{start/end}]}
  const list = resp?.items || resp?.busy || [];
  return list
    .map((it) => {
      const s = it.start?.dateTime || it.start?.date;
      const e = it.end?.dateTime || it.end?.date;
      if (!s || !e) return null;
      return {
        start: DateTime.fromISO(s, { zone: TZ }),
        end: DateTime.fromISO(e, { zone: TZ }),
      };
    })
    .filter(Boolean)
    .filter(({ start, end }) => start.isValid && end.isValid);
}

// Chequea cruce de intervalos
function overlaps(aStart, aEnd, bStart, bEnd) {
  // a<bEnd && aEnd>bStart
  return aStart < bEnd && aEnd > bStart;
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);

    // Parámetros
    const dateStr = searchParams.get("date");        // YYYY-MM-DD (requerido)
    const serviceId = String(searchParams.get("serviceId") || "8");
    const mode = searchParams.get("mode") || "normal"; // "normal" | "extra"

    if (!dateStr) {
      return new Response(
        JSON.stringify({ error: "Falta parámetro 'date' (YYYY-MM-DD)" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Duración del servicio
    const duration = SERVICE_DURATIONS[serviceId] || 60;

    // Día base en TZ local
    const day = DateTime.fromISO(dateStr, { zone: TZ }).startOf("day");
    if (!day.isValid) {
      return new Response(
        JSON.stringify({ error: "Fecha inválida" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Ventana de consulta al Calendar (todo el día)
    const timeMin = day.toISO();
    const timeMax = day.plus({ days: 1 }).toISO();

    // Traer eventos ocupados del calendario
    // (Asegúrate que NEXT_PUBLIC_GCAL_API_KEY y NEXT_PUBLIC_GCAL_CALENDAR_ID estén seteados)
    const busyResp = await listPublicEvents({
      timeMin,
      timeMax,
    });
    const busy = normalizeBusy(busyResp);

    // Generar posibles inicios según modo
    let startMin, lastStartMin;
    if (mode === "extra") {
      startMin = EXTRA_START_MIN;
      lastStartMin = EXTRA_LAST_START_MIN;
    } else {
      startMin = NORMAL_START_MIN;
      lastStartMin = NORMAL_LAST_START_MIN;
    }

    const starts = rangeMinutesEvery30(startMin, lastStartMin);

    // “Ahora” en TZ negocio para filtrar horas pasadas solo si es hoy
    const now = DateTime.now().setZone(TZ);
    const isToday = now.hasSame(day, "day");

    const slots = [];
    const availableSlots = [];

    for (const m of starts) {
      const slotStart = day.plus({ minutes: m });
      const slotEnd = slotStart.plus({ minutes: duration });

      // Filtrar horas pasadas solo si es hoy
      if (isToday && slotStart <= now) {
        continue;
      }

      // Verificar cruce con ocupados
      const isOverlapped = busy.some(({ start, end }) =>
        overlaps(slotStart, slotEnd, start, end)
      );

      const ok = !isOverlapped;

      slots.push({
        start: slotStart.toISO(),
        end: slotEnd.toISO(),
        available: ok,
      });

      if (ok) {
        // Lo que consume el front (HH:mm en TZ local)
        availableSlots.push(slotStart.toFormat("HH:mm"));
      }
    }

    return new Response(
      JSON.stringify({
        date: day.toISODate(),
        tz: TZ,
        mode,
        serviceId,
        durationMin: duration,
        availableSlots,
        slots,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
