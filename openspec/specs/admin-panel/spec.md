# Spec: Admin Panel

> Panel privado de gestión para Vanessa/staff.
> **Estado: AS-IS.** Última revisión: 2026-06-22.
> ⚠️ El modelo de auth actual es **débil y está marcado para hardening** (`changes/harden-admin-auth`).

## Overview

El panel admin (rutas `/admin/*`) permite gestionar horarios, turnos y validación de citas/pagos. Está protegido por un gate de login que combina password + cookie + device token, más un PIN de 4 dígitos para mutaciones sensibles.

**Rutas (4):**
| Ruta | Archivo | Propósito |
|---|---|---|
| `/admin/login` | `pages/admin/login.js:11` | Gate de entrada. Redirige a `/admin/validar-citas` tras éxito. |
| `/admin/horarios` | `pages/admin/horarios.js:12` | Editor de horarios semanales + excepciones. |
| `/admin/turnos` | `pages/admin/turnos.js:37` | Calendario de disponibilidad + creación manual de reservas. |
| `/admin/validar-citas` | `pages/admin/validar-citas.js:52` | Dashboard principal: lista reservas, confirma pagos, valida asistencia. |

> La sidebar (`components/AdminShell.js:16`) lista solo 3 destinos (Horarios, Turnos, Validar citas); `/admin/login` está excluido del menú.

## Requirements

### Requirement 1: Login con password + cookie + device token
El acceso al panel requiere una contraseña; tras validarse se establece una cookie de 24h y opcionalmente un device token para auto-login.

- **Scenario 1.1:** WHEN el admin envía el form de login THEN se compara el password en texto plano contra `NEXT_PUBLIC_ADMIN_PASSWORD` (o `_FALLBACK`) (`pages/admin/login.js:7-9`, `:37`).
- **Scenario 1.2:** WHEN la contraseña coincide THEN se setea cookie `admin_token=admin-<timestamp>` por 24h (`lib/adminAuth.js:16`) y se redirige a `/admin/validar-citas`.
- **Scenario 1.3:** WHEN se marca "recordar dispositivo" THEN se guarda `admin_device_token` = SHA-256(password) en `localStorage` (`pages/admin/login.js:40`).
- **Scenario 1.4:** WHEN el admin vuelve y existe device token THEN `checkDeviceAndAutoLogin()` (`lib/adminAuth.js`) rehashea el password público, compara, y si coincide re-setea la cookie sin pedir password.
- **Scenario 1.5:** WHEN el admin hace logout THEN `clearAdminToken()` (`lib/adminAuth.js:19`) borra cookie + `admin_device_token` del `localStorage`.

### Requirement 2: Guardias de ruta client-side
Cada página admin valida el acceso en cliente antes de renderizar.

- **Scenario 2.1:** WHEN se accede a una ruta admin sin cookie THEN se ejecuta `hasAdminToken()` → fallback `checkDeviceAndAutoLogin()` → si ambos fallan, `router.push('/admin/login')`.
- **Scenario 2.2:** Esta validación es **puramente client-side** — no hay middleware server-side que la haga cumplir.

### Requirement 3: Editor de horarios (`/admin/horarios`)
Permite configurar horarios semanales y excepciones que afectan la disponibilidad.

- **Scenario 3.1:** El admin edita por día de la semana: hora apertura/cierre (con toggle "Cerrado") usando `<HorarioEditor>` (`components/HorarioEditor.jsx`).
- **Scenario 3.2:** Permite deshabilitar ordinales (ej. "2do domingo"), fechas puntuales y rangos blackout.
- **Scenario 3.3:** WHEN se guarda THEN se hace `GET`/`POST` al `HORARIOS_ENDPOINT` (Netlify `/.netlify/functions/horarios`).
- **Scenario 3.4:** La config persiste en Sheet tab `ConfiguracionHorarios` (celda A1 como JSON), Netlify Blobs y `data/horarios.json`.

### Requirement 4: Calendario de turnos (`/admin/turnos`)
Vista mensual/semanal con capacidad real y creación manual de reservas.

- **Scenario 4.1:** Los días se colorean como bloqueado/disponible/ocupado.
- **Scenario 4.2:** Se calcula "capacidad real" (cantidad de reservas no solapadas que entran).
- **Scenario 4.3:** WHEN el admin crea una reserva desde un slot THEN se llama al endpoint de booking con flag `adminCreated: true` (`pages/api/admin/cita.js`).

### Requirement 5: Dashboard de validación (`/admin/validar-citas`)
Lista de reservas con filtros y acciones operativas.

- **Scenario 5.1:** Muestra reservas de hoy / semana / 60 días, filtrables por estado de pago y búsqueda libre.
- **Scenario 5.2:** Acciones: confirmar pago, barrer pagos expirados, validar asistencia.
- **Scenario 5.3:** Las mutaciones sensibles (`confirm-payment`, `validate-attendance`, `expire-pending-payments`) requieren **device token OR PIN admin de 4 dígitos** enviado en el body — esta es la **única** parte con validación server-side real.
- **Scenario 5.4:** Esta página usa `lucide-react` para iconos (a diferencia del resto que usa `BrandMotifs`).

## Referencias de código

- `pages/admin/login.js:7-9,37,40` — password check + device token
- `lib/adminAuth.js:16,19` — cookie set/clear
- `components/AdminShell.js:16` — sidebar nav
- `components/HorarioEditor.jsx` — editor de horarios (único archivo `.jsx` del repo)
- `pages/admin/validar-citas.js:52` — dashboard
- `pages/admin/turnos.js:37` — calendario

## Deuda conocida (ver `changes/`)

- Password admin viaja al browser (`NEXT_PUBLIC_`) → `changes/harden-admin-auth`
- Cookie `admin_token` forgeable (solo timestamp) → `changes/harden-admin-auth`
- Sin server middleware → `changes/harden-admin-auth`
- `/api/admin/cita.js` tiene auth **comentada** (líneas 39-42) → `changes/harden-api-routes`
- Doble sistema de iconos (lucide vs BrandMotifs) → `changes/remove-dead-dependencies`
