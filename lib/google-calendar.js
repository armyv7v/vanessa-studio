// lib/google-calendar.js

/**
 * Lee eventos públicos desde Google Calendar usando events.list.
 * Requiere:
 *  - NEXT_PUBLIC_GCAL_API_KEY
 *  - NEXT_PUBLIC_GCAL_CALENDAR_ID (tu ID secundario @group.calendar.google.com)
 *
 * Devuelve: { busy: [{start, end, id, summary}], raw }
 */
export async function listPublicEvents({ date, timeMin, timeMax } = {}) {
  const apiKey = process.env.NEXT_PUBLIC_GCAL_API_KEY;
  const calendarId = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID;

  if (!apiKey || !calendarId) {
    throw new Error('Faltan NEXT_PUBLIC_GCAL_API_KEY o NEXT_PUBLIC_GCAL_CALENDAR_ID');
  }

  // Ventana de consulta
  let minISO, maxISO;
  if (date) {
    // Día completo local → a UTC
    const d0 = new Date(`${date}T00:00:00`);
    const d1 = new Date(`${date}T23:59:59`);
    minISO = new Date(d0.getTime() - d0.getTimezoneOffset() * 60000).toISOString();
    maxISO = new Date(d1.getTime() - d1.getTimezoneOffset() * 60000).toISOString();
  } else {
    minISO = timeMin || new Date().toISOString();
    maxISO = timeMax || new Date(Date.now() + 7 * 86400000).toISOString();
  }

  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: minISO,
    timeMax: maxISO,
    key: apiKey,
  });

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    calendarId
  )}/events?${params.toString()}`;

  const res = await fetch(url);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Google Calendar ${res.status}: ${text} (calendarId=${calendarId})`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { items: [] };
  }

  const busy = (data.items || [])
    .map((ev) => {
      const s = ev.start?.dateTime || (ev.start?.date ? `${ev.start.date}T00:00:00Z` : null);
      const e = ev.end?.dateTime || (ev.end?.date ? `${ev.end.date}T00:00:00Z` : null);
      return s && e ? { start: s, end: e, id: ev.id, summary: ev.summary || '' } : null;
    })
    .filter(Boolean);

  return { busy, raw: data };
}
