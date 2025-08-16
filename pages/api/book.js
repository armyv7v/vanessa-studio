/**
 * API que guarda una nueva cita y envía correos de confirmación.
 *
 * Expecta cuerpo JSON:
 * {
 *   serviceId: number,
 *   date: "YYYY-MM-DD",
 *   start: "HH:mm",
 *   client: { name, email, phone }
 * }
 */

import { addBooking } from "../../lib/sheets";
import { sendEmail } from "../../lib/email";
import { parse, addMinutes, format } from "date-fns";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const { serviceId, date, start, client } = req.body;
  if (!serviceId || !date || !start || !client?.name || !client?.email || !client?.phone) {
    return res.status(400).json({ error: "Datos incompletos." });
  }

  // Mapa de duración (reutilizamos del API de slots)
  const durationMap = {
    1: 120,
    2: 180,
    3: 180,
    4: 180,
    5: 180,
    6: 150,
    7: 150,
    8: 90,
  };
  const duration = durationMap[serviceId];
  if (!duration) {
    return res.status(400).json({ error: "Servicio no válido." });
  }

  // Calcular hora fin
  const startDateTime = parse(`${date} ${start}`, "yyyy-MM-dd HH:mm", new Date());
  const endDateTime = addMinutes(startDateTime, duration);
  const end = format(endDateTime, "HH:mm");

  // Guardar en Google Sheets
  try {
    await addBooking({
      serviceId,
      date,
      start,
      end,
      name: client.name,
      phone: client.phone,
      email: client.email,
    });
  } catch (err) {
    console.error("Error al escribir en Sheets:", err);
    return res.status(500).json({ error: "No se pudo guardar la cita." });
  }

  // Construir correo de confirmación
  const serviceNames = {
    1: "Retoque (Mantenimiento)",
    2: "Reconstrucción Uñas Mordidas (Onicofagía)",
    3: "Uñas Acrílicas",
    4: "Uñas Polygel",
    5: "Uñas Softgel",
    6: "Kapping o Baño Polygel o Acrílico sobre uña natural",
    7: "Reforzamiento Nivelación Rubber",
    8: "Esmaltado Permanente",
  };
  const serviceName = serviceNames[serviceId];
  const formattedDate = format(startDateTime, "dd/MM/yyyy");
  const formattedStart = format(startDateTime, "HH:mm");
  const formattedEnd = format(endDateTime, "HH:mm");

  const html = `
    <h2>¡Cita confirmada en Vanessa Nails Studio!</h2>
    <p><strong>Servicio:</strong> ${serviceName}</p>
    <p><strong>Fecha:</strong> ${formattedDate}</p>
    <p><strong>Horario:</strong> ${formattedStart} – ${formattedEnd}</p>
    <p><strong>Cliente:</strong> ${client.name}</p>
    <p><strong>Teléfono:</strong> ${client.phone}</p>
    <p><strong>Email:</strong> ${client.email}</p>
    <hr/>
    <p>Recibirás un recordatorio 4 horas antes de tu cita.</p>
    <p>Dirección: <a href="${process.env.NEXT_PUBLIC_GOOGLE_MAPS_LINK}" target="_blank">Pasaje Ricardo Videla Pineda 691, Coquimbo</a></p>
    <p>WhatsApp: <a href="${process.env.NEXT_PUBLIC_WHATSAPP_LINK}" target="_blank">+56991744464</a></p>
    <p>¡Te esperamos!</p>
  `;

  try {
    await sendEmail(client.email, "Confirmación de cita - Vanessa Nails Studio", html);
  } catch (err) {
    console.error("Error al enviar email:", err);
    // No bloqueamos la reserva por email fallido
  }

  return res.status(200).json({ success: true });
}