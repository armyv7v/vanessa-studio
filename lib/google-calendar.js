// lib/google-calendar.js
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ],
});

/**
 * Crea un evento en Google Calendar
 * @param {Object} eventData - Datos del evento
 * @returns {Promise<Object>} Evento creado
 */
export async function createCalendarEvent(eventData) {
  try {
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Verificar que las fechas sean válidas
    if (!eventData.startDateTime || !eventData.endDateTime) {
      throw new Error('Fechas inválidas');
    }
    
    const event = {
      summary: eventData.summary || 'Cita Vanessa Nails',
      description: eventData.description || 'Cita agendada',
      location: 'Pasaje Ricardo Videla Pineda 691, Coquimbo',
      start: {
        dateTime: eventData.startDateTime,
        timeZone: 'America/Santiago',
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: 'America/Santiago',
      },
      reminders: {
        useDefault: true,
      },
      visibility: 'public',
      guestsCanInviteOthers: false,
      guestsCanModify: false,
      guestsCanSeeOtherGuests: false,
      transparency: 'opaque'
    };
    
    console.log('Creando evento en Google Calendar:');
    console.log('- Calendar ID:', process.env.GOOGLE_CALENDAR_ID || 'primary');
    console.log('- Summary:', event.summary);
    console.log('- Start:', eventData.startDateTime);
    console.log('- End:', eventData.endDateTime);
    
    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      requestBody: event,
    });
    
    console.log('Evento creado exitosamente:');
    console.log('- Event ID:', response.data.id);
    console.log('- Event Link:', response.data.htmlLink);
    
    return response.data;
    
  } catch (error) {
    console.error('Error detallado creando evento en Google Calendar:');
    console.error('Código de error:', error.code);
    console.error('Mensaje:', error.message);
    if (error.response) {
      console.error('Respuesta de la API:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * Obtiene eventos de Google Calendar para una fecha específica
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @returns {Promise<Array>} Lista de eventos
 */
export async function getCalendarEvents(date) {
  try {
    const calendar = google.calendar({ version: 'v3', auth });
    
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    console.log('Buscando eventos en Google Calendar:');
    console.log('- Calendar ID:', process.env.GOOGLE_CALENDAR_ID || 'primary');
    console.log('- Fecha inicio:', startDate.toISOString());
    console.log('- Fecha fin:', endDate.toISOString());
    
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    const events = response.data.items || [];
    console.log(`Encontrados ${events.length} eventos para la fecha ${date}`);
    
    return events;
    
  } catch (error) {
    console.error('Error obteniendo eventos de Google Calendar:', error);
    return [];
  }
}

/**
 * Verifica disponibilidad de horario en Google Calendar
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @param {string} startTime - Hora de inicio en formato HH:mm
 * @param {string} endTime - Hora de fin en formato HH:mm
 * @returns {Promise<boolean>} true si está disponible, false si no
 */
export async function isCalendarSlotAvailable(date, startTime, endTime) {
  try {
    const events = await getCalendarEvents(date);
    
    // Convertir horas a objetos Date para comparación
    const slotStart = new Date(`${date}T${startTime}:00`);
    const slotEnd = new Date(`${date}T${endTime}:00`);
    
    // Verificar si hay conflictos con eventos existentes
    for (const event of events) {
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);
      
      // Verificar solapamiento
      if (
        (slotStart >= eventStart && slotStart < eventEnd) ||
        (slotEnd > eventStart && slotEnd <= eventEnd) ||
        (slotStart <= eventStart && slotEnd >= eventEnd)
      ) {
        console.log('Conflicto encontrado con evento existente:', event.summary);
        return false;
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('Error verificando disponibilidad en calendario:', error);
    // En caso de error, asumir que está ocupado para evitar overbooking
    return false;
  }
}