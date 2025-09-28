/**
 * WebApp de reservas — Vanessa Nails Studio
 * Edita y despliega con clasp sin cambiar la URL del WebApp.
 */

const TZ = "America/Santiago";
const CALENDAR_ID = "64693698ebab23975e6f5d11f9f3b170a6d11b9a19ebb459e1486314ee930ebf@group.calendar.google.com";
const OWNER_EMAIL = "nailsvanessacl@gmail.com";
const SHEET_ID   = "1aE4dnWZQjEJWAMaDEfDRpACVUDU8_F9-fzd_2mSQQeM";
const SHEET_NAME = "Reservas";
const WHATSAPP_PHONE = "56991744464";
const BANK_LINES = [
  "VANESSA MORALES — Cuenta RUT 27774310-8 — Banco Estado",
  "VANESSA MORALES — Cuenta Corriente 12700182876 — Banco Estado"
];
// Horarios de atención
const BUSINESS_HOURS = { start: "10:00", end: "18:00" };
const EXTRA_HOURS    = { start: "18:00", end: "20:00" };
const SLOT_STEP_MIN  = 30; // Intervalo de los slots, en minutos
const DISABLED_DAYS = [
  // Ejemplos: "SAT1", "SAT3", "SUN2"
];

const SERVICE_MAP = {
  "1": { name: "Retoque (Mantenimiento)", duration: 120 },
  "2": { name: "Reconstrucción Uñas Mordidas (Onicofagía)", duration: 180 },
  "3": { name: "Uñas Acrílicas", duration: 180 },
  "4": { name: "Uñas Polygel", duration: 180 },
  "5": { name: "Uñas Softgel", duration: 180 },
  "6": { name: "Kapping o Baño Polygel o Acrílico sobre uña natural", duration: 150 },
  "7": { name: "Reforzamiento Nivelación Rubber", duration: 150 },
  "8": { name: "Esmaltado Permanente", duration: 90 }
};

/**
 * Maneja las solicitudes OPTIONS (preflight) para CORS.
 * Esto es crucial para que las solicitudes GET y POST desde el navegador funcionen.
 */
function doOptions(e) {
  return ContentService.createTextOutput()
    .setHeader('Access-Control-Allow-Origin', '*') // O tu dominio específico
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Maneja las solicitudes GET para obtener horarios disponibles.
 */
function doGet(e) {
  const response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  response.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const action = e.parameter.action;

    // Acción para autocompletar datos del cliente
    if (action === 'getClient') {
      const email = e.parameter.email;
      Logger.log(`doGet: Recibida acción 'getClient' para email: ${email}`);
      if (!email) throw new Error("Parámetro 'email' es requerido");
      
      const clientData = getClientByEmail(email);
      response.setContent(JSON.stringify({ client: clientData }));
      Logger.log(`doGet: Datos de cliente encontrados: ${JSON.stringify(clientData)}`);
      return response;
    }

    // Acción por defecto: obtener horarios
    const date = e.parameter.date; // 'YYYY-MM-DD'
    const serviceId = e.parameter.serviceId;
    const mode = e.parameter.mode || 'normal'; // 'normal' o 'extra'

    if (!date || !serviceId) {
      response.setContent(JSON.stringify({ error: "Faltan parámetros 'date' o 'serviceId'" }));
      return response;
    }

    const service = SERVICE_MAP[serviceId];
    if (!service) {
      response.setContent(JSON.stringify({ error: "Servicio no válido" }));
      return response;
    }

    const availableSlots = getAvailableSlotsForDay(date, service.duration, mode);
    
    response.setContent(JSON.stringify({ availableSlots: availableSlots }));
    return response;

  } catch (err) {
    response.setContent(JSON.stringify({ error: "Error interno del servidor: " + String(err) }));
    return response;
  }
}

/**
 * Busca los datos más recientes de un cliente por su email en la hoja de cálculo.
 * @param {string} email El email del cliente a buscar.
 * @returns {object|null} Un objeto con {name, phone} o null si no se encuentra.
 */
function getClientByEmail(email) {
  if (!email) return null;
  Logger.log(`getClientByEmail: Buscando cliente con email: ${email}`);
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    Logger.log(`getClientByEmail: Hoja '${SHEET_NAME}' no encontrada en el Spreadsheet ID: ${SHEET_ID}`);
    return null;
  }

  const data = sh.getDataRange().getValues();
  Logger.log(`getClientByEmail: Total de filas en la hoja: ${data.length}`);
  // Busca desde la última fila hacia arriba para obtener los datos más recientes.
  for (let i = data.length - 1; i >= 1; i--) { // i >= 1 para saltar la cabecera
    const row = data[i];
    Logger.log(`getClientByEmail: Procesando fila ${i}, Email en hoja: '${row[2]}', Nombre: '${row[1]}', Teléfono: '${row[3]}'`);
    // Asume que las columnas son: A:Timestamp, B:Nombre, C:Email, D:Teléfono
    if (row[2] && row[2].toString().trim().toLowerCase() === email.trim().toLowerCase()) {
      Logger.log(`getClientByEmail: ¡Coincidencia encontrada en fila ${i}!`);
      return { name: row[1] || "", phone: row[3] || "" };
    }
  }
  Logger.log(`getClientByEmail: No se encontró ninguna coincidencia para el email: ${email}`);
  return null; // No se encontró el cliente
}

