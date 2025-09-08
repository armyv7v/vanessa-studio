/** Code.gs — Web App para reservas
 *  Requisitos:
 *   - Activar “Google Calendar API” como Servicio Avanzado (Apps Script)
 *   - Activar “Google Calendar API” en Google Cloud del proyecto
 *   - Zona horaria del proyecto: America/Santiago
 */

/** =========================
 * CONFIG
 * ======================== */
const CALENDAR_ID = '64693698ebab23975e6f5d11f9f3b170a6d11b9a19ebb459e1486314ee930ebf@group.calendar.google.com'; // calendario secundario
const TZ          = 'America/Santiago';
const SHEET_ID    = '1aE4dnWZQjEJWAMaDEfDRpACVUDU8_F9-fzd_2mSQQeM'; // <-- tu Sheet ID
const SHEET_NAME  = 'Reservas';
const OWNER_EMAIL = 'nailsvanessacl@gmail.com';                      // copia/alertas
const WHATSAPP_LINK = 'https://wa.me/5699144464?text=Hola%20Vanessa,%20te%20env%C3%ADo%20el%20comprobante%20de%20mi%20reserva%20%F0%9F%92%85%F0%9F%92%97';

/** =========================
 * Mapa de Servicios (debe calzar con el front)
 * ======================== */
const SERVICE_MAP = {
  '1': { name: 'Retoque (Mantenimiento)', duration: 120 },
  '2': { name: 'Reconstrucción Uñas Mordidas (Onicofagía)', duration: 180 },
  '3': { name: 'Uñas Acrílicas', duration: 180 },
  '4': { name: 'Uñas Polygel', duration: 180 },
  '5': { name: 'Uñas Softgel', duration: 180 },
  '6': { name: 'Kapping o Baño Polygel o Acrílico sobre uña natural', duration: 150 },
  '7': { name: 'Reforzamiento Nivelación Rubber', duration: 150 },
  '8': { name: 'Esmaltado Permanente', duration: 90 }
};

/** =========================
 * Utils
 * ======================== */

