// pages/api/slots.js
import { DateTime } from "luxon";

// Indicamos a Cloudflare que ejecute esto como una función de borde (edge function).
export const runtime = 'edge';

// --- Interfaces para la API de Google Calendar ---
interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
}

interface GoogleCalendarListResponse {
  items: CalendarEvent[];
}

interface GoogleApiError {
  error: { message: string };
}

// --- Manejador Principal de la Ruta ---
export default async function handler(req) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date");

  if (!date) {
    return jsonResponse({ error: "El parámetro date es obligatorio (YYYY-MM-DD)." }, 400);
  }

  // Obtenemos las variables de entorno del proyecto de Cloudflare
  const calendarId = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID;
  const apiKey = process.env.NEXT_PUBLIC_GCAL_API_KEY;
  const timezone = process.env.NEXT_PUBLIC_TZ ?? "UTC";

  if (!calendarId || !apiKey) {
    return jsonResponse({ error: "Faltan configuraciones de Google Calendar en las variables de entorno." }, 500);
  }

  try {
    const range = buildCalendarRange(date, timezone);
    const requestUrl = buildGoogleCalendarUrl(calendarId, apiKey, range);

    const gcResponse = await fetch(requestUrl.toString());
    const payload = await gcResponse.json();

    if (!gcResponse.ok) {
      const message = payload?.error?.message || "Error obteniendo eventos del calendario.";
      return jsonResponse({ error: message }, gcResponse.status);
    }

    const busy = (payload.items || [])
      .filter((event) => !event.start?.date) // Filtra eventos de todo el día
      .map((event) => ({
        start: event.start?.dateTime ?? null,
        end: event.end?.dateTime ?? null,
      }));

    return jsonResponse({ busy });

  } catch (error) {
    return jsonResponse({ error: error?.message ?? "Error interno obteniendo los horarios." }, 500);
  }
}

// --- Funciones de Utilidad ---

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function buildCalendarRange(date, timezone) {
  const start = DateTime.fromISO(`${date}T00:00:00`, { zone: timezone });
  if (!start.isValid) throw new Error("Fecha inválida");
  const end = start.endOf("day");
  return { timeMin: start.toUTC().toISO(), timeMax: end.toUTC().toISO() };
}

function buildGoogleCalendarUrl(calendarId, apiKey, range) {
  if (!range.timeMin || !range.timeMax) throw new Error("Rango de tiempo inválido");
  const params = new URLSearchParams({
    key: apiKey,
    timeMin: range.timeMin,
    timeMax: range.timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "2500",
  });
  const encodedCalendar = encodeURIComponent(calendarId);
  return new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodedCalendar}/events?${params.toString()}`);
}
