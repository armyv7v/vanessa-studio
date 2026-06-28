# Tasks: Harden Admin Auth

> Depende de `harden-secrets-and-gitignore` para rotacion real de secretos y coordina con `harden-api-routes`.

## 1. Setup de secrets server-only
- [ ] Definir `ADMIN_PASSWORD_HASH` en Vercel si se decide mover de password plana server-side a hash.
- [ ] Definir `ADMIN_SESSION_SECRET` real en Vercel (32+ bytes aleatorios).
- [ ] Eliminar `NEXT_PUBLIC_ADMIN_PASSWORD` y `NEXT_PUBLIC_ADMIN_PASSWORD_FALLBACK` de Vercel.
- [x] Documentar `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` en `.env.example`.
- [x] Eliminar `NEXT_PUBLIC_ADMIN_PASSWORD` de `.env.example`.

## 2. Crear endpoints de login server-side
- [x] Crear `pages/api/admin/login.js`.
- [x] Validar password en servidor usando `ADMIN_PASSWORD` / `ADMIN_PASSWORD_FALLBACK`.
- [x] Setear cookie `admin_session` firmada, `HttpOnly`, `SameSite=Strict`, `Secure` en produccion.
- [x] Crear `pages/api/admin/logout.js` para expirar la cookie.
- [x] Crear `pages/api/admin/session.js` para verificacion client-side sin exponer la cookie.
- [ ] Reemplazar password plana por `ADMIN_PASSWORD_HASH` cuando se agregue estrategia de hashing.

## 3. Crear middleware server-side
- [x] Crear `middleware.js` en raiz.
- [x] Configurar matcher para `/admin/*` y `/api/admin/*`.
- [x] Excluir `/admin/login` y `/api/admin/login`.
- [x] Redirigir paginas admin sin sesion a `/admin/login`.
- [x] Responder `401` en APIs admin sin sesion.

## 4. Refactor de `pages/admin/login.js`
- [x] Reemplazar comparacion client-side por `POST /api/admin/login`.
- [x] Si response 200, redirigir a `/admin/validar-citas` o `next`.
- [x] Si response 401, mostrar error.
- [x] Eliminar dependencia de `NEXT_PUBLIC_ADMIN_PASSWORD`.

## 5. Refactor de `lib/adminAuth.js`
- [x] Eliminar `setAdminToken`.
- [x] Reemplazar `hasAdminToken` por consulta a `/api/admin/session`.
- [x] Convertir `clearAdminToken` en logout server-side.
- [x] Eliminar `checkDeviceAndAutoLogin`.
- [x] Eliminar `getDeviceToken`.

## 6. Proteger `/api/admin/cita.js`
- [x] Eliminar auth comentada.
- [x] Verificar `admin_session` con `verifyAdminRequest`.
- [x] Responder `401` si la cookie falta, expiro o tiene firma invalida.

## 7. Proteger `/api/horarios.js`
- [x] Reemplazar check de presencia de `admin_token` por validacion real de `admin_session`.
- [x] Mantener fallback degradado para lectura GET cuando el backend remoto falla.
- [x] Hacer que `/admin/horarios` y `/admin/turnos` consuman `/api/horarios`.

## 8. Refactor de mutaciones sensibles
- [x] En `pages/admin/validar-citas.js`, quitar fallback de device token obsoleto.
- [x] Mantener PIN como segundo factor para confirmar pagos, validar asistencia y liberar vencidas.
- [x] En `pages/validar.js`, revisar si existe algun fallback equivalente: solo envia `adminPin`.
- [x] En backend Netlify, dejar de aceptar device tokens como auth valida.

## 9. Pruebas
- [x] Login con password correcta -> entra al panel / sesion valida (`next dev`, HTTP local).
- [x] Login con password incorrecta -> 401, no entra (`next dev`, HTTP local).
- [x] Acceso a `/admin/horarios` sin cookie -> redirect `/admin/login` (`307`, HTTP local).
- [x] Acceso a `/api/admin/cita` sin cookie -> 401 (`next dev`, HTTP local).
- [x] Acceso a `/api/admin/cita` con cookie vieja `admin_token=admin-123` -> 401 (`next dev`, HTTP local).
- [ ] PIN correcto valida asistencia; PIN incorrecto no.
- [x] Logout limpia la cookie y deja `/api/admin/session` en 401 (`next dev`, HTTP local).
- [x] `npm run build`.

## 10. Documentacion
- [x] Actualizar `openspec/specs/admin-panel/spec.md`.
- [x] Documentar nuevas variables env en `.env.example`.
- [ ] Actualizar `ADMIN_PANEL_GUIDE.md` si existe/se crea.
- [ ] Commit sugerido: `feat(auth): replace client-side admin auth with signed server sessions`

## Deviations

- La propuesta original mencionaba `jose`/JWT y `bcrypt`. Este slice evita nuevas dependencias y usa HMAC SHA-256 con WebCrypto para la firma de sesion. La password queda server-only, pero aun plana en env; el hash queda como hardening pendiente.
