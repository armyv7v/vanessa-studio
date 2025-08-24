// pages/api/slots.js
export const config = { runtime: 'edge' };

/**
 * Genera disponibilidad en intervalos de 30 min, comparando contra eventos ocupados
 * en "minutos del día" (HH*60+MM) **locales**. Evitamos objetos Date para comparar.
 */

const TZ = 'America/Santiago';
const OPEN_HOUR = 9;   // 09:00
const CLOSE_HOUR = 19;  // último comienzo válido será 18:30
const SLOT_MINUTES = 30;

const ENABLE_SATURDAY = true;
const ENABLE_SUNDAY_DEFAULT = true; // si lo pones en false, ocultas todos los domingos
// Desactiva domingos puntuales: "YYYY-MM": [1,3] => DOM1 y DOM3 del mes
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

// ---------- Utils de minutos locales (sin Date) ----------
function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function minutesToHHMM(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
/** Extrae HH:MM locales del ISO y los pasa a minutos (ignora el offset porque HH:MM ya es local) */
function isoLocalHHMMToMinutes(iso) {
  // Formatos posibles:
  // - "2025-08-24T09:00:00-04:00"  -> capturamos "09:00"
  // - "2025-08-24" (evento "all-day") -> tratamos como min=0 ó 1440 según start/end
  if (!iso) return null;
  if (iso.includes('T')) {
    const m = iso.match(/T(\d{2}):(\d{2})/);
    if (!m) return null;
    const h = Number(m[1]);
    const mi = Number(m[2]);
    return h * 60 + mi;
  } else {
    // all-day (sin hora)
    // El backend de calendar para all-day entrega start.date = 'YYYY-MM-DD' y end.date = 'YYYY-MM-DD' (día siguiente)
    // Lo manejaremos fuera con un chequeo especial.
    return null;
  }
}
function getSundayIndex(date) {
  // 1..5: índice de domingo del mes para esa fecha
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  let idx = 0;
  for (let i = 1; i <= 31; i++) {
    d.setDate(i);
    if (d.getMonth() !== date.getMonth()) break;
    if (d.getDay() === 0) {
      idx++;
      if (d.getDate() === date.getDate()) return idx;
    }
  }
  return null;
}
function sundayDisabledFor(date) {
  if (!ENABLE_SUNDAY_DEFAULT) return true;
  const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const list = DISABLE_SUNDAYS_BY_MONTH[ym];
  if (!list?.length) return false;
  const idx = getSundayIndex(date);
  return idx ? list.includes(idx) : false;
}
function nowLocalMinutesInTZ() {
  // Hora local en America/Santiago -> minutos del día
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts = fmt.formatToParts(new Date());
  const hh = Number(parts.find(p => p.type === 'hour')?.value || '0');
  const mm = Number(parts.find(p => p.type === 'minute')?.value || '0');
  return hh * 60 + mm;
}

// ---------- Google Calendar (público) ----------
async function listPublicEvents({ calendarId, apiKey, timeMinISO, timeMaxISO }) {
  const qs = new URLSearchParams({
    key: apiKey,
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: timeMinISO,
    timeMax: timeMaxISO,
    maxResults: '2500',
  });
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${qs.toString()}`;
  const res = await fetch(url);
  const txt = await res.text();
  let json;
  try { json = JSON.parse(txt); }
  catch { throw new Error(`Calendar no-JSON: ${txt.slice(0, 300)}`); }
  if (!res.ok) throw new Error(`Google Calendar ${res.status}: ${txt}`);

  const items = json.items || [];
  return items;
}

// ---------- Lógica principal ----------
export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date'); // YYYY-MM-DD
    const serviceId = searchParams.get('serviceId') || '8';

    const apiKey = process.env.NEXT_PUBLIC_GCAL_API_KEY;
    const calendarId = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID;
    if (!dateStr) {
      return json({ error: 'Falta date=YYYY-MM-DD' }, 400);
    }
    if (!apiKey || !calendarId) {
      return json({ error: 'Faltan NEXT_PUBLIC_GCAL_API_KEY / NEXT_PUBLIC_GCAL_CALENDAR_ID' }, 500);
    }

    // Reglas de fin de semana
    const [Y, M, D] = dateStr.split('-').map(Number);
    const day = new Date(Y, M - 1, D, 12, 0, 0, 0); // sólo para detectar día de la semana
    const dow = day.getDay(); // 0=dom, 6=sab
    if (dow === 6 && !ENABLE_SATURDAY) return json({ availableSlots: [], reason: 'Saturday disabled' });
    if (dow === 0 && sundayDisabledFor(day)) return json({ availableSlots: [], reason: 'Sunday disabled' });

    const durationMin = SERVICE_DURATIONS[serviceId] || 60;

    // Rango del día completo en UTC para consultar eventos
    const timeMinISO = new Date(Y, M - 1, D, 0, 0, 0, 0).toISOString();
    const timeMaxISO = new Date(Y, M - 1, D + 1, 0, 0, 0, 0).toISOString();

    const items = await listPublicEvents({ calendarId, apiKey, timeMinISO, timeMaxISO });

    // Convierte eventos ocupados a rangos en minutos del día local
    // Si es all-day (start.date & end.date) => ocupamos todo el día
    const busyRanges = [];
    for (const it of items) {
      const s = it.start || {};
      const e = it.end || {};

      if (s.date && e.date) {
        // all-day: ocupa todo el día seleccionado si está dentro
        // La API suele dar end.date = día siguiente
        busyRanges.push([0, 24 * 60]);
        continue;
      }
      const sMin = isoLocalHHMMToMinutes(s.dateTime);
      const eMin = isoLocalHHMMToMinutes(e.dateTime);
      if (sMin == null || eMin == null) continue;
      busyRanges.push([sMin, eMin]); // [inicioMin, finMin)
    }

    // Genera slots de 30 min (HH:MM) y comprueba si cabe durationMin
    const openMin = OPEN_HOUR * 60;
    const closeMin = CLOSE_HOUR * 60;
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
      .format(new Date()) // "YYYY-MM-DD"
      .replaceAll('/', '-'); // algunos runtimes usan '/', uniformizamos

    const nowLocalMins = nowLocalMinutesInTZ();

    const slots = [];
    for (let startMin = openMin; startMin + SLOT_MINUTES <= closeMin; startMin += SLOT_MINUTES) {
      // filtro “ya pasó” si es el mismo día
      if (dateStr === todayStr && startMin + 1 <= nowLocalMins) continue;

      // ¿cabe la duración completa sin chocar con busy?
      const wantedEnd = startMin + durationMin;
      if (wantedEnd > closeMin) continue;

      const intersects = busyRanges.some(([bS, bE]) => !(wantedEnd <= bS || startMin >= bE));
      if (!intersects) {
        slots.push(minutesToHHMM(startMin));
      }
    }

    return json({
      date: dateStr,
      serviceId,
      openHour: OPEN_HOUR,
      closeHour: CLOSE_HOUR,
      slotMinutes: SLOT_MINUTES,
      durationMin,
      availableSlots: slots,
    });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
