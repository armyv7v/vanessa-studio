/**
 * WebApp de reservas — Vanessa Nails Studio
 * v1.2.0 - CORS Robusto y Horario Extendido
 * Edita y despliega con clasp sin cambiar la URL del WebApp.
 */

const TZ = "America/Santiago";
const CALENDAR_ID = "64693698ebab23975e6f5d11f9f3b170a6d11b9a19ebb459e1486314ee930ebf@group.calendar.google.com";
const OWNER_EMAIL = "nailsvanessacl@gmail.com";
const SHEET_ID   = "1aE4dnWZQjEJWAMaDEfDRpACVUDU8_F9-fzd_2mSQQeM";
const PROD_ORIGIN = "https://vanessa-studio.pages.dev";
const SHEET_NAME = "Reservas";
const WHATSAPP_PHONE = "56991744464";
const BANK_LINES = [
  "VANESSA MORALES — Cuenta RUT 27774310-8 — Banco Estado",
  "VANESSA MORALES — Cuenta Corriente 12700182876 — Banco Estado"
];
// Horarios de atención (Base)
const BUSINESS_HOURS = { start: "10:00", end: "21:00" }; // <-- HORARIO CORREGIDO
const EXTRA_HOURS    = { start: "18:00", end: "20:00" };
const SLOT_STEP_MIN  = 30;
const DISABLED_DAYS = [];

/**
 * Maneja las solicitudes OPTIONS (pre-vuelo) para CORS.
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Unifica la creación de respuestas JSON con las cabeceras CORS correctas.
 */
function createJsonResponse(data, statusCode = 200) {
  const payload = Object.assign({}, data);
  if (statusCode !== 200 && payload.statusCode == null) {
    payload.statusCode = statusCode;
  }

  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Maneja las solicitudes GET para obtener configuración, horarios, etc.
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    Logger.log(`doGet: Recibida acción '${action}' con parámetros: ${JSON.stringify(e.parameter)}`);

    if (action === 'getConfig') {
      return createJsonResponse({
        ok: true,
        disabledDays: DISABLED_DAYS,
        workingHours: BUSINESS_HOURS // Devolvemos el horario correcto
      });
    }

    if (action === 'getClient') {
      const email = e.parameter.email;
      if (!email) throw new Error("Parámetro 'email' es requerido");
      const clientData = getClientByEmail(email);
      return createJsonResponse({ ok: true, client: clientData });
    }

    // Si no es ninguna acción conocida, devuelve un error.
    return createJsonResponse({ ok: false, error: "Acción no reconocida o faltan parámetros." }, 400);

  } catch (err) {
    Logger.log(`Error en doGet: ${err.stack}`);
    return createJsonResponse({ ok: false, error: "Error interno del servidor: " + String(err) }, 500);
  }
}

