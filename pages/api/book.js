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
export const runtime = 'nodejs';
import { addBooking, getAllBookings } from "../../lib/sheets";
import { sendEmail } from "../../lib/email";
import { createCalendarEvent, getCalendarEvents } from "../../lib/google-calendar";
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

  // Verificar disponibilidad en Google Calendar y Google Sheets
  try {
    const isAvailable = await checkSlotAvailability(date, start, end);
    if (!isAvailable) {
      return res.status(400).json({ 
        error: "El horario seleccionado ya no está disponible. Por favor, elige otro horario." 
      });
    }
  } catch (err) {
    console.error("Error verificando disponibilidad:", err);
    return res.status(500).json({ error: "Error verificando disponibilidad del horario." });
  }

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
    console.log('Cita guardada en Google Sheets exitosamente');
  } catch (err) {
    console.error("Error al escribir en Sheets:", err);
    return res.status(500).json({ error: "No se pudo guardar la cita." });
  }

  // Crear evento en Google Calendar
  let calendarEvent = null;
  try {
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
    
    calendarEvent = await createCalendarEvent({
      summary: `Cita: ${serviceName} - ${client.name}`,
      description: `
Servicio: ${serviceName}
Cliente: ${client.name}
Teléfono: ${client.phone}
Email: ${client.email}
      `.trim(),
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString()
    });
    
    console.log('Evento creado en Google Calendar:', calendarEvent.id);
    
  } catch (err) {
    console.error("Error al crear evento en Google Calendar:", err);
    // No bloqueamos la reserva por error en Calendar, pero lo registramos
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
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Confirmación de Cita - Vanessa Nails Studio</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #ff69b4; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; }
          .highlight { background-color: #fff0f5; padding: 15px; border-left: 4px solid #ff69b4; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Vanessa Nails Studio</h1>
            <p>Confirmación de Cita</p>
        </div>
        <div class="content">
            <h2>¡Tu cita ha sido confirmada!</h2>
            <div class="highlight">
                <p><strong>Servicio:</strong> ${serviceName}</p>
                <p><strong>Fecha:</strong> ${formattedDate}</p>
                <p><strong>Horario:</strong> ${formattedStart} – ${formattedEnd}</p>
                <p><strong>Cliente:</strong> ${client.name}</p>
            </div>
            <p>Estimado/a <strong>${client.name}</strong>,</p>
            <p>Te confirmamos que tu cita en Vanessa Nails Studio ha sido agendada exitosamente.</p>
            <p><strong>Detalles de contacto:</strong></p>
            <ul>
                <li>Dirección: Pasaje Ricardo Videla Pineda 691, Coquimbo</li>
                <li>WhatsApp: <a href="https://wa.me/56991744464">+56991744464</a></li>
                <li>Mapa: <a href="https://maps.google.com/maps?q=Pasaje+Ricardo+Videla+Pineda+691,+Coquimbo">Ver ubicación</a></li>
            </ul>
            <p>Recibirás un recordatorio 4 horas antes de tu cita.</p>
            <p>¡Gracias por elegirnos!</p>
        </div>
        <div class="footer">
            <p>Vanessa Nails Studio - Pasaje Ricardo Videla Pineda 691, Coquimbo</p>
            <p>Este es un mensaje automático, por favor no responder.</p>
        </div>
    </body>
    </html>
  `;

  // Enviar email de confirmación al cliente
  try {
    console.log('Enviando email a:', client.email);
    await sendEmail(
      client.email, 
      "Confirmación de cita - Vanessa Nails Studio", 
      html,
      process.env.STUDIO_EMAIL || 'noreply@tudominio.com'
    );
    console.log('Email de confirmación enviado exitosamente a:', client.email);
  } catch (err) {
    console.error("Error al enviar email al cliente:", err);
  }

  // Enviar copia al studio
  try {
    console.log('Enviando copia al studio:', process.env.STUDIO_EMAIL);
    if (process.env.STUDIO_EMAIL) {
      await sendEmail(
        process.env.STUDIO_EMAIL,
        `Nueva Cita Agendada - ${client.name}`,
        `
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="utf-8">
              <title>Nueva Cita</title>
          </head>
          <body>
              <h2>Nueva Cita Agendada</h2>
              <p><strong>Cliente:</strong> ${client.name}</p>
              <p><strong>Email:</strong> ${client.email}</p>
              <p><strong>Teléfono:</strong> ${client.phone}</p>
              <p><strong>Servicio:</strong> ${serviceName}</p>
              <p><strong>Fecha:</strong> ${formattedDate}</p>
              <p><strong>Horario:</strong> ${formattedStart} – ${formattedEnd}</p>
              ${calendarEvent ? `<p><strong>Evento Calendar:</strong> <a href="${calendarEvent.htmlLink}">Ver en Google Calendar</a></p>` : ''}
          </body>
          </html>
        `,
        process.env.STUDIO_EMAIL
      );
      console.log('Copia enviada al studio exitosamente');
    }
  } catch (err) {
    console.error("Error al enviar email al studio:", err);
  }

  return res.status(200).json({ 
    success: true, 
    message: "Cita confirmada, emails enviados y evento creado en calendario" 
  });
}

/**
 * Verifica la disponibilidad de un slot en ambos sistemas
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @param {string} startTime - Hora de inicio en formato HH:mm
 * @param {string} endTime - Hora de fin en formato HH:mm
 * @returns {Promise<boolean>} true si está disponible, false si no
 */
async function checkSlotAvailability(date, startTime, endTime) {
  try {
    // Verificar en Google Sheets
    const allBookings = await getAllBookings();
    const bookingsForDate = allBookings.filter(row => {
      if (row[0] === 'ID' || row[0] === 'id' || !row[0]) return false;
      return row[1] === date;
    });
    
    const isBookedInSheets = bookingsForDate.some(booking => booking[2] === startTime);
    if (isBookedInSheets) {
      console.log(`Slot ${date} ${startTime} ya está ocupado en Google Sheets`);
      return false;
    }

    // Verificar en Google Calendar
    const calendarEvents = await getCalendarEvents(date);
    
    // Convertir horas a objetos Date para comparación
    const slotStart = new Date(`${date}T${startTime}:00`);
    const slotEnd = new Date(`${date}T${endTime}:00`);
    
    // Verificar si hay conflictos con eventos existentes
    for (const event of calendarEvents) {
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);
      
      // Verificar solapamiento
      if (
        (slotStart >= eventStart && slotStart < eventEnd) ||
        (slotEnd > eventStart && slotEnd <= eventEnd) ||
        (slotStart <= eventStart && slotEnd >= eventEnd)
      ) {
        console.log(`Slot ${date} ${startTime}-${endTime} ya está ocupado en Google Calendar por:`, event.summary);
        return false;
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('Error verificando disponibilidad:', error);
    // En caso de error, asumir que está ocupado para evitar overbooking
    return false;
  }
}