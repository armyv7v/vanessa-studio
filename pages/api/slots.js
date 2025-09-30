import { DateTime } from "luxon";

const CALENDAR_ID = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID;
const API_KEY = process.env.NEXT_PUBLIC_GCAL_API_KEY;
const DEFAULT_TZ = process.env.NEXT_PUBLIC_TZ || "America/Santiago";

function buildGoogleCalendarUrl({ date, timezone }) {
  const dateString = (date || "") + "T00:00";
  const startOfDay = DateTime.fromISO(dateString, { zone: timezone });
  if (!startOfDay.isValid) {
    throw new Error("Fecha inválida");
  }
  const endOfDay = startOfDay.endOf("day");

  const params = new URLSearchParams({
    key: API_KEY,
    timeMin: startOfDay.toUTC().toISO(),
    timeMax: endOfDay.toUTC().toISO(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "2500",
  });

  const encodedCalendar = encodeURIComponent(CALENDAR_ID || "");
  return "https://www.googleapis.com/calendar/v3/calendars/" + encodedCalendar + "/events?" + params.toString();
}

export default async function handler(req, res) {
  const { action, date, mode = "normal" } = req.query;

  if (action !== "getBusySlots") {
    return res.status(400).json({ error: "Acción no soportada. Usa action=getBusySlots." });
  }

  if (!CALENDAR_ID || !API_KEY) {
    return res.status(500).json({ error: "Faltan configuraciones de Google Calendar." });
  }

  if (!date) {
    return res.status(400).json({ error: "El parámetro date es obligatorio (YYYY-MM-DD)." });
  }

  try {
    const timezone = DEFAULT_TZ;
    const url = buildGoogleCalendarUrl({ date, timezone });

    const gcResponse = await fetch(url);
    const payload = await gcResponse.json().catch(() => null);

    if (!gcResponse.ok || !payload) {
      const message = payload?.error?.message || "Error obteniendo eventos del calendario.";
      return res.status(gcResponse.status).json({ error: message, diagnosticInfo: { url } });
    }

    const busy = (payload.items || [])
      .filter((event) => !event.start?.date && !event.end?.date)
      .map((event) => ({
        id: event.id,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        summary: event.summary || "",
      }));

    return res.status(200).json({ busy, mode, source: "google-calendar-api" });
  } catch (error) {
    console.error("Error en /api/slots (Google Calendar):", error);
    return res.status(500).json({ error: error.message || "Error interno obteniendo los horarios." });
  }
}