/**
 * Maneja las solicitudes POST para crear reservas.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: "Solicitud vacía" }, 400);
    }
    let data;
    try { data = JSON.parse(e.postData.contents); }
    catch { return createJsonResponse({ success: false, error: "JSON inválido" }, 400); }

    const clientData = data.client || {};
    const nombre    = sanitize(clientData.name);
    const email     = sanitize(clientData.email).toLowerCase();
    const telefono  = sanitize(clientData.phone).replace(/[^\d+]/g, '');
    const fecha     = (data.date || "").trim();
    const hora      = (data.start || "").trim();
    const durationMin = Number(data.durationMin);
    const serviceName = data.serviceName || "Servicio no especificado";
    const extraCupo = !!data.extraCupo;

    if (!nombre || !email || !telefono || !fecha || !hora || !durationMin || !serviceName) {
      return createJsonResponse({ success: false, error: "Faltan campos obligatorios." }, 400);
    }

    const tzFromPayload = typeof data.tz === "string" && data.tz ? data.tz : TZ;
    const tzOffsetFromPayload = typeof data.tzOffset === "string" ? data.tzOffset : "";
    const startIsoFromPayload = typeof data.startIso === "string" ? data.startIso : "";
    const endIsoFromPayload = typeof data.endIso === "string" ? data.endIso : "";

    const { start, end, startStr, endStr } = buildDateTimeObjects(
      fecha,
      hora,
      durationMin,
      {
        tz: tzFromPayload,
        tzOffset: tzOffsetFromPayload,
        startIso: startIsoFromPayload,
        endIso: endIsoFromPayload,
      }
    );
    if (hasConflictCalendarApp(CALENDAR_ID, start, end)) {
      return createJsonResponse({ success: false, error: "El horario seleccionado ya no está disponible. Por favor, elige otro." }, 409);
    }

    const cal = CalendarApp.getCalendarById(CALENDAR_ID);
    const eventTitle = `Cita: ${serviceName} con ${nombre}` + (extraCupo ? " (EXTRA)" : "");
    const eventDescription = `Cliente: ${nombre}\nEmail: ${email}\nTeléfono: ${telefono}\nServicio: ${serviceName}\nDuración: ${durationMin} min\nModalidad: ${extraCupo ? 'Extra Cupo' : 'Normal'}`;
    const guestsList = [email];
    if (OWNER_EMAIL) {
      guestsList.push(OWNER_EMAIL);
    }
    const guestString = guestsList.filter((guestEmail) => !!guestEmail).join(",");
    let event;
    try {
      event = cal.createEvent(eventTitle, start, end, {
        description: eventDescription,
        guests: guestString,
        sendInvites: true,
      });
    } catch (err) {
      const errMsg = String(err || "");
      const guestPermissionIssue = /guest|invitad|permiso/i.test(errMsg);
      if (!guestPermissionIssue) {
        throw err;
      }
      Logger.log(`Fallo al crear evento con invitados (reintentando sin ellos): ${errMsg}`);
      event = cal.createEvent(eventTitle, start, end, {
        description: eventDescription,
      });
      guestsList.forEach((guestEmail) => {
        if (!guestEmail) return;
        try {
          event.addGuest(guestEmail);
        } catch (guestErr) {
          Logger.log(`No se pudo agregar al invitado ${guestEmail}: ${guestErr}`);
        }
      });
    }
    const eventLink = typeof event.getId === 'function' && CALENDAR_ID
      ? `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(CALENDAR_ID)}`
      : "";

    const appendedRow = appendToSheet([ new Date(), nombre, email, telefono, serviceName, Utilities.formatDate(start, TZ, "yyyy-MM-dd HH:mm"), Utilities.formatDate(end, TZ, "yyyy-MM-dd HH:mm"), durationMin, extraCupo ? "SI" : "NO", event.getId(), eventLink ]);
    const html = buildEmailHtml({ clientName: nombre, fecha, hora, duracion: durationMin, telefono, serviceName, htmlLink: eventLink });

    MailApp.sendEmail({ to: email, subject: `✅ Confirmación de Reserva — ${serviceName}`, htmlBody: html });
    if (OWNER_EMAIL) {
      MailApp.sendEmail({ to: OWNER_EMAIL, subject: `Nueva Cita — ${serviceName} (${nombre})`, htmlBody: html });
    }

    return createJsonResponse({ success: true, eventId: event.getId(), htmlLink: eventLink, start: startStr, end: endStr, sheetRow: appendedRow });
  } catch (err) {
    Logger.log(`Error en doPost: ${err.stack}`);
    return createJsonResponse({ success: false, error: "Error interno del servidor: " + String(err) }, 500);
  }
}


// --- EL RESTO DE TUS FUNCIONES (getClientByEmail, buildDateTimeObjects, etc.) VAN AQUÍ SIN CAMBIOS ---
// ... (pega aquí el resto de tu archivo original desde la función getClientByEmail hacia abajo) ...

/**
 * Busca los datos más recientes de un cliente por su email en la hoja de cálculo.
 * @param {string} email El email del cliente a buscar.
 * @returns {object|null} Un objeto con {name, phone} o null si no se encuentra.
 */
