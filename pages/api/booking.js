﻿﻿﻿// pages/api/booking.js
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    const url = process.env.APPS_SCRIPT_URL;
    if (!url) return res.status(500).json({ error: "Falta APPS_SCRIPT_URL" });
    
    const body = req.body; // { date, start, end, serviceId, name, email, phone, notes }
    const payload = { action: "createBooking", payload: body };
    const gasResponse = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await gasResponse.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { ok: res.ok, raw: text }; }
    if (!gasResponse.ok || json?.ok === false) {
      return res.status(502).json({ error: "AppsScript error", detail: json || text });
    }
    return res.status(200).json(json);
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
