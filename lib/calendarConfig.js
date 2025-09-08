// lib/calendarConfig.js
import { getWeekOfMonth } from 'date-fns';

/**
 * CONFIGURACIÓN DE DÍAS
 * - Habilitar/Deshabilitar sábados en general
 * - Domingos: por defecto habilitados o no; además puedes elegir por ordinales (DOM1, DOM2, DOM3, DOM4, DOM5)
 *   Si ENABLED_SUNDAY_ORDINALS tiene elementos, SOLO esos domingos estarán habilitados.
 */
export const ENABLE_SATURDAY = true;
export const ENABLE_SUNDAY_DEFAULT = true; // por defecto, domingos deshabilitados

// Ejemplos: [1,3] habilita solo DOM1 y DOM3; [] usa ENABLE_SUNDAY_DEFAULT
export const ENABLED_SUNDAY_ORDINALS = []; // <-- ajusta a tu gusto (p. ej. [1,3])

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
export function isAllowedBusinessDay(date) {
  const dow = date.getDay(); // 0=Dom ... 6=Sab
  if (dow >= 1 && dow <= 5) return true; // Lun-Vie

  if (dow === 6) { // Sábado
    return ENABLE_SATURDAY;
  }
  if (dow === 0) { // Domingo
    if (ENABLED_SUNDAY_ORDINALS.length > 0) {
      const ordinal = getSundayOrdinalOfMonth(date); // 1..5
      return ENABLED_SUNDAY_ORDINALS.includes(ordinal);
    }
    return ENABLE_SUNDAY_DEFAULT;
  }
  return false;
}

/** Ordinal del domingo dentro del mes (DOM1..DOM5) */
export function getSundayOrdinalOfMonth(date) {
  // date-fns getWeekOfMonth: semanas 1..5; pero queremos solo para domingos.
  // Una forma robusta: contar domingos del mismo mes hasta esta fecha.
  const y = date.getFullYear(), m = date.getMonth();
  let count = 0;
  for (let d = new Date(y, m, 1); d.getMonth() === m; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) count++;
    if (d.toDateString() === date.toDateString()) return count;
  }
  return 0;
}

/**
 * Filtra/normaliza slots locales HH:mm:
 *  - Si el día seleccionado es HOY, oculta los horarios ya pasados
 */
export function filterPastSlotsIfToday(slotsHHmm, dateObj) {
  if (!dateObj || !Array.isArray(slotsHHmm)) return [];
  const now = new Date();
  if (sameDay(now, dateObj)) {
    return slotsHHmm.filter((hhmm) => {
      const [H, M] = hhmm.split(':').map(Number);
      const t = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), H, M, 0, 0);
      return t.getTime() > now.getTime() + 60 * 1000;
    });
  }
  return slotsHHmm;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
}