function getClientByEmail(email) {
  if (!email) return null;
  Logger.log(`getClientByEmail: Buscando cliente con email: ${email}`);

  // Optimización: Usar CacheService para no leer la hoja en cada petición.
  const cache = CacheService.getScriptCache();
  const cacheKey = `CLIENT_DATA_FOR_${SHEET_ID}`;
  let data = JSON.parse(cache.get(cacheKey));

  if (!data) {
    Logger.log("Cache de clientes no encontrada. Leyendo desde la hoja de cálculo.");
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) {
      Logger.log(`getClientByEmail: Hoja '${SHEET_NAME}' no encontrada.`);
      return null;
    }
    data = sh.getDataRange().getValues();
    // Guardar en caché por 6 minutos (360 segundos).
    cache.put(cacheKey, JSON.stringify(data), 360);
  }

  Logger.log(`getClientByEmail: Total de filas en la hoja: ${data.length}`);
  // Busca desde la última fila hacia arriba para obtener los datos más recientes.
  for (let i = data.length - 1; i >= 1; i--) { // i >= 1 para saltar la cabecera
    const row = data[i];
    // Asume que las columnas son: A:Timestamp, B:Nombre, C:Email, D:Teléfono
    if (row[2] && row[2].toString().trim().toLowerCase() === email.trim().toLowerCase()) {
      Logger.log(`getClientByEmail: ¡Coincidencia encontrada en fila ${i}!`);
      // Devuelve los datos limpios
      return { name: (row[1] || "").toString().trim(), phone: (row[3] || "").toString().trim() };
    }
  }
  Logger.log(`getClientByEmail: No se encontró ninguna coincidencia para el email: ${email}`);
  return null; // No se encontró el cliente
}

/**
 * Construye objetos Date y strings en formato RFC3339 a partir de fecha y hora.
 */
function buildDateTimeObjects(dateStr, timeStr, minutesToAdd, options) {
  if (!dateStr || !timeStr) throw new Error("dateStr/timeStr requeridos");
  const opts = options || {};
  const tz = opts.tz || TZ;

  const start = resolveStartDateTime({
    dateStr,
    timeStr,
    tz,
    tzOffset: opts.tzOffset,
    startIso: opts.startIso,
  });

  const durationMinutes = Number(minutesToAdd) || 0;
  const end = resolveEndDateTime({
    start,
    durationMinutes,
    endIso: opts.endIso,
  });

  const startStr = Utilities.formatDate(start, tz, "yyyy-MM-dd'T'HH:mm:ssXXX");
  const endStr = Utilities.formatDate(end, tz, "yyyy-MM-dd'T'HH:mm:ssXXX");
  return { start, end, startStr, endStr };
}

function resolveStartDateTime({ dateStr, timeStr, tz, tzOffset, startIso }) {
  const fromIso = parseIsoDate(startIso);
  if (fromIso) return fromIso;

  const normalizedOffset = normalizeTzOffset(tzOffset);
  if (normalizedOffset) {
    const isoCandidate = `${dateStr}T${ensureTimeHasSeconds(timeStr)}${normalizedOffset}`;
    const candidate = parseIsoDate(isoCandidate);
    if (candidate) return candidate;
  }

  const [Y, M, D] = dateStr.split("-").map(Number);
  const [h, m, s] = ensureTimeHasSeconds(timeStr).split(":").map(Number);

  const baseUtc = new Date(Date.UTC(Y, M - 1, D, h, m, s || 0, 0));
  const isoWithTz = Utilities.formatDate(baseUtc, tz, "yyyy-MM-dd'T'HH:mm:ssXXX");
  const viaUtilities = parseIsoDate(isoWithTz);
  if (viaUtilities) return viaUtilities;

  const local = new Date(Y, M - 1, D, h, m, s || 0, 0);
  if (!isNaN(local.getTime())) return local;

  throw new Error("No se pudo interpretar la fecha/hora solicitada.");
}

