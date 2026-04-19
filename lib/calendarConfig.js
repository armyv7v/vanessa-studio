// lib/calendarConfig.js

/**
 * Ventanas de atención para páginas:
 * - normal: 10:00–18:00 (cierre) con paso de 30'
 * - extra:  18:00–20:00 (cierre de inicio) con paso de 30' (permitimos terminar después de las 20:00)
 */
export const NORMAL_WINDOW = { openHour: 10, closeHour: 18, stepMin: 30 };
export const EXTRA_WINDOW  = { openHour: 18, closeHour: 20, stepMin: 30 };

/**
 * Determina si una fecha está permitida según reglas:
 * - Siempre permite de lunes a viernes
 * - Sábados según ENABLE_SATURDAY
 * - Domingos según ENABLED_SUNDAY_ORDINALS (si no está vacío) o ENABLE_SUNDAY_DEFAULT
 */
export function isAllowedBusinessDay(date, disabledConfig = []) {
  const normalizedConfig = Array.isArray(disabledConfig)
    ? { disabledDays: disabledConfig, disabledDates: [], blackoutRanges: [] }
    : (disabledConfig || {});

  const disabledDays = Array.isArray(normalizedConfig.disabledDays) ? normalizedConfig.disabledDays : [];
  const disabledDates = Array.isArray(normalizedConfig.disabledDates) ? normalizedConfig.disabledDates : [];
  const blackoutRanges = Array.isArray(normalizedConfig.blackoutRanges) ? normalizedConfig.blackoutRanges : [];

  const dow = date.getDay(); // 0=Dom ... 6=Sab
  const weekNum = Math.ceil(date.getDate() / 7);
  const dateKey = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
  let dayCode = '';
  if (dow === 0) {
    dayCode = "SUN" + weekNum;
  } else if (dow === 6) {
    dayCode = "SAT" + weekNum;
  }

  if (disabledDays.includes(dayCode)) {
    return false;
  }

  if (disabledDates.includes(dateKey)) {
    return false;
  }

  const insideBlackoutRange = blackoutRanges.some((range) => {
    if (!range?.start || !range?.end) return false;
    return dateKey >= range.start && dateKey <= range.end;
  });

  return !insideBlackoutRange;
}
