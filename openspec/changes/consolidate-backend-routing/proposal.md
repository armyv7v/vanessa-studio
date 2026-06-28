# Proposal: Consolidate Backend Routing and Remove Legacy Hardcodes

## Why

Después del hardening quedaron varias rutas y helpers apuntando a backends distintos con defaults hardcodeados:

- `pages/api/available-slots.js`
- `pages/api/gs-check.js`
- `pages/api/slots.js`
- `lib/api.js`
- `pages/admin/validar-citas.js`
- `vanessa-studio-backend/netlify/functions/loyalty-reminders.js`

Hoy conviven:

- `NEXT_PUBLIC_API_WORKER_URL`
- `NEXT_PUBLIC_BACKEND_BASE_URL`
- `NEXT_PUBLIC_GAS_WEBHOOK_URL`
- `GAS_WEBAPP_URL`
- hardcodes directos a `https://vanessastudioback.netlify.app/...`

Eso vuelve opaca la arquitectura, complica deploys, rompe trazabilidad y hace fácil dejar defaults inconsistentes con el target oficial (`vanessa-studio.vercel.app` + backend Netlify).

## What changes

1. Definir una convención explícita de resolución de backend frontend → Netlify/GAS.
2. Centralizar la construcción de URLs backend en un helper único.
3. Eliminar hardcodes repetidos de `vanessastudioback.netlify.app` donde no sean necesarios.
4. Alinear `available-slots`, `gs-check`, `slots`, `lib/api.js` y vistas admin con esa convención.
5. Documentar la fuente de verdad en `openspec/specs/deployment-architecture/spec.md` y/o `booking-api/spec.md`.

## Out of scope

- Migrar de Netlify a otra plataforma.
- Reescribir lógica de disponibilidad.
- Cambiar contratos funcionales de booking.
- Deploy automático.

## Expected outcome

- Menos drift entre entornos.
- Menos fallbacks mágicos.
- Menor riesgo de defaults legacy en frontend.
- Base más limpia para `formalize-backend-submodule` y `unify-slot-and-hours-logic`.
