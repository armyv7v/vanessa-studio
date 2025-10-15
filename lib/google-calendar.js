﻿// lib/google-calendar.js
// Obtiene eventos (públicos) con API KEY para calcular "busy"

const CALENDAR_ID   = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID;
const API_KEY       = process.env.NEXT_PUBLIC_GCAL_API_KEY;
const API_WORKER_URL = process.env.NEXT_PUBLIC_API_WORKER_URL; // ej: https://vanessa-nails-api.workers.dev

export async function listPublicEvents({ timeMin, timeMax, useWorker = true }) {
  // En producción, usamos el Worker de Cloudflare para más velocidad y seguridad.
  // El Worker ya tiene las credenciales y solo necesita la fecha.
  if (useWorker && process.env.NODE_ENV === 'production' && API_WORKER_URL) {
    const date = timeMin.substring(0, 10); // Extraer YYYY-MM-DD de la fecha ISO
    const workerUrl = new URL(`${API_WORKER_URL}/api/slots`);
    workerUrl.searchParams.set('action', 'getBusySlots');
    workerUrl.searchParams.set('date', date);

    const res = await fetch(workerUrl.toString());
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error en API Worker ${res.status}: ${text}`);
    }
    // La respuesta del worker ya tiene el formato { busy: [...] }
    const data = await res.json();
    return { busy: data.busy || [], raw: data };
  }

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
