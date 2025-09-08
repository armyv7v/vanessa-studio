Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-File {
  param([string]$Path, [string]$Content)
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  Set-Content -Path $Path -Value $Content -Encoding UTF8
  Write-Host "✓ Wrote $Path"
}

Write-Host "== Limpieza de artefactos =="
$gitattrib = "pages/api/.gitattributes"
if (Test-Path $gitattrib) {
  Remove-Item $gitattrib -Force
  Write-Host "✓ Removed $gitattrib"
}

Write-Host "== Actualizando /api/book (Edge + GAS) =="
$book = @'
export const runtime = 'edge';

// Valida un email simple
function isEmailValid(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req) {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const GAS_URL   = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL;
    const CALENDAR  = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID || '';
    const TZ        = process.env.NEXT_PUBLIC_TZ || 'America/Santiago';

    if (!GAS_URL) {
      return new Response(JSON.stringify({ error: 'Falta NEXT_PUBLIC_GAS_WEBHOOK_URL' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const {
      serviceId,
      date,     // YYYY-MM-DD
      start,    // HH:mm
      client,   // { name, email, phone }
      extraCup, // boolean (true => extra cupo)
      durationOverrideMin, // opcional
    } = body || {};

    if (!serviceId || !date || !start || !client?.name || !client?.email) {
      return new Response(JSON.stringify({ error: 'Datos incompletos' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!isEmailValid(client.email)) {
      return new Response(JSON.stringify({ error: 'Email inválido' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // GAS hace: Calendar + Sheets + correo según normal/extra
    const payload = {
      nombre: client.name,
      email: client.email,
      telefono: client.phone || '',
      fecha: date,
      hora: start,
      serviceId: String(serviceId),
      extraCup: !!extraCup,
      durationMin: durationOverrideMin ? Number(durationOverrideMin) : undefined,
      calendarId: CALENDAR,
      tz: TZ,
    };

    const r = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!r.ok || data?.success === false) {
      return new Response(JSON.stringify({ error: data?.error || 'GAS error', data }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
'@
Write-File "pages/api/book.js" $book

Write-Host "== Actualizando /api/slots (Edge + Luxon + normal/extra) =="
$slots = @'
export const runtime = 'edge';

import { DateTime, Interval } from 'luxon';

const TZ = 'America/Santiago';

// Duración por servicio
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

function parseQuery(url) {
  const u = new URL(url);
  return Object.fromEntries(u.searchParams.entries());
}

// Genera inicios cada 30 min en una ventana (incluye último inicio permitido)
function buildSlots(dateISO, mode, serviceId) {
  const durationMin = SERVICE_MAP[String(serviceId)] || 90;
  const base = DateTime.fromISO(dateISO, { zone: TZ });

  let openHour, lastStartHour;
  if (mode === 'extra') {
    // Extra: inicios 18:00..20:00 (inclusive)
    openHour = 18;
    lastStartHour = 20;
  } else {
    // Normal: inicios 10:00..17:30 (inclusive)
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
    throw new Error(\`Google Calendar \${r.status}: \${e}\`);
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

export default async function handler(req) {
  try {
    const q = parseQuery(req.url);
    const date = q.date;               // 'YYYY-MM-DD'
    const serviceId = q.serviceId || '8';
    const mode = q.mode === 'extra' ? 'extra' : 'normal';

    const apiKey = process.env.NEXT_PUBLIC_GCAL_API_KEY;
    const calendarId = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID;

    if (!date) {
      return new Response(JSON.stringify({ error: 'Falta date' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!apiKey || !calendarId) {
      return new Response(JSON.stringify({ error: 'Faltan credenciales de Calendar' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
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

    return new Response(JSON.stringify({
      date,
      mode,
      serviceId: String(serviceId),
      times,
      availableSlots: times,
      tz: TZ
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
'@
Write-File "pages/api/slots.js" $slots

Write-Host "== Registrando cambios en git =="
git add -A
git commit -m "fix(edge): rewrite /api/book and /api/slots for Edge (GAS + Luxon); remove pages/api/.gitattributes" | Out-Null
Write-Host "✓ Commit listo. Ejecuta ahora:"
Write-Host "   npm i luxon"
Write-Host "   git push origin main"
