// lib/google-calendar.js
// Obtiene eventos (públicos) con API KEY para calcular "busy"

const CALENDAR_ID = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID;
const API_KEY = process.env.NEXT_PUBLIC_GCAL_API_KEY;

export async function listPublicEvents({ timeMin, timeMax }) {
  if (!CALENDAR_ID || !API_KEY) {
    throw new Error('Faltan NEXT_PUBLIC_GCAL_CALENDAR_ID o NEXT_PUBLIC_GCAL_API_KEY');
  }

  const params = new URLSearchParams({
    key: API_KEY,
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '2500',
  });

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar ${res.status}: ${text}`);
  }
  const data = await res.json();

  // Convertimos a “busy” [{start,end}]
  const busy = (data.items || []).map(evt => {
    const startISO = evt.start?.dateTime || (evt.start?.date ? `${evt.start.date}T00:00:00Z` : null);
    const endISO   = evt.end?.dateTime   || (evt.end?.date   ? `${evt.end.date}T23:59:59Z`   : null);
    return { start: startISO, end: endISO };
  }).filter(b => b.start && b.end);

  return { busy, raw: data };
}
