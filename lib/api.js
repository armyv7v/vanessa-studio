import { DateTime } from 'luxon';
import horariosConfig from '../config/horarios.json';

const TIMEZONE = 'America/Santiago';
const STEP_MINUTES = 30;        // espacio entre candidatos de inicio
const SERVICE_DURATION = 120;   // duración real del servicio (2h)
const DAY_NAMES = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miércoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sábado',
};

function getHorarioAtencion() {
  const horarios = {};
  for (let dayNum = 0; dayNum <= 6; dayNum += 1) {
    const dayName = DAY_NAMES[dayNum];
    const horario = horariosConfig.horarioAtencion?.[dayName];

    horarios[dayNum] = Array.isArray(horario) && horario.length === 2
      ? { inicio: horario[0], fin: horario[1] }
      : null;
  }
  return horarios;
}

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

function isSlotBusy(dateStr, timeStr, busySlots) {
  const slotStart = DateTime.fromISO(`${dateStr}T${timeStr}:00`, { zone: TIMEZONE });
  const slotEnd = slotStart.plus({ minutes: SERVICE_DURATION });

  return busySlots.some((busy) => {
    if (!busy?.start || !busy?.end) return false;

    const busyStart = DateTime.fromISO(busy.start).setZone(TIMEZONE);
    const busyEnd = DateTime.fromISO(busy.end).setZone(TIMEZONE);
    return slotStart < busyEnd && slotEnd > busyStart;
  });
}

function buildAvailableRange(startDate, endDate, busySlots) {
  const horarioAtencion = getHorarioAtencion();
  const start = DateTime.fromISO(startDate, { zone: TIMEZONE }).startOf('day');
  const end = DateTime.fromISO(endDate, { zone: TIMEZONE }).endOf('day');
  const now = DateTime.now().setZone(TIMEZONE);
  const availableSlots = [];

  let currentDate = start;
  let iterationCount = 0;

  while (currentDate <= end && iterationCount < 100) {
    const dayOfWeek = currentDate.weekday === 7 ? 0 : currentDate.weekday;
    const horario = horarioAtencion[dayOfWeek];

    if (horario) {
      const dateStr = currentDate.toISODate();
      const timeSlots = generateTimeSlots(horario.inicio, horario.fin, STEP_MINUTES, SERVICE_DURATION);

      for (const time of timeSlots) {
        const slotDateTime = DateTime.fromISO(`${dateStr}T${time}:00`, { zone: TIMEZONE });
        if (slotDateTime <= now) continue;

        if (!isSlotBusy(dateStr, time, busySlots)) {
          const slotEnd = slotDateTime.plus({ minutes: SERVICE_DURATION });
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

  return availableSlots;
}

export async function getAvailableSlots(date, serviceId) {
  const formattedDate = date.toISOString().split('T')[0];
  const fallbackBaseUrl = process.env.NEXT_PUBLIC_API_WORKER_URL || 'https://vanessastudioback.netlify.app/.netlify/functions/api';
  const isProductionHost = typeof window !== 'undefined' && window.location.hostname.includes('pages.dev');

  const response = isProductionHost
    ? await fetch(`${fallbackBaseUrl}?date=${encodeURIComponent(formattedDate)}`)
    : await fetch(`/api/slots?date=${formattedDate}&serviceId=${serviceId}`);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Error obteniendo horarios disponibles');
  }

  return data?.busy || [];
}

export async function getAvailableSlotsRange(startDate, endDate) {
  const fallbackBaseUrl = process.env.NEXT_PUBLIC_API_WORKER_URL || process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL;
  const isProductionHost = typeof window !== 'undefined' && window.location.hostname.includes('pages.dev');

  if (fallbackBaseUrl && isProductionHost) {
    const directUrl = new URL(fallbackBaseUrl);
    directUrl.searchParams.set('startDate', startDate.toISOString().split('T')[0]);
    directUrl.searchParams.set('endDate', endDate.toISOString().split('T')[0]);

    const directResponse = await fetch(directUrl.toString());
    const directData = await directResponse.json().catch(() => null);

    if (directResponse.ok) {
      return buildAvailableRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        directData?.busy || [],
      );
    }
  }

  const params = new URLSearchParams({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  });

  const response = await fetch(`/api/available-slots?${params.toString()}`);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Error obteniendo disponibilidad por rango');
  }

  return data?.available || [];
}

export async function bookAppointment(bookingData) {
  const fallbackBaseUrl = process.env.NEXT_PUBLIC_API_WORKER_URL || 'https://vanessastudioback.netlify.app/.netlify/functions/api';
  const isProductionHost = typeof window !== 'undefined' && window.location.hostname.includes('pages.dev');

  const response = await fetch(isProductionHost ? fallbackBaseUrl : '/api/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.error) {
    throw new Error(data?.error || 'Error al confirmar la cita');
  }

  return data;
}

export async function getClientByEmail(email, signal) {
  if (!email || !email.includes('@')) {
    return null;
  }

  const fallbackBaseUrl = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL || process.env.NEXT_PUBLIC_API_WORKER_URL;
  const isProductionHost = typeof window !== 'undefined' && window.location.hostname.includes('pages.dev');

  if (fallbackBaseUrl && isProductionHost) {
    const directUrl = new URL(fallbackBaseUrl);
    directUrl.searchParams.set('action', 'getClient');
    directUrl.searchParams.set('email', email);

    const directResponse = await fetch(directUrl.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal,
    });

    if (directResponse.ok) {
      const directData = await directResponse.json().catch(() => null);
      return directData?.client || directData?.customer || null;
    }

    if (directResponse.status === 404) {
      return null;
    }

    return null;
  }

  const response = await fetch(`/api/client?email=${encodeURIComponent(email)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (response.ok) {
    const data = await response.json().catch(() => null);
    return data?.client || null;
  }

  if (response.status === 404) {
    return null;
  }

  if (!fallbackBaseUrl) {
    return null;
  }

  const fallbackUrl = new URL(fallbackBaseUrl);
  fallbackUrl.searchParams.set('action', 'getClient');
  fallbackUrl.searchParams.set('email', email);

  const fallbackResponse = await fetch(fallbackUrl.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (!fallbackResponse.ok) {
    return null;
  }

  const fallbackData = await fallbackResponse.json().catch(() => null);
  return fallbackData?.client || fallbackData?.customer || null;
}
