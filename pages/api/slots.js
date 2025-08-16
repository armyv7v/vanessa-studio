/**
 * API que, dado un día y un servicio, devuelve los slots de 30 min que están
 * libres para iniciar el servicio sin solaparse con citas existentes.
 *
 * Parámetros GET:
 *   - date      (YYYY-MM-DD)
 *   - serviceId (int)
 *
 * Respuesta JSON:
 *   { slots: ["09:00", "09:30", ...] }
 */

import { getAllBookings } from "../../lib/sheets";
import { parse, format, addMinutes, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";

export default async function handler(req, res) {
  const { date, serviceId } = req.query;

  if (!date || !serviceId) {
    return res.status(400).json({ error: "Faltan parámetros." });
  }

  const serviceMap = {
    1: 120,
    2: 180,
    3: 180,
    4: 180,
    5: 180,
    6: 150,
    7: 150,
    8: 90,
  };
  const duration = serviceMap[serviceId];
  if (!duration) {
    return res.status(400).json({ error: "Servicio no válido." });
  }

  // Convertir la fecha solicitada a objeto Date
  const targetDay = parse(date, "yyyy-MM-dd", new Date());

  // Rango del día completo (para filtrar reservas existentes)
  const dayStart = startOfDay(targetDay);
  const dayEnd = endOfDay(targetDay);

  // Obtener todas las reservas y quedarnos con las del día solicitado
  const allBookings = await getAllBookings();
  const dayBookings = allBookings.filter((b) => {
    const bookingDate = parse(b.date, "yyyy-MM-dd", new Date());
    return bookingDate >= dayStart && bookingDate <= dayEnd;
  });

  // Definir horario de atención
  const OPEN_HOUR = 9;  // 09:00
  const CLOSE_HOUR = 20; // 20:00 (el servicio debe terminar antes de esta hora)

  // Generar todos los posibles inicios cada 30 min dentro del rango de apertura
  const possibleSlots = [];
  let cursor = new Date(targetDay);
  cursor.setHours(OPEN_HOUR, 0, 0, 0);
  const closing = new Date(targetDay);
  closing.setHours(CLOSE_HOUR, 0, 0, 0);

  while (isBefore(cursor, closing)) {
    possibleSlots.push(new Date(cursor));
    cursor = addMinutes(cursor, 30);
  }

  // Función para saber si un intervalo [start, end) está libre
  const isSlotFree = (slotStart) => {
    const slotEnd = addMinutes(slotStart, duration);
    // No permitir que el servicio pase del cierre
    if (isAfter(slotEnd, closing)) return false;

    // Verificar que no intersecte con ninguna reserva existente
    for (const booking of dayBookings) {
      const bookingStart = parse(`${booking.date} ${booking.start}`, "yyyy-MM-dd HH:mm", new Date());
      const bookingEnd = parse(`${booking.date} ${booking.end}`, "yyyy-MM-dd HH:mm", new Date());

      // Si hay cruce -> no está libre
      const overlap =
        (slotStart >= bookingStart && slotStart < bookingEnd) ||
        (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
        (slotStart <= bookingStart && slotEnd >= bookingEnd);
      if (overlap) return false;
    }
    return true;
  };

  // Filtrar los slots que están libres
  const freeSlots = possibleSlots.filter(isSlotFree).map((d) => format(d, "HH:mm"));

  return res.status(200).json({ slots: freeSlots });
}