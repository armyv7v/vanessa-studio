// pages/api/slots.js
export const runtime = 'edge';
import { getAllBookings } from '../../lib/sheets';

export default async function handler(req, res) {
  // Solo permitir método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { date, serviceId } = req.query;

  // Validar parámetros requeridos
  if (!date || !serviceId) {
    return res.status(400).json({ 
      error: 'Parámetros incompletos', 
      message: 'Se requieren date y serviceId' 
    });
  }

  // Validar formato de fecha (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({ 
      error: 'Formato de fecha inválido', 
      message: 'La fecha debe tener formato YYYY-MM-DD' 
    });
  }

  // Validar serviceId
  const serviceIdNum = parseInt(serviceId);
  const durationMap = {
    1: 120,   // Retoque (Mantenimiento)
    2: 180,   // Reconstrucción Uñas Mordidas
    3: 180,   // Uñas Acrílicas
    4: 180,   // Uñas Polygel
    5: 180,   // Uñas Softgel
    6: 150,   // Kapping o Baño Polygel/Acrílico
    7: 150,   // Reforzamiento Nivelación Rubber
    8: 90,    // Esmaltado Permanente
  };

  if (!durationMap[serviceIdNum]) {
    return res.status(400).json({ 
      error: 'Servicio no válido', 
      message: 'El serviceId debe ser un número del 1 al 8' 
    });
  }

  try {
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.GOOGLE_SHEET_ID) {
      console.error('ERROR: GOOGLE_SHEET_ID no está definida en las variables de entorno');
      return res.status(500).json({ 
        error: 'Error de configuración del servidor',
        message: 'GOOGLE_SHEET_ID no está definida'
      });
    }

    console.log(`Obteniendo slots disponibles para fecha: ${date}, servicio: ${serviceId}`);

    // Obtener todas las citas programadas
    const allBookings = await getAllBookings();
    console.log(`Total de citas obtenidas: ${allBookings.length}`);

    // Filtrar citas para la fecha específica
    const bookingsForDate = allBookings.filter(row => {
      // Saltar encabezados
      if (row[0] === 'ID' || row[0] === 'id' || !row[0]) return false;
      // Filtrar por fecha (columna B - índice 1)
      return row[1] === date;
    });

    console.log(`Citas encontradas para ${date}: ${bookingsForDate.length}`);

    // Definir slots de tiempo disponibles
    const allTimeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
      '18:00', '18:30', '19:00', '19:30'
    ];

    // Obtener slots ocupados
    const bookedSlots = bookingsForDate.map(booking => booking[2]); // Columna C = hora inicio
    console.log('Slots ocupados:', bookedSlots);

    // Calcular duración del servicio en horas
    const durationHours = durationMap[serviceIdNum] / 60;
    
    // Filtrar slots disponibles considerando la duración del servicio
    const availableSlots = allTimeSlots.filter(slot => {
      // Verificar si el slot está ocupado
      if (bookedSlots.includes(slot)) {
        return false;
      }
      
      // Verificar si hay suficiente tiempo para el servicio
      const [hours, minutes] = slot.split(':').map(Number);
      const slotTime = hours + minutes / 60;
      const endTime = slotTime + durationHours;
      
      // Verificar que no se pase de las 20:00 (8 PM)
      if (endTime > 20) {
        return false;
      }
      
      // Verificar si hay conflictos con citas existentes
      for (const bookedSlot of bookedSlots) {
        const [bookedHours, bookedMinutes] = bookedSlot.split(':').map(Number);
        const bookedTime = bookedHours + bookedMinutes / 60;
        
        // Estimar duración del servicio existente (simplificada)
        const existingServiceDuration = 2; // 2 horas por defecto
        
        // Si hay solapamiento de tiempos
        if (
          (slotTime >= bookedTime && slotTime < bookedTime + existingServiceDuration) ||
          (bookedTime >= slotTime && bookedTime < slotTime + durationHours)
        ) {
          return false;
        }
      }
      
      return true;
    });

    console.log(`Slots disponibles encontrados: ${availableSlots.length}`);

    res.status(200).json({
      date,
      serviceId: serviceIdNum,
      duration: durationMap[serviceIdNum],
      availableSlots,
      totalAvailable: availableSlots.length
    });

  } catch (error) {
    console.error('Error en API de slots:', error);
    
    // Error específico para problemas de autenticación/permisos
    if (error.message && error.message.includes('Missing required parameters: spreadsheetId')) {
      return res.status(500).json({
        error: 'Error de configuración',
        message: 'No se pudo conectar con Google Sheets. Verifique las variables de entorno.'
      });
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message || 'No se pudieron obtener los slots disponibles'
    });
  }
}