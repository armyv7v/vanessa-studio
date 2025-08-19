export async function fetchAvailability({ date, from, to, serviceId, openHour, closeHour, duration, signal } = {}) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (serviceId != null) params.set("serviceId", String(serviceId));
  if (openHour != null) params.set("openHour", String(openHour));
  if (closeHour != null) params.set("closeHour", String(closeHour));
  if (duration != null) params.set("duration", String(duration));
  const res = await fetch(`/api/availability?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  // Deriva "times" (compat antigua) desde slots disponibles
  const times = Array.isArray(data?.slots)
    ? data.slots.filter(s => s?.available).map(s => s?.start)
    : Array.isArray(data?.times) ? data.times : [];
  return { ...data, times };
}
export async function createBooking(payload) {
  // payload: { date, start, end, serviceId, name, email, phone, notes }
  const res = await fetch("/api/booking", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // { ok: true, ... }
}
