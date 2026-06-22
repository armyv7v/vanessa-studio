# Project: Vanessa Studio

> Sistema de reservas online para Vanessa Nails Studio (Valparaíso, Chile).
> Este archivo es el **contexto compartido** para todas las specs y changes.
> Generado como parte de la auditoría integral con spec-kit (2026-06-22).

---

## 1. Propósito

Permitir a clientas reservar citas de manicura/pedicura online, gestionar el pago anticipado de un depósito, validar asistencia presencial mediante un código QR, y mantener un programa de fidelidad (sellos). Incluye un panel admin privado para gestionar horarios, turnos y validación de citas/pagos.

**Usuarios:**
- **Clientas** (público general) → reserva + validación de asistencia + tarjeta de fidelidad.
- **Admin** (Vanessa y staff) → gestión de horarios, turnos, pagos y asistencia.

---

## 2. Stack y topología

| Capa | Tecnología | Deploy | Origen de verdad |
|---|---|---|---|
| **Frontend** | Next.js 14.2.5 (Pages Router), React 18, Tailwind 3.4 | **Vercel** (`vanessa-studio.vercel.app`) | este repo |
| **Backend API** | Netlify Functions (Node), Google APIs (OAuth user-based) | Netlify (`vanessastudioback.netlify.app`) | `vanessa-studio-backend/` (repo anidado gitignored) |
| **Apps Script** | Google Apps Script Web App (`doGet`/`doPost`) | Google Cloud (deploy manual vía `clasp`) | `scripts/google-script/src/Code.gs` |
| **Worker (legacy)** | Cloudflare Worker TypeScript | Cloudflare (sin uso real en producción) | `api-worker/` (propuesta: eliminar) |

> ⚠️ **Estado real:** el frontend depende de **tres** backends simultáneamente (Next.js `/api/*`, Netlify Functions, y opcionalmente el Worker). La presencia del Worker y los scripts de Cloudflare son **legado de migraciones abandonadas**. La función de Apps Script es una **ruta paralela/legacy** (escribe 11 columnas vs las 19 del backend Netlify). Ver `changes/` para propuestas de limpieza.

---

## 3. Integraciones externas

| Servicio | Uso | Credenciales |
|---|---|---|
| **Google Sheets** (`1aE4dnWZ...`) | Persistencia principal. Tabs: `Reservas`, `TarjetasFidelidad`, `EmailLog`, `ConfiguracionHorarios` | GAS (identidad del deployer) / Netlify (OAuth refresh token) |
| **Google Calendar** | Conflictos de horario + eventos de cita (invitaciones a clienta y owner) | API key (Worker/lib) + OAuth (Netlify) + `CalendarApp` (GAS) |
| **Brevo (Sendinblue)** | Emails transaccionales (confirmación reserva, pago confirmado, recordatorios fidelidad) | `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` (Netlify) |
| **Twilio (WhatsApp)** | Chatbot FAQ + recordatorios de mantenimiento | `TWILIO_*` (Netlify) |
| **MailApp (Google)** | Emails de confirmación legacy desde Apps Script | scopes del script |
| **api.qrserver.com** | Generación de PNG QR para códigos de validación | pública |

---

## 4. Modelo de datos (Google Sheet `Reservas`)

Existen **dos esquemas** en producción según el camino de booking:

| Columna | GAS (11 cols, legacy) | Netlify (19 cols, actual) |
|---|:---:|:---:|
| Timestamp, Nombre, Email, Teléfono, Servicio, StartLocal, EndLocal, Duración, ExtraCupo, EventId, EventLink | ✅ | ✅ |
| validationCode, attended, validatedAt, paymentStatus, paymentConfirmedAt, paymentExpiresAt, releasedAt, releaseReason | ❌ | ✅ |

> Propuesta de unificación pendiente. Ver spec `deployment-architecture`.

**Estados de `paymentStatus`:** `PENDIENTE_PAGO` → `PAGO_CONFIRMADO` | `EXPIRADA`.

**TarjetasFidelidad (8 cols):** email, name, stamps (0–6), lastApptDate, deadlineDate, rewardAvailable (SI/NO), inPenalty (SI/NO), history. Meta: 6 sellos = recompensa; >30 días sin visita = penalidad.

---

## 5. Glosario

| Término | Definición |
|---|---|
| **Reserva** | Una cita agendada, representada como fila en el sheet `Reservas` y como evento de Calendar. |
| **Cupo normal** | Reserva dentro del horario regular (10:00–18:00 aprox.). |
| **Extra-cupos** | Reservas en ventana extendida (18:00–20:00), con recargo de $5.000 y horizonte de 35 días. Accesible vía `/extra-cupos`. |
| **validationCode** | Hash MD5 asociado a cada reserva; usado en URL `/validar?code=...` para mostrar detalle + QR de asistencia. |
| **Depósito** | $10.000 pagados por transferencia; la reserva queda `PENDIENTE_PAGO` hasta confirmación admin. Expira a las 24h sin pago. |
| **Sello** | Un punto de fidelidad (máx. 6) otorgado al validar asistencia presencial. |
| **PIN admin** | Código de 4 dígitos (`ADMIN_VALIDATION_PIN`, default `2308`) requerido para mutaciones sensibles desde el panel. |

