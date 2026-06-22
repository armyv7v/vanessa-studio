# Spec: Payments & Loyalty

> Lifecycle de pago de reservas + programa de fidelidad por sellos.
> **Estado: AS-IS.** Última revisión: 2026-06-22.
> Toda esta lógica vive en el **backend Netlify** (`vanessa-studio-backend/netlify/functions/api.js` y `lib/reservation-payments.js`).

## Overview

Cada reserva nace en estado `PENDIENTE_PAGO` con un depósito de **$10.000** y un plazo de **24 horas** para pagarlo. Si no se confirma a tiempo, un job programado libera la reserva (borra el evento de Calendar y marca la fila `EXPIRADA`). Al validar asistencia presencial, se otorga un sello de fidelidad; 6 sellos = recompensa, >30 días sin visita = penalidad.

## Requirements

### Requirement 1: Estado inicial de una reserva
Toda reserva creada arranca en `PENDIENTE_PAGO` con deadline calculado.

- **Scenario 1.1:** WHEN se crea una reserva vía booking THEN se inserta fila en sheet `Reservas` con `paymentStatus=PENDIENTE_PAGO` y `paymentExpiresAt = now + 24h`.
- **Scenario 1.2:** Se genera un `validationCode` (md5 hash) y una URL de QR (vía `api.qrserver.com` pública).
- **Scenario 1.3:** Se envía email de confirmación (Brevo) a clienta + `OWNER_EMAIL`.
- **Scenario 1.4:** Se simula el update de la tarjeta de fidelidad (no se persiste aún).

### Requirement 2: Confirmación de pago (acción admin)
El admin confirma el depósito recibido.

- **Scenario 2.1:** WHEN el admin confirma pago THEN se setea `paymentStatus=GAGO_CONFIRMADO` y `paymentConfirmedAt`.
- **Scenario 2.2:** Si la reserva había expirado (evento Calendar borrado), se **recrea** el evento antes de confirmar.
- **Scenario 2.3:** Se envía email Brevo de "pago confirmado".
- **Scenario 2.4:** Requiere device token OR PIN admin (`ADMIN_VALIDATION_PIN`, default `2308`).

### Requirement 3: Expiración automática (job programado)
Reservas no pagadas en 24h se liberan automáticamente.

- **Scenario 3.1:** Existe un job **scheduled cada 15 min** (`netlify.toml:8-9`): `expire-pending-payments`.
- **Scenario 3.2:** WHEN una reserva tiene `paymentStatus=PENDIENTE_PAGO` y `paymentExpiresAt < now` THEN se **borra** el evento de Calendar, se setea `paymentStatus=EXPIRADA`, `releasedAt`, `releaseReason=NO_PAYMENT_24H`.
- **Scenario 3.3:** El mismo efecto puede dispararse manualmente vía POST `/expire-pending-payments`.

### Requirement 4: Validación de asistencia (acción admin, en sitio)
Cuando la clienta asiste a su cita, el admin valida presencialmente.

- **Scenario 4.1:** La clienta accede a `/validar?code=<validationCode>` (`pages/validar.js`) y ve su reserva + tarjeta de fidelidad + QR.
- **Scenario 4.2:** El admin ingresa un **PIN de 4 dígitos** y se hace POST `/validate-attendance` con el código.
- **Scenario 4.3:** Solo se permite validar reservas con `paymentStatus=CONFIRMED`.
- **Scenario 4.4:** WHEN se valida THEN se setea `attended=SI`, `validatedAt`, y se **actualiza** (real) la tarjeta de fidelidad (suma un sello).

### Requirement 5: Programa de fidelidad
Modelo de sellos en sheet `TarjetasFidelidad`.

- **Scenario 5.1:** Schema (8 cols): `email, name, stamps(0-6), lastApptDate, deadlineDate, rewardAvailable(SI/NO), inPenalty(SI/NO), history`.
- **Scenario 5.2:** WHEN la clienta acumula 6 sellos THEN `rewardAvailable=SI`.
- **Scenario 5.3:** WHEN pasan más de 30 días desde `lastApptDate` THEN `inPenalty=SI` (no acumula/usa sellos).
- **Scenario 5.4:** Los sellos solo se persisten al validar asistencia, no al reservar.

### Requirement 6: Recordatorios de fidelidad
Recordatorios de mantenimiento por email.

- **Scenario 6.1:** Existe un job `loyalty-reminders` (día 20 y día 25 desde última visita) que envía email por Brevo.

## Referencias de código

- `vanessa-studio-backend/netlify/functions/api.js:799,882,1009` — PIN default `2308`
- `vanessa-studio-backend/netlify/functions/lib/reservation-payments.js` — lógica de pago
- `vanessa-studio-backend/netlify/functions/expire-pending-payments.js` — job scheduled
- `vanessa-studio-backend/netlify/functions/loyalty-reminders.js` — recordatorios
- `pages/validar.js:67` — vista pública de validación
- `scripts/google-script/src/Code.gs:424` — recordatorios legacy por MailApp (GAS)

## Deuda conocida (ver `changes/`)

- PIN default `2308` hardcoded en 3 lugares → `changes/harden-api-routes`
- Respuesta de auth fallida expone `debug` con prefijos de token y conteos → `changes/harden-api-routes`
- La ruta legacy GAS `doPost` escribe solo 11 columnas (sin paymentStatus) → `changes/formalize-backend-submodule`
- Schema de fidelidad sin tests → fuera de alcance de esta auditoría