/**
 * Calcula los horarios disponibles para un día, servicio y modo específicos.
 */
function getAvailableSlotsForDay(dateStr, durationMin, mode) {
  const targetDate = new Date(dateStr + "T00:00:00");
  if (isNaN(targetDate.getTime())) {
    throw new Error("Fecha inválida: " + dateStr);
  }

  // 1. Verificar si el día está deshabilitado
  if (isDisabledDay(targetDate)) {
    return [];
  }

  // 2. Definir la ventana de tiempo según el modo
  const hours = (mode === 'extra') ? EXTRA_HOURS : BUSINESS_HOURS;
  const [startHour, startMin] = hours.start.split(':').map(Number);
  const [endHour, endMin] = hours.end.split(':').map(Number);

  const dayStart = new Date(targetDate);
  dayStart.setHours(startHour, startMin, 0, 0);

  const dayEnd = new Date(targetDate);
  dayEnd.setHours(endHour, endMin, 0, 0);

  // 3. Obtener eventos existentes en el calendario para ese día
  const cal = CalendarApp.getCalendarById(CALENDAR_ID);
  const busySlots = cal.getEvents(dayStart, dayEnd).map(function(ev) {
    return { start: ev.getStartTime(), end: ev.getEndTime() };
  });

  // 4. Generar todos los posibles slots y filtrar los no disponibles
  const availableSlots = [];
  let cursor = new Date(dayStart);

  while (cursor < dayEnd) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);

    // El slot es válido si comienza antes de la hora de cierre de la ventana.
    // Para el horario normal, también debe terminar antes de la hora de cierre.
    // Para el horario extra, puede terminar después.
    const isValidWindow = (mode === 'extra') ? (slotStart < dayEnd) : (slotEnd <= dayEnd);

    if (isValidWindow) {
      // Verificar si hay conflicto con algún evento existente
      const hasConflict = busySlots.some(function(busy) {
        return (slotStart < busy.end) && (slotEnd > busy.start);
      });

      // Verificar si el slot ya pasó (si es para hoy)
      const now = new Date();
      const isPast = (slotStart < now);

      if (!hasConflict && !isPast) {
        availableSlots.push(Utilities.formatDate(slotStart, TZ, "HH:mm"));
      }
    }

    // Mover el cursor al siguiente slot
    cursor.setMinutes(cursor.getMinutes() + SLOT_STEP_MIN);
  }

  return availableSlots;
}

