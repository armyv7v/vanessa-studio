# Spec: Booking API

> Rutas API del frontend Next.js (`/api/*`) y su mapeo a integraciones.
> **Estado: AS-IS.** Última revisión: 2026-06-22.
> ⚠️ 8 de 9 rutas **no tienen auth, CORS ni rate-limit**. Ver `changes/harden-api-routes`.

## Overview

Las rutas `/api/*` del frontend son **mayoritariamente proxies delgados** que reenvían a Apps Script (GAS) o al backend Netlify, con fallbacks hardcoded. Excepción: `available-slots.js` que calcula slots localmente, y `horarios.js` que es la única con un gate de auth (cookie presence).

**Enrutamiento backend (3 estrategias distintas — deuda):**
1. `lib/api.js:101` `shouldUseHostedBackend()` → usa `NEXT_PUBLIC_API_WORKER_URL` si existe y no es localhost.
2. `BookingFlow.js:70-72` → `useHostedBackend = !isLocalHost && API_WORKER_URL`.
3. `BookingFlow.js:279` → `hostname.includes('pages.com')` para el endpoint de horarios.

## Requirements

### Requirement 1: `POST /api/book` — reserva pública
Endpoint principal de creación de reservas.

- **Scenario 1.1:** WHEN llega un POST con `{serviceId, serviceName, durationMin, date, start, extraCupo, client}` THEN valida: email regex, campos requeridos, duración finita, fecha ISO parseable (`pages/api/book.js:3-4,52-66`).
- **Scenario 1.2:** WHEN `NEXT_PUBLIC_API_WORKER_URL` está seteada THEN reenvía todo el body al Worker (líneas 23-35).
- **Scenario 1.3:** ELSE reenvía el payload enriquecido a la Apps Script Web App (`NEXT_PUBLIC_GAS_WEBHOOK_URL` || `GAS_WEBAPP_URL`).
- **Scenario 1.4:** La respuesta incluye `{validationCode, paymentExpiresAt}`.
- **Scenario 1.5:** **Sin auth.** Cualquiera puede POSTear.

### Requirement 2: `POST /api/admin/cita` — reserva admin
Variante admin de booking con flag `adminCreated: true`.

- **Scenario 2.1:** Mismo comportamiento que `/api/book` pero agrega `adminCreated: true` y reenvía a GAS.
- **Scenario 2.2:** ⚠️ **Auth STUBBED OUT** — existe `checkAdminAuth` (`pages/api/admin/cita.js:17-28`) pero está **comentada** (líneas 39-42). Actualmente **wide open**.

### Requirement 3: `GET /api/slots` — slots ocupados de un día
Devuelve intervalos *busy* para que el frontend calcule disponibles.

- **Scenario 3.1:** WHEN llega `?date=YYYY-MM-DD` THEN hace fetch a `https://vanessastudioback.netlify.app/.netlify/functions/api?date=` (URL **hardcodeada**, `pages/api/slots.js:4`).
- **Scenario 3.2:** Responde con `{busy: [...]}`.
- **Scenario 3.3:** WHEN el fetch falla THEN responde `{busy: [], degraded: true}` (silencioso).
- **Scenario 3.4:** **Sin auth.**

### Requirement 4: `GET /api/available-slots` — slots disponibles por rango
Computa slots disponibles localmente para un rango de fechas.

- **Scenario 4.1:** WHEN llega `?startDate=&endDate=` THEN pide busy al backend Netlify y luego ejecuta el cálculo de slots **en esta ruta** (`pages/api/available-slots.js`).
- **Scenario 4.2:** Usa business hours **hardcodeadas 09:00–22:00 todos los días** (líneas 6-16) — entran en conflicto con `calendarConfig.js` y con la config de Netlify.
- **Scenario 4.3:** Aplica test de solapamiento `isSlotBusy`.
- **Scenario 4.4:** Responde `{available: [...]}`.
- **Scenario 4.5:** **Sin auth.**

### Requirement 5: `GET /api/client` — lookup de cliente
Autocompletado de cliente por email.

