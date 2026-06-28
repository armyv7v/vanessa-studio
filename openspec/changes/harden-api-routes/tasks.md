# Tasks: Harden API Routes

## Frontend (`/api/*`)

### 1. Rate limiting en booking
- [x] Elegir estrategia: in-memory token bucket inicial (simple, sin dependencias extra).
- [x] Implementar en `/api/book.js` y `/api/admin/cita.js`: 5 POSTs/IP/hora -> 429 si excede.
- [x] Headers de respuesta: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`.
- [ ] Evaluar Upstash Redis si el trafico o abuso real supera una sola instancia serverless.

### 2. Validacion de `subscribe-push`
- [x] En `pages/api/subscribe-push.js`: validar que `subscription.endpoint` es URL.
- [x] Validar que `subscription.keys.auth` y `subscription.keys.p256dh` existen y tienen longitud razonable.
- [x] Validar email opcional si se envia.
- [x] Rechazar con 400 si no valida.

### 3. Eliminar `test-config.js`
- [x] Eliminar `pages/api/test-config.js`.
- [ ] Si se necesita diagnostico de env, crear `scripts/check-env.js` (CLI, no expuesto via HTTP).

### 4. CORS estricto
- [x] Crear helper `lib/cors.js` con allowlist: `https://vanessa-studio.vercel.app`, `http://localhost:3000`, `http://127.0.0.1:3000`, `FRONTEND_URL`, `NEXT_PUBLIC_SITE_URL`, `VERCEL_URL` y `ADMIN_ALLOWED_ORIGINS`.
- [x] Aplicar a rutas admin (`/api/admin/*`, `/api/horarios`).
- [ ] Rutas publicas (`/api/book`, `/api/slots`, etc.) pueden mantener CORS por defecto o restringirse segun necesidad real.

## Backend Netlify

### 5. PIN sin default
- [x] En `api.js`: cambiar `ADMIN_VALIDATION_PIN || 2308` por `ADMIN_VALIDATION_PIN` obligatorio + error si falta.
- [ ] Asegurar que `ADMIN_VALIDATION_PIN` este seteada en Netlify antes de deploy.

### 6. Quitar `debug` de respuestas auth fallida
- [x] Buscar respuestas 401 de mutaciones admin que incluian `debug`.
- [x] Reemplazar por `{error: 'Unauthorized'}` sin metadata.
- [x] Eliminar diagnostico sensible de device token; mantener logs no sensibles existentes.

### 7. CORS restrictivo en Netlify
- [ ] Auditar/definir `FRONTEND_URL` en Netlify env antes de deploy.
- [x] Reemplazar `Access-Control-Allow-Origin: *` por allowlist dinamica en `api.js` y `horarios.js`.
- [x] Mantener `*` fuera de este slice para `whatsapp-webhook.js` y `send-whatsapp-reminder.js` por integraciones externas; revisar seguridad especifica aparte.

### 8. Validacion de input en `api.js`
- [x] En booking POST: validar email, longitud de nombre, telefono, servicio, fecha, hora y duracion.
- [x] En `validate-attendance` y `confirm-payment`: validar `code` con formato real actual (8 hex o fallback `VAL-...`).
- [x] Normalizar inputs antes de escribir al Sheet: nombre/email/telefono/servicio/fecha/hora/duracion.

## Apps Script

### 9. Restringir acceso GAS
- [ ] Evaluar `scripts/google-script/src/appsscript.json` antes de cambiar acceso; el frontend/backend todavia puede depender del Web App anonimo.
- [ ] Coordinar con `formalize-backend-submodule` y deprecacion de GAS para booking.
- [ ] `npm run gs:push` solo con confirmacion explicita.

## 10. Dependencias y auditoria
- [x] Ejecutar `npm audit --audit-level=moderate`.
- [x] Actualizar `next` y `eslint-config-next` de `14.2.5` a `14.2.35` para quitar vulnerabilidades criticas sin saltar a una major breaking.
- [x] Ejecutar `npm audit fix` no-breaking para reducir vulnerabilidades transitivas.
- [ ] Resolver vulnerabilidades altas restantes que requieren cambios breaking (`next@16`, `eslint-config-next@16`) en un slice separado.

## 11. Pruebas
- [x] Spam de POSTs a `/api/book` desde misma IP -> el 6to recibe 429 (`next dev`, HTTP local).
- [x] POST a `/api/subscribe-push` con `subscription` invalido -> 400 (`next dev`, HTTP local).
- [x] Llamar a `/api/test-config` -> 404 (`next dev`, HTTP local).
- [ ] Auth fallida en backend Netlify -> respuesta sin `debug` (pendiente deploy: el Netlify productivo actual todavia responde body legacy con `debug`).
- [x] Frontend local: origen permitido devuelve preflight 204 y origen prohibido 403 en `/api/admin/login`.
- [ ] Netlify: `FRONTEND_URL`/origen permitido permite CORS; otro origen es bloqueado (pendiente deploy: el Netlify productivo actual todavia responde `Access-Control-Allow-Origin: *`).
- [x] `npm run build`.

## 12. Documentacion
- [x] Documentar rate limits y cambios de endpoints en `openspec/specs/booking-api/spec.md`.
- [ ] Commit sugerido: `feat(security): rate limiting, input validation, CORS hardening, debug leak fix`
