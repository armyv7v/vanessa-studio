﻿﻿import { DateTime } from "luxon";

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

export const runtime = 'nodejs';

export default async function handler(req, res) {
  const { action, date, mode = 'normal' } = req.query;

  if (action !== 'getBusySlots') {
    return res.status(400).json({ error: 'Accion no soportada. Usa action=getBusySlots.' });
  }

  if (!CALENDAR_ID || !API_KEY) {
    return res.status(500).json({ error: 'Faltan configuraciones de Google Calendar.' });
  }

  if (!date) {
    return res.status(400).json({ error: 'El parametro date es obligatorio (YYYY-MM-DD).' });
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

    return res.status(200).json({ busy, mode });
  } catch (error) {
    console.error('Error en /api/slots:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
