# Spec: Booking API

> Rutas API del frontend Next.js (`/api/*`) y su mapeo a integraciones.
> **Estado: AS-IS.** Ultima revision: 2026-06-28.

## Overview

Las rutas `/api/*` del frontend son proxies hacia Apps Script (GAS), Netlify Functions o calculos locales. El hardening inicial ya protege las rutas admin principales y agrega rate limit/validacion a los endpoints mas sensibles, pero todavia queda deuda en CORS, Netlify backend y consolidacion de rutas legacy.

## Requirements

### Requirement 1: `POST /api/book` — reserva publica
Endpoint principal de creacion de reservas.

- **Scenario 1.1:** WHEN llega un POST THEN aplica rate limit in-memory de 5 POSTs/IP/hora.
- **Scenario 1.2:** WHEN el limite se excede THEN responde `429` con `Retry-After`, `X-RateLimit-Limit` y `X-RateLimit-Remaining`.
- **Scenario 1.3:** WHEN llega `{serviceId, serviceName, durationMin, date, start, extraCupo, client}` THEN valida campos requeridos, email, duracion finita y fecha/hora parseable.
- **Scenario 1.4:** WHEN `NEXT_PUBLIC_API_WORKER_URL` esta seteada THEN reenvia el body al backend configurado.
- **Scenario 1.5:** ELSE reenvia el payload enriquecido a Apps Script (`NEXT_PUBLIC_GAS_WEBHOOK_URL` || `GAS_WEBAPP_URL`).
- **Scenario 1.6:** Sigue siendo publico; no requiere sesion admin.

### Requirement 2: `POST /api/admin/cita` — reserva admin
Variante admin de booking con flag `adminCreated: true`.

- **Scenario 2.1:** WHEN el request trae `Origin` no permitido THEN responde `403`.
- **Scenario 2.2:** WHEN falta o es invalida la cookie `admin_session` THEN responde `401`.
- **Scenario 2.3:** WHEN la sesion admin es valida THEN aplica rate limit in-memory de 5 POSTs/IP/hora.
- **Scenario 2.4:** WHEN el limite se excede THEN responde `429`.
- **Scenario 2.5:** WHEN el payload es valido THEN reenvia a GAS con `adminCreated: true`.

### Requirement 3: `GET /api/slots` — slots ocupados de un dia
Devuelve intervalos `busy` para que el frontend calcule disponibles.

- **Scenario 3.1:** WHEN llega `?date=YYYY-MM-DD` THEN hace fetch al backend Netlify.
- **Scenario 3.2:** Responde con `{busy: [...]}`.
- **Scenario 3.3:** WHEN el fetch falla THEN responde `{busy: [], degraded: true}`.
- **Scenario 3.4:** Sigue sin auth.

### Requirement 4: `GET /api/available-slots` — slots disponibles por rango
Computa slots disponibles localmente para un rango de fechas.

- **Scenario 4.1:** WHEN llega `?startDate=&endDate=` THEN pide busy al backend Netlify y calcula slots localmente.
- **Scenario 4.2:** Usa business hours hardcodeadas; pendiente de `unify-slot-and-hours-logic`.
- **Scenario 4.3:** Responde `{available: [...]}`.

### Requirement 5: `GET /api/client` — lookup de cliente
Autocompletado de cliente por email.

- **Scenario 5.1:** WHEN llega `?email=` THEN reenvia a GAS `?action=getClient&email=`.
- **Scenario 5.2:** Sigue sin auth; pendiente de revisar exposicion de datos.

### Requirement 6: `GET /api/gs-check` — health check + config
Endpoint dual: health check o fetch de configuracion.

- **Scenario 6.1:** WHEN `?action=getConfig` THEN proxiea a Netlify `/.netlify/functions/horarios`.
- **Scenario 6.2:** ELSE retorna un `DEFAULT_CONFIG` hardcodeado.
- **Scenario 6.3:** Sigue sin auth; pendiente de consolidar con `/api/horarios`.

### Requirement 7: `GET/POST /api/horarios` — proxy horarios admin
Proxy protegido para configuracion de horarios.

