﻿import { DateTime, Interval } from 'luxon';

const TZ = 'America/Santiago';

// Duración por servicio (min)
const SERVICE_MAP = {
  '1': 120,
  '2': 180,
  '3': 180,
  '4': 180,
  '5': 180,
  '6': 150,
  '7': 150,
  '8': 90,
};

// Genera inicios cada 30 min
function buildSlots(dateISO, mode, serviceId) {
  const durationMin = SERVICE_MAP[String(serviceId)] || 90;
  const base = DateTime.fromISO(dateISO, { zone: TZ });

  let openHour, lastStartHour;
  if (mode === 'extra') {
    // Extra: 18:00 a 20:00 (inclusive)
    openHour = 18;
    lastStartHour = 20;
  } else {
    // Normal: 10:00 a 17:30 (inclusive)
    openHour = 10;
    lastStartHour = 17.5; // 17:30
  }

  const first = base.set({ hour: Math.floor(openHour), minute: (openHour % 1) ? 30 : 0, second: 0, millisecond: 0 });
  const lastStart = base.set({
    hour: Math.floor(lastStartHour),
    minute: (lastStartHour % 1) ? 30 : 0,
    second: 0,
    millisecond: 0
  });

  const out = [];
  for (let t = first; t <= lastStart; t = t.plus({ minutes: 30 })) {
    out.push({ start: t, end: t.plus({ minutes: durationMin }) });
  }
  return out;
}

async function fetchBusy(dateISO, apiKey, calendarId) {
  const dayStart = DateTime.fromISO(dateISO, { zone: TZ }).startOf('day');
  const dayEnd = dayStart.endOf('day');
  const timeMin = encodeURIComponent(dayStart.toISO());
  const timeMax = encodeURIComponent(dayEnd.toISO());
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${encodeURIComponent(apiKey)}&singleEvents=true&orderBy=startTime&timeMin=${timeMin}&timeMax=${timeMax}&showDeleted=false`;

  const r = await fetch(url);
  if (!r.ok) {
    const e = await r.text();
    throw new Error(`Google Calendar ${r.status}: ${e}`);
  }
  const data = await r.json();

  const intervals = [];
  for (const ev of data.items || []) {
    const s = ev.start?.dateTime || ev.start?.date;
    const e = ev.end?.dateTime || ev.end?.date;
    if (!s || !e) continue;
    const si = DateTime.fromISO(s, { zone: TZ });
    const ei = DateTime.fromISO(e, { zone: TZ });
    if (!si.isValid || !ei.isValid) continue;
    intervals.push(Interval.fromDateTimes(si, ei));
  }
  return intervals;
}

function filterPastToday(slots, now) {
  return slots.filter(s => s.start >= now);
}

const fmt = (dt) => dt.toFormat('HH:mm');

export default async function handler(req, res) {
  try {
    const { date, serviceId = '8', mode = 'normal' } = req.query;

    const apiKey = process.env.NEXT_PUBLIC_GCAL_API_KEY;
    const calendarId = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID;

    if (!date) {
      return res.status(400).json({ error: 'Falta date' });
    }
    if (!apiKey || !calendarId) {
      return res.status(500).json({ error: 'Faltan credenciales de Calendar' });
    }

    let slots = buildSlots(date, mode, serviceId);

    // Filtrar “hoy” los slots pasados
    const now = DateTime.now().setZone(TZ);
    const day = DateTime.fromISO(date, { zone: TZ });
    if (day.hasSame(now, 'day')) {
      slots = filterPastToday(slots, now.startOf('minute'));
    }

    // Cruce con calendario
    const busyIntervals = await fetchBusy(date, apiKey, calendarId);
    const free = slots.filter(s => {
      const slotI = Interval.fromDateTimes(s.start, s.end);
      return !busyIntervals.some(bi => bi && bi.overlaps(slotI));
    });

    const times = free.map(s => fmt(s.start));

    res.status(200).json({
      date,
      mode,
      serviceId: String(serviceId),
      times,
      availableSlots: times,
      tz: TZ
    });

  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
