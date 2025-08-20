// pages/api/availability.js
export const config = { runtime: "edge" };
import { listPublicEvents } from "../../lib/google-calendar";
const SERVICE_DURATIONS = { "1": 60, "2": 90, "3": 120, "8": 60 };
function generateTimeSlots({ from, to, openHour, closeHour, slotMinutes, busy }) {
  const slots = [];
  const start = new Date(from);
  const end = new Date(to);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    for (let h = openHour; h < closeHour; h++) {
      const slotStart = new Date(d); slotStart.setHours(h, 0, 0, 0);
      const slotEnd = new Date(slotStart); slotEnd.setMinutes(slotEnd.getMinutes() + slotMinutes);
      const overlapped = busy.some(b => new Date(slotStart) < new Date(b.end) && new Date(slotEnd) > new Date(b.start));
      slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString(), available: !overlapped });
    }
  }
  return slots;
}
// Ignora all-day salvo si el título indica cierre/bloqueo
function filterBusyAllDay(items) {
  const keywords = ["cerrado", "bloqueo", "bloqueado", "closed"];
  return (items || []).filter(ev => {
    const allDay =
      (typeof ev.start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ev.start)) ||
      (typeof ev.end === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ev.end));
    if (!allDay) return true;
    const t = (ev.summary || "").toLowerCase();
    return keywords.some(k => t.includes(k)); // sólo bloquea all-day si título indica cierre/bloqueo
  });
}
export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const debug = searchParams.get("debug");
    const openHour = Number(searchParams.get("openHour") || 10);
    const closeHour = Number(searchParams.get("closeHour") || 19);
    let from, to;
    if (date) { from = date; to = date; }
    else {
      from = fromParam || new Date().toISOString().slice(0,10);
      to   = toParam   || new Date(Date.now()+7*86400000).toISOString().slice(0,10);
    }
    const slotMinutesOverride = searchParams.get("duration");
    const slotMinutes = (slotMinutesOverride && Number(slotMinutesOverride)) ||
                        (serviceId && SERVICE_DURATIONS[serviceId]) || 60;
    const { busy } = await listPublicEvents({ timeMin: from, timeMax: to });
    const busyFiltered = filterBusyAllDay(busy);
    const slots = generateTimeSlots({ from, to, openHour, closeHour, slotMinutes, busy: busyFiltered });
    const payload = { from, to, openHour, closeHour, slotMinutes, busy: busyFiltered, slots };
    const availableStarts = slots.filter(s => s.available).map(s => s.start);
    payload.times = availableStarts; // compat
    if (debug) {
      payload.slots_count = slots.length;
      payload.available_count = availableStarts.length;
      payload.sample = availableStarts.slice(0, 8);
    }
    return new Response(JSON.stringify(payload), { headers: { "content-type": "application/json" }, status: 200 });
  } catch (err) {
    const msg = String(err?.message || err);
    const hint =
      msg.includes("403") ? "Key: Application restrictions=None; API restrictions=Google Calendar API." :
      msg.includes("404") ? "GCAL_ID incorrecto o calendario no público." :
      "Verifica GCAL_ID / GCAL_KEY y que el calendario sea público.";
    return new Response(JSON.stringify({ error: msg, hint }), { headers: { "content-type": "application/json" }, status: 500 });
  }
}