/** RFC3339 con zona horaria explícita para Calendar API */
function buildRfc3339(dateStr, timeStr, minutesToAdd) {
  if (!dateStr || !timeStr) throw new Error('Fecha u hora vacías');
  var d = dateStr.split('-').map(Number);
  var t = timeStr.split(':').map(Number);
  if (d.length !== 3 || t.length < 2) throw new Error('Formato de fecha/hora inválido');

  var start = new Date(d[0], d[1] - 1, d[2], t[0], t[1], 0, 0); // interpretado en TZ del proyecto
  var end   = new Date(start.getTime() + minutesToAdd * 60000);

  var startStr = Utilities.formatDate(start, TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
  var endStr   = Utilities.formatDate(end,   TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
  return { start, end, startStr, endStr };
}

/** Verifica conflicto exacto con Calendar API avanzada */
function hasConflict(calendarId, startIso, endIso) {
  var resp = Calendar.Events.list(calendarId, {
    timeMin: startIso,
    timeMax: endIso,
    singleEvents: true,
    orderBy: 'startTime',
    showDeleted: false,
    maxResults: 1
  });
  var items = (resp && resp.items) || [];
  return items.length > 0;
}

/** Google Sheets: agrega fila */
function appendToSheet(row) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  sh.appendRow(row);
}

/** Inserción mínima (robusta) al Calendar */
function insertMinimalEvent(calendarId, summary, description, startStr, endStr) {
  var evt = Calendar.Events.insert({
    summary,
    description,
    start: { dateTime: startStr, timeZone: TZ },
    end:   { dateTime: endStr,   timeZone: TZ }
  }, calendarId);
  return evt;
}

/** Si quieres usar asistentes + Meet (activar solo si minimal funciona perfecto) */
function insertFullEvent(calendarId, summary, description, startStr, endStr, attendeesEmails) {
  var evt = Calendar.Events.insert({
    summary,
    description,
    start: { dateTime: startStr, timeZone: TZ },
    end:   { dateTime: endStr,   timeZone: TZ },
    attendees: (attendeesEmails || []).map(function (e) { return { email: e }; }),
    conferenceData: {
      createRequest: {
        requestId: Utilities.getUuid(),
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    }
  }, calendarId, { conferenceDataVersion: 1 /* , sendUpdates: 'all' */ });
  return evt;
}

/** Email HTML (normal) */
function htmlEmailNormal(params) {
  var { clientName, clientEmail, phone, serviceName, startLocal, endLocal, eventHtmlLink } = params;
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#222;">
    <div style="max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(90deg,#ec4899,#8b5cf6);padding:20px;color:white;">
        <h2 style="margin:0;">¡Cita confirmada! 💅</h2>
        <p style="margin:6px 0 0 0;">Vanessa Nails Studio</p>
      </div>
      <div style="padding:20px;">
        <p>Hola <b>${clientName}</b>,</p>
        <p>Tu cita ha sido registrada con éxito. Aquí tienes el detalle:</p>

        <table style="width:100%;border-collapse:separate;border-spacing:0 8px;">
          <tr><td style="width:160px;color:#666;">Servicio</td><td><b>${serviceName}</b></td></tr>
          <tr><td style="color:#666;">Fecha y hora</td><td><b>${startLocal}</b> – <b>${endLocal}</b></td></tr>
          <tr><td style="color:#666;">Contacto</td><td>${phone ? phone : '-'}</td></tr>
          ${eventHtmlLink ? `<tr><td style="color:#666;">Evento</td><td><a href="${eventHtmlLink}" target="_blank">Ver en Google Calendar</a></td></tr>` : ``}
        </table>

        <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />

        <h3 style="margin-top:0;">Confirmación de hora ✅</h3>
        <p>Para apartar tu horita debes enviar una reserva de <b>$5.000</b>, la cual se descuenta del valor total del servicio.</p>
        <p><b>Datos de depósito:</b></p>
        <ul>
          <li>VANESSA MORALES — Cuenta RUT — 27.774.310-8 — Banco Estado</li>
          <li>VANESSA MORALES — Cuenta Corriente — 12700182876 — Banco Estado</li>
        </ul>
        <p>💖 Se agradece enviar el comprobante de pago por WhatsApp:</p>
        <p><a href="${WHATSAPP_LINK}" target="_blank" style="display:inline-block;background:#25D366;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;">Enviar comprobante por WhatsApp</a></p>

        <h3>Política de reserva</h3>
        <ul>
          <li>Si falta a su hora, no se realiza devolución de la reserva.</li>
          <li>Para reagendar usando el mismo abono, debe notificar al menos 24 horas antes de su cita.</li>
          <li>“Texto en formato lista a incluir en próximas versiones”.</li>
        </ul>

        <p style="margin-top:24px;">Gracias por tu preferencia ❤️<br/>Vanessa Nails Studio</p>
      </div>
    </div>
  </div>
  `;
}

/** Email HTML (extra cupo: incluye recargo) */
function htmlEmailExtra(params) {
  var { clientName, clientEmail, phone, serviceName, startLocal, endLocal, eventHtmlLink } = params;
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#222;">
    <div style="max-width:600px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(90deg,#fb7185,#f59e0b);padding:20px;color:white;">
        <h2 style="margin:0;">¡Cita extra cupo confirmada! ✨</h2>
        <p style="margin:6px 0 0 0;">Vanessa Nails Studio</p>
      </div>
      <div style="padding:20px;">
        <p>Hola <b>${clientName}</b>,</p>
        <p>Tu cita en horario <b>extra cupo</b> ha sido registrada con éxito. Detalle:</p>

        <table style="width:100%;border-collapse:separate;border-spacing:0 8px;">
          <tr><td style="width:160px;color:#666;">Servicio</td><td><b>${serviceName}</b></td></tr>
          <tr><td style="color:#666;">Fecha y hora</td><td><b>${startLocal}</b> – <b>${endLocal}</b></td></tr>
          <tr><td style="color:#666;">Contacto</td><td>${phone ? phone : '-'}</td></tr>
          ${eventHtmlLink ? `<tr><td style="color:#666;">Evento</td><td><a href="${eventHtmlLink}" target="_blank">Ver en Google Calendar</a></td></tr>` : ``}
        </table>

        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px;margin:16px 0;">
          <b>Importante:</b> Las reservas en horario extra cupo tienen un <b>recargo fijo de $5.000</b>, independiente del servicio.
        </div>

        <h3 style="margin-top:0;">Confirmación de hora ✅</h3>
        <p>Para apartar tu horita debes enviar una reserva de <b>$5.000</b>, la cual se descuenta del valor total del servicio. (El recargo extra cupo se suma al total).</p>
        <p><b>Datos de depósito:</b></p>
        <ul>
          <li>VANESSA MORALES — Cuenta RUT — 27.774.310-8 — Banco Estado</li>
          <li>VANESSA MORALES — Cuenta Corriente — 12700182876 — Banco Estado</li>
        </ul>
        <p>💖 Se agradece enviar el comprobante de pago por WhatsApp:</p>
        <p><a href="${WHATSAPP_LINK}" target="_blank" style="display:inline-block;background:#25D366;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;">Enviar comprobante por WhatsApp</a></p>

        <h3>Política de reserva</h3>
        <ul>
          <li>Si falta a su hora, no se realiza devolución de la reserva.</li>
          <li>Para reagendar usando el mismo abono, debe notificar al menos 24 horas antes de su cita.</li>
          <li>“Texto en formato lista a incluir en próximas versiones”.</li>
        </ul>

        <p style="margin-top:24px;">Gracias por tu preferencia ❤️<br/>Vanessa Nails Studio</p>
      </div>
    </div>
  </div>
  `;
}

/** Envío de emails (elige plantilla según includeExtra) + notificación al dueño */
function sendEmailsHTML({ clientName, clientEmail, phone, serviceName, startLocal, endLocal, eventHtmlLink, includeExtra }) {
  var htmlClient = includeExtra
    ? htmlEmailExtra({ clientName, clientEmail, phone, serviceName, startLocal, endLocal, eventHtmlLink })
    : htmlEmailNormal({ clientName, clientEmail, phone, serviceName, startLocal, endLocal, eventHtmlLink });

  var subjectClient = includeExtra
    ? `Confirmación de cita EXTRA CUPO - ${serviceName}`
    : `Confirmación de cita - ${serviceName}`;

  MailApp.sendEmail({
    to: clientEmail,
    subject: subjectClient,
    htmlBody: htmlClient
  });

  var subjectOwner = (includeExtra ? '[EXTRA CUPO] ' : '') + `Nueva cita reservada - ${serviceName}`;
  var htmlOwner = `
    <p>Nueva reserva ${includeExtra ? '<b>(extra cupo)</b>' : ''}:</p>
    <ul>
      <li>Cliente: <b>${clientName}</b> (${clientEmail})</li>
      <li>Teléfono: ${phone || '-'}</li>
      <li>Servicio: ${serviceName}</li>
      <li>Fecha/Hora: ${startLocal} – ${endLocal}</li>
      ${eventHtmlLink ? `<li>Evento: <a href="${eventHtmlLink}" target="_blank">${eventHtmlLink}</a></li>` : ''}
    </ul>
  `;
  MailApp.sendEmail({ to: OWNER_EMAIL, subject: subjectOwner, htmlBody: htmlOwner });
}

/** =========================
 * Endpoint Web App (POST)
 * ======================== */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Solicitud vacía' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents || '{}');

    var nombre     = data.nombre || '';
    var email      = data.email || '';
    var telefono   = data.telefono || '';
    var fecha      = data.fecha;      // YYYY-MM-DD
    var hora       = (data.hora || '').toString().slice(0,5); // HH:mm
    var serviceId  = String(data.serviceId || '');
    var includeExtra = Boolean(data.includeExtra);
    var servicio   = data.servicio || (SERVICE_MAP[serviceId] ? SERVICE_MAP[serviceId].name : 'Servicio');
    var duration   = Number(data.durationMin || (SERVICE_MAP[serviceId] ? SERVICE_MAP[serviceId].duration : 60));

    if (!nombre || !email || !fecha || !hora || !serviceId) {
      return ContentService.createTextOutput(JSON.stringify({ success:false, error:'Campos obligatorios faltantes' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      return ContentService.createTextOutput(JSON.stringify({ success:false, error:'Duración inválida' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Construye ventana con TZ correcta
    var win = buildRfc3339(fecha, hora, duration);

    // Chequea conflicto
    if (hasConflict(CALENDAR_ID, win.startStr, win.endStr)) {
      return ContentService.createTextOutput(JSON.stringify({ success:false, error:'Horario no disponible (conflicto)' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Inserta evento (mínimo para evitar 400)
    var summary = 'Cita: ' + servicio + ' con ' + nombre + (includeExtra ? ' [EXTRA CUPO]' : '');
    var desc = 'Cliente: ' + nombre
      + '\nEmail: ' + email
      + '\nTeléfono: ' + telefono
      + '\nServicio: ' + servicio
      + '\nDuración: ' + duration + ' min'
      + (includeExtra ? '\nTipo: EXTRA CUPO (recargo $5.000)' : '');

    var event;
    try {
      event = insertMinimalEvent(CALENDAR_ID, summary, desc, win.startStr, win.endStr);
    } catch (errMin) {
      throw new Error('Calendar insert (minimal) falló: ' + errMin);
      // Si necesitas reintentar con full:
      // event = insertFullEvent(CALENDAR_ID, summary, desc, win.startStr, win.endStr, [email, OWNER_EMAIL]);
    }

    // Registro en Sheets
    var startLocal = Utilities.formatDate(win.start, TZ, 'yyyy-MM-dd HH:mm');
    var endLocal   = Utilities.formatDate(win.end,   TZ, 'yyyy-MM-dd HH:mm');
    appendToSheet([
      new Date(), nombre, email, telefono,
      servicio + (includeExtra ? ' [EXTRA CUPO]' : ''),
      startLocal, endLocal, duration,
      event.htmlLink || '', includeExtra ? 'EXTRA' : 'NORMAL'
    ]);

    // Emails
    sendEmailsHTML({
      clientName: nombre,
      clientEmail: email,
      phone: telefono,
      serviceName: servicio,
      startLocal, endLocal,
      eventHtmlLink: event.htmlLink || '',
      includeExtra
    });

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      eventId: event.id,
      htmlLink: event.htmlLink || '',
      includeExtra: includeExtra
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success:false, error:String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
