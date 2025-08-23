// pages/api/slots.js
export const config = { runtime: 'edge' };

import { listPublicEvents } from '../../lib/google-calendar';

const TZ = process.env.NEXT_PUBLIC_TZ || 'America/Santiago';

// Duraciones por servicio (debe calzar con el front y con Apps Script)
const SERVICE_DURATIONS = {
  '1': 120,
  '2': 180,
  '3': 180,
  '4': 180,
  '5': 180,
  '6': 150,
  '7': 150,
  '8': 90,  // Esmaltado Permanente
};

// Config horario
const OPEN_HOUR = 10;
const CLOSE_HOUR = 18;
const STEP_MIN = 30; // slots cada 30 minutos

/** Obtiene horas/min en TZ dada */
function isoToHMInTZ(iso, tz) {
  const dt = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(dt);
  const h = parseInt(parts.find((p) => p.type === 'hour').value, 10);
  const m = parseInt(parts.find((p) => p.type === 'minute').value, 10);
  return { h, m };
}

/** “Ahora” en minutos desde medianoche en TZ */
function nowMinutesInTZ(tz) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const h = parseInt(parts.find((p) => p.type === 'hour').value, 10);
  const m = parseInt(parts.find((p) => p.type === 'minute').value, 10);
  return h * 60 + m;
}

/** Formatea mm (minutos desde 00:00) a "HH:mm" */
function mmToLabel(mm) {
  const h = Math.floor(mm / 60);
  const m = mm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Convierte busy ISO -> rangos ocupados en minutos */
function buildBusyRangesInMinutes(busy, tz) {
  return busy.map((b) => {
    const s = isoToHMInTZ(b.start, tz);
    const e = isoToHMInTZ(b.end, tz);
    return { start: s.h * 60 + s.m, end: e.h * 60 + e.m };
  });
}

/** Chequea solape [s, s+dur) con rangos ocupados */
function overlapsAny(s, dur, ranges) {
  const e = s + dur;
  return ranges.some((r) => s < r.end && e > r.start);
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);

    const date = searchParams.get('date');         // YYYY-MM-DD
    const serviceId = searchParams.get('serviceId') || '8';

    if (!date) {
      return new Response(JSON.stringify({ error: 'Falta date (YYYY-MM-DD)' }), {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }

    const durationMin = SERVICE_DURATIONS[serviceId] || 60;

    // Trae eventos ocupados ese día
    const { busy } = await listPublicEvents({ date });
    const busyRanges = buildBusyRangesInMinutes(busy, TZ);

    // Genera candidatos cada 30 min entre 10:00–18:00, respetando duración
    const dayOpen = OPEN_HOUR * 60;
    const dayClose = CLOSE_HOUR * 60;
    const lastStart = dayClose - durationMin;

    // Si es hoy, filtra horas pasadas
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date()); // YYYY-MM-DD
    const isToday = date === todayStr;
    const nowMin = isToday ? nowMinutesInTZ(TZ) : -1;

    const availableSlots = [];
    for (let t = dayOpen; t <= lastStart; t += STEP_MIN) {
      if (isToday && t <= nowMin) continue; // descarta lo pasado
      if (!overlapsAny(t, durationMin, busyRanges)) {
        availableSlots.push(mmToLabel(t));
      }
    }

    const meta = {
      env: process.env.NODE_ENV,
      calendarId: process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID || 'unset',
      tz: TZ,
      buildId:
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.CF_PAGES_COMMIT_SHA ||
        process.env.BUILD_ID ||
        'local',
    };

    return new Response(JSON.stringify({ date, openHour: OPEN_HOUR, closeHour: CLOSE_HOUR, stepMin: STEP_MIN, durationMin, busy, availableSlots, meta }), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
        pragma: 'no-cache',
        'x-build-id': meta.buildId,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
}