- **Scenario 7.1:** WHEN el request trae `Origin` no permitido THEN responde `403`.
- **Scenario 7.2:** WHEN no existe cookie `admin_session` valida THEN responde `401`.
- **Scenario 7.3:** WHEN la sesion es valida THEN proxiea al backend Netlify `/.netlify/functions/horarios`.
- **Scenario 7.4:** WHEN GET falla contra backend remoto THEN responde fallback local degradado.

### Requirement 7.5: CORS admin local
Las rutas `/api/admin/*` y `/api/horarios` usan allowlist de origen.

- **Scenario 7.5.1:** WHEN `OPTIONS` llega desde un origen permitido THEN responde `204` con headers CORS.
- **Scenario 7.5.2:** WHEN `OPTIONS` llega desde un origen no permitido THEN responde `403`.
- **Scenario 7.5.3:** Los origenes permitidos por defecto son `https://vanessa-studio.vercel.app`, `http://localhost:3000` y `http://127.0.0.1:3000`; se puede ampliar con `ADMIN_ALLOWED_ORIGINS`.

### Requirement 8: `POST /api/subscribe-push` — suscripcion web-push
Guarda una suscripcion de notificaciones push.

- **Scenario 8.1:** WHEN llega un POST THEN valida que `subscription.endpoint` sea URL `https:`.
- **Scenario 8.2:** Valida que `subscription.keys.auth` y `subscription.keys.p256dh` existan y tengan longitud razonable.
- **Scenario 8.3:** WHEN `email` viene presente THEN valida formato de email.
- **Scenario 8.4:** WHEN la entrada es invalida THEN responde `400`.
- **Scenario 8.5:** WHEN la entrada es valida THEN reenvia `{action: 'saveSubscription', subscription, email}` a GAS.

### Requirement 9: `/api/test-config` removido
El endpoint HTTP de diagnostico de secrets fue eliminado.

- **Scenario 9.1:** WHEN se llama `/api/test-config` THEN Next.js debe responder `404`.
- **Scenario 9.2:** Si se necesita diagnostico de entorno, debe implementarse como script CLI no expuesto por HTTP.

## Mapeo a integraciones

| Ruta | Destino real | Servicio |
|---|---|---|
| `POST /api/book` | Backend configurado o GAS `doPost` | Netlify/legacy Worker/GAS |
| `POST /api/admin/cita` | GAS `doPost` con `adminCreated` | Apps Script |
| `GET /api/slots` | Netlify `api` function | Netlify |
| `GET /api/available-slots` | calculo local + Netlify busy | Local + Netlify |
| `GET /api/client` | GAS `?action=getClient` | Apps Script |
| `GET /api/gs-check` | Netlify `horarios` o default | Netlify |
| `GET/POST /api/horarios` | Netlify `horarios` | Netlify |
| `POST /api/subscribe-push` | GAS `?action=saveSubscription` | Apps Script |

## Deuda conocida

- Las rutas admin locales (`/api/admin/*`, `/api/horarios`) ya usan CORS por allowlist dinamica; falta decidir si rutas publicas deben restringirse igual.
- Backend Netlify: las mutaciones admin ya no aceptan `deviceToken`, `ADMIN_VALIDATION_PIN` es obligatorio y las respuestas 401 ya no devuelven `debug` sensible.
- Backend Netlify: booking POST valida nombre, email, telefono, servicio, fecha, hora y duracion antes de crear Calendar/Sheet.
- Backend Netlify: validacion/confirmacion de citas valida `code` con el formato real actual (`8 hex` o fallback `VAL-...`) antes de buscar en Sheets.
- Backend Netlify: `api.js` y `horarios.js` usan CORS por allowlist dinamica; origenes no permitidos reciben `403`.
- Webhooks/funciones de mensajeria (`whatsapp-webhook.js`, `send-whatsapp-reminder.js`) conservan CORS separado para no romper integraciones externas; requieren revision especifica aparte.
- `/api/available-slots` mantiene horarios hardcodeados.
- `/api/client` y `/api/gs-check` siguen publicos.
- Persisten varias estrategias de enrutamiento backend.
