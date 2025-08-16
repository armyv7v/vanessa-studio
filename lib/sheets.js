/**
 * Cliente para Google Sheets mediante una cuenta de servicio.
 *
 * Necesita en .env.local:
 *   - GOOGLE_SHEETS_ID
 *   - GOOGLE_CLIENT_EMAIL
 *   - GOOGLE_PRIVATE_KEY
 */

import { google } from "googleapis";

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const sheets = google.sheets({ version: "v4", auth });

/**
 * Obtiene todas las filas de la hoja "Citas".
 * Se asume que la hoja tiene encabezados en la fila 1.
 */
export async function getAllBookings() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: "Citas!A2:H", // A = Servicio, B = Fecha, C = HoraInicio, D = HoraFin, E = Nombre, F = Teléfono, G = Email, H = Timestamp
  });
  const rows = response.data.values || [];
  return rows.map(row => ({
    serviceId: Number(row[0]),
    date: row[1], // "YYYY-MM-DD"
    start: row[2], // "HH:mm"
    end: row[3],
    name: row[4],
    phone: row[5],
    email: row[6],
    timestamp: row[7],
  }));
}

/**
 * Guarda una nueva reserva en la hoja.
 * @param {Object} booking - objeto con los campos descritos arriba.
 */
export async function addBooking(booking) {
  const values = [
    [
      booking.serviceId,
      booking.date,
      booking.start,
      booking.end,
      booking.name,
      booking.phone,
      booking.email,
      new Date().toISOString(),
    ],
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: "Citas!A:H",
    valueInputOption: "RAW",
    requestBody: { values },
  });
}