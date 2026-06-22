# Tasks: Harden API Routes

## Frontend (`/api/*`)

### 1. Rate limiting en booking
- [ ] Elegir estrategia: in-memory token bucket (simple, no extra deps) o Upstash Redis (distribuido)
- [ ] Implementar en `/api/book.js` y `/api/admin/cita.js`: 5 POSTs/IP/hora → 429 si excede
- [ ] Headers de respuesta: `X-RateLimit-Remaining`, `Retry-After`

### 2. Validación de `subscribe-push`
- [ ] En `pages/api/subscribe-push.js`: validar que `subscription.endpoint` es URL, que `subscription.keys.auth` y `subscription.keys.p256dh` existen y tienen longitud razonable
- [ ] Rechazar con 400 si no valida

### 3. Eliminar `test-config.js`
- [ ] `git rm pages/api/test-config.js`
- [ ] Si se necesita diagnóstico de env, crear `scripts/check-env.js` (CLI, no expuesto vía HTTP)

### 4. CORS estricto
- [ ] Crear helper `lib/cors.js` con allowlist: `https://vanessa-studio.vercel.app`, `http://localhost:3000`
- [ ] Aplicar a rutas admin (`/api/admin/*`, `/api/horarios`)
- [ ] Rutas públicas (`/api/book`, `/api/slots`, etc.) pueden mantener `*` o restringir también

## Backend Netlify

### 5. PIN sin default
- [ ] En `api.js` (3 lugares: 799, 882, 1009): cambiar `process.env.ADMIN_VALIDATION_PIN || '2308'` por `process.env.ADMIN_VALIDATION_PIN` + `throw new Error('ADMIN_VALIDATION_PIN not set')` si falta
- [ ] Asegurar que `ADMIN_VALIDATION_PIN` esté seteada en Netlify (con el valor rotado de `harden-secrets-and-gitignore`)

### 6. Quitar `debug` de respuestas auth fallida
- [ ] Buscar todas las respuestas 401/403 que incluyen un objeto `debug` (alrededor de `api.js:808-819`)
- [ ] Reemplazar por `{error: 'Unauthorized'}` sin metadata
- [ ] Mantener logs server-side (console.log con nivel debug) para diagnóstico

### 7. CORS restrictivo en Netlify
- [ ] Auditar `FRONTEND_URL` en Netlify env (debe ser `https://vanessa-studio.vercel.app`)
- [ ] Reemplazar `Access-Control-Allow-Origin: *` por `Access-Control-Allow-Origin: <FRONTEND_URL>` en todas las functions
- [ ] Para el webhook de Twilio (`whatsapp-webhook.js`): mantener `*` (Twilio lo requiere)

### 8. Validación de input en `api.js`
- [ ] En el handler de booking POST: validar email regex, longitud de nombre (2-100), teléfono (8-15 dígitos), serviceId conocido
- [ ] En `validate-attendance`: validar que `code` tiene formato md5 (32 hex chars)
- [ ] Sanitizar todos los inputs antes de escribir al Sheet

## Apps Script

### 9. Restringir acceso GAS
- [ ] Editar `scripts/google-script/src/appsscript.json`:
  - `executeAs`: `USER_DEPLOYING` (no `ANYONE_ANONYMOUS`)
  - `access`: `DOMAIN` o `MYSELF` (evaluar qué rompe — el frontend necesita llamarlo)
- [ ] Coordinar con `formalize-backend-submodule` — si se depreca GAS para booking, esto pierde urgencia
- [ ] `npm run gs:push`

## 10. Pruebas
- [ ] Spam de 10 POSTs a `/api/book` desde misma IP → el 6to recibe 429
- [ ] POST a `/api/subscribe-push` con `subscription` inválido → 400
- [ ] Llamar a `/api/test-config` → 404 (ruta removida)
- [ ] Auth fallida en backend → respuesta sin `debug`
- [ ] `FRONTEND_URL` correcto permite CORS; otro origen es bloqueado

## 11. Documentación
- [ ] Documentar rate limits en `openspec/specs/booking-api/spec.md` (actualizar AS-IS → nuevo comportamiento)
- [ ] Commit: `feat(security): rate limiting, input validation, CORS hardening, debug leak fix`