---

## 6. Variables de entorno

El proyecto tiene **multiples variables redundantes** para el mismo propósito (auditar en `changes/consolidate-env-vars`). Resumen:

**Frontend (Vercel) — `NEXT_PUBLIC_*`:**
- `NEXT_PUBLIC_API_WORKER_URL` — URL del Worker (legacy, propuesta: eliminar)
- `NEXT_PUBLIC_GAS_WEBHOOK_URL` / `GAS_WEBAPP_URL` (server) — URL de Apps Script (2 nombres para lo mismo)
- `NEXT_PUBLIC_GCAL_CALENDAR_ID` — ID del calendario público
- `NEXT_PUBLIC_BACKEND_BASE_URL` / `NEXT_PUBLIC_BACKEND_HORARIOS_URL` — URL del backend Netlify (2 vars para lo mismo)
- `NEXT_PUBLIC_TZ` (`America/Santiago`), `NEXT_PUBLIC_TZ_OFFSET`
- `NEXT_PUBLIC_ADMIN_PASSWORD` (+ `_FALLBACK`) — ⚠️ contraseña en el bundle del browser (auditar en `changes/harden-admin-auth`)
- `GCAL_API_KEY` — server-side (verificar que no filtre al bundle)

**Backend (Netlify):** `GOOGLE_OAUTH_*`, `BREVO_*`, `TWILIO_*`, `ADMIN_VALIDATION_PIN` (default `2308`), `ADMIN_PASSWORD[_FALLBACK]`, `FRONTEND_URL`.

**Vestigiales (declaradas pero nunca usadas en código):** `GOOGLE_SHEET_ID`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`.

---

## 7. Decisiones de diseño vigentes

- **Deploy target único: Vercel.** Toda la basura de Cloudflare/OpenNext está marcada para eliminación (`changes/remove-cloudflare-dead-code`).
- **Backend Netlify separado, a formalizar** como submodule o repo propio (`changes/formalize-backend-submodule`). No se migra a Vercel.
- **Apps Script** se mantiene como integración (gestión con `clasp`), pero su ruta de booking `doPost` es legacy y debe deprecarse a favor del backend Netlify.
- **Idioma UI:** español (Chile). **Zona horaria:** `America/Santiago`. **Moneda:** CLP.
- **Auth admin actual:** password en el bundle + cookie `admin_token` + device token en `localStorage` + PIN de 4 dígitos para mutaciones. **Es débil y está marcada para hardening** (`changes/harden-admin-auth`).

---

## 8. Cómo leer esta auditoría

- **`specs/`** describe el sistema **AS-IS** (cómo funciona hoy, no cómo debería). Cada requirement tiene escenarios WHEN/THEN.
- **`changes/`** contiene **propuestas de cambio** derivadas de la auditoría. Cada una tiene `proposal.md` (qué+cómo) y `tasks.md` (checklist). Ninguna se ha ejecutado todavía — el usuario decide cuáles aplicar.
- **Severidades:** `CRITICAL` / `HIGH` / `MEDIUM` / `LOW` en cada proposal.

---

## 9. Hallazgos críticos (resumen ejecutivo)

Los 14 changes propuestos se agrupan en 4 ejes:

1. **🧹 Limpieza (CRITICAL/HIGH):** `.cf-deploy/` tracked (74 archivos, 665KB `_worker.js`), 7 patches muertos, `api-worker/`, scripts/deps Cloudflare, junk files (`nul`, `npx`, etc.). → `changes/remove-*`.
2. **🔒 Seguridad (CRITICAL/HIGH):** secretos en `.env.local` en disco (rotar), password admin en bundle, auth de `/api/admin/cita.js` comentada, 8/9 rutas sin auth, PIN default débil, info leak en debug. → `changes/harden-*`.
3. **🏗️ Arquitectura (HIGH/MEDIUM):** 2 motores de slots paralelos, 4 definiciones de horario conflictivas, env vars redundantes, backend anidado fantasma, Next 14.2.5 con CVEs. → `changes/unify-*`, `consolidate-*`, `formalize-*`, `patch-*`.
4. **📚 Documentación (MEDIUM/LOW):** sin README, docs pre-rediseño stale, 6 guías WhatsApp para 3 providers, ramas/remote stale. → `changes/add-readme-*`, `refresh-stale-docs`, `cleanup-git-*`.

> Para el detalle con evidencia `file:line`, ver cada `proposal.md`.
