﻿// pages/api/availability.js

const TZ = 'America/Santiago';
const CALENDAR_ID = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID;
const API_KEY = process.env.NEXT_PUBLIC_GCAL_API_KEY;

// Duraciones por servicio (min)
const SERVICE_DURATIONS = {
  '1': 120,
  '2': 180,
  '3': 180,
  '4': 180,
  '5': 180,
  '6': 150,
  '7': 150,
  '8': 90
};

// Util: fecha local YYYY-MM-DD en Santiago
function formatLocalYMD(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
}

// Util: crea Date en TZ a partir de Y-M-D y H:M
function makeZonedDate(ymd, hh, mm = 0) {
  // ymd = 'YYYY-MM-DD'
  const [Y, M, D] = ymd.split('-').map(Number);
  // Creamos fecha como si fuera local: usando el offset de la zona
  // Truco: usamos la fecha UTC del mismo “parecido” pero luego format/parse
  // Aquí, para Edge runtime, armamos un Date “civil” y lo usamos solo para comparar via getTime()
  const d = new Date(Date.UTC(Y, M - 1, D, hh, mm, 0));
  // Ajuste: calculamos el offset real de America/Santiago para ese instante:
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const parts = fmt.formatToParts(d);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  // reconstruimos epoch del “tiempo local” en TZ
  // Ojo: Date.UTC/parse local → aquí simplificamos usando un nuevo Date con esos componentes
  const local = new Date(Date.UTC(
    Number(map.year), Number(map.month) - 1, Number(map.day),
    Number(map.hour), Number(map.minute), Number(map.second)
  ));
  return local;
}

// Util: ahora mismo en Santiago (epoch)
function nowInSantiago() {
  const now = new Date();
  // proyectamos “componentes TZ” a epoch
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const parts = fmt.formatToParts(now);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return Date.UTC(
    Number(map.year), Number(map.month) - 1, Number(map.day),
    Number(map.hour), Number(map.minute), Number(map.second)
  );
}

// Carga eventos ocupados (busy) desde Google Calendar (público con API Key)
async function fetchBusyISO({ fromYMD, toYMD }) {
  if (!CALENDAR_ID || !API_KEY) {
    throw new Error('Faltan NEXT_PUBLIC_GCAL_CALENDAR_ID o NEXT_PUBLIC_GCAL_API_KEY');
  }
  // timeMin/timeMax inclusive: usamos 00:00:00 a 23:59:59 del rango
  const timeMin = `${fromYMD}T00:00:00`;
  const timeMax = `${toYMD}T23:59:59`;
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?key=${API_KEY}&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&showDeleted=false`;

  const resp = await fetch(url);
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Google Calendar ${resp.status}: ${t}`);
  }
  const data = await resp.json();
  const busy = [];
  for (const ev of data.items || []) {
    const s = ev.start?.dateTime || ev.start?.date;
    const e = ev.end?.dateTime || ev.end?.date;
    if (!s || !e) continue;
    // Normalizamos a epoch (UTC) a través del parser Date:
    const start = new Date(s).getTime();
    const end = new Date(e).getTime();
    busy.push({ start, end });
  }
  return busy;
}

// Chequea solapamiento (epoch)
function overlaps(s1, e1, s2, e2) {
  return s1 < e2 && s2 < e1;
}

// Genera slots en pasos de 30 min para un día específico
function generateDaySlots({
  ymd, isExtra, serviceMinutes, busyEpoch, // busyEpoch: [{start, end}]
  // ventanas:
  normalStartHH = 10, normalEndLastStartHH = 17, normalEndLastStartMM = 30, // último inicio 17:30
  extraStartHH = 18, extraEndLastStartHH = 20, extraEndLastStartMM = 0      // último inicio 20:00
}) {
  const slots = [];
  const step = 30; // minutos

  // Determina ventana de inicios
  let startHH = isExtra ? extraStartHH : normalStartHH;
  let endLastHH = isExtra ? extraEndLastStartHH : normalEndLastStartHH;
  let endLastMM = isExtra ? extraEndLastStartMM : normalEndLastStartMM;

  // Hoy en Santiago → filtrar inicios pasados
  const nowEpoch = nowInSantiago();
  const todayYMD = formatLocalYMD(new Date(nowEpoch));
  const isToday = ymd === todayYMD;

  // recorre cada inicio posible
  for (let hh = startHH; hh <= endLastHH; hh++) {
    for (let mm = (hh === startHH ? 0 : 0); mm <= 30; mm += 30) {
      // cortar al último inicio permitido exacto
      if (hh === endLastHH && mm > endLastMM) break;

      const slotStart = makeZonedDate(ymd, hh, mm).getTime();
      const slotEnd = new Date(slotStart + serviceMinutes * 60000).getTime();

      // si es hoy, no mostrar inicios “pasados”
      if (isToday && slotStart <= nowEpoch) continue;

      // chequear choque con busy
      const conflict = (busyEpoch || []).some(b => overlaps(slotStart, slotEnd, b.start, b.end));
      if (!conflict) {
        // devolvemos ISO de inicio (UTC ISO string); el front formatea a HH:mm local
        slots.push(new Date(slotStart).toISOString());
      }
    }
  }
  return slots;
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    // Compat: ?date=YYYY-MM-DD & serviceId=8 ; Nuevos: ?from & ?to ; ?extra=1
    const date = searchParams.get('date'); // si viene, usamos ventana de 1 día
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const serviceId = searchParams.get('serviceId') || '8';
    const isExtra = searchParams.get('extra') === '1';

    const serviceMinutes = Number(SERVICE_DURATIONS[serviceId] || 60);

    // Ventana a consultar al calendario
    let fromYMD, toYMD, days;
    if (date) {
      fromYMD = date;
      toYMD = date;
      days = [date];
    } else {
      const todayYMD = formatLocalYMD(new Date());
      fromYMD = from || todayYMD;
      toYMD = to || fromYMD;
      // generar días intermedios
      const d0 = new Date(fromYMD + 'T00:00:00');
      const d1 = new Date(toYMD + 'T00:00:00');
      const arr = [];
      for (let d = new Date(d0); d <= d1; d.setDate(d.getDate() + 1)) {
        arr.push(formatLocalYMD(d));
      }
      days = arr;
    }

    // Cargar busy
    const busy = await fetchBusyISO({ fromYMD, toYMD });

    // Generar slots por día (según flujo)
    let allSlots = [];
    for (const ymd of days) {
      const daySlots = generateDaySlots({
        ymd,
        isExtra,
        serviceMinutes,
        busyEpoch: busy
      });
      allSlots = allSlots.concat(daySlots);
    }

    // Respuesta nueva + compat legacy
    // - slots: [{start,end,available}] (opcional)
    // - times: ["ISO", ...] para el front actual
    const times = allSlots; // lista de inicios ISO (el front muestra HH:mm)
    return new Response(
      JSON.stringify({
        from: fromYMD, to: toYMD,
        serviceId, isExtra,
        slotStepMin: 30,
        times,
        // pista para debug
        debug: { daysCount: days.length, receivedBusy: busy.length }
      }),
      { headers: { 'content-type': 'application/json' }, status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { 'content-type': 'application/json' },
      status: 500
    });
  }
}