- **Scenario 5.1:** WHEN llega `?email=` THEN reenvía a GAS `?action=getClient&email=`.
- **Scenario 5.2:** **Sin auth.**

### Requirement 6: `GET /api/gs-check` — health check + config
Endpoint dual: health check o fetch de configuración.

- **Scenario 6.1:** WHEN `?action=getConfig` THEN proxiea a Netlify `/.netlify/functions/horarios`.
- **Scenario 6.2:** ELSE retorna un `DEFAULT_CONFIG` hardcodeado.
- **Scenario 6.3:** **Sin auth.**

### Requirement 7: `GET/POST /api/horarios` — proxy horarios admin
**Única ruta con auth** (aunque sea solo presencia de cookie).

- **Scenario 7.1:** WHEN no existe cookie `admin_token` THEN responde **401** (`pages/api/horarios.js:54-55`).
- **Scenario 7.2:** Es proxie al backend Netlify `/.netlify/functions/horarios` (o `NEXT_PUBLIC_BACKEND_BASE_URL`).
- **Scenario 7.3:** La cookie se valida por **presencia únicamente**, no por firma — forgeable.

### Requirement 8: `POST /api/subscribe-push` — suscripción web-push
Guarda una suscripción de notificaciones push.

- **Scenario 8.1:** WHEN llega `{subscription, email}` THEN reenvía `{action: 'saveSubscription', subscription, email}` a GAS.
- **Scenario 8.2:** ⚠️ **Sin validación** del objeto `subscription` — se reenvía ciegamente.
- **Scenario 8.3:** **Sin auth.**

### Requirement 9: `GET /api/test-config` — debug de secrets
Endpoint de diagnóstico que expone presencia/ausencia de secrets de Google.

- **Scenario 9.1:** WHEN `NODE_ENV === 'production'` THEN responde **403** (`pages/api/test-config.js:8-9`).
- **Scenario 9.2:** ELSE retorna un objeto con `GOOGLE_SHEET_ID`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` enmascarados (presencia/longitud).
- **Scenario 9.3:** ⚠️ Esas 3 variables **nunca se usan** en ningún llamado real a Google APIs en este repo — son vestigiales.

## Mapeo a integraciones (resumen)

| Ruta | Destino real | Servicio |
|---|---|---|
| `POST /api/book` | Worker (si seteado) o GAS `doPost` | Cloudflare / Apps Script |
| `POST /api/admin/cita` | GAS `doPost` (admin flag) | Apps Script |
| `GET /api/slots` | Netlify `api` function | Netlify |
| `GET /api/available-slots` | computa localmente + Netlify busy | (local) + Netlify |
| `GET /api/client` | GAS `?action=getClient` | Apps Script |
| `GET /api/gs-check` | Netlify `horarios` o default | Netlify |
| `GET/POST /api/horarios` | Netlify `horarios` | Netlify |
| `POST /api/subscribe-push` | GAS `?action=saveSubscription` | Apps Script |
| `GET /api/test-config` | (ninguno) | local |

## Referencias de código

- `pages/api/book.js:16,23-35,52-66`
- `pages/api/admin/cita.js:17-28,39-42` (auth comentada)
- `pages/api/slots.js:4` (URL hardcodeada)
- `pages/api/available-slots.js:6-16,85` (hours hardcodeadas)
- `pages/api/horarios.js:53-55` (única auth real)
- `pages/api/test-config.js:7-9`
- `lib/api.js:101` (estrategia de enrutamiento)

## Deuda conocida (ver `changes/`)

- 8/9 rutas sin auth, CORS ni rate-limit → `changes/harden-api-routes`
- `/api/admin/cita.js` auth comentada → `changes/harden-admin-auth`, `harden-api-routes`
- URL Netlify hardcodeada en fallbacks → `changes/consolidate-env-vars`
- 3 estrategias de enrutamiento backend → `changes/consolidate-env-vars`
- `available-slots.js` con hours hardcodeadas que contradicen otras configs → `changes/unify-slot-and-hours-logic`
- `test-config.js` expone diagnósticos de secrets → `changes/harden-api-routes`