function resolveEndDateTime({ start, durationMinutes, endIso }) {
  const fromIso = parseIsoDate(endIso);
  if (fromIso) return fromIso;
  const minutes = Number(durationMinutes) || 0;
  return new Date(start.getTime() + minutes * 60000);
}

function ensureTimeHasSeconds(timeStr) {
  const parts = (timeStr || "").split(":").map((p) => p.trim());
  if (parts.length === 2) {
    parts.push("00");
  } else if (parts.length !== 3) {
    throw new Error("timeStr inválido");
  }
  return parts.map((p) => p.padStart(2, "0")).join(":");
}

function normalizeTzOffset(offset) {
  if (typeof offset !== "string") return null;
  const trimmed = offset.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^([+-])(\d{2}):?(\d{2})$/);
  if (!match) return null;
  return `${match[1]}${match[2]}:${match[3]}`;
}

function parseIsoDate(value) {
  if (!value || typeof value !== "string") return null;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
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
  SpreadsheetApp.flush();
  return sh.getLastRow();
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

function sanitize(str) {
  return (str || "").toString().replace(/<[^>]*>/g, "").trim();
}

// --- (El resto de tus funciones de recordatorio, etc. no necesitan cambios) ---

function buildMaintenanceReminderHtml({ clientName, lastDateStr, serviceName }) {
  const whatsLink = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
    `Hola Vanessa 💖 Quiero agendar mi *mantenimiento*. Soy ${clientName}.`
  )}`;

  return `
  <div style="font-family:Arial,sans-serif;color:#333;line-height:1.6">
    <div style="max-width:560px;margin:auto;border:1px solid #f2d7e2;border-radius:12px;overflow:hidden">
      <div style="background:#fef0f5;padding:16px 20px">
        <h2 style="margin:0;color:#d63384">💅 Recordatorio de Mantenimiento</h2>
      </div>
      <div style="padding:20px">
        <p>Hola <b>${clientName}</b>, ¡esperamos que estés disfrutando tus uñas! ✨</p>
        <p>Hoy se cumplen <b>20 días</b> desde tu última visita
          ${lastDateStr ? `(<b>${lastDateStr}</b>)` : ""} ${serviceName ? `para <b>${serviceName}</b>` : ""}.
        </p>

        <div style="background:#fff7fb;border:1px solid #f2d7e2;border-radius:10px;padding:14px;margin:14px 0">
          <p style="margin:0 0 8px 0"><b>Para mantenerlas perfectas:</b></p>
          <ul style="margin:0 0 0 18px;padding:0">
            <li><b>Mantenimiento ideal:</b> cada <b>21 días</b> (máximo <b>30 días</b>, sin excepción).</li>
            <li><b>Beneficios:</b> forma y brillo intactos, menos quiebres/desprendimientos y uñas más saludables.</li>
            <li><b>Bienestar personal:</b> manos siempre prolijas y listas para todo 💖.</li>
          </ul>
        </div>

        <div style="background:#fffaf0;border:1px solid #f2d7e2;border-radius:10px;padding:14px;margin:14px 0">
          <p style="margin:0"><b>Si superas los 30 días:</b> debemos realizar un
            <b>retiro completo</b> de la estructura anterior para evitar <b>acumulación de humedad</b>
            y prevenir <b>posibles hongos</b>. Es por tu salud y seguridad 🙏.</p>
        </div>

        <p style="margin:16px 0 10px">¿Agendamos tu mantención?</p>
        <p>
          <a href="${whatsLink}"
             style="display:inline-block;background:#d63384;color:#fff;padding:10px 16px;border-radius:8px;
                    text-decoration:none;font-weight:bold">Reservar por WhatsApp</a>
        </p>

        <p style="font-size:12px;color:#666;margin-top:18px">
          Gracias por confiar en <b>Vanessa Nails Studio</b> 💅🏻<br>
          Queremos que tus uñas siempre luzcan bellas, impecables y <b>saludables</b>.
        </p>
      </div>
    </div>
  </div>`;
}

function sendMaintenanceReminders() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) return;

  const data = sh.getDataRange().getValues();
  if (data.length <= 1) return;

  const IDX = { NAME: 1, EMAIL: 2, SERVICE: 4, START_LOCAL: 5, EVENT_ID: 9 };
  const lastByEmail = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const email = (row[IDX.EMAIL] || "").toString().trim().toLowerCase();
    if (!email) continue;

    const name = row[IDX.NAME] || "";
    const service = row[IDX.SERVICE] || "";
    const startStr = (row[IDX.START_LOCAL] || "").toString();
    const eventId = row[IDX.EVENT_ID] || "";

    if (!startStr) continue;

    const parts = startStr.split(" ");
    if (parts.length < 2) continue;
    const [d, t] = parts;
    const [Y, M, D] = d.split("-").map(Number);
    const [h, m] = t.split(":").map(Number);
    const startDate = new Date(Y, (M - 1), D, h, m, 0, 0);

    const prev = lastByEmail[email];
    if (!prev || startDate > prev.startDate) {
      lastByEmail[email] = { name, service, startDate, startStr: d, eventId };
    }
  }

  const now = new Date();
  const todayStr = Utilities.formatDate(now, TZ, "yyyy-MM-dd");
  const [tY, tM, tD] = todayStr.split("-").map(Number);
  const today = new Date(tY, tM - 1, tD, 0, 0, 0, 0);

  Object.keys(lastByEmail).forEach(email => {
    const rec = lastByEmail[email];
    const lastDateOnly = new Date(rec.startDate.getFullYear(), rec.startDate.getMonth(), rec.startDate.getDate());
    const diffDays = Math.floor((today - lastDateOnly) / (1000 * 60 * 60 * 24));

    if (diffDays === 20) {
      if (hasReminderLogged(email, rec.startStr, "REMINDER20")) return;

      const html = buildMaintenanceReminderHtml({
        clientName: rec.name || "Bella",
        lastDateStr: Utilities.formatDate(rec.startDate, TZ, "dd/MM/yyyy"),
        serviceName: rec.service || ""
      });

      const subject = "💖 Recordatorio de Mantenimiento — Vanessa Nails Studio";
      try {
        MailApp.sendEmail({ to: email, subject, htmlBody: html });
        if (OWNER_EMAIL) {
          MailApp.sendEmail({ to: OWNER_EMAIL, subject: `Recordatorio enviado (20 días) — ${rec.name} <${email}>`, htmlBody: html });
        }
        logReminderSent(email, rec.startStr, "REMINDER20");
      } catch (err) {
        Logger.log("Error enviando recordatorio a " + email + ": " + err);
      }
    }
  });
}

function hasReminderLogged(email, baseDateStr, type) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName("EmailLog");
  if (!sh) return false;

  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return false;

  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if ((r[1] || "").toString().trim().toLowerCase() === (email || "").trim().toLowerCase() &&
        (r[2] || "") === type &&
        (r[3] || "").toString() === baseDateStr) {
      return true;
    }
  }
  return false;
}

function logReminderSent(email, baseDateStr, type) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName("EmailLog");
  if (!sh) {
    sh = ss.insertSheet("EmailLog");
    sh.appendRow(["Timestamp", "Email", "Type", "BaseDate", "Notes"]);
  }
  sh.appendRow([new Date(), email, type, baseDateStr, "Sent OK"]);
}

function ensureReminderTrigger() {
  Logger.log("ensureReminderTrigger(): no-op (el trigger fue creado manualmente en la UI).");
}
