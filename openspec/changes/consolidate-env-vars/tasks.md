# Tasks: Consolidate Environment Variables

> Ejecutar tras `remove-cloudflare-dead-code` y coordinar con `harden-api-routes`.

## 1. Inventario y backup
- [ ] Listar todas las env vars actuales en Vercel: `vercel env ls` (o vía dashboard)
- [ ] Documentar valores actuales en un doc privado (no commitear)

## 2. Introducir `NEXT_PUBLIC_BACKEND_URL`
- [ ] Añadir en Vercel: `NEXT_PUBLIC_BACKEND_URL=https://vanessastudioback.netlify.app/.netlify/functions`
- [ ] Verificar que el frontend puede leerla (deploy preview)

## 3. Refactor del cliente API
- [ ] En `lib/api.js`: crear `getBackendUrl()` único helper que retorna `process.env.NEXT_PUBLIC_BACKEND_URL`
- [ ] Reemplazar todas las lecturas de `NEXT_PUBLIC_API_WORKER_URL`, `NEXT_PUBLIC_BACKEND_HORARIOS_URL`, `NEXT_PUBLIC_BACKEND_BASE_URL` por `getBackendUrl()` + sufijo de ruta
- [ ] Eliminar las URLs hardcodeadas `https://vanessastudioback.netlify.app/...` en:
  - `components/BookingFlow.js:68`
  - `pages/validar.js:6`
  - `pages/admin/turnos.js`
  - `lib/api.js:118`
- [ ] Eliminar las 3 estrategias de routing (`shouldUseHostedBackend`, `hostname.includes('pages.com')`, `useHostedBackend`)
- [ ] Commit: `refactor(api): unify backend URL into single NEXT_PUBLIC_BACKEND_URL`

## 4. Unificar URL de GAS
- [ ] En todos los archivos que usan `GAS_WEBAPP_URL` (server) o `NEXT_PUBLIC_GAS_WEBHOOK_URL`, usar siempre `process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL`
- [ ] Actualizar `.env.example` y `.env.local`
- [ ] En Vercel: copiar el valor de `GAS_WEBAPP_URL` a `NEXT_PUBLIC_GAS_WEBHOOK_URL` si aún no existe
- [ ] Commit: `refactor(api): unify GAS URL into NEXT_PUBLIC_GAS_WEBHOOK_URL`

## 5. Eliminar vars vestigiales
- [ ] `git rm pages/api/test-config.js` (si no se hizo en `harden-api-routes`)
- [ ] Eliminar references a `GOOGLE_SHEET_ID`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` (solo estaban en `test-config.js`)
- [ ] En Vercel: eliminar `GOOGLE_SHEET_ID`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`
- [ ] Commit: `chore(env): remove vestigial Google service-account variables`

## 6. Cleanup en Vercel
- [ ] Eliminar de Vercel: `NEXT_PUBLIC_API_WORKER_URL` (tras confirmar que el Worker ya no existe)
- [ ] Eliminar de Vercel: `NEXT_PUBLIC_BACKEND_HORARIOS_URL`, `NEXT_PUBLIC_BACKEND_BASE_URL`
- [ ] Eliminar de Vercel: `GAS_WEBAPP_URL` (legacy)

## 7. Actualizar `.env.example`
- [ ] Reescribir `.env.example` con la lista final limpia:
  ```
  NEXT_PUBLIC_BACKEND_URL=https://vanessastudioback.netlify.app/.netlify/functions
  NEXT_PUBLIC_GAS_WEBHOOK_URL=https://script.google.com/macros/s/tu_script_id/exec
  NEXT_PUBLIC_GCAL_CALENDAR_ID=tu_calendar_id@group.calendar.google.com
  NEXT_PUBLIC_TZ=America/Santiago
  ADMIN_PASSWORD_HASH=tu_hash_bcrypt
  ADMIN_SESSION_SECRET=tu_secreto_aleatorio_32bytes
  ```
- [ ] Commit: `docs(env): rewrite .env.example with consolidated variables`

## 8. Pruebas
- [ ] Flujo de reserva funciona extremo a extremo
- [ ] Panel admin funciona
- [ ] Validación de asistencia funciona
- [ ] `console.log` muestra siempre la misma URL de backend sin importar el hostname

## 9. Actualizar specs
- [ ] Actualizar `openspec/specs/booking-api/spec.md` para reflejar el routing unificado
- [ ] Commit: `docs(spec): update booking-api for unified env vars`
