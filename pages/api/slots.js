// pages/api/slots.js
export const config = { runtime: 'edge' };

/**
 * Endpoint de disponibilidad:
 * - Lee eventos públicos del calendar con API Key (NEXT_PUBLIC_GCAL_API_KEY)
 * - Genera slots cada 30 min entre OPEN/CLOSE (TZ America/Santiago)
 * - Filtra slots pasados si es el día actual
 * - Permite configurar sábados/domingos y desactivar domingos específicos por mes
 */

const TZ = 'America/Santiago';
const OPEN_HOUR = 10;
const CLOSE_HOUR = 19; // último slot comienza 18:30
const SLOT_MINUTES = 30;

// ¿Habilitar sábados y domingos por defecto?
const ENABLE_SATURDAY = true;
const ENABLE_SUNDAY_DEFAULT = true; // true: se muestran (pero puedes desactivar algunos abajo)

// Desactivar domingos específicos por mes (ej: { "2025-08": [1, 3] } desactiva DOM1 y DOM3 de ago-2025)
const DISABLE_SUNDAYS_BY_MONTH = {
  // "2025-08": [1, 3],
};

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

// Utilidades
function formatYYYYMMDD(d) {
  return d.toISOString().slice(0, 10);
}
function toLocalDate(dateStr, timeStr) {
  // dateStr = YYYY-MM-DD, timeStr = HH:mm — en TZ local
  const [Y, M, D] = dateStr.split('-').map(Number);
  const [h, m] = timeStr.split(':').map(Number);
  return new Date(Y, M - 1, D, h, m, 0, 0);
}
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}
function getSundayIndex(date) {
  // Devuelve el índice de domingo del mes (1..5) para esa fecha si es domingo
  // Ej: el primer domingo del mes => 1, segundo domingo => 2, etc.
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  let idx = 0;
  for (let i = 1; i <= 31; i++) {
    d.setDate(i);
    if (d.getMonth() !== date.getMonth()) break;
    if (d.getDay() === 0) { // domingo
      idx++;
      if (d.getDate() === date.getDate()) return idx;
    }
  }
  return null;
}

function shouldDisableSunday(date) {
  if (!ENABLE_SUNDAY_DEFAULT) return true; // si el default es deshabilitar domingo
  const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const list = DISABLE_SUNDAYS_BY_MONTH[ym];
  if (!list || !list.length) return false;
  const idx = getSundayIndex(date); // 1..5
  return idx ? list.includes(idx) : false;
}

function generateDaySlots({ date, slotMinutes, openHour, closeHour, nowUtc }) {
  const slots = [];
  // fecha local (America/Santiago). Usamos Date sin forzar TZ porque el server está UTC,
  // pero comparamos con nowUtc y convertimos ISO al final.
  const localStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), openHour, 0, 0, 0);
  const localEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), closeHour, 0, 0, 0);

  for (let t = new Date(localStart); t < localEnd; t = addMinutes(t, slotMinutes)) {
    // filtro de “pasado” si es el día actual
    const isSameDay =
      t.getFullYear() === nowUtc.getFullYear() &&
      t.getMonth() === nowUtc.getMonth() &&
      t.getDate() === nowUtc.getDate();

    // Convertimos "t" (que asumimos como hora local) a una aproximación UTC comparando por hora/min
    // Para evitar desfase, comparamos por fecha/hora local textual si es el mismo día.
    if (isSameDay) {
      // Si ya pasó, no lo ofrecemos
      const nowLocal = new Date(
        t.getFullYear(),
        t.getMonth(),
        t.getDate(),
        new Date().getHours(),
        new Date().getMinutes(),
        0,
        0
      );
      // Si la hora del slot + 1 minuto es <= ahora local, saltar
      if (addMinutes(t, 1) <= nowLocal) continue;
    }

    const end = addMinutes(t, slotMinutes);
    slots.push({ start: new Date(t), end });
  }
  return slots;
}

