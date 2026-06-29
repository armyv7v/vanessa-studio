# Change: admin-reservation-card-actions

## Why

El panel admin necesita operar cada cita directamente desde su card: reagendar, editar datos de clienta/servicio y eliminar una hora sin salir del dashboard.

## What changes

- Agrega acciones funcionales por card en `/admin/validar-citas`.
- Agrega endpoints operativos en backend Netlify para actualizar datos, reagendar y cancelar/eliminar una reserva.
- Mantiene PIN admin para mutaciones sensibles.
- Actualiza Google Sheets y Google Calendar en la misma operación cuando corresponda.

## Impact

- Frontend: `pages/admin/validar-citas.js`.
- Backend: `vanessa-studio-backend/netlify/functions/api.js`.
- Specs: `openspec/specs/admin-panel/spec.md`, `openspec/specs/booking-api/spec.md`.
