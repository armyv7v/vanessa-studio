// lib/sheets.js
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

/**
 * Obtiene todas las citas programadas desde Google Sheets
 * @returns {Promise<Array>} Array con los datos de las citas
 */
export async function getAllBookings() {
  try {
    // Verificar que la variable de entorno esté definida
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID no está definida en las variables de entorno');
    }
    
    console.log('Obteniendo datos de spreadsheetId:', spreadsheetId);
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Citas!A:H', // Ajusta según la estructura de tu hoja
    });
    
    console.log('Datos obtenidos de Sheets:', response.data.values?.length || 0, 'filas');
    return response.data.values || [];
  } catch (error) {
    console.error('Error obteniendo citas de Google Sheets:', error);
    if (error.response) {
      console.error('Detalles del error de Google Sheets:', error.response.data);
    }
    throw error;
  }
}

/**
 * Agrega una nueva cita a Google Sheets
 * @param {Object} bookingData - Datos de la cita
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function addBooking(bookingData) {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID no está definida en las variables de entorno');
    }
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Generar ID único (puedes mejorarlo según tus necesidades)
    const id = Date.now();
    const timestamp = new Date().toISOString();
    
    const values = [[
      id,
      bookingData.date,
      bookingData.start,
      bookingData.end,
      bookingData.name,
      bookingData.phone,
      bookingData.email,
      timestamp
    ]];
    
    console.log('Guardando cita en Google Sheets:', values[0]);
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'Citas!A:H',
      valueInputOption: 'RAW',
      requestBody: {
        values: values,
      },
    });
    
    console.log('Cita guardada exitosamente en Google Sheets');
    return response.data;
    
  } catch (error) {
    console.error('Error guardando cita en Google Sheets:', error);
    if (error.response) {
      console.error('Detalles del error de Google Sheets:', error.response.data);
    }
    throw error;
  }
}

/**
 * Obtiene las citas programadas para una fecha específica
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @returns {Promise<Array>} Array con las citas de esa fecha
 */
export async function getBookingsByDate(date) {
  try {
    const allBookings = await getAllBookings();
    
    // Filtrar citas por fecha (asumiendo que la fecha está en la columna B - índice 1)
    const bookingsForDate = allBookings.filter(row => {
      // Saltar encabezados si existen
      if (row[0] === 'ID' || row[0] === 'id') return false;
      return row[1] === date; // Columna B = fecha
    });
    
    console.log(`Encontradas ${bookingsForDate.length} citas para la fecha ${date}`);
    return bookingsForDate;
  } catch (error) {
    console.error('Error filtrando citas por fecha:', error);
    return [];
  }
}

/**
 * Verifica si un slot de tiempo está disponible
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @param {string} time - Hora en formato HH:mm
 * @returns {Promise<boolean>} true si está disponible, false si no
 */
export async function isSlotAvailable(date, time) {
  try {
    const bookings = await getBookingsByDate(date);
    
    // Verificar si ya existe una cita con esa fecha y hora
    const isBooked = bookings.some(booking => {
      return booking[2] === time; // Columna C = hora de inicio
    });
    
    return !isBooked;
  } catch (error) {
    console.error('Error verificando disponibilidad del slot:', error);
    // En caso de error, asumir que está ocupado para evitar overbooking
    return false;
  }
}

/**
 * Elimina una cita específica por ID de Google Sheets
 * @param {string|number} bookingId - ID de la cita a eliminar
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function deleteBookingById(bookingId) {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID no está definida en las variables de entorno');
    }
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Primero, encontrar la fila que contiene este ID
    const allData = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Citas!A:H',
    });
    
    const rows = allData.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('No se encontraron datos en la hoja');
    }
    
    // Buscar la fila con el ID especificado
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] == bookingId) { // Comparación débil para manejar strings/números
        rowIndex = i + 1; // +1 porque las filas en Sheets comienzan en 1
        break;
      }
    }
    
    if (rowIndex === -1) {
      throw new Error(`No se encontró cita con ID: ${bookingId}`);
    }
    
    // Eliminar la fila específica
    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0, // Asumiendo que es la primera hoja
              dimension: 'ROWS',
              startIndex: rowIndex - 1, // -1 porque startIndex es 0-based
              endIndex: rowIndex
            }
          }
        }]
      }
    });
    
    console.log(`Cita con ID ${bookingId} eliminada exitosamente de fila ${rowIndex}`);
    return response.data;
    
  } catch (error) {
    console.error('Error eliminando cita de Google Sheets:', error);
    throw error;
  }
}

/**
 * Obtiene una cita específica por ID
 * @param {string|number} bookingId - ID de la cita
 * @returns {Promise<Object|null>} Datos de la cita o null si no existe
 */
export async function getBookingById(bookingId) {
  try {
    const allBookings = await getAllBookings();
    
    const booking = allBookings.find(row => {
      return row[0] == bookingId; // Comparación débil
    });
    
    return booking || null;
  } catch (error) {
    console.error('Error obteniendo cita por ID:', error);
    return null;
  }
}