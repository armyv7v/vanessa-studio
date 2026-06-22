# Spec: Scheduling Config

> Configuración de horarios y generación de slots disponibles.
> **Estado: AS-IS.** Última revisión: 2026-06-22.
> 🔴 **Hallazgo crítico:** existen **4 definiciones de "business hours"** en el código, en conflicto entre sí.

## Overview

La disponibilidad de citas depende de:
1. **Horarios base** (apertura/cierre por día de semana + excepciones) — configurable por admin.
2. **Eventos ocupados** del Google Calendar — fuente externa.
3. **Duración del servicio** seleccionado (90–180 min en `lib/services.js`).
4. **Modo** (normal vs extra-cupos) — cambia la ventana horaria.

La matemática de "qué slots están libres" se ejecuta en **3 lugares distintos** con reglas parcialmente inconsistentes:
- `lib/slots.js` (cliente, usado por `BookingFlow`)
- `lib/api.js:30-99` (cliente, duplicado paralelo)
- `pages/api/available-slots.js` (server-side, hours hardcodeadas)

## Requirements

### Requirement 1: Configuración admin de horarios
Los horarios son editables desde el panel y persisten en múltiples sitios.

- **Scenario 1.1:** El admin edita horarios semanales en `/admin/horarios` (apertura/cierre por día, toggle "Cerrado").
- **Scenario 1.2:** Se persiste en **3 lugares**: sheet tab `ConfiguracionHorarios` (A1 JSON), Netlify Blobs, y `vanessa-studio-backend/data/horarios.json`.
- **Scenario 1.3:** Excepciones: ordinales (`SUN1`, `SAT3`), fechas puntuales, rangos blackout.

### Requirement 2: Las 4 definiciones de "business hours" (CONFLICTO)
Diferentes partes del código asumen horarios distintos. **Esto es la principal fuente de bugs de scheduling.**

| Fuente | Horario asumido | Notas |
|---|---|---|
| `config/horarios.json` (default) | **09:00–22:00 todos los días** (incl. domingo) | Valor por defecto en disco |
| `pages/api/available-slots.js:6-16` | **09:00–22:00 todos los días** | Hardcodeado en server |
| `pages/index.js` (modo normal) | **10:00–18:00** | Window pasada a `BookingFlow` |
| `pages/extra-cupos.js` | **18:00–20:00** | Window pasada a `BookingFlow` (modo extra) |
| `lib/calendarConfig.js` | 10:00–18:00 normal / 18:00–20:00 extra + días condicionalmente deshabilitados | Reglas por defecto en cliente |
| `vanessa-studio-backend` (Netlify) | **09:00–18:00** lun-vie, **10:00–14:00** sáb, **cerrado** dom | Default backend |

> Hay al menos **6 conjuntos de reglas distintos**. La activa en runtime depende del camino de ejecución.

### Requirement 3: Generación de slots (cliente, `lib/slots.js`)
`generateTimeSlots()` es la función usada por `BookingFlow`.

- **Scenario 3.1:** Inputs: `date`, `serviceDurationMin`, `businessHours{start,end}`, `busyIntervals[]`, `tz`.
- **Scenario 3.2:** Genera candidatos cada (duración del servicio) dentro de la ventana, descartando los que solapan con `busy`.
- **Scenario 3.3:** Oculta horas pasadas si la fecha es "hoy".
- **Scenario 3.4:** Tiene un **cap de iteración de 150** para evitar loops infinitos.

### Requirement 4: Generación de slots (cliente, `lib/api.js:30-99`) — DUPLICADO
Existe una **segunda implementación paralela** de la misma matemática.

- **Scenario 4.1:** `lib/api.js` define `generateTimeSlots`, `buildAvailableRange`, `isSlotBusy` localmente.
- **Scenario 4.2:** Esta copia **puede divergir** de `lib/slots.js` — riesgo de comportamiento inconsistente según qué camino se ejecute.

### Requirement 5: Generación de slots (server, `available-slots.js`)
La ruta server-side computa para rangos de fechas.

- **Scenario 5.1:** Pide busy al backend Netlify para `startDate..endDate`.
- **Scenario 5.2:** Aplica horas **hardcodeadas 09:00–22:00** (ignora la config admin).
- **Scenario 5.3:** Expone `isSlotBusy` y devuelve `{available: [...]}`.

### Requirement 6: Resolución en runtime
Cuál definición "gana" depende del camino de código.

- **Scenario 6.1:** `BookingFlow.js` (camino principal del cliente) usa `lib/slots.js` con la window pasada por props (10:00–18:00 normal / 18:00–20:00 extra).
- **Scenario 6.2:** Si se llama `getAvailableSlotsRange` (rango), se pasa a `/api/available-slots.js` con hours hardcodeadas.
- **Scenario 6.3:** Si el Worker está configurado, usa su propia lógica (read-only Calendar).

## Referencias de código

- `lib/slots.js` — motor principal (cliente)
- `lib/api.js:30-99` — motor duplicado (cliente)
- `pages/api/available-slots.js:6-16,85` — motor server
- `lib/calendarConfig.js` — reglas por defecto cliente
- `config/horarios.json` — default disco (09–22)
- `pages/index.js`, `pages/extra-cupos.js` — windows pasadas a BookingFlow
- `vanessa-studio-backend/data/horarios.json` — default backend
- `api-worker/src/index.ts` — motor Worker (legacy)

## Deuda conocida (ver `changes/`)

- 4+ definiciones de business hours en conflicto → `changes/unify-slot-and-hours-logic`
- Doble motor de slots (`lib/slots.js` vs `lib/api.js`) → `changes/unify-slot-and-hours-logic`
- `config/horarios.json` no refleja las reglas runtime → `changes/consolidate-config-drift`
- `available-slots.js` ignora la config admin → `changes/unify-slot-and-hours-logic`
