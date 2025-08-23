// pages/api/slots.js
export const config = { runtime: 'edge' };

const OPEN_HOUR = 9;      // 10:00
const CLOSE_HOUR = 19;     // 19git:00 (último inicio posible 17:30 si STEP_MIN=30)
const STEP_MIN = 30;       // pasos de 30 min
const TIMEZONE = 'America/Santiago';

// Duración por servicio (min)
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

function badRequest(message) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { 'content-type': 'application/json' }
  });
}

function serverError(message) {
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { 'content-type': 'application/json' }
  });
}

// YYYY-MM-DD → {y,m,d} válido
function parseYmd(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== (mo - 1) || dt.getUTCDate() !== d) return null;
  return { y, m: mo, d };
}

// Slots del día: ["10:00","10:30",...]
function buildDayTimes() {
  const out = [];
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    for (let m = 0; m < 60; m += STEP_MIN) {
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return out;
}

function minutesOfDay(dateLike) {
  const h = dateLike.getHours();
  const m = dateLike.getMinutes();
  return h * 60 + m;
}

function overlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

// Ahora en TZ: { y, m, d, hm (minutos del día) }
function nowInTZParts() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
  const y = +parts.year;
  const m = +parts.month;
  const d = +parts.day;
  const hm = (+parts.hour) * 60 + (+parts.minute);
  return { y, m, d, hm };
}

// Comparador YYYY-MM-DD vs hoy (TZ)
function compareYmdToToday(ymd) {
  const { y: ty, m: tm, d: td } = nowInTZParts();
  if (ymd.y !== ty) return ymd.y < ty ? -1 : 1;
  if (ymd.m !== tm) return ymd.m < tm ? -1 : 1;
  if (ymd.d !== td) return ymd.d < td ? -1 : 1;
  return 0; // mismo día
}

// Google Calendar (público)
async function listBusyISO({ timeMinISO, timeMaxISO }) {
  const apiKey = process.env.NEXT_PUBLIC_GCAL_API_KEY;
  const calId  = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID;
  if (!apiKey || !calId) throw new Error('Faltan NEXT_PUBLIC_GCAL_API_KEY / NEXT_PUBLIC_GCAL_CALENDAR_ID');

  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('timeMin', timeMinISO);
  url.searchParams.set('timeMax', timeMaxISO);

  const res = await fetch(url.toString(), { headers: { 'content-type': 'application/json' } });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Google Calendar ${res.status}: ${t || res.statusText}`);
  }
  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];
  return items
    .map(ev => {
      const s = ev.start?.dateTime || ev.start?.date;
      const e = ev.end?.dateTime || ev.end?.date;
      if (!s || !e) return null;
      const sD = new Date(s);
      const eD = new Date(e);
      if (isNaN(sD) || isNaN(eD)) return null;
      return { start: sD, end: eD };
    })
    .filter(Boolean);
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');      // YYYY-MM-DD
    const serviceId = searchParams.get('serviceId') || '8';

    if (!date) return badRequest('Parámetro "date" es requerido (YYYY-MM-DD).');

    const ymd = parseYmd(date);
    if (!ymd) return badRequest('Fecha inválida. Usa formato YYYY-MM-DD.');

    const duration = SERVICE_DURATIONS[serviceId] || 60;
    const times = buildDayTimes();

    // Ventana UTC del día
    const startDayUTC = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d, 0, 0, 0));
    const endDayUTC   = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d, 23, 59, 59));

    // Si la fecha es anterior a hoy en TZ -> sin slots
    const cmp = compareYmdToToday(ymd);
    if (cmp < 0) {
      return new Response(JSON.stringify({ date, serviceId, times: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Ocupados
    const busy = await listBusyISO({ timeMinISO: startDayUTC.toISOString(), timeMaxISO: endDayUTC.toISOString() });
    const busyBlocks = busy.map(b => ({
      startMin: minutesOfDay(b.start),
      endMin:   minutesOfDay(b.end),
    }));

    // Si es hoy, obtén hora actual en TZ para filtrar pasados
    const now = nowInTZParts();
    const isToday = cmp === 0;
    const nowMin = isToday ? now.hm : null;

    const available = [];
    for (const t of times) {
      const [h, m] = t.split(':').map(Number);
      const startMin = h * 60 + m;
      const endMin   = startMin + duration;

      // Dentro de jornada
      if (endMin > CLOSE_HOUR * 60) continue;

      // Si es hoy, no mostrar pasados
      if (isToday && startMin <= nowMin) continue;

      const overlapped = busyBlocks.some(b => overlap(startMin, endMin, b.startMin, b.endMin));
      if (!overlapped) available.push(t);
    }

    return new Response(JSON.stringify({
      date,
      serviceId,
      openHour: OPEN_HOUR,
      closeHour: CLOSE_HOUR,
      stepMin: STEP_MIN,
      duration,
      times: available
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return serverError(String(err));
  }
}
