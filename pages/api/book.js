// pages/api/book.js

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

    const GAS_URL  = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL;
    const CALENDAR = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID || '';
    const TZ       = process.env.NEXT_PUBLIC_TZ || 'America/Santiago';

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
      extraCup, // boolean
      durationOverrideMin, // optional
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
