import { DateTime } from "luxon";

interface Env {
  NEXT_PUBLIC_GCAL_CALENDAR_ID: string;
  NEXT_PUBLIC_GCAL_API_KEY: string;
  NEXT_PUBLIC_TZ?: string;
}

interface CalendarEvent {
  id: string;
  summary?: string;
  start?: {
    date?: string;
    dateTime?: string;
  };
  end?: {
    date?: string;
    dateTime?: string;
  };
}

interface GoogleCalendarListResponse {
  items: CalendarEvent[];
}

interface GoogleApiError {
  error: { message: string };
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/slots") {
      return handleSlots(url, env);
    }
    return new Response("Not Found", { status: 404 });
  },
};

async function handleSlots(url: URL, env: Env): Promise<Response> {
  const action = url.searchParams.get("action");
  const date = url.searchParams.get("date");
  const mode = url.searchParams.get("mode") ?? "normal";

  if (action && action !== "getBusySlots") {
    return json({ error: "Acción no soportada. Usa action=getBusySlots." }, 400);
  }

  if (!date) {
    return json({ error: "El parámetro date es obligatorio (YYYY-MM-DD)." }, 400);
  }

  const calendarId = env.NEXT_PUBLIC_GCAL_CALENDAR_ID;
  const apiKey = env.NEXT_PUBLIC_GCAL_API_KEY;
  const timezone = env.NEXT_PUBLIC_TZ ?? "UTC";

  if (!calendarId || !apiKey) {
    return json({ error: "Faltan configuraciones de Google Calendar." }, 500);
  }

  try {
    const range = buildCalendarRange(date, timezone);
    const requestUrl = buildGoogleCalendarUrl(calendarId, apiKey, range);

    const gcResponse = await fetch(requestUrl.toString());
    const payload = (await gcResponse.json().catch(() => null)) as GoogleCalendarListResponse | GoogleApiError | null;

    if (!gcResponse.ok || !payload) {
      const message = (payload as GoogleApiError)?.error?.message || "Error obteniendo eventos del calendario.";
      return json({ error: message, diagnosticInfo: { requestUrl: requestUrl.toString() } }, gcResponse.status);
    }

    const busy = ('items' in payload ? payload.items : [])
      .filter((event) => !event.start?.date && !event.end?.date) // Filtra eventos de todo el día
      .map((event) => ({
        id: event.id,
        start: event.start?.dateTime ?? null,
        end: event.end?.dateTime ?? null,
        summary: event.summary ?? "",
      }));

    return json({ busy, mode, source: "google-calendar-api" });
  } catch (error: any) {
    return json({ error: error?.message ?? "Error interno obteniendo los horarios." }, 500);
  }
}

function buildCalendarRange(date: string, timezone: string) {
  const start = DateTime.fromISO(`${date}T00:00:00`, { zone: timezone });
  if (!start.isValid) {
    throw new Error("Fecha inválida");
  }

  const end = start.endOf("day");

  return {
    timeMin: start.toUTC().toISO(),
    timeMax: end.toUTC().toISO(),
  };
}

function buildGoogleCalendarUrl(calendarId: string, apiKey: string, range: { timeMin: string | null; timeMax: string | null }) {
  if (!range.timeMin || !range.timeMax) {
    throw new Error("No se pudo calcular el rango de tiempo");
  }

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

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export default worker;
