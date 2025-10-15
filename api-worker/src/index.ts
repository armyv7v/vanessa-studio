import { DateTime } from "luxon";

// Definición de la configuración de entorno del Worker
interface Env {
  NEXT_PUBLIC_GCAL_CALENDAR_ID: string;
  NEXT_PUBLIC_GCAL_API_KEY: string;
  GAS_WEBAPP_URL: string; // URL del Google Apps Script para la configuración
  NEXT_PUBLIC_TZ?: string;
}

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

// --- Worker Principal ---
const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Enrutador principal basado en la ruta de la solicitud
    switch (url.pathname) {
      case "/api/slots":
        return handleSlots(url, env);
      case "/api/gs-check":
        return handleConfig(url, env);
      default:
        return new Response("Not Found", { status: 404 });
    }
  },
};

// --- Manejador para la configuración (/api/gs-check) ---
async function handleConfig(url: URL, env: Env): Promise<Response> {
  const action = url.searchParams.get("action");

  if (action === 'getConfig') {
    const gasUrl = env.GAS_WEBAPP_URL;
    if (!gasUrl) {
      return json({ error: "GAS_WEBAPP_URL no está configurada en el worker." }, 500);
    }

    try {
      const configUrl = new URL(gasUrl);
      configUrl.searchParams.set('action', 'getConfig');

      const apiRes = await fetch(configUrl.toString());
      const data = await apiRes.json();

      if (!apiRes.ok) {
        const errorMessage = (data as any)?.error || 'Error al obtener la configuración desde Google Script.';
        return json({ ok: false, error: errorMessage }, apiRes.status);
      }

      // Devolvemos la configuración (incluyendo horarios y días deshabilitados)
      return json(data, 200);

    } catch (err: any) {
      return json({ ok: false, error: `Error al contactar el servicio de configuración: ${err.message}` }, 502);
    }
  }

  return json({ error: "Acción no soportada. Usa action=getConfig." }, 400);
}


// --- Manejador para los horarios de Google Calendar (/api/slots) ---
async function handleSlots(url: URL, env: Env): Promise<Response> {
  const date = url.searchParams.get("date");
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
      return json({ error: message }, gcResponse.status);
    }

    const busy = ('items' in payload ? payload.items : [])
      .filter((event) => !event.start?.date) // Filtra eventos de todo el día
      .map((event) => ({
        start: event.start?.dateTime ?? null,
        end: event.end?.dateTime ?? null,
      }));

    return json({ busy });
  } catch (error: any) {
    return json({ error: error?.message ?? "Error interno obteniendo los horarios." }, 500);
  }
}

// --- Funciones de Utilidad ---
function buildCalendarRange(date: string, timezone: string) {
  const start = DateTime.fromISO(`${date}T00:00:00`, { zone: timezone });
  if (!start.isValid) throw new Error("Fecha inválida");
  const end = start.endOf("day");
  return { timeMin: start.toUTC().toISO(), timeMax: end.toUTC().toISO() };
}

function buildGoogleCalendarUrl(calendarId: string, apiKey: string, range: { timeMin: string | null; timeMax: string | null }) {
  if (!range.timeMin || !range.timeMax) throw new Error("Rango de tiempo inválido");
  const params = new URLSearchParams({
    key: apiKey, timeMin: range.timeMin, timeMax: range.timeMax,
    singleEvents: "true", orderBy: "startTime", maxResults: "2500",
  });
  const encodedCalendar = encodeURIComponent(calendarId);
  return new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodedCalendar}/events?${params.toString()}`);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Permitir CORS
    },
  });
}

export default worker;
