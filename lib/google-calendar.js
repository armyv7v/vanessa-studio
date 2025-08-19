export async function listPublicEvents({ timeMin, timeMax }) {
  const CAL_ID = process.env.GCAL_ID;
  const API_KEY = process.env.GCAL_KEY;
  if (!CAL_ID || !API_KEY) throw new Error("Faltan GCAL_ID/GCAL_KEY");
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CAL_ID)}/events`
  );
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  if (timeMin) url.searchParams.set("timeMin", new Date(`${timeMin}T00:00:00.000Z`).toISOString());
  if (timeMax) url.searchParams.set("timeMax", new Date(`${timeMax}T23:59:59.999Z`).toISOString());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Google Calendar ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const busy = (data.items || []).map(ev => ({
    start: ev.start?.dateTime || ev.start?.date,
    end: ev.end?.dateTime || ev.end?.date,
    summary: ev.summary || "",
  }));
  return { busy };
}
