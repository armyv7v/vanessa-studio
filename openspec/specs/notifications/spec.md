# Spec: Notifications

> Canales de notificación del sistema: email, WhatsApp, push.
> **Estado: AS-IS.** Última revisión: 2026-06-22.
> ⚠️ Coexisten **4 proveedores** con responsabilidades solapadas. Ver `changes/refresh-stale-docs`.

## Overview

Las notificaciones se envían desde **3 origenes distintos**:

| Origen | Canal | Proveedor | Cuándo |
|---|---|---|---|
| Backend Netlify | Email | **Brevo** (Sendinblue, `sib-api-v3-sdk`) | Confirmación reserva, pago confirmado, recordatorios fidelidad |
| Backend Netlify | WhatsApp | **Twilio** | Chatbot FAQ inbound + recordatorios de mantenimiento |
| Apps Script | Email | **MailApp** (Google) | Confirmación reserva (legacy) + recordatorio día 20 |
| Frontend Next.js | Push | (web-push, vía GAS) | Suscripción guardada en GAS |

> El frontend **nunca** llama a Brevo ni Twilio directamente — solo renderiza `wa.me/` deep links en emails/UI.

## Requirements

### Requirement 1: Emails transaccionales (Brevo, backend)
Enviados desde el backend Netlify al crear confirmar reservas.

- **Scenario 1.1:** WHEN se crea una reserva THEN se envía email Brevo a clienta + `OWNER_EMAIL` con los detalles.
- **Scenario 1.2:** WHEN se confirma pago THEN se envía email Brevo "pago confirmado".
- **Scenario 1.3:** Credenciales: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` (Netlify env).

### Requirement 2: Emails legacy (MailApp, Apps Script)
Ruta paralela de confirmación vía GAS.

- **Scenario 2.1:** WHEN se reserva por la ruta GAS `doPost` THEN se envía email vía `MailApp.sendEmail` al cliente + owner (`scripts/google-script/src/Code.gs:166-169`).
- **Scenario 2.2:** Existe un trigger manual `sendMaintenanceReminders` (Code.gs:424) que escanea `Reservas`, identifica clientes con exactamente 20 días desde la última visita, envía email y loguea en sheet `EmailLog` para evitar duplicados.

### Requirement 3: WhatsApp (Twilio, backend)
Chatbot inbound + recordatorios outbound.

- **Scenario 3.1:** Existe `whatsapp-webhook.js` que recibe mensajes Twilio inbound y responde con FAQ (`lib/faqs.js`).
- **Scenario 3.2:** `send-whatsapp-reminder.js` envía un recordatorio de mantenimiento individual.
- **Scenario 3.3:** Credenciales: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`.

### Requirement 4: Web Push (suscripción)
Suscripción de notificaciones push del browser.

- **Scenario 4.1:** WHEN el browser se suscribe THEN `POST /api/subscribe-push` reenvía `{action: 'saveSubscription', subscription, email}` a GAS.
- **Scenario 4.2:** ⚠️ El objeto `subscription` **no se valida** antes de reenviarlo.
- **Scenario 4.3:** No hay evidencia en el repo de un endpoint que **envíe** notaciones push (solo persistencia de suscripciones).

### Requirement 5: QR de validación
Generación de imagen QR para códigos de validación.

- **Scenario 5.1:** WHEN se crea una reserva THEN se genera una URL QR vía `api.qrserver.com` (servicio público externo, sin auth).
- **Scenario 5.2:** El QR codifica el `validationCode` y se muestra en `/validar?code=...`.

## Documentación existente (potencialmente stale)

`vanessa-studio-backend/docs/` contiene **6 guías** para **3 providers distintos** de WhatsApp:
- `360dialog-setup.md` — provider 360dialog (no implementado)
- `twilio-setup.md` — provider Twilio (implementado)
- `twilio-whatsapp-produccion.md` — Twilio en producción
- `whatsapp-setup.md` — setup genérico
- `whatsapp-reminders-setup.md` — recordatorios
- `update-chatbot-info.md` — actualización del chatbot

## Referencias de código

- `vanessa-studio-backend/netlify/functions/api.js` — envío Brevo
- `vanessa-studio-backend/netlify/functions/whatsapp-webhook.js` — Twilio inbound
- `vanessa-studio-backend/netlify/functions/send-whatsapp-reminder.js` — Twilio outbound
- `vanessa-studio-backend/netlify/functions/loyalty-reminders.js` — recordatorios Brevo
- `scripts/google-script/src/Code.gs:166-169,424` — MailApp
- `pages/api/subscribe-push.js:7` — proxy suscripción
- `vanessa-studio-backend/lib/faqs.js` — base de conocimiento del chatbot

## Deuda conocida (ver `changes/`)

- `@sendgrid/mail` en `package.json` del frontend pero **sin ningún import** → `changes/remove-dead-dependencies`
- 6 docs WhatsApp para 3 providers (solo Twilio implementado) → `changes/refresh-stale-docs`
- Doble ruta de email (Brevo vs MailApp/GAS) → `changes/formalize-backend-submodule`
- `subscribe-push` sin validación → `changes/harden-api-routes`
- `api.qrserver.com` como dependencia externa sin fallback → fuera de alcance de esta auditoría
