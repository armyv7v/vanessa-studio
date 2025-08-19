// pages/api/cleanup.js
export const runtime = 'edge';
import { getAllBookings, deleteBookingById } from '../../lib/sheets';
import { getCalendarEvents } from '../../lib/google-calendar';

export default async function handler(req, res) {
  // Solo permitir método POST para esta operación sensible
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Use POST.' });
  }

  // Verificar clave de API para seguridad (opcional pero recomendado)
  const authHeader = req.headers.authorization;
  if (process.env.CLEANUP_API_KEY && 
      (!authHeader || authHeader !== `Bearer ${process.env.CLEANUP_API_KEY}`)) {
    return res.status(401).json({ error: 'No autorizado. Se requiere clave API.' });
  }

  try {
    console.log('Iniciando proceso de limpieza de citas huérfanas...');
    
    // Obtener todas las citas de Google Sheets
    const allBookings = await getAllBookings();
    console.log(`Total de citas en Sheets: ${allBookings.length - 1}`); // -1 por encabezado

    // Filtrar solo las filas con datos válidos (excluir encabezados)
    const validBookings = allBookings.filter(row => {
      return row[0] !== 'ID' && row[0] !== 'id' && row[0] && !isNaN(row[0]);
    });

    console.log(`Citas válidas encontradas: ${validBookings.length}`);

    // Agrupar citas por fecha para optimizar llamadas a Calendar API
    const bookingsByDate = {};
    validBookings.forEach(booking => {
      const date = booking[1]; // Columna B = fecha
      if (!bookingsByDate[date]) {
        bookingsByDate[date] = [];
      }
      bookingsByDate[date].push(booking);
    });

    console.log(`Fechas con citas: ${Object.keys(bookingsByDate).length}`);

    let cleanedCount = 0;
    const orphanedBookings = [];

    // Verificar cada fecha
    for (const [date, bookings] of Object.entries(bookingsByDate)) {
      console.log(`Verificando citas para fecha: ${date}`);
      
      // Obtener eventos de Google Calendar para esta fecha
      const calendarEvents = await getCalendarEvents(date);
      
      // Crear mapa de eventos por hora de inicio para búsqueda rápida
      const calendarSlots = new Set();
      calendarEvents.forEach(event => {
        if (event.start && event.start.dateTime) {
          const eventTime = new Date(event.start.dateTime);
          const timeString = `${eventTime.getHours().toString().padStart(2, '0')}:${eventTime.getMinutes().toString().padStart(2, '0')}`;
          calendarSlots.add(timeString);
        }
      });

      console.log(`Eventos encontrados en Calendar para ${date}: ${calendarEvents.length}`);

      // Verificar cada cita en Sheets
      for (const booking of bookings) {
        const bookingId = booking[0]; // Columna A = ID
        const bookingTime = booking[2]; // Columna C = hora inicio
        
        // Si el slot no existe en Calendar, es una cita huérfana
        if (!calendarSlots.has(bookingTime)) {
          console.log(`Cita huérfana encontrada - ID: ${bookingId}, Fecha: ${date}, Hora: ${bookingTime}`);
          orphanedBookings.push({
            id: bookingId,
            date: date,
            time: bookingTime,
            name: booking[4] || 'Desconocido', // Columna E = nombre
            row: allBookings.indexOf(booking) + 1 // +1 por encabezado
          });
        }
      }
    }

    console.log(`Total de citas huérfanas encontradas: ${orphanedBookings.length}`);

    // Eliminar citas huérfanas si se solicita
    if (req.body?.cleanup === true) {
      console.log('Iniciando eliminación de citas huérfanas...');
      
      for (const orphaned of orphanedBookings) {
        try {
          // NOTA: Necesitarás implementar deleteBookingById en lib/sheets.js
          // await deleteBookingById(orphaned.id);
          console.log(`Cita eliminada - ID: ${orphaned.id}`);
          cleanedCount++;
        } catch (deleteError) {
          console.error(`Error eliminando cita ID ${orphaned.id}:`, deleteError);
        }
      }
      
      console.log(`Limpieza completada. Citas eliminadas: ${cleanedCount}`);
    }

    res.status(200).json({ 
      success: true,
      message: `Análisis completado. ${orphanedBookings.length} citas huérfanas encontradas.`,
      orphanedCount: orphanedBookings.length,
      orphanedBookings: orphanedBookings,
      cleanedCount: req.body?.cleanup === true ? cleanedCount : 0
    });

  } catch (error) {
    console.error('Error en proceso de limpieza:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
}