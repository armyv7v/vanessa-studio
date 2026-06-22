# Tasks: Harden Admin Auth

> Depende de `harden-secrets-and-gitignore` (rotación de password) y coordina con `harden-api-routes`.

## 1. Setup de secrets (server-only)
- [ ] Definir `ADMIN_PASSWORD_HASH` (bcrypt) en Vercel — derivado del nuevo password rotado
- [ ] Definir `ADMIN_SESSION_SECRET` (32+ bytes aleatorios) en Vercel
- [ ] **Eliminar** `NEXT_PUBLIC_ADMIN_PASSWORD` y `NEXT_PUBLIC_ADMIN_PASSWORD_FALLBACK` de Vercel

## 2. Crear endpoint de login server-side
- [ ] Crear `pages/api/admin/login.js`:
  - POST: recibe `{password}`, compara con `bcrypt.compare(password, ADMIN_PASSWORD_HASH)`
  - Si OK: setea cookie `admin_session` = `sign({exp}, ADMIN_SESSION_SECRET, '30d')` con flags `httpOnly`, `secure`, `sameSite=strict`
  - Si no: 401
- [ ] Crear `pages/api/admin/logout.js`: POST que borra la cookie

## 3. Crear middleware server-side
- [ ] Crear `middleware.js` en raíz (Next.js 14 soporta middleware en Pages Router)
- [ ] Configurar `matcher` para `/admin/*` (excepto `/admin/login`) y `/api/admin/*` (excepto `/api/admin/login`)
- [ ] Lógica: verificar cookie `admin_session` con `jose.jwtVerify` (edge-compatible)
  - Inválida/experimentada → redirect `/admin/login` (para pages) o 401 (para api)

## 4. Refactor de `pages/admin/login.js`
- [ ] Reemplazar la comparación client-side por `fetch('/api/admin/login', {method:'POST', body: JSON.stringify({password})})`
- [ ] Si response 200 → redirect `/admin/validar-citas`
- [ ] Si 401 → mostrar error
- [ ] Mantener funcionalidad "recordar dispositivo" pero ahora persiste la cookie `admin_session` (httpOnly no es accesible desde JS — usar flag `persistent` server-side o un second cookie signal)

## 5. Refactor de `lib/adminAuth.js`
- [ ] Eliminar `setAdminToken` / `hasAdminToken` (cookie forgeable) — reemplazado por cookie firmada
- [ ] Mantener `clearAdminToken` para limpiar residuos viejos
- [ ] Eliminar `checkDeviceAndAutoLogin` (la cookie firmada ya persiste la sesión)

## 6. Descomentar + corregir auth en `/api/admin/cita.js`
- [ ] Descomentar las líneas 39-42
- [ ] Reemplazar `checkAdminAuth(req)` por: verificar presencia + validez de `admin_session` cookie firmada
- [ ] Si inválida → 401

## 7. Actualizar `pages/api/horarios.js`
- [ ] Reemplazar el check `admin_token` cookie presence (líneas 54-55) por validación de cookie firmada `admin_session`
- [ ] Mantener comportamiento para admin legítimo

## 8. Refactor de mutaciones sensibles
- [ ] En `pages/admin/validar-citas.js` y `pages/validar.js`: las mutaciones (`confirm-payment`, `validate-attendance`, `expire-pending-payments`) ya requieren PIN. Mantener PIN como segundo factor. Quitar el fallback de device token obsoleto.
- [ ] En el backend Netlify: ya no aceptar device tokens como auth válida — solo PIN o header firmado derivado de la sesión server-side.

## 9. Pruebas
- [ ] Login con password correcta → entra al panel
- [ ] Login con password incorrecta → 401, no entra
- [ ] Acceso a `/admin/horarios` sin cookie → redirect `/admin/login`
- [ ] Acceso a `/api/admin/cita` sin cookie → 401
- [ ] Acceso a `/api/admin/cita` con cookie vieja `admin_token=admin-123` → 401 (la cookie firmada es necesaria)
- [ ] PIN correcto valida asistencia; PIN incorrecto no
- [ ] Logout limpia la cookie y redirige a login

## 10. Documentación
- [ ] Actualizar `ADMIN_PANEL_GUIDE.md` con el nuevo flujo
- [ ] Documentar las nuevas variables env (`ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`) en `.env.example`
- [ ] Commit: `feat(auth): replace client-side admin auth with server middleware + signed cookies`
