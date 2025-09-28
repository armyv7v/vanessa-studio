﻿// pages/api/booking.js
export default async function handler(req) {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    const url = process.env.APPS_SCRIPT_URL;
    if (!url) return new Response(JSON.stringify({ error: "Falta APPS_SCRIPT_URL" }), { status: 500 });
    const body = await req.json(); // { date, start, end, serviceId, name, email, phone, notes }
    const payload = { action: "createBooking", payload: body };
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { ok: res.ok, raw: text }; }
    if (!res.ok || json?.ok === false) {
      return new Response(JSON.stringify({ error: "AppsScript error", detail: json || text }), { status: 502 });
    }
    return new Response(JSON.stringify(json), { headers: { "content-type": "application/json" }, status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500 });
  }
}
