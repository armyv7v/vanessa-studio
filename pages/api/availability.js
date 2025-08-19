// pages/api/availability.js
export const config = { runtime: 'edge' };

import { listPublicEvents } from '../../lib/google-calendar';

function generateTimeSlots({
  from,
  to,
  openHour = 10,
  closeHour = 19,
  slotMinutes = 60,
  busy,
}) {
  const slots = [];
  const start = new Date(from);
  const end = new Date(to);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    for (let h = openHour; h < closeHour; h++) {
      const slotStart = new Date(d);
      slotStart.setHours(h, 0, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotMinutes);

      const overlapped = busy.some((b) => {
        const bStart = new Date(b.start);
        const bEnd = new Date(b.end);
        return slotStart < bEnd && slotEnd > bStart;
      });

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: !overlapped,
      });
    }
  }
  return slots;
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') || new Date().toISOString().slice(0, 10);
    const to =
      searchParams.get('to') ||
      new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    const { busy } = await listPublicEvents({ timeMin: from, timeMax: to });

    const slots = generateTimeSlots({ from, to, busy });

    return new Response(JSON.stringify({ from, to, busy, slots }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'content-type': 'application/json' },
      status: 500,
    });
  }
}
