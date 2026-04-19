import { DateTime } from 'luxon';

/**
 * Genera slots horarios con seguridad de zona horaria usando Luxon.
 * - Si allowOverflowEnd = true: un slot es válido si start < closeHour; el fin puede pasar la hora de cierre
 * - Si allowOverflowEnd = false: slot válido sólo si end <= closeHour
 * - Conflicto si el intervalo [slotStart, slotEnd) se solapa con cualquier turno ocupado [{start,end}]
 */
export function generateTimeSlots({
  date,             // 'YYYY-MM-DD'
  openHour,         // 0..23 o string 'HH:mm'
  closeHour,        // 0..23 o string 'HH:mm'
  stepMinutes,      // ej. 30
  durationMinutes,  // ej. 90
  busy = [],        // [{start,end}] en ISO
  tz = 'America/Santiago',
  allowOverflowEnd = false,
}) {
  const ZONE = tz || 'America/Santiago';

  // Helper para aceptar tanto numérico (10) como string ("09:00")
  const parseHour = (h) => (typeof h === 'string' && h.includes(':') ? h : `${String(h).padStart(2, '0')}:00`);

  const baseStartStr = `${date}T${parseHour(openHour)}:00`;
  const baseEndStr = `${date}T${parseHour(closeHour)}:00`;

  const openTime = DateTime.fromISO(baseStartStr, { zone: ZONE });
  const closeTime = DateTime.fromISO(baseEndStr, { zone: ZONE });

  // Normalizar los turnos ocupados
  const normBusy = busy.filter(b => b && b.start && b.end).map(b => ({
    start: DateTime.fromISO(b.start).setZone(ZONE),
    end: DateTime.fromISO(b.end).setZone(ZONE),
  }));

  const slots = [];
  let cursor = openTime;

  // Seguimos proponiendo inicios mientras:
  const canPropose = (startDt) => {
    const endDt = startDt.plus({ minutes: durationMinutes });
    return allowOverflowEnd ? startDt < closeTime : endDt <= closeTime;
  };

  // Prevenir un bucle infinito en caso de configuraciones raras
  let iterations = 0;
  
  while (canPropose(cursor) && iterations < 150) {
    const startDt = cursor;
    const endDt = startDt.plus({ minutes: durationMinutes });

    // conflicto: (start < bEnd && end > bStart)
    const overlapped = normBusy.some(b => startDt < b.end && endDt > b.start);

    slots.push({
      start: startDt.toISO(),
      end: endDt.toISO(),
      available: !overlapped,
    });

    cursor = cursor.plus({ minutes: stepMinutes });
    iterations++;
  }

  // Además, si el día seleccionado es hoy, ocultamos horas pasadas
  const now = DateTime.now().setZone(ZONE);
  const isSameDay = now.toISODate() === date;

  return slots.filter(s => {
    if (!isSameDay) return true;
    return DateTime.fromISO(s.start, { zone: ZONE }) > now;
  });
}
