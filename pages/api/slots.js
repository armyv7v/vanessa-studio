import { DateTime } from "luxon";

const CALENDAR_ID = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID;
const API_KEY = process.env.NEXT_PUBLIC_GCAL_API_KEY;
const DEFAULT_TZ = process.env.NEXT_PUBLIC_TZ || "America/Santiago";

function buildGoogleCalendarUrl({ date, timezone }) {
  const dateString = (date || "") + "T00:00";
  const startOfDay = DateTime.fromISO(dateString, { zone: timezone });
  if (!startOfDay.isValid) {
    throw new Error('Fecha invalida');
  }
  const endOfDay = startOfDay.endOf('day');

  const params = new URLSearchParams({
    key: API_KEY,
    timeMin: startOfDay.toUTC().toISO(),
    timeMax: endOfDay.toUTC().toISO(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '2500',
  });

  const encodedCalendar = encodeURIComponent(CALENDAR_ID || '');
  return 'https://www.googleapis.com/calendar/v3/calendars/' + encodedCalendar + '/events?' + params.toString();
}

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const date = url.searchParams.get('date');
  const mode = url.searchParams.get('mode') || 'normal';

  if (action !== 'getBusySlots') {
    return jsonResponse({ error: 'Accion no soportada. Usa action=getBusySlots.' }, 400);
  }

  if (!CALENDAR_ID || !API_KEY) {
    return jsonResponse({ error: 'Faltan configuraciones de Google Calendar.' }, 500);
  }

  if (!date) {
    return jsonResponse({ error: 'El parametro date es obligatorio (YYYY-MM-DD).' }, 400);
  }

  try {
    const timezone = DEFAULT_TZ;
    const apiUrl = buildGoogleCalendarUrl({ date, timezone });
    const response = await fetch(apiUrl);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Calendar ${response.status}: ${text}`);
    }
    const data = await response.json();
    const busy = (data.items || [])
      .filter(evt => !evt.start?.date && !evt.end?.date)
      .map(evt => ({
        start: evt.start?.dateTime,
        end: evt.end?.dateTime,
      }));

    return jsonResponse({ busy, mode });
  } catch (error) {
    console.error('Error en /api/slots:', error);
    return jsonResponse({ error: error.message || 'Error interno del servidor' }, 500);
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
