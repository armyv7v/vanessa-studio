# Tasks: Consolidate Backend Routing and Remove Legacy Hardcodes

## 1. Mapear convención objetivo

- [x] Definir cuál variable manda para backend Netlify en frontend (`NEXT_PUBLIC_API_WORKER_URL` vs `NEXT_PUBLIC_BACKEND_BASE_URL`).
- [x] Definir cuándo se usa GAS directo y cuándo proxy local.
- [x] Documentar prioridad/fallbacks permitidos.

## 2. Centralizar resolución de URLs

- [x] Crear helper compartido para construir base URL backend.
- [x] Reutilizarlo desde `lib/api.js` y APIs Next que hoy tienen hardcodes.
- [x] Evitar concatenaciones manuales repetidas.

## 3. Eliminar hardcodes legacy del frontend

- [x] Revisar `pages/api/available-slots.js`.
- [x] Revisar `pages/api/gs-check.js`.
- [x] Revisar `pages/api/slots.js`.
- [x] Revisar `lib/api.js`.
- [x] Revisar `pages/admin/validar-citas.js`.

## 4. Revisar backend relacionado

- [x] Revisar `vanessa-studio-backend/netlify/functions/loyalty-reminders.js` por hardcode de booking URL.
- [x] Alinear defaults con `FRONTEND_URL`/target oficial.

## 5. Verificación

- [x] `npm run build`
- [x] Verificar booking público
- [x] Verificar carga de slots
- [x] Verificar `gs-check?action=getConfig`
- [x] Verificar validación de citas admin

## Suggested commit

`refactor(api): consolidate backend routing and remove legacy hardcodes`
