# Proposal: Harden API Routes

> **Severidad: HIGH**
> Tipo: security
> Specs afectadas: `booking-api`, `payments-loyalty`

## Why

**8 de 9** rutas `/api/*` del frontend **no tienen auth, CORS ni rate-limit**. Esto permite:
- Abuso del endpoint de booking (reservas spam, ocupando slots reales del Calendar).
- Scraping de datos de clientes vía `/api/client`.
- Inyección de suscripciones push arbitrarias vía `/api/subscribe-push`.
- Enumeración de configuración vía `/api/gs-check` y `/api/test-config`.

En el backend Netlify, además:
- El PIN default `2308` está hardcoded en 3 lugares (`api.js:799,882,1009`).
- Las respuestas de auth fallida **filtran información**: objeto `debug` con prefijos de token, conteos y diagnósticos de env (`api.js:808-819`).
- CORS `*` en todas las functions.

## What Changes

### Frontend (`/api/*`)
1. **Rate limiting** en `/api/book` y `/api/admin/cita` (anti-abuso):
   - Simple: token bucket in-memory (suficiente para Vercel serverless single-instance por cold start) o vía Upstash Redis si se quiere distribuido.
   - Límite sugerido: 5 reservas/IP/hora.
2. **Validación de `subscribe-push`**: esquema mínimo del objeto `subscription` (debe tener `endpoint`, `keys.auth`, `keys.p256dh`).
3. **`test-config.js`**: ya está gateado a non-prod por `NODE_ENV`, pero **removerlo del todo** o moverlo a un script CLI. No aporta en producción.
4. **CORS estricto** para rutas admin: solo el dominio del frontend.
5. **Auth en `/api/admin/cita.js`** (ver `harden-admin-auth`).

### Backend Netlify
6. **PIN default sin fallback.** Si `ADMIN_VALIDATION_PIN` no está seteada → error en arranque, no `2308` como default.
7. **Quitar `debug` de respuestas de auth fallida.** Reemplazar por mensaje genérico `"Unauthorized"`.
8. **CORS restrictivo:** solo `FRONTEND_URL` (ya existe la var).
9. **Validación de input** en el mega-function `api.js` (regex de email, longitud de campos, tipos).

### Apps Script (GAS)
10. **`appsscript.json`**: cambiar `executeAs: ANYONE_ANONYMOUS` a `USER_DEPLOYING` + restringir acceso al dominio o test用户提供. (Coordinado con `formalize-backend-submodule` — idealmente deprecate GAS para booking.)

## Impacto

- **Rate limiting** puede bloquear abuso sin afectar uso legítimo.
- **Quitar `debug`** mejora postura de seguridad sin romper nada para usuarios válidos.
- **CORS estricto** puede romper integraciones no documentadas — auditar primero qué orígenes llaman a las functions.
- **Cambiar `appsscript.json`** afecta quién puede invocar el Web App — coordinar con Vanessa.

## Evidencia

- `pages/api/book.js` — sin auth, sin rate-limit
- `pages/api/admin/cita.js:39-42` — auth comentada
- `pages/api/subscribe-push.js:7` — sin validación
- `pages/api/test-config.js:8-9` — gateado por NODE_ENV pero igual expone presencia de secrets
- `scripts/google-script/src/appsscript.json:13-16` — `ANYONE_ANONYMOUS`
- `vanessa-studio-backend/netlify/functions/api.js:799,882,1009` — PIN default `2308`
- `vanessa-studio-backend/netlify/functions/api.js:808-819` — objeto `debug` en respuesta auth fallida
- CORS `*` en todas las Netlify functions (búsqueda `Access-Control-Allow-Origin`)

## Related

- Coordina con `harden-admin-auth` (auth de `/api/admin/cita.js`).
- Coordina con `harden-secrets-and-gitignore` (rotación de PIN).
- Coordina con `formalize-backend-submodule` (CORS y auth del Netlify backend).
