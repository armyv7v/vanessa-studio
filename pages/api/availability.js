// pages/api/availability.js
export const config = { runtime: 'edge' };

import { listPublicEvents } from '../../lib/google-calendar';

// Mapa de duración (minutos) por serviceId — AJUSTA según tu catálogo real
const SERVICE_DURATIONS = {
  '1': 60,
  '2': 90,
  '3': 120,
  '8': 60,
};

// Genera slots de [openHour, closeHour) con tamaño slotMinutes
function generateTimeSlots({ from, to, openHour, closeHour, slotMinutes, busy }) {
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

// Filtra eventos all-day salvo que el título indique cierre/bloqueo
function filterBusyForBusinessRules(items) {
  const keywords = ['cerrado', 'bloqueo', 'bloqueado', 'closed'];
  return (items || []).filter((ev) => {
    const isAllDay = !!ev.start && ev.start.length === 10 || !!ev.end && ev.end.length === 10
      || (!!ev.start && /^\d{4}-\d{2}-\d{2}$/.test(ev.start))
      || (!!ev.end && /^\d{4}-\d{2}-\d{2}$/.test(ev.end));
    if (!isAllDay) return true;
    const title = (ev.summary || '').toLowerCase();
    return keywords.some((k) => title.includes(k));
  });
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);

    // Compatibilidad con endpoint antiguo
    const date = searchParams.get('date');                // YYYY-MM-DD (un día)
    const serviceId = searchParams.get('serviceId');      // p.ej. "8"

    // Parámetros nuevos
    const fromParam = searchParams.get('from');           // YYYY-MM-DD
    const toParam = searchParams.get('to');               // YYYY-MM-DD
    const legacy = searchParams.get('legacy');            // "1" para formato antiguo
    const debug = searchParams.get('debug');              // "1" para info extra

    // Horario base (permite override por query si quieres probar)
    const openHour = Number(searchParams.get('openHour') || 10);  // 10:00
    const closeHour = Number(searchParams.get('closeHour') || 19); // 19:00

    // Ventana [from, to]
    let from, to;
    if (date) {
      from = date;
      to = date;
    } else {
      from = fromParam || new Date().toISOString().slice(0, 10);
      to = toParam || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    }

    // Duración
    const slotMinutesOverride = searchParams.get('duration'); // permite probar ?duration=90
    const slotMinutes =
      (slotMinutesOverride && Number(slotMinutesOverride)) ||
      (serviceId && SERVICE_DURATIONS[serviceId]) ||
      60;

    // Llamada a Google Calendar (REST + API Key)
    const { busy } = await listPublicEvents({ timeMin: from, timeMax: to });

    // Aplica reglas de negocio: ignora all-day salvo "cerrado/bloqueo"
    const busyFiltered = filterBusyForBusinessRules(busy);

    // Genera slots
    const slots = generateTimeSlots({
      from,
      to,
      openHour,
      closeHour,
      slotMinutes,
      busy: busyFiltered,
    });

    // Formato nuevo
    const payload = {
      from,
      to,
      openHour,
      closeHour,
      slotMinutes,
      busy: busyFiltered,
      slots,
    };

    // Formato "legacy": lista plana de inicios disponibles (para UIs antiguas)
    const availableStarts = slots.filter((s) => s.available).map((s) => s.start);
    const legacyPayload = {
      ok: true,
      date: date || from,
      serviceId: serviceId || null,
      times: availableStarts,
    };

    if (debug) {
      payload.slots_count = slots.length;
      payload.available_count = availableStarts.length;
      payload.sample = availableStarts.slice(0, 8);
    }

    // Si piden legacy=1 devolvemos sólo formato legacy; si no, el nuevo (e incluimos legacy si debug)
    if (legacy === '1') {
      return new Response(JSON.stringify(legacyPayload), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      });
    } else {
      if (debug) payload.legacy = legacyPayload;
      return new Response(JSON.stringify(payload), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      });
    }
  } catch (err) {
    console.error('Availability ERROR:', err);
    const msg = String(err?.message || err);
    const hint =
      msg.includes('403') ? 'Revisa API Key: Application restrictions = None; API restrictions = Google Calendar API.' :
      msg.includes('404') ? 'Revisa GCAL_ID: usa el "Calendar ID" exacto (Integrate calendar) y que el calendario esté público.' :
      'Verifica GCAL_ID, GCAL_KEY y que el calendario esté público.';
    return new Response(JSON.stringify({ error: msg, hint }), {
      headers: { 'content-type': 'application/json' },
      status: 500,
    });
  }
}