function slotFitsDuration(slotStart, durationMin, busy) {
  const wantedEnd = addMinutes(slotStart, durationMin);
  // Si cualquier busy interseca [slotStart, wantedEnd) => no cabe
  for (const b of busy) {
    if (overlaps(slotStart, wantedEnd, b.start, b.end)) return false;
  }
  return true;
}

async function listPublicEvents({ calendarId, apiKey, timeMinISO, timeMaxISO }) {
  const params = new URLSearchParams({
    key: apiKey,
    timeMin: timeMinISO,
    timeMax: timeMaxISO,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '2500',
  });
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`;
  const res = await fetch(url);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch (e) {
    throw new Error(`Calendar no-JSON: ${text.slice(0, 300)}`);
  }
  if (!res.ok) {
    throw new Error(`Google Calendar ${res.status}: ${text}`);
  }
  const items = json.items || [];
  const busy = items
    .map((it) => {
      const s = it.start?.dateTime || it.start?.date;
      const e = it.end?.dateTime || it.end?.date;
      if (!s || !e) return null;
      return { start: new Date(s), end: new Date(e) };
    })
    .filter(Boolean);
  return { busy };
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date'); // YYYY-MM-DD
    const serviceId = searchParams.get('serviceId') || '8'; // default 8
    const apiKey = process.env.NEXT_PUBLIC_GCAL_API_KEY;
    const calendarId = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID;

    if (!date) {
      return new Response(JSON.stringify({ error: 'Falta date=YYYY-MM-DD' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (!apiKey || !calendarId) {
      return new Response(JSON.stringify({ error: 'Faltan variables NEXT_PUBLIC_GCAL_API_KEY o NEXT_PUBLIC_GCAL_CALENDAR_ID' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    const durationMin = SERVICE_DURATIONS[serviceId] || 60;

    // Construir fecha local
    const [Y, M, D] = date.split('-').map(Number);
    const day = new Date(Y, M - 1, D, 12, 0, 0, 0); // mediodía local
    const dayOfWeek = day.getDay(); // 0 dom, 6 sab

    // Reglas fines de semana:
    if (dayOfWeek === 6 && !ENABLE_SATURDAY) {
      return new Response(JSON.stringify({ availableSlots: [], reason: 'Saturday disabled' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (dayOfWeek === 0) {
      if (!ENABLE_SUNDAY_DEFAULT || shouldDisableSunday(day)) {
        return new Response(JSON.stringify({ availableSlots: [], reason: 'Sunday disabled' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
    }

    // Ventana para pedir eventos (todo el día)
    const timeMinISO = new Date(Y, M - 1, D, 0, 0, 0, 0).toISOString();
    const timeMaxISO = new Date(Y, M - 1, D + 1, 0, 0, 0, 0).toISOString();

    const { busy } = await listPublicEvents({
      calendarId,
      apiKey,
      timeMinISO,
      timeMaxISO,
    });

    // Genera slots de 30 min entre OPEN/CLOSE
    const nowUtc = new Date();
    const slots = generateDaySlots({
      date: day,
      slotMinutes: SLOT_MINUTES,
      openHour: OPEN_HOUR,
      closeHour: CLOSE_HOUR,
      nowUtc,
    });

    // Filtrar por disponibilidad real considerando duración del servicio
    const available = slots
      .filter(({ start }) => slotFitsDuration(start, durationMin, busy))
      .map(({ start }) => {
        // devolver formato 'HH:mm' para la UI
        const hh = String(start.getHours()).padStart(2, '0');
        const mm = String(start.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      });

    return new Response(JSON.stringify({
      date,
      serviceId,
      openHour: OPEN_HOUR,
      closeHour: CLOSE_HOUR,
      slotMinutes: SLOT_MINUTES,
      durationMin,
      busy,
      availableSlots: available,
    }), {
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
