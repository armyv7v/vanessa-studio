# Spec: Admin Panel

> Panel privado de gestion para Vanessa/staff.
> **Estado: AS-IS.** Ultima revision: 2026-06-27.

## Overview

El panel admin (`/admin/*`) permite gestionar horarios, turnos y validacion de citas/pagos. El acceso usa login server-side, cookie `admin_session` firmada y middleware para proteger rutas admin. Las mutaciones sensibles se autorizan con `admin_session` en endpoints locales `/api/admin/*`; el secreto operativo queda server-side.

**Rutas (4):**
| Ruta | Archivo | Proposito |
|---|---|---|
| `/admin/login` | `pages/admin/login.js` | Gate de entrada. Envia password a `/api/admin/login` y redirige tras exito. |
| `/admin/horarios` | `pages/admin/horarios.js` | Editor de horarios semanales + excepciones. |
| `/admin/turnos` | `pages/admin/turnos.js` | Calendario de disponibilidad + creacion manual de reservas. |
| `/admin/validar-citas` | `pages/admin/validar-citas.js` | Dashboard principal: lista reservas, confirma pagos, valida asistencia. |

## Requirements

### Requirement 1: Login server-side con cookie firmada
El acceso al panel requiere una password validada en servidor.

- **Scenario 1.1:** WHEN el admin envia el form de login THEN `pages/admin/login.js` llama `POST /api/admin/login` con `{password}`.
- **Scenario 1.2:** WHEN la password coincide con `ADMIN_PASSWORD` o `ADMIN_PASSWORD_FALLBACK` server-only THEN el endpoint setea cookie `admin_session` firmada, `HttpOnly`, `SameSite=Strict`, `Secure` en produccion y `Max-Age=24h`.
- **Scenario 1.3:** WHEN la password no coincide THEN el endpoint responde `401` y no setea cookie.
- **Scenario 1.4:** WHEN el admin hace logout THEN `POST /api/admin/logout` expira `admin_session`.
- **Scenario 1.5:** `NEXT_PUBLIC_ADMIN_PASSWORD` ya no participa del flujo de login.

### Requirement 2: Proteccion server-side de rutas admin
El acceso al panel y a APIs admin se valida antes de ejecutar la ruta protegida.

- **Scenario 2.1:** WHEN se accede a `/admin/*` sin `admin_session` valida THEN `middleware.js` redirige a `/admin/login`.
- **Scenario 2.2:** WHEN se accede a `/api/admin/*` sin `admin_session` valida THEN `middleware.js` responde `401`.
- **Scenario 2.3:** WHEN una pagina admin ya cargo THEN `lib/adminAuth.js` consulta `/api/admin/session` para confirmar sesion desde el cliente.

### Requirement 3: Editor de horarios (`/admin/horarios`)
Permite configurar horarios semanales y excepciones que afectan disponibilidad.

- **Scenario 3.1:** El admin edita por dia de la semana: hora apertura/cierre usando `<HorarioEditor>`.
- **Scenario 3.2:** Permite deshabilitar ordinales, fechas puntuales y rangos blackout.
- **Scenario 3.3:** El admin tambien puede editar `extraCuposConfig` (enabled, start, end, daysToShow).
- **Scenario 3.4:** WHEN se carga o guarda configuracion THEN la pagina llama `/api/horarios`, proxy local protegido por `admin_session`.
- **Scenario 3.5:** La config persiste en el backend de horarios y mantiene fallback local degradado para lectura.

### Requirement 4: Calendario de turnos (`/admin/turnos`)
Vista mensual/semanal con capacidad real y creacion manual de reservas.

- **Scenario 4.1:** Los dias se colorean como bloqueado/disponible/ocupado.
- **Scenario 4.2:** Se calcula capacidad real segun duracion seleccionada.
- **Scenario 4.3:** WHEN el admin crea una reserva desde un slot THEN se llama a `POST /api/admin/cita` con flag `adminCreated: true`.
- **Scenario 4.4:** `POST /api/admin/cita` requiere `admin_session` valida.

### Requirement 5: Dashboard de validacion (`/admin/validar-citas`)
Lista reservas con filtros y acciones operativas.

- **Scenario 5.1:** Muestra reservas de hoy / semana / 60 dias, filtrables por estado de pago y busqueda libre.
- **Scenario 5.2:** Acciones: confirmar pago, barrer pagos expirados, validar asistencia.
- **Scenario 5.3:** Las mutaciones sensibles (`confirm-payment`, `validate-attendance`, `expire-pending-payments`) se ejecutan mediante `/api/admin/reservation-operation`, que requiere `admin_session` valida e inyecta el secreto operativo server-side.
- **Scenario 5.4:** El device token en `localStorage` ya no se usa como autorizacion para operaciones criticas.
- **Scenario 5.5:** La vista principal presenta un resumen operativo tipo SaaS de agenda profesional con KPIs accionables antes de la lista de citas.
- **Scenario 5.6:** Cada card de cita permite reagendar, editar datos de clienta/servicio y eliminar/liberar la hora desde acciones inline.
- **Scenario 5.7:** Las acciones de reagendar, editar y eliminar requieren `admin_session` valida en el proxy local y actualizan Google Sheets y Google Calendar cuando corresponde.

## Referencias de codigo

- `middleware.js` — protege `/admin/*` y `/api/admin/*`.
- `lib/adminSession.js` — firma/verifica `admin_session`.
- `lib/adminAuth.js` — helpers client-side para login/logout/session-check.
- `pages/api/admin/login.js` — login server-side.
- `pages/api/admin/logout.js` — logout server-side.
- `pages/api/admin/session.js` — verificacion de sesion para cliente.
- `pages/api/admin/cita.js` — creacion manual admin protegida.
- `pages/api/horarios.js` — proxy de horarios protegido.
- `components/AdminShell.js` — layout admin y logout.

## Deuda conocida (ver `changes/`)

- `ADMIN_PASSWORD` aun se compara como secreto plano server-side; pendiente evaluar hash (`ADMIN_PASSWORD_HASH`) si se agrega dependencia o helper robusto.
- El backend Netlify todavia debe dejar de aceptar device tokens como autorizacion alternativa.
- Falta hardening completo de rate limiting, CORS e input validation en rutas publicas.
- Doble sistema de iconos (`lucide-react` vs `BrandMotifs`) sigue pendiente.
