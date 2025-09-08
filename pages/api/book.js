// pages/api/book.js

// Nota: runtime Node (no Edge) para facilitar depuración y compatibilidad
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const gasUrl = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL;
  if (!gasUrl) {
    return res.status(500).json({ error: 'Falta NEXT_PUBLIC_GAS_WEBHOOK_URL' });
  }

  // Debe calzar con UI/GAS
  const SERVICE_MAP = {
    '1': { name: 'Retoque (Mantenimiento)', duration: 120 },
    '2': { name: 'Reconstrucción Uñas Mordidas (Onicofagía)', duration: 180 },
    '3': { name: 'Uñas Acrílicas', duration: 180 },
    '4': { name: 'Uñas Polygel', duration: 180 },
    '5': { name: 'Uñas Softgel', duration: 180 },
    '6': { name: 'Kapping o Baño Polygel o Acrílico sobre uña natural', duration: 150 },
    '7': { name: 'Reforzamiento Nivelación Rubber', duration: 150 },
    '8': { name: 'Esmaltado Permanente', duration: 90 }
  };

  try {
    const body = req.body || {};
    const {
      serviceId,       // número o string
      date,            // 'YYYY-MM-DD'
      start,           // 'HH:mm' (preferido) — puede venir como '10:00' o '10:00:00'
      hora,            // compat: 'HH:mm' si el front envía este campo
      client,          // { name, email, phone }
      includeExtra,    // booleano (extra cupo)
      durationMin      // opcional; si no viene, usamos SERVICE_MAP
    } = body;

    const sid = String(serviceId || '');
    const svc = SERVICE_MAP[sid] || {};

    const hhmmRaw = (start || hora || '').toString();
    const hhmm = hhmmRaw.slice(0, 5); // normaliza 'HH:mm:ss' → 'HH:mm'

    const dur = Number(
      typeof durationMin === 'number' ? durationMin : (svc.duration ?? 60)
    );

    // Validaciones mínimas
    if (!sid || !svc.name) {
      return res.status(400).json({ error: 'serviceId inválido o desconocido' });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Fecha inválida (use YYYY-MM-DD)' });
    }
    if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) {
      return res.status(400).json({ error: 'Hora inválida (use HH:mm)' });
    }
    if (!client?.name || !client?.email) {
      return res.status(400).json({ error: 'Faltan datos del cliente (name, email)' });
    }
    if (!Number.isFinite(dur) || dur <= 0) {
      return res.status(400).json({ error: 'Duración inválida' });
    }

    // Payload para GAS (Apps Script)
    const payload = {
      nombre: client.name,
      email: client.email,
      telefono: client.phone || '',
      fecha: date,
      hora: hhmm,
      serviceId: sid,
      servicio: svc.name,
      durationMin: dur,
      includeExtra: Boolean(includeExtra),
      source: 'web'
    };

    // Llamada al GAS
    const gasResp = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      body: JSON.stringify(payload)
    });

    const text = await gasResp.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    // El GAS devuelve { success: true, ... } si todo bien
    if (!gasResp.ok || json?.success === false) {
      // Pasamos el error tal cual para depurar rápido
      return res.status(500).json({ error: json?.error || `GAS ${gasResp.status}: ${text}` });
    }

    return res.status(200).json({
      success: true,
      durationMin: dur,
      ...json
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
