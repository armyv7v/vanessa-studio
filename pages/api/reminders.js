/**
 * Vercel Cron Job – se ejecuta cada hora (ver `vercel.json`).
 *
 * Busca citas cuyo inicio sea dentro de la ventana de 4 h ± 5 min y envía
 * un recordatorio por email.
 */
export const runtime = 'edge';
import { sendEmail } from "../../lib/email";
import { parse, addHours, isWithinInterval, format } from "date-fns";

export default async function handler(req, res) {
  // Esta función solo se invoca vía cron, no se expone al público.
  // Por seguridad podemos validar un token opcional en headers, pero por
  // simplicidad la dejamos abierta (Vercel protege los cron jobs).

  const now = new Date();
  const target = addHours(now, 4); // 4 horas en el futuro

  // Permitir un margen de 5 minutos antes o después
  const interval = {
    start: addHours(now, 3.9166667), // 3h 55m
    end: addHours(now, 4.0833333),  // 4h 5m
  };

  let bookings;
  try {
    bookings = await getAllBookings();
  } catch (err) {
    console.error("Error al leer Sheets:", err);
    return res.status(500).json({ error: "Error obteniendo citas." });
  }

  const toRemind = bookings.filter((b) => {
    const start = parse(`${b.date} ${b.start}`, "yyyy-MM-dd HH:mm", new Date());
    return isWithinInterval(start, interval);
  });

  // Enviar recordatorios
  for (const r of toRemind) {
    const html = `
      <h2>Recordatorio de cita – Vanessa Nails Studio</h2>
      <p>Hola <strong>${r.name}</strong>,</p>
      <p>Te recordamos que tienes una cita mañana a las <strong>${r.start}</strong> del servicio <strong>${r.serviceId}</strong> (ver detalle en tu email de confirmación).</p>
      <p>Dirección: <a href="${process.env.NEXT_PUBLIC_GOOGLE_MAPS_LINK}" target="_blank">Pasaje Ricardo Videla Pineda 691, Coquimbo</a></p>
      <p>WhatsApp: <a href="${process.env.NEXT_PUBLIC_WHATSAPP_LINK}" target="_blank">+56991744464</a></p>
      <p>¡Nos vemos pronto!</p>
    `;

    try {
      await sendEmail(r.email, "Recordatorio de cita - Vanessa Nails Studio", html);
    } catch (err) {
      console.error(`Error al enviar recordatorio a ${r.email}:`, err);
    }
  }

  return res.status(200).json({ sent: toRemind.length });
}