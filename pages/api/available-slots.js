import { DateTime } from 'luxon';
import { getBackendApiUrl, getBackendHorariosUrl } from '../../lib/backendRouting';
import { getFullDayBusinessHours } from '../../lib/businessHours';
import { generateTimeSlots } from '../../lib/slots';

const TIMEZONE = process.env.NEXT_PUBLIC_TZ || 'America/Santiago';
const DEFAULT_SERVICE_DURATION = 120;

const DEFAULT_HORARIO_ATENCION = {
  lunes: ['10:00', '21:00'],
  martes: ['10:00', '21:00'],
  miércoles: ['10:00', '21:00'],
  jueves: ['10:00', '21:00'],
  viernes: ['10:00', '21:00'],
  sábado: ['10:00', '21:00'],
  domingo: ['10:00', '21:00'],
};

async function fetchHorarioAtencion() {
  try {
    const response = await fetch(getBackendHorariosUrl(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Backend status ${response.status}`);
    }

    const payload = await response.json().catch(() => null);
    return payload?.horarioAtencion || DEFAULT_HORARIO_ATENCION;
  } catch {
    return DEFAULT_HORARIO_ATENCION;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const startDate = Array.isArray(req.query.startDate) ? req.query.startDate[0] : req.query.startDate;
    const endDate = Array.isArray(req.query.endDate) ? req.query.endDate[0] : req.query.endDate;
    const durationParam = Array.isArray(req.query.duration) ? req.query.duration[0] : req.query.duration;
    const serviceDuration = Number(durationParam) > 0 ? Number(durationParam) : DEFAULT_SERVICE_DURATION;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required parameters: startDate and endDate',
        received: { startDate, endDate },
      });
    }

    const backendUrl = `${getBackendApiUrl()}?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    const horarioAtencion = await fetchHorarioAtencion();

    let busySlots = [];
    try {
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const payload = await response.json().catch(() => null);
        busySlots = payload?.busy || [];
      }
    } catch {
      busySlots = [];
    }

    const availableSlots = [];
    const start = DateTime.fromISO(startDate, { zone: TIMEZONE }).startOf('day');
    const end = DateTime.fromISO(endDate, { zone: TIMEZONE }).endOf('day');
    const now = DateTime.now().setZone(TIMEZONE);

    let currentDate = start;
    let iterationCount = 0;

    while (currentDate <= end && iterationCount < 100) {
      const businessHours = getFullDayBusinessHours({
        date: currentDate.toISODate(),
        horarioAtencion,
      });

      if (businessHours) {
        const dateStr = currentDate.toISODate();
        const timeSlots = generateTimeSlots({
          date: dateStr,
          openHour: businessHours.openHour,
          closeHour: businessHours.closeHour,
          stepMinutes: businessHours.stepMinutes,
          durationMinutes: serviceDuration,
          busy: busySlots,
          tz: TIMEZONE,
          allowOverflowEnd: businessHours.allowOverflowEnd,
        });

        availableSlots.push(
          ...timeSlots
            .filter((slot) => slot.available && DateTime.fromISO(slot.start, { zone: TIMEZONE }) > now)
            .map((slot) => ({
              start: slot.start,
              end: DateTime.fromISO(slot.end, { zone: TIMEZONE }).toFormat('HH:mm'),
              available: true,
            }))
        );
      }

      currentDate = currentDate.plus({ days: 1 });
      iterationCount += 1;
    }

    return res.status(200).json({ available: availableSlots });
  } catch (error) {
    return res.status(500).json({
      error: 'Error generating available slots',
      details: error.message,
    });
  }
}
