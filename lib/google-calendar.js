// lib/google-calendar.js
export async function listPublicEvents({ timeMin, timeMax }) {
  const apiKey = process.env.NEXT_PUBLIC_GCAL_API_KEY;
  const calendarId = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID;
  if (!apiKey || !calendarId) {
    throw new Error('Faltan variables NEXT_PUBLIC_GCAL_API_KEY o NEXT_PUBLIC_GCAL_CALENDAR_ID');
  }

  // timeMin y timeMax vienen como 'YYYY-MM-DD'
  const tz = 'America/Santiago';
  const timeMinIso = new Date(`${timeMin}T00:00:00`).toISOString();
  const timeMaxIso = new Date(`${timeMax}T23:59:59`).toISOString();

  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('timeMin', timeMinIso);
  url.searchParams.set('timeMax', timeMaxIso);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '2500');

  const res = await fetch(url.toString(), { method: 'GET', headers: { 'content-type': 'application/json' } });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Google Calendar ${res.status}: ${JSON.stringify(json, null, 1)}`);
  }

  const items = json.items || [];

  // Normaliza a bloques ocupados (busy)
  const busy = items
    .filter(ev => ev.status !== 'cancelled')
    .map(ev => {
      const s = ev.start?.dateTime || (ev.start?.date ? `${ev.start.date}T00:00:00Z` : null);
      const e = ev.end?.dateTime || (ev.end?.date ? `${ev.end.date}T23:59:59Z` : null);
      return { start: s, end: e, id: ev.id || undefined, summary: ev.summary || '' };
    })
    .filter(b => b.start && b.end);

  return { busy };
}
