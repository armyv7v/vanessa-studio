// pages/api/slots.js
import { DateTime } from 'luxon';

export const runtime = 'edge';

const jsonRes = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');

  if (!date) return jsonRes({ error: 'El parámetro date es obligatorio (YYYY-MM-DD).' }, 400);

  const calendarId = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID;
  const apiKey = process.env.GCAL_API_KEY;
  const timezone = process.env.NEXT_PUBLIC_TZ ?? 'UTC';

  if (!calendarId || !apiKey)
    return jsonRes({ error: 'Faltan configuraciones de Google Calendar en las variables de entorno del servidor.' }, 500);

  try {
    const range = buildCalendarRange(date, timezone);
    const requestUrl = buildGoogleCalendarUrl(calendarId, apiKey, range);

    const gcResponse = await fetch(requestUrl.toString());
    const payload = await gcResponse.json();

    if (!gcResponse.ok) {
      const message = payload?.error?.message || 'Error obteniendo eventos del calendario.';
      return jsonRes({ error: message }, gcResponse.status);
    }

    const busy = (payload.items || [])
      .filter((event) => !event.start?.date)
      .map((event) => ({
        start: event.start?.dateTime ?? null,
        end: event.end?.dateTime ?? null,
      }));

    return jsonRes({ busy });
  } catch (error) {
    return jsonRes({ error: error?.message ?? 'Error interno del servidor obteniendo los horarios.' }, 500);
  }
}

function buildCalendarRange(date, timezone) {
  const start = DateTime.fromISO(`${date}T00:00:00`, { zone: timezone });
  if (!start.isValid) throw new Error('Fecha inválida');
  const end = start.endOf('day');
  return { timeMin: start.toUTC().toISO(), timeMax: end.toUTC().toISO() };
}

function buildGoogleCalendarUrl(calendarId, apiKey, range) {
  if (!range.timeMin || !range.timeMax) throw new Error('Rango de tiempo inválido');
  const params = new URLSearchParams({
    key: apiKey, timeMin: range.timeMin, timeMax: range.timeMax,
    singleEvents: 'true', orderBy: 'startTime', maxResults: '2500',
  });
  const encodedCalendar = encodeURIComponent(calendarId);
  return new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodedCalendar}/events?${params.toString()}`);
}
