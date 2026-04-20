import { DateTime } from 'luxon';

const BACKEND_URL = 'https://vanessastudioback.netlify.app/.netlify/functions/api';
const TIMEZONE = process.env.NEXT_PUBLIC_TZ || 'America/Santiago';

const horariosConfig = {
  horarioAtencion: {
    lunes: ['09:00', '22:00'],
    martes: ['09:00', '22:00'],
    miercoles: ['09:00', '22:00'],
    jueves: ['09:00', '22:00'],
    viernes: ['09:00', '22:00'],
    sabado: ['09:00', '22:00'],
    domingo: ['09:00', '22:00'],
  },
};

const DAY_NAMES = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
};

const STEP_MINUTES = 30;
const DEFAULT_SERVICE_DURATION = 120;

function getHorarioAtencion() {
  const horarios = {};

  for (let dayNum = 0; dayNum <= 6; dayNum += 1) {
    const dayName = DAY_NAMES[dayNum];
    const horario = horariosConfig.horarioAtencion[dayName];

    horarios[dayNum] = Array.isArray(horario) && horario.length === 2
      ? { inicio: horario[0], fin: horario[1] }
      : null;
  }

  return horarios;
}

const HORARIO_ATENCION = getHorarioAtencion();

function generateTimeSlots(startTime, endTime, step, serviceDuration) {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  while (currentMinutes + serviceDuration <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    slots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
    currentMinutes += step;
  }

  return slots;
}

function isSlotBusy(dateStr, timeStr, busySlots, serviceDuration) {
  if (!Array.isArray(busySlots) || busySlots.length === 0) return false;

  const slotStart = DateTime.fromISO(`${dateStr}T${timeStr}:00`, { zone: TIMEZONE });
  const slotEnd = slotStart.plus({ minutes: serviceDuration });

  return busySlots.some((busy) => {
    if (!busy?.start || !busy?.end) return false;

    try {
      const busyStart = DateTime.fromISO(busy.start).setZone(TIMEZONE);
      const busyEnd = DateTime.fromISO(busy.end).setZone(TIMEZONE);
      return slotStart < busyEnd && slotEnd > busyStart;
    } catch {
      return false;
    }
  });
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

    const backendUrl = `${BACKEND_URL}?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;

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
      const dayOfWeek = currentDate.weekday === 7 ? 0 : currentDate.weekday;
      const horario = HORARIO_ATENCION[dayOfWeek];

      if (horario) {
        const dateStr = currentDate.toISODate();
        const timeSlots = generateTimeSlots(horario.inicio, horario.fin, STEP_MINUTES, serviceDuration);

        for (const time of timeSlots) {
          const slotDateTime = DateTime.fromISO(`${dateStr}T${time}:00`, { zone: TIMEZONE });
          if (slotDateTime <= now) continue;

          if (!isSlotBusy(dateStr, time, busySlots, serviceDuration)) {
            const slotEnd = slotDateTime.plus({ minutes: serviceDuration });
            availableSlots.push({
              start: slotDateTime.toISO(),
              end: slotEnd.toFormat('HH:mm'),
              available: true,
            });
          }
        }
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
