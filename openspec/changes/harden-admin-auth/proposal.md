# Proposal: Harden Admin Auth

> **Severidad: CRITICAL**
> Tipo: security / refactor
> Specs afectadas: `admin-panel`, `booking-api`

## Why

El modelo de auth del panel admin es **puramente cosmético**:

1. **Password en el browser bundle.** `NEXT_PUBLIC_ADMIN_PASSWORD[_FALLBACK]` está prefijado con `NEXT_PUBLIC_`, lo que lo incluye en el JS enviado al cliente. Cualquiera puede leerlo del código fuente del browser. Login = `string compare` en cliente (`pages/admin/login.js:37`).
2. **Cookie forgeable.** `admin_token=admin-<timestamp>` — el valor es predecible y forgible (cualquiera puede setear esa cookie manualmente).
3. **Sin server middleware.** Las páginas admin validan acceso solo en cliente (`lib/adminAuth.js`) — bypassable.
4. **Auth de API comentada.** `pages/api/admin/cita.js` tiene `checkAdminAuth` definido (líneas 17-28) pero **comentado** en el handler (líneas 39-42). La ruta está **wide open**.

Lo único con validación server-side real es el PIN de 4 dígitos para mutaciones (confirmar pago, validar asistencia), y el PIN default es `2308`.

## What Changes

Reemplazar el modelo client-side por **server-side middleware + secret no público + cookie firmada**.

### Modelo propuesto
1. **Password fuera del bundle.** Renombrar `NEXT_PUBLIC_ADMIN_PASSWORD` a `ADMIN_PASSWORD` (server-only). El login envía la password vía POST a un endpoint server-side que la compara con `process.env.ADMIN_PASSWORD` (sin `NEXT_PUBLIC_`).
2. **Cookie firmada (HMAC).** Tras login exitoso, el server setea una cookie `admin_session` firmada con `ADMIN_SESSION_SECRET` (server-only), con expiry y `httpOnly`, `secure`, `sameSite=strict`.
3. **Server middleware.** Crear `pages/_middleware.js` (o `middleware.js` en app router) que valide la cookie firmada para cualquier ruta `/admin/*` (excepto `/admin/login`) y `/api/admin/*`. Sin cookie válida → redirect/401.
4. **Descomentar auth en `/api/admin/cita.js`.** Reemplazar el `checkAdminAuth` stub por validación de la cookie firmada (o token Bearer derivado).
5. **PIN como factor adicional** para mutaciones sensibles (mantener, pero PIN default != `2308`, ya rotado en `harden-secrets-and-gitignore`).

### Migration plan
- Migrar gradualmente: introducir el nuevo endpoint `/api/admin/login` que valida server-side y setea cookie firmada, manteniendo el flujo client-side de fallback durante 1 release.
- Una vez verificado, eliminar `NEXT_PUBLIC_ADMIN_PASSWORD` y la lógica client-side de `lib/adminAuth.js`.

## Impacto

- **Breaking change para el login actual** (la cookie `admin_token` vieja se invalida — todos los admins deben re-loguearse, una sola vez).
- **Más seguro:** el password ya no es legible del bundle; la cookie no es forgable; las rutas admin y API admin están protegidas en server-side.
- Complejidad añadida: 1 middleware + 1 endpoint de login + manejo de `ADMIN_SESSION_SECRET`.

## Diseño técnico (resumen)

```
POST /api/admin/login {password}
   ↓ server: bcrypt.compare(password, ADMIN_PASSWORD_HASH)
   ↓ si ok: setCookie('admin_session', sign({ts, exp}, ADMIN_SESSION_SECRET), {httpOnly, secure, sameSite:strict})
   ↓ 200 {ok:true}

middleware.js (matches /admin/* except /admin/login, and /api/admin/*)
   ↓ verify(req.cookies.admin_session, ADMIN_SESSION_SECRET)
   ↓ si inválido/expirado: redirect /admin/login (pages) | 401 (api)
```

> Considerar `jose` (WebCrypto JWT) o `cookie-signature` para la firma. Jose está recomendado para Next.js middleware (edge-compatible).

## Evidencia

- `pages/admin/login.js:7-9` — `NEXT_PUBLIC_ADMIN_PASSWORD` en uso client-side
- `pages/admin/login.js:37` — `password === adminPassword` (string compare)
- `lib/adminAuth.js:16` — `admin_token=admin-${Date.now()}` (forgeable)
- `lib/adminAuth.js:19` — `clearAdminToken` (ya limpia localStorage, OK)
- `pages/api/admin/cita.js:17-28` — `checkAdminAuth` definido
- `pages/api/admin/cita.js:39-42` — `// const auth = checkAdminAuth(req); if (!auth.ok) return ...` **comentado**
- `pages/api/horarios.js:54-55` — única auth real (cookie presence, no firma)

## Related

- Depende de: `harden-secrets-and-gitignore` (rotación de `ADMIN_PASSWORD`)
- Coordina con: `harden-api-routes` (auth de `/api/admin/cita.js`)
