# Spec: Client Booking

> Flujo público de reserva de citas para clientas.
> **Estado: AS-IS** (documenta cómo funciona hoy, no el estado deseado).
> Última revisión: 2026-06-22.

## Overview

Las clientas reservan citas a través de un wizard de 4 pasos servido por Next.js (Pages Router). Hay **dos modos de reserva**:

- **Cupos normales** (`/`, `pages/index.js`): ventana 10:00–18:00, horizonte 21 días.
- **Extra-cupos** (`/extra-cupos`, `pages/extra-cupos.js`): ventana 18:00–20:00, horizonte 35 días, con recargo de **$5.000** y aviso visual.

Ambos reusan el mismo componente `<BookingFlow>` (`components/BookingFlow.js`) con props distintas.

La generación de slots disponibles **no es server-side**: el frontend pide solo los intervalos *busy* al backend y computa los slots libres en el browser con `lib/slots.js`.

## Requirements

### Requirement 1: Wizard de 4 pasos
El flujo de reserva expone exactamente 4 pasos en orden: **Servicio → Fecha → Hora → Datos**. El usuario solo puede avanzar secuencialmente; el progreso se refleja visualmente.

- **Scenario 1.1:** WHEN la clienta aterriza en `/` THEN ve el paso "Servicio" con la grilla de 8 servicios ordenados por duración ascendente (`lib/services.js`).
- **Scenario 1.2:** WHEN la clienta selecciona un servicio THEN avanza a "Fecha" (`handleServiceSelect`, `BookingFlow.js:371`).
- **Scenario 1.3:** WHEN la clienta selecciona fecha THEN avanza a "Hora" (`handleDateSelect`, `BookingFlow.js:381`).
- **Scenario 1.4:** WHEN la clienta selecciona hora THEN avanza a "Datos" (`handleTimeSelect`, `BookingFlow.js:388`).
- **Scenario 1.5:** WHEN la clienta completa datos y envía THEN se ejecuta `handleSubmitBooking` (`BookingFlow.js:398`).

### Requirement 2: Configuración remota de disponibilidad (fetch al montar)
Al montar `BookingFlow`, se obtiene la configuración remota antes de mostrar el calendario.

- **Scenario 2.1:** WHEN se monta el componente THEN se hace `GET /api/gs-check?action=getConfig` para obtener `workingHours`, `disabledDays`, `disabledDates`, `blackoutRanges` y `extraCuposConfig`.
- **Scenario 2.2:** WHEN la carga falla THEN el flujo continúa con fallbacks locales (`config/horarios.json` + `lib/calendarConfig.js`) sin crashear.

### Requirement 3: Cálculo de slots en cliente
Los slots disponibles se calculan en el navegador a partir de los intervalos *busy* devueltos por el backend.

- **Scenario 3.1:** WHEN la clienta selecciona fecha THEN un `useEffect` (`BookingFlow.js:354`) llama a `fetchSlots` → `listSlotsViaApi`: `GET /api/slots?date=<YYYY-MM-DD>&serviceId=<id>`.
- **Scenario 3.2:** El endpoint responde con `{busy: [...]}` y el frontend ejecuta `generateTimeSlots()` (`lib/slots.js`) aplicando duración del servicio, ventana horaria del modo, detección de solapamientos y ocultando horas pasadas si es "hoy".
- **Scenario 3.3:** Los slots se agrupan en buckets **Mañana / Tarde / Noche** para la UI.
- **Scenario 3.4:** WHEN el backend responde con error THEN el flujo degrada gracefully (no crashea).

### Requirement 4: Autocompletado de cliente por email
Cuando la clienta sale del campo email, se intenta autocompletar nombre y teléfono si ya existe.

- **Scenario 4.1:** WHEN el campo email pierde el foco THEN `useClientAutocomplete` (`lib/useClientAutocomplete.js`) ejecuta `getClientByEmail` → `GET /api/client?email=<email>`.
- **Scenario 4.2:** WHEN la lookup retorna un cliente THEN se rellenan nombre y teléfono.
- **Scenario 4.3:** WHEN la lookup falla THEN el error se ignora silenciosamente (nunca debe bloquear la reserva).

### Requirement 5: Envío de reserva
Al confirmar, se envía la reserva al backend y se muestra feedback de éxito.

- **Scenario 5.1:** WHEN la clienta confirma THEN se llama `bookAppointment` (`lib/api.js`) → `POST /api/book` con payload `{serviceId, serviceName, durationMin, date, start, extraCupo, client: {name, email, phone}}`.
- **Scenario 5.2:** WHEN el backend responde 200 THEN se renderiza `<BookingConfirmation>` con `{validationCode, paymentExpiresAt}`, se disparan 600 piezas de confetti (`react-confetti`) y se resetea el flujo a los 8 segundos.
- **Scenario 5.3:** WHEN el backend responde conflicto (slot ocupado) THEN se muestra error y se permite reintentar.

### Requirement 6: Modo extra-cupos
`/extra-cupos` reusa el mismo `BookingFlow` pero con configuración extendida.

- **Scenario 6.1:** WHEN se accede a `/extra-cupos` THEN `BookingFlow` recibe `isExtra: true` y `mode: 'extra'`.
- **Scenario 6.2:** WHEN existe `extraCuposConfig` remota THEN la ventana y horizonte del modo extra salen de esa config.
- **Scenario 6.3:** WHEN la config remota no existe o falla THEN el flujo cae al fallback local `18:00–20:00`, 35 días.
- **Scenario 6.4:** La UI muestra un aviso visible del recargo de **$5.000** antes de confirmar.

### Requirement 7: Diseño y accesibilidad
El flujo sigue el design system "premium minimalist" (post-rediseño Jun 2026).

- **Scenario 7.1:** La paleta usa tokens definidos en `tailwind.config.js` y `styles/globals.css` (fucsia `#E11B74`, dorado `#C5A059`).
- **Scenario 7.2:** Se respetan `prefers-reduced-motion` (vía `matchMedia`) para desactivar animaciones.
- **Scenario 7.3:** Los componentes usan atributos `aria-*`, `role="alert"`/`"status"` y un skip-link para accesibilidad.

## Referencias de código

- `pages/index.js:3` — render de `<BookingFlow>` modo normal
- `pages/extra-cupos.js:14` — modo extra-cupos
- `components/BookingFlow.js:59` — `stepLabels`, wizard
- `lib/api.js:101` — `shouldUseHostedBackend()` (lógica de enrutamiento backend)
- `lib/slots.js` — `generateTimeSlots()`
- `lib/calendarConfig.js` — reglas por defecto de días laborables
- `lib/services.js` — catálogo de servicios

## Deuda conocida (ver `changes/`)

- Doble motor de slots (`lib/slots.js` vs `lib/api.js:30-99`) → `changes/unify-slot-and-hours-logic`
- Lógica de "usar backend hosted" con 3 estrategias distintas → `changes/consolidate-env-vars`
- URL del backend Netlify hardcodeada en fallbacks → `changes/consolidate-env-vars`
