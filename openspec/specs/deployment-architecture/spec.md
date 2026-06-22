# Spec: Deployment Architecture

> Topología de deploy, modelo de datos y relación entre los 3 backends.
> **Estado: AS-IS.** Última revisión: 2026-06-22.
> **Deploy target oficial: Vercel** (`vanessa-studio.vercel.app`).

## Overview

El sistema se compone de **4 capas** que viven en **3 plataformas distintas**. La relación entre ellas es **frágil**: URLs hardcoded, fallbacks silenciosos, esquemas de datos paralelos, y una capa Cloudflare legado sin uso real.

```
┌─────────────────────────────────────────────────────────────┐
│ Browser (clienta/admin)                                       │
│   ├─ /  /extra-cupos  /validar   (público)                   │
│   └─ /admin/*                   (privado, gate client-side)  │
└────────────┬────────────────────────────────────────────────┘
             │ fetch HTTPS
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Next.js 14 (Vercel)  ← este repo                            │
│   pages/api/*  (proxies delgados)                           │
└──┬──────────────┬──────────────────┬────────────────────────┘
   │              │                  │
   ▼              ▼                  ▼
┌─────────┐ ┌──────────────┐ ┌──────────────────┐
│ GAS     │ │ Netlify      │ │ Cloudflare Worker│
│ Web App │ │ Functions    │ │ (api-worker/)    │
│ (legacy)│ │ (source of   │ │ (legacy, unused) │
│         │ │  truth)      │ │                  │
└────┬────┘ └──────┬───────┘ └──────────────────┘
     │             │
     │   ┌─────────┴──────────┐
     │   │  Google APIs (OAuth)│
     │   │  - Sheets v4        │
     │   │  - Calendar v3      │
     │   └─────────────────────┘
     │
     ▼
┌──────────────────────────────────────────┐
│ Google Cloud                              │
│  - Sheet 1aE4dnWZ...                      │
│  - Calendar 64693698...@group.calendar    │
│  - MailApp (email legacy)                 │
│  - Apps Script ejecuta como deployer      │
│    (ANYONE_ANONYMOUS)                     │
└──────────────────────────────────────────┘
```

## Requirements

### Requirement 1: Frontend (Vercel)
App Next.js 14 Pages Router deployada en Vercel.

- **Scenario 1.1:** Deploy automático on push a `main` (`.vercel/project.json`: projectId `prj_cjkHpShUq5qfleVNIyISHQ6mypY1`, projectName `vanessa-studio`).
- **Scenario 1.2:** Build via `next build` (`npm run build`).
- **Scenario 1.3:** Runtime: Node >= 18 (declarado), real ~20/22.
- **Scenario 1.4:** Variables públicas via `NEXT_PUBLIC_*` inyectadas en bundle.

### Requirement 2: Backend (Netlify) — fuente de verdad
Repo anidado `vanessa-studio-backend/` deployado independientemente.

- **Scenario 2.1:** URL: `https://vanessastudioback.netlify.app/.netlify/functions/...` (hardcodeada en fallbacks del frontend).
- **Scenario 2.2:** Functions: `api` (mega-function), `horarios`, `whatsapp-webhook`, `send-whatsapp-reminder`, `loyalty-reminders`, `expire-pending-payments`.
- **Scenario 2.3:** Scheduled job: `expire-pending-payments` cada 15 min (`netlify.toml:8-9`).
- **Scenario 2.4:** Auth Google: **OAuth user-based con refresh token** (no service account).
- **Scenario 2.5:** Es **su propio repo git** (`.git` dentro de la carpeta) y está **gitignored en el padre** — phantom dependency.

### Requirement 3: Apps Script (GAS) — ruta legacy
Web App desplegada vía `clasp`, accesible públicamente.

- **Scenario 3.1:** URL en `NEXT_PUBLIC_GAS_WEBHOOK_URL` (o legacy `GAS_WEBAPP_URL`).
- **Scenario 3.2:** Ejecuta como `ANYONE_ANONYMOUS` / identidad del deployer (`scripts/google-script/src/appsscript.json:13-16`) — el público puede disparar writes de Calendar y emails.
- **Scenario 3.3:** `doGet`: `getConfig`, `getClient` (cached 6 min).
- **Scenario 3.4:** `doPost`: reserva legacy — conflict-check vía `CalendarApp`, crea evento con invites, appenda **11 columnas** en sheet `Reservas`, envía email `MailApp`.
- **Scenario 3.5:** `sendMaintenanceReminders`: trigger manual, recordatorio día 20, log a sheet `EmailLog`.
- **Scenario 3.6:** Constants **hardcodeadas en código commiteado**: `CALENDAR_ID`, `SHEET_ID`, `OWNER_EMAIL`, `WHATSAPP_PHONE`, cuentas bancarias (`Code.gs:8-17`).

