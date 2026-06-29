# Spec: Scheduling Config

> Configuración de horarios y generación de slots disponibles.
> **Estado: AS-IS.** Última revisión: 2026-06-28.
> 🟡 **Hallazgo vigente:** ya no existe el motor duplicado en `lib/api.js`, pero todavía conviven defaults/fallbacks distintos entre frontend y backend.

## Overview

La disponibilidad de citas depende de:
1. **Horarios base** por día (`horarioAtencion`) editables desde admin.
2. **Excepciones** (`disabledDays`, `disabledDates`, `blackoutRanges`).
3. **Eventos ocupados** del Google Calendar.
4. **Duración del servicio** seleccionado.
5. **Modo** (`normal` vs `extra`) que segmenta la ventana visible al cliente.

La matemática de slots ahora se centraliza en `lib/slots.js`, y tanto el flujo público como `/api/available-slots` reutilizan ese motor compartido.

## Requirements

### Requirement 1: Configuración admin de horarios
Los horarios son editables desde el panel y persisten en múltiples sitios.

- **Scenario 1.1:** El admin edita horarios semanales en `/admin/horarios` (apertura/cierre por día, toggle "Cerrado").
- **Scenario 1.2:** Se persiste en **3 lugares**: sheet tab `ConfiguracionHorarios` (A1 JSON), Netlify Blobs, y `vanessa-studio-backend/data/horarios.json`.
- **Scenario 1.3:** Excepciones: ordinales (`SUN1`, `SAT3`), fechas puntuales y rangos blackout.

### Requirement 2: Fuente primaria y fallbacks de business hours
La fuente primaria de horarios para runtime es la config admin remota.

- **Scenario 2.1:** `BookingFlow` obtiene `workingHours` desde `/api/gs-check?action=getConfig`.
- **Scenario 2.2:** `workingHours` representa `horarioAtencion` por día de semana.
- **Scenario 2.3:** `extraCuposConfig` modela explícitamente la franja extendida (`enabled`, `start`, `end`, `daysToShow`).
- **Scenario 2.4:** `lib/calendarConfig.js` define ventanas fallback para segmentar `normal` vs `extra` y cubrir degradación.
- **Scenario 2.5:** `config/horarios.json` es fallback local del frontend, no fuente de verdad primaria.

### Requirement 3: Generación de slots compartida (`lib/slots.js`)
`generateTimeSlots()` es el motor compartido de slots.

- **Scenario 3.1:** Inputs: `date`, `openHour`, `closeHour`, `stepMinutes`, `durationMinutes`, `busy[]`, `tz`, `allowOverflowEnd`.
- **Scenario 3.2:** Genera candidatos dentro de la ventana, marcando `available` según solapamiento con `busy`.
- **Scenario 3.3:** Oculta horas pasadas si la fecha es hoy.
- **Scenario 3.4:** Tiene un cap de iteración de 150 para evitar loops infinitos.

### Requirement 4: Cliente público (`BookingFlow`)
El flujo público deriva su ventana visible según modo y config admin.

- **Scenario 4.1:** El modo `normal` usa `workingHours` remota intersectada con la ventana fallback normal.
- **Scenario 4.2:** El modo `extra` usa `extraCuposConfig` remota cuando existe.
- **Scenario 4.3:** Si una fecha no tiene `horarioAtencion` para ese día, no debe mostrarse como seleccionable.
- **Scenario 4.4:** Las props `openHour`/`closeHour` quedan como override para tests o casos controlados.

### Requirement 5: Rango server-side (`/api/available-slots`)
La ruta server-side calcula disponibilidad por rango usando el mismo motor compartido.

- **Scenario 5.1:** Pide `busy` al backend Netlify para `startDate..endDate`.
- **Scenario 5.2:** Pide `horarioAtencion` al backend de horarios y usa fallback local solo si falla.
- **Scenario 5.3:** Reutiliza `generateTimeSlots()` y devuelve `{ available: [...] }`.

### Requirement 6: Cliente admin (`getAvailableSlotsRange`)
El panel admin sigue usando `/api/available-slots` para obtener disponibilidad de rango.

- **Scenario 6.1:** `pages/admin/turnos.js` consume `getAvailableSlotsRange()`.
- **Scenario 6.2:** `lib/api.js` ya no mantiene un motor duplicado de slots.
- **Scenario 6.3:** El cálculo de rango queda centralizado en la ruta server-side.

## Referencias de código

- `lib/slots.js` — motor compartido de slots.
- `lib/businessHours.js` — resolución de ventanas por modo y día.
- `components/BookingFlow.js` — flujo público que deriva horarios desde config admin.
- `pages/api/available-slots.js` — rango server-side usando el motor compartido.
- `pages/api/gs-check.js` — proxy resiliente para `workingHours` + excepciones.
- `lib/calendarConfig.js` — fallback y segmentación de modo.
- `config/horarios.json` — fallback local del frontend.
- `vanessa-studio-backend/data/horarios.json` — fallback local del backend.

## Deuda conocida (ver `changes/`)

- El worker legacy mantiene deuda de consolidación separada.
- Falta verificación funcional manual completa del flujo normal y extra tras la unificación.
- La configuración real remota puede seguir difiriendo del fallback versionado si el sheet/admin no está alineado.
