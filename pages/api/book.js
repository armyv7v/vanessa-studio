// pages/api/book.js

function isEmailValid(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const GAS_URL  = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL;
    const CALENDAR = process.env.NEXT_PUBLIC_GCAL_CALENDAR_ID || '';
    const TZ       = process.env.NEXT_PUBLIC_TZ || 'America/Santiago';

    if (!GAS_URL) {
      return res.status(500).json({ error: 'Falta NEXT_PUBLIC_GAS_WEBHOOK_URL' });
    }

    const body = req.body;
    const {
      serviceId,
      date,     // YYYY-MM-DD
      start,    // HH:mm
      client,   // { name, email, phone }
      extraCup, // boolean
      durationOverrideMin, // optional
    } = body || {};

    if (!serviceId || !date || !start || !client?.name || !client?.email) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }
    if (!isEmailValid(client.email)) {
      return res.status(400).json({ error: 'Email inválido' });
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

    const text = await r.text(); // Google Apps Script a veces no devuelve JSON válido
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!r.ok || data?.success === false) {
      return res.status(500).json({ error: data?.error || 'GAS error', data });
    }

    res.status(200).json({ success: true, data });

  } catch (err) {
    console.error("Error en /api/book:", err);
    res.status(500).json({ error: String(err) });
  }
}