function buildRfc3339(dateStr, timeStr, minutesToAdd) {
  if (!dateStr || !timeStr) throw new Error("dateStr/timeStr requeridos");
  const [Y, M, D] = dateStr.split("-").map(Number);
  const [h, m]   = timeStr.split(":").map(Number);
  const start = new Date(Y, M - 1, D, h, m, 0, 0);
  const end   = new Date(start.getTime() + (Number(minutesToAdd) || 0) * 60000);
  const startStr = Utilities.formatDate(start, TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
  const endStr   = Utilities.formatDate(end,   TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
  return { start, end, startStr, endStr };
}

function isDisabledDay(date) {
  const dow = date.getDay(); // 0 dom, 6 sáb
  const weekNum = Math.ceil(date.getDate() / 7);
  if (dow === 6) return DISABLED_DAYS.includes("SAT" + weekNum);
  if (dow === 0) return DISABLED_DAYS.includes("SUN" + weekNum);
  return false;
}

function hasConflictCalendarApp(calendarId, start, end) {
  const cal = CalendarApp.getCalendarById(calendarId);
  const events = cal.getEvents(start, end);
  return events && events.length > 0;
}

function appendToSheet(row) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  sh.appendRow(row);
}

function buildEmailHtml({ clientName, fecha, hora, duracion, telefono, serviceName, htmlLink }) {
  const bankList = BANK_LINES.map(l => `<li>${l}</li>`).join("");
  const whatsLink = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
    "Hola Vanessa, te envío el comprobante de reserva. Mi nombre es " + clientName
  )}`;
  return `
  <div style="font-family:Arial,sans-serif;color:#333;line-height:1.6">
    <div style="max-width:560px;margin:auto;border:1px solid #f2d7e2;border-radius:12px;overflow:hidden">
      <div style="background:#fef0f5;padding:16px 20px">
        <h2 style="margin:0;color:#d63384">✨ Confirmación de Reserva</h2>
      </div>
      <div style="padding:20px">
        <p>Hola <b>${clientName}</b>, tu cita ha sido registrada con éxito 💅🏻</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0">
          <tr><td style="padding:6px 0;width:140px"><b>Servicio:</b></td><td>${serviceName || "-"}</td></tr>
          <tr><td style="padding:6px 0"><b>Fecha:</b></td><td>${fecha}</td></tr>
          <tr><td style="padding:6px 0"><b>Hora:</b></td><td>${hora}</td></tr>
          <tr><td style="padding:6px 0"><b>Duración:</b></td><td>${duracion} minutos</td></tr>
          <tr><td style="padding:6px 0"><b>Teléfono:</b></td><td>${telefono || "-"}</td></tr>
          ${htmlLink ? `<tr><td style="padding:6px 0"><b>Evento:</b></td><td><a href="${htmlLink}">Abrir en Google Calendar</a></td></tr>` : ""}
        </table>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
        <h3 style="margin:10px 0 6px">💖 Condiciones de Reserva</h3>
        <p>Para apartar tu horita debes enviar una reserva de <b>$5.000</b> pesos, la cual se descuenta del valor total del servicio.</p>
        <p>🏦 Transferir a:</p>
        <ul style="margin:0 0 10px 18px;padding:0">${bankList}</ul>
        <p>💖 Por favor, envía el comprobante por WhatsApp:
          <a href="${whatsLink}" style="color:#d63384;font-weight:bold;text-decoration:none">Enviar comprobante</a>
        </p>
        <p>🚫 Si faltas a tu hora, no se realiza devolución de la reserva.<br>
           👉 Puedes reagendar con el mismo abono notificando como mínimo <b>24 horas antes</b>.</p>
        <p style="font-size:12px;color:#666;margin-top:18px">
          Gracias por tu preferencia 💅🏻<br>Vanessa Nails Studio
        </p>
      </div>
    </div>
  </div>`;
}

function jsonResponse(obj, statusCode) {
  const response = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  
  // ¡Esta es la clave para solucionar el error de CORS!
  response.setHeader('Access-Control-Allow-Origin', '*');
  return response; // Esta función ahora es un helper, doGet tiene la lógica principal.
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: "Solicitud vacía" });
    }
    let data;
    try { data = JSON.parse(e.postData.contents); }
    catch { return jsonResponse({ success: false, error: "JSON inválido" }); }

    const nombre    = (data.nombre || data.name || "").trim();
    const email     = (data.email || "").trim();
    const telefono  = (data.telefono || data.phone || "").trim();
    const fecha     = (data.fecha || data.date || "").trim(); // YYYY-MM-DD
    const hora      = (data.hora  || data.start || "").trim(); // HH:mm
    const serviceId = String(data.serviceId || "");
    const extraCupo = !!(data.extraCupo || data.extraCup); // Acepta ambos para retrocompatibilidad
    const durationMin = Number(data.durationMin || (SERVICE_MAP[serviceId]?.duration || 60));
    const serviceName = data.servicio || SERVICE_MAP[serviceId]?.name || "Servicio";

    if (!nombre || !email || !fecha || !hora) {
      return jsonResponse({ success: false, error: "Faltan campos: nombre, email, fecha, hora" });
    }

    const probe = new Date(`${fecha}T${hora}:00`);
    if (isNaN(probe.getTime())) return jsonResponse({ success: false, error: "Fecha/Hora inválidas" });
    if (isDisabledDay(probe))   return jsonResponse({ success: false, error: "Este día no está disponible para reservas." });

    const { start, end, startStr, endStr } = buildRfc3339(fecha, hora, durationMin);
    if (hasConflictCalendarApp(CALENDAR_ID, start, end)) {
      return jsonResponse({ success: false, error: "Horario no disponible (conflicto)" });
    }

    const cal = CalendarApp.getCalendarById(CALENDAR_ID);
    const eventTitle = `Cita: ${serviceName} con ${nombre}` + (extraCupo ? " (EXTRA)" : "");
    const event = cal.createEvent(eventTitle,
      `Cita: ${serviceName} con ${nombre}`,
      start,
      end,
      {
        description: [
          `Cliente: ${nombre}`,
          `Email: ${email}`,
          `Teléfono: ${telefono}`,
          `Servicio: ${serviceName}`,
          `Duración: ${durationMin} min`,
          `Modalidad: ${extraCupo ? 'Extra Cupo' : 'Normal'}`
        ].join("\\n"),
        guests: email + (OWNER_EMAIL ? "," + OWNER_EMAIL : ""),
        sendInvites: true
      }
    );

    const startLocal = Utilities.formatDate(start, TZ, "yyyy-MM-dd HH:mm");
    const endLocal   = Utilities.formatDate(end,   TZ, "yyyy-MM-dd HH:mm");
    appendToSheet([
      new Date(), nombre, email, telefono,
      serviceName, startLocal, endLocal, durationMin, extraCupo ? "SI" : "NO",
      event.getId(), event.getHtmlLink()
    ]);

    const html = buildEmailHtml({
      clientName: nombre,
      fecha, hora, duracion: durationMin,
      telefono, serviceName,
      htmlLink: event.getHtmlLink()
    });

    MailApp.sendEmail({ to: email, subject: `✅ Confirmación de Reserva — ${serviceName}`, htmlBody: html });
    if (OWNER_EMAIL) {
      MailApp.sendEmail({ to: OWNER_EMAIL, subject: `Nueva Cita — ${serviceName} (${nombre})`, htmlBody: html });
    }

    return jsonResponse({ success: true, eventId: event.getId(), htmlLink: event.getHtmlLink(), start: startStr, end: endStr });
  } catch (err) {
    return jsonResponse({ success: false, error: String(err) });
  }
}

function test_doPost() {
  const e = { postData: { contents: JSON.stringify({
    nombre: "Prueba VSCode",
    email: "cliente@example.com",
    telefono: "56911112222",
    fecha: "2025-08-25",
    hora: "10:00",
    serviceId: 8,
    durationMin: 90,
    servicio: "Esmaltado Permanente"
  })}};
  const res = doPost(e);
  Logger.log(res.getContent());
}

/**
 * Guarda una suscripción de notificación push en la hoja 'Subscriptions'.
 */
function saveSubscription(data) {
  const { subscription, email } = data;
  if (!subscription || !email) {
    throw new Error("Faltan datos de suscripción o email.");
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName("Subscriptions");
  if (!sh) {
    throw new Error("La hoja 'Subscriptions' no existe.");
  }

  // Guarda el email y la suscripción como un string JSON
  sh.appendRow([email, JSON.stringify(subscription)]);
}

/**
 * Modifica doPost para manejar la nueva acción 'saveSubscription'.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: "Solicitud vacía" });
    }
    let data;
    try { data = JSON.parse(e.postData.contents); }
    catch { return jsonResponse({ success: false, error: "JSON inválido" }); }

    // --- Manejo de acciones ---
    if (data.action === 'saveSubscription') {
      saveSubscription(data);
      return jsonResponse({ success: true });
    }

    // --- Lógica de reserva de cita (código existente) ---
    const nombre    = (data.nombre || data.name || "").trim();
    const email     = (data.email || "").trim();
    const telefono  = (data.telefono || data.phone || "").trim();
    const fecha     = (data.fecha || data.date || "").trim(); // YYYY-MM-DD
    const hora      = (data.hora  || data.start || "").trim(); // HH:mm
    const serviceId = String(data.serviceId || "");
    const extraCupo = !!(data.extraCupo || data.extraCup);
    const durationMin = Number(data.durationMin || (SERVICE_MAP[serviceId]?.duration || 60));
    const serviceName = data.servicio || SERVICE_MAP[serviceId]?.name || "Servicio";

    if (!nombre || !email || !fecha || !hora) {
      return jsonResponse({ success: false, error: "Faltan campos: nombre, email, fecha, hora" });
    }

    const probe = new Date(`${fecha}T${hora}:00`);
    if (isNaN(probe.getTime())) return jsonResponse({ success: false, error: "Fecha/Hora inválidas" });
    if (isDisabledDay(probe))   return jsonResponse({ success: false, error: "Este día no está disponible para reservas." });

    const { start, end, startStr, endStr } = buildRfc3339(fecha, hora, durationMin);
    if (hasConflictCalendarApp(CALENDAR_ID, start, end)) {
      return jsonResponse({ success: false, error: "Horario no disponible (conflicto)" });
    }

    // ... (resto de tu lógica de doPost para crear el evento, etc.)
    // ... (el código no cambia, solo se ha movido dentro de la estructura if/else)

    // ... (código para crear evento, enviar email, etc.)

    return jsonResponse({ success: true, eventId: event.getId(), htmlLink: event.getHtmlLink(), start: startStr, end: endStr });

  } catch (err) {
    return jsonResponse({ success: false, error: String(err) });
  }
}

// NOTA: La función para *enviar* las notificaciones push desde Google Apps Script
// es muy compleja debido a la necesidad de firmar tokens (JWT).
// Se recomienda usar un servicio de terceros (como OneSignal) o un backend
// en Node.js para manejar el envío de notificaciones de forma programada.
// Esta implementación se enfoca en la suscripción del usuario.
