# Proposal: Unify Slot and Hours Logic

> **Severidad: HIGH**
> Tipo: refactor
> Specs afectadas: `scheduling-config`, `client-booking`

## Why

Hay **dos implementaciones paralelas** de la matemática de slots en el cliente, y **4+ definiciones conflictivas** de "business hours". Esto causa bugs difíciles de reproducir: la disponibilidad mostrada puede diferir según qué camino de código se ejecuta.

### Dos motores de slots (cliente)
- `lib/slots.js` — `generateTimeSlots()` (usado por `BookingFlow`)
- `lib/api.js:30-99` — `generateTimeSlots`, `buildAvailableRange`, `isSlotBusy` (duplicado paralelo)
- (server) `pages/api/available-slots.js` — su propio motor con hours hardcodeadas

### Conflictos de business hours
| Fuente | Horario |
|---|---|
| `config/horarios.json` | 09:00–22:00 todos los días |
| `pages/api/available-slots.js:6-16` | 09:00–22:00 todos los días (hardcoded) |
| `pages/index.js` → BookingFlow | 10:00–18:00 (normal) |
| `pages/extra-cupos.js` → BookingFlow | 18:00–20:00 (extra) |
| `lib/calendarConfig.js` | 10:00–18:00 / 18:00–20:00 + días condicionalmente off |
| Netlify backend default | 09:00–18:00 lun-vie, 10:00–14:00 sáb, cerrado dom |

## What Changes

### 1. Eliminar el motor duplicado en `lib/api.js`
- Mover las funciones `generateTimeSlots`, `buildAvailableRange`, `isSlotBusy` de `lib/api.js:30-99` a importarlas de `lib/slots.js`.
- Eliminar la copia local.

### 2. Eliminar `/api/available-slots.js` o refactorizarlo
- Opción A (preferida): **eliminar la ruta** — no se usa en el flujo principal del cliente (que usa `lib/slots.js` con busy de `/api/slots`). Si nada la consume, borrarla.
- Opción B: si algo la usa, refactorizarla para que **lea la config admin** (de Netlify) en vez de usar hours hardcoded.

### 3. Única fuente de business hours: la config admin
- `pages/index.js` y `pages/extra-cupos.js` ya no deberían pasar windows hardcoded a `BookingFlow`.
- En su lugar, `BookingFlow` debe pedir la config admin (vía `/api/gs-check?action=getConfig`) y usarla para determinar windows por modo (normal/extra).
- `lib/calendarConfig.js` se queda solo como **fallback** si la config admin no carga.

### 4. Alinear `config/horarios.json` con la realidad
- Actualizar el default del disco para que refleje las reglas runtime reales.
- Documentar que es solo un fallback, no la fuente de verdad (la fuente es el sheet `ConfiguracionHorarios`).

## Impacto

- **Eliminación de código muerto/duplicado:** ~70 líneas.
- **Comportamiento más predecible:** una sola definición de business hours activa.
- **Riesgo:** si `available-slots.js` se usa en algún sitio no detectado, rompe. Auditar primero.

## Evidencia

- `lib/slots.js` — motor principal
- `lib/api.js:30-99` — motor duplicado
- `pages/api/available-slots.js:6-16` — hours hardcoded
- `pages/index.js:16` — `window: '10:00-18:00'` (similar)
- `config/horarios.json` — default 09–22

## Related

- Coordina con `consolidate-config-drift` (alinear `config/horarios.json` y `lib/calendarConfig.js`)
