import horariosConfig from '../config/horarios.json';
import { EXTRA_WINDOW, NORMAL_WINDOW } from './calendarConfig';

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const FALLBACK_HORARIO_ATENCION = horariosConfig.horarioAtencion || {};
const FALLBACK_EXTRA_CUPOS_CONFIG = horariosConfig.extraCuposConfig || {
  enabled: true,
  start: '18:00',
  end: '20:00',
  daysToShow: 35,
  extraChargeClp: 5000,
};

function normalizeDayName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function toTimeString(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${String(value).padStart(2, '0')}:00`;
  }

  return typeof value === 'string' && value.includes(':') ? value : null;
}

function timeToMinutes(value) {
  const time = toTimeString(value);
  if (!time) return null;

  const [hours, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function minutesToTime(value) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function normalizeHorarioAtencion(input) {
  const source = input && typeof input === 'object' ? input : FALLBACK_HORARIO_ATENCION;
  const normalized = {};

  Object.entries(source).forEach(([dayName, range]) => {
    normalized[normalizeDayName(dayName)] = Array.isArray(range) ? range : [];
  });

  return normalized;
}

export function getDayHours({ date, horarioAtencion }) {
  const jsDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(jsDate.getTime())) return null;

  const normalized = normalizeHorarioAtencion(horarioAtencion);
  const dayName = normalizeDayName(DAY_NAMES[jsDate.getDay()]);
  const dayHours = normalized[dayName];

  if (!Array.isArray(dayHours) || dayHours.length !== 2) {
    return null;
  }

  const [start, end] = dayHours;
  if (timeToMinutes(start) == null || timeToMinutes(end) == null) {
    return null;
  }

  return [start, end];
}

function getModeWindow(mode) {
  return mode === 'extra' ? EXTRA_WINDOW : NORMAL_WINDOW;
}

export function normalizeExtraCuposConfig(input) {
  const source = input && typeof input === 'object' ? input : FALLBACK_EXTRA_CUPOS_CONFIG;
  const start = toTimeString(source.start) || FALLBACK_EXTRA_CUPOS_CONFIG.start;
  const end = toTimeString(source.end) || FALLBACK_EXTRA_CUPOS_CONFIG.end;

  return {
    enabled: source.enabled !== false,
    start,
    end,
    daysToShow: Number.isFinite(Number(source.daysToShow)) ? Number(source.daysToShow) : FALLBACK_EXTRA_CUPOS_CONFIG.daysToShow,
    extraChargeClp: Number.isFinite(Number(source.extraChargeClp)) ? Number(source.extraChargeClp) : FALLBACK_EXTRA_CUPOS_CONFIG.extraChargeClp,
  };
}

export function getBusinessHoursForDate({ date, horarioAtencion, mode = 'normal', overrides, extraCuposConfig }) {
  if (overrides?.openHour != null && overrides?.closeHour != null) {
    return {
      openHour: toTimeString(overrides.openHour),
      closeHour: toTimeString(overrides.closeHour),
      stepMinutes: overrides.stepMinutes || 30,
      allowOverflowEnd: Boolean(overrides.allowOverflowEnd),
    };
  }

  const dayHours = getDayHours({ date, horarioAtencion });
  if (!dayHours) return null;

  const [adminStart, adminEnd] = dayHours.map(timeToMinutes);
  const windowConfig = getModeWindow(mode);
  const normalizedExtraConfig = normalizeExtraCuposConfig(extraCuposConfig);
  if (mode === 'extra' && !normalizedExtraConfig.enabled) {
    return null;
  }
  const modeStart = timeToMinutes(mode === 'extra' ? normalizedExtraConfig.start : windowConfig.openHour);
  const modeEnd = timeToMinutes(mode === 'extra' ? normalizedExtraConfig.end : windowConfig.closeHour);

  const start = Math.max(adminStart, modeStart);
  const end = Math.min(adminEnd, modeEnd);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null;
  }

  if (start >= end) {
    if (mode === 'extra' && normalizedExtraConfig.enabled) {
      return {
        openHour: minutesToTime(modeStart),
        closeHour: minutesToTime(modeEnd),
        stepMinutes: windowConfig.stepMin || 30,
        allowOverflowEnd: Boolean(windowConfig.allowOverflowEnd),
      };
    }

    return null;
  }

  return {
    openHour: minutesToTime(start),
    closeHour: minutesToTime(end),
    stepMinutes: windowConfig.stepMin || 30,
    allowOverflowEnd: Boolean(windowConfig.allowOverflowEnd),
  };
}

export function getFullDayBusinessHours({ date, horarioAtencion }) {
  const dayHours = getDayHours({ date, horarioAtencion });
  if (!dayHours) return null;

  return {
    openHour: dayHours[0],
    closeHour: dayHours[1],
    stepMinutes: 30,
    allowOverflowEnd: false,
  };
}
