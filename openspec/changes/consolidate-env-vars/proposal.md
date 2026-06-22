# Proposal: Consolidate Environment Variables

> **Severidad: MEDIUM**
> Tipo: refactor / config
> Specs afectadas: `booking-api`, `deployment-architecture`

## Why

Hay **3 variables distintas** apuntando al mismo backend Netlify, y **2 nombres** para la misma URL de Apps Script. Esto genera:
- Confusión al configurar (`¿cuál seteo?`)
- Comportamiento distinto según cuál esté seteada (3 estrategias de routing distintas en el código)
- Variables declaradas que **nunca se usan**

## What Changes

### Backend Netlify URL (3 vars → 1)
**Actual:**
- `NEXT_PUBLIC_API_WORKER_URL` → Worker (legacy, eliminar tras `remove-cloudflare-dead-code`)
- `NEXT_PUBLIC_BACKEND_HORARIOS_URL` → Netlify horarios directo
- `NEXT_PUBLIC_BACKEND_BASE_URL` → Netlify base (override)

**Propuesta:**
- `NEXT_PUBLIC_BACKEND_URL` — única URL del backend Netlify
- Eliminar las 3 anteriores
- Eliminar también las URLs hardcodeadas `https://vanessastudioback.netlify.app/.netlify/functions/api` (en `BookingFlow.js:68`, `validar.js:6`, `api.js:118`, `turnos.js`)

### GAS Web App URL (2 vars → 1)
**Actual:**
- `GAS_WEBAPP_URL` (server-only)
- `NEXT_PUBLIC_GAS_WEBHOOK_URL` (public)

**Propuesta:**
- `NEXT_PUBLIC_GAS_WEBHOOK_URL` — única, pública (es una URL pública de todos modos)
- Eliminar `GAS_WEBAPP_URL`

### Variables declaradas pero nunca usadas
**Actual:** `GOOGLE_SHEET_ID`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` solo se referencian en `pages/api/test-config.js` para reportar presencia. No se usan en ningún call a Google APIs (la auth real es vía GAS o Netlify OAuth).

**Propuesta:** Eliminar las 3 vars y el endpoint `test-config.js` (también propuesto en `harden-api-routes`).

### Estrategia de routing unificada
**Actual (3 estrategias):**
1. `lib/api.js:101` `shouldUseHostedBackend()` → `API_WORKER_URL && !isLocalHost`
2. `BookingFlow.js:70-72` → `useHostedBackend = !isLocalHost && API_WORKER_URL`
3. `BookingFlow.js:279` → `hostname.includes('pages.com')`

**Propuesta:** Único helper `lib/api.js:getBackendUrl()` que retorna `NEXT_PUBLIC_BACKEND_URL` (siempre). Sin detección de hostname.

## Impacto

- **Breaking para la config:** hay que actualizar Vercel env vars en una migración coordinada.
- **Código más simple:** 1 helper vs 3 estrategias.
- **Mayor predictibilidad:** el comportamiento ya no depende del hostname.

## Evidencia

- `lib/api.js:101,110,112,118,134,192` — múltiples vars de URL
- `pages/api/book.js:20` — `NEXT_PUBLIC_API_WORKER_URL`
- `pages/api/horarios.js:23` — `NEXT_PUBLIC_BACKEND_BASE_URL`
- `BookingFlow.js:68,70-72,276,279` — URLs hardcodeadas + 2 estrategias
- `pages/validar.js:6` — URL hardcodeada
- `pages/api/test-config.js` — únicos usos de las 3 vars vestigiales

## Related

- Ejecutar **después** de `remove-cloudflare-dead-code` (elimina `NEXT_PUBLIC_API_WORKER_URL`)
- Coordinar con `harden-api-routes` (eliminación de `test-config.js`)
