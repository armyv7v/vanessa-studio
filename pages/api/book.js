import { DateTime } from 'luxon';

// pages/api/book.js

function isEmailValid(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeTzOffset(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^([+-])(\d{2}):?(\d{2})$/);
  if (!match) return null;
  return `${match[1]}${match[2]}:${match[3]}`;
}

export const runtime = 'nodejs';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const GAS_URL = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL;
    const CALENDAR = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID || '';
    const TZ = process.env.NEXT_PUBLIC_TZ || 'America/Santiago';
    const TZ_OFFSET_ENV = process.env.NEXT_PUBLIC_TZ_OFFSET;

    if (!GAS_URL) {
      return res.status(500).json({ error: 'Falta NEXT_PUBLIC_GAS_WEBHOOK_URL' });
    }

    const body = await req.json().catch(() => ({}));
    const {
      serviceId,
      serviceName,
      date,
      start,
      durationMin,
      client,
      extraCupo,
      extraCup,
      durationOverrideMin,
    } = body;

    const normalizedClient = {
      name: client?.name ? String(client.name).trim() : '',
      email: client?.email ? String(client.email).trim() : '',
      phone: client?.phone ? String(client.phone).trim() : '',
    };

    if (!serviceId || !date || !start || !normalizedClient.name || !normalizedClient.email) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }
    if (!isEmailValid(normalizedClient.email)) {
      return res.status(400).json({ error: 'Email invalido' });
    }

    const resolvedDurationMin = durationOverrideMin != null
      ? Number(durationOverrideMin)
      : durationMin != null
        ? Number(durationMin)
        : undefined;

    if (!Number.isFinite(resolvedDurationMin)) {
      return res.status(400).json({ error: 'Duracion invalida' });
    }

    const timezone = typeof TZ === 'string' && TZ ? TZ : 'UTC';
    const startDateTime = DateTime.fromISO(`${date}T${start}`, { zone: timezone });
    if (!startDateTime.isValid) {
      return res.status(400).json({ error: 'Fecha u hora invalida' });
    }
    const endDateTime = startDateTime.plus({ minutes: resolvedDurationMin });
    const tzOffset = normalizeTzOffset(TZ_OFFSET_ENV) ?? startDateTime.toFormat('ZZ');

    const payload = {
      client: normalizedClient,
      nombre: normalizedClient.name,
      email: normalizedClient.email,
      telefono: normalizedClient.phone,
      date,
      fecha: date,
      start,
      hora: start,
      startIso: startDateTime.toISO(),
      endIso: endDateTime.toISO(),
      tzOffset,
      serviceId: String(serviceId),
      serviceName: serviceName || '',
      extraCupo: extraCupo ?? extraCup ?? false,
      durationMin: resolvedDurationMin,
      calendarId: CALENDAR,
      tz: timezone,
    };

    const r = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!r.ok || data?.success === false) {
      const statusFromData = Number(data?.statusCode);
      const status = Number.isFinite(statusFromData) && statusFromData >= 400 ? statusFromData : (r.ok ? 500 : r.status);
      return res.status(status).json({ error: data?.error || 'GAS error', data });
    }
    return res.status(200).json({ success: true, data });

  } catch (err) {
    console.error('Error en /api/book:', err);
    return res.status(500).json({ error: String(err) });
  }
}