### Requirement 4: Cloudflare Worker — legado sin uso real
`api-worker/` existe pero su uso es opcional y poco claro.

- **Scenario 4.1:** Implementa `/api/slots` (Calendar read-only via API key) y `/api/gs-check` (proxy GAS getConfig).
- **Scenario 4.2:** `wrangler.toml` expone `NEXT_PUBLIC_GCAL_CALENDAR_ID` y `GAS_WEBAPP_URL` en `[vars]` (plaintext commiteado).
- **Scenario 4.3:** Solo se activa si `NEXT_PUBLIC_API_WORKER_URL` está seteada; sin esa var, el frontend no lo toca.
- **Scenario 4.4:** **Propuesta: eliminar** (`changes/remove-cloudflare-dead-code`).

### Requirement 5: Modelo de datos (Google Sheet)
Sheet `1aE4dnWZQjEJWAMaDEfDRpACVUDU8_F9-fzd_2mSQQeM` con tabs:

| Tab | Esquema | Escrito por |
|---|---|---|
| `Reservas` | **2 esquemas en conflicto**: GAS 11 cols vs Netlify 19 cols | Ambos |
| `TarjetasFidelidad` | 8 cols (email, name, stamps, lastApptDate, deadlineDate, rewardAvailable, inPenalty, history) | Netlify |
| `EmailLog` | Log de recordatorios GAS | GAS |
| `ConfiguracionHorarios` | JSON en A1 | Netlify |

### Requirement 6: Google Calendar
Calendario `64693698...@group.calendar.google.com` (público para lectura via API key).

- **Scenario 6.1:** Lectura: Worker (API key), `lib/google-calendar.js` (API key), GAS (`CalendarApp`), Netlify (OAuth `events.list`).
- **Scenario 6.2:** Escritura: GAS (`CalendarApp.createEvent` con `sendInvites`), Netlify (`events.insert` con `sendUpdates:'all'`).
- **Scenario 6.3:** Borrado: Netlify (`events.delete`) al expirar reserva sin pago.

### Requirement 7: Artefactos de deploy abandonados (DEUDA)
El repo contiene restos de **2 migraciones fallidas a Cloudflare**.

- **Scenario 7.1:** `.cf-deploy/` — **74 archivos tracked** incluyendo `_worker.js` de 665KB (build artifact commiteado).
- **Scenario 7.2:** `wrangler.jsonc`, `open-next.config.mjs`, `open-next.config.ts` (2 configs conflictivas del mismo tool).
- **Scenario 7.3:** `package.json` scripts `build:cf`/`preview:cf`/`deploy:cf`/`upload:cf`/`cf-typegen` + deps `@opennextjs/cloudflare: latest`, `wrangler: latest`.
- **Scenario 7.4:** `deploy.sh` deploya el output de Vercel a Cloudflare Pages (incoherente).
- **Scenario 7.5:** **Propuesta: eliminar todos** (`changes/remove-cloudflare-dead-code`).

## Referencias de código

- `.vercel/project.json` — projectId Vercel
- `package.json:11-15,33,43` — scripts y deps Cloudflare
- `pages/api/slots.js:4` — URL Netlify hardcodeada
- `scripts/google-script/src/Code.gs:8-17` — constants commiteados
- `scripts/google-script/src/appsscript.json:13-16` — access ANYONE_ANONYMOUS
- `api-worker/wrangler.toml:4-8` — vars plaintext
- `api-worker/src/index.ts:34-40` — rutas del Worker
- `vanessa-studio-backend/netlify/functions/api.js` — mega-function
- `vanessa-studio-backend/netlify.toml:8-9` — job scheduled

## Deuda conocida (ver `changes/`)

- `.cf-deploy/` tracked (74 archivos) → `changes/remove-cloudflare-dead-code` (CRITICAL)
- 2 esquemas de `Reservas` en conflicto (11 vs 19 cols) → `changes/formalize-backend-submodule`
- Backend anidado fantasma → `changes/formalize-backend-submodule`
- GAS ejecuta como ANYONE_ANONYMOUS → `changes/harden-api-routes`
- Constants hardcodeados en GAS commiteados → `changes/harden-secrets-and-gitignore`
- Cloudflare Worker legado → `changes/remove-cloudflare-dead-code`
