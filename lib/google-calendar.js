// lib/google-calendar.js
// Lista eventos públicos desde Google Calendar (REST) sin usar googleapis (evita problemas de webpack/node:process)

const TZ = process.env.NEXT_PUBLIC_TZ || 'America/Santiago';

function toRFC3339Range(dateStr) {
  // NOTA: usamos la zona declarada; Calendar API además soporta &timeZone=
  const start = `${dateStr}T00:00:00`;
  const end   = `${dateStr}T23:59:59`;
  return { timeMin: start, timeMax: end };
}

export async function listPublicEvents({ date }) {
  const apiKey = process.env.NEXT_PUBLIC_GCAL_API_KEY;
  const calendarId = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID;

  if (!apiKey || !calendarId) {
    throw new Error('Faltan variables NEXT_PUBLIC_GCAL_API_KEY o NEXT_PUBLIC_GCAL_CALENDAR_ID');
  }

  const { timeMin, timeMax } = toRFC3339Range(date);

  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  );
  url.searchParams.set('key', apiKey);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('showDeleted', 'false');
  url.searchParams.set('timeZone', TZ);
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('maxResults', '2500');

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Google Calendar ${res.status}: ${txt}`);
  }

  const json = await res.json();
  const items = json.items || [];

  // Normalizamos a pares {start, end} ISO (string)
  const busy = items
    .map((ev) => ({
      start: ev.start?.dateTime || ev.start?.date, // date (día completo) poco frecuente en tu caso
      end: ev.end?.dateTime || ev.end?.date,
    }))
    .filter((b) => b.start && b.end);

  return { busy, raw: json };
}
