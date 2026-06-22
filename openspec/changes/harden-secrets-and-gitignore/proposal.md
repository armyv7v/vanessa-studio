# Proposal: Harden Secrets and Gitignore

> **Severidad: CRITICAL**
> Tipo: security
> Specs afectadas: `deployment-architecture`

## Why

`.env.local` (4 KB) contiene **secretos de producción en texto plano** en disco:
- `GOOGLE_PRIVATE_KEY` (clave RSA completa de service account)
- `GOOGLE_CLIENT_SECRET` (OAuth client secret)
- `GCAL_API_KEY`
- `ADMIN_PASSWORD` / `ADMIN_PASSWORD_FALLBACK` (contraseñas admin en claro)
- `VERCEL_OIDC_TOKEN` (JWT que NO debería persistirse — Vercel lo inyecta en build time)
- `GAS_WEBAPP_URL`, `GOOGLE_SHEET_ID`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_CLIENT_ID` (PII)

Aunque `.env.local` está gitignored y NO está trackeado, el historial de commits del repo es caótico (migraciones múltiples, branches). La política defensiva es **rotar los secretos más sensibles** y blindar el `.gitignore`.

Además, `.dev.vars` (formato Cloudflare) **sí está trackeado** en git y no está en `.gitignore` — si alguien le pone secretos reales, se commitearán.

## What Changes

### Acciones inmediatas (rotación)
- [CRITICAL] **Rotar `GOOGLE_PRIVATE_KEY`** del service account en Google Cloud Console. La actual es comprometida.
- [CRITICAL] **Rotar `GOOGLE_CLIENT_SECRET`** OAuth.
- [CRITICAL] **Cambiar `ADMIN_PASSWORD`** a una contraseña fuerte (no `Admin2308`).
- [HIGH] **Rotar `GCAL_API_KEY`** (con restricciones de HTTP referrer en la nueva).
- [HIGH] **Rotar `ADMIN_VALIDATION_PIN`** (default `2308` hardcoded).

> Nota: `VERCEL_OIDC_TOKEN` no necesita rotación — es efímero, pero debe quitarse del `.env.local`.

### `.gitignore` hardening
- [HIGH] Añadir `.dev.vars` (formato Cloudflare — tracked actualmente, leak risk).
- [HIGH] Añadir `.wrangler/`.
- [HIGH] Añadir `nul` (defensivo Windows).
- [MEDIUM] De-duplicar la entrada `.vercel` (aparece 2 veces en `.gitignore:12,16`).

### Archivos tracked a quitar
- [HIGH] `git rm --cached .dev.vars` (después de añadirlo al `.gitignore`).

### `wrangler.toml` del api-worker
- [MEDIUM] Tras `remove-cloudflare-dead-code`, este archivo se va. Pero si se mantiene por algún motivo, mover `GAS_WEBAPP_URL` y `NEXT_PUBLIC_GCAL_CALENDAR_ID` de `[vars]` (plaintext) a secrets.

### `scripts/google-script/src/Code.gs`
- [MEDIUM] Constantes hardcodeadas en código commiteado: `CALENDAR_ID`, `SHEET_ID`, `OWNER_EMAIL`, `WHATSAPP_PHONE`, cuentas bancarias (`Code.gs:8-17`). Migrar a PropertiesService del script (no commiteados).

## Impacto

- **Rotación:** causa downtime mínimo (hay que actualizar Vercel + Netlify + GAS con los nuevos secretos coordinadamente).
- **`.gitignore`:** sin impacto funcional.
- Sin esto, cualquier leak del repo (clone equivocado, fork, breach) expone credenciales con acceso a Calendar, Sheets, y envío de email.

## Evidencia

- `.env.local:3-4` — `ADMIN_PASSWORD="Admin2308"`, `ADMIN_PASSWORD_FALLBACK`
- `.env.local:7` — `GCAL_API_KEY="AIzaSy..."`
- `.env.local:10` — `GOOGLE_CLIENT_SECRET="GOCSPX-..."`
- `.env.local:11` — `GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."`
- `.env.local:16` — `VERCEL_OIDC_TOKEN="eyJ..."` (no pertenece a `.env.local`)
- `.gitignore` — sin entradas para `.dev.vars`, `.wrangler/`, `nul`
- `.dev.vars` — tracked (confirmar con `git ls-files .dev.vars`)
- `scripts/google-script/src/Code.gs:8-17` — constants hardcodeados
