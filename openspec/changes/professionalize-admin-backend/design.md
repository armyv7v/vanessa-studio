# Design: Professional Admin and Backend Operations

## Decision

El panel admin debe evolucionar hacia un centro de gestión de citas, pero la implementación debe hacerse en capas: seguridad, backend, motor de agenda, operación admin y automatización.

La regla de diseño es simple: **no construir experiencia profesional sobre una arquitectura insegura o duplicada**.

## Target Operating Model

| Área | Decisión |
|---|---|
| Backend principal | Netlify Functions sigue siendo el backend operativo actual. |
| Frontend | Next.js en Vercel mantiene las vistas públicas y admin. |
| Persistencia | Google Sheets se mantiene como fuente actual mientras se estabiliza el dominio. |
| Agenda | Un único motor de disponibilidad debe alimentar cliente, admin y APIs. |
| Admin auth | Sesión server-side firmada; nada sensible en bundle público. |
| Automatización | Brevo/Twilio se usan desde backend, no desde lógica dispersa. |

## Admin Information Architecture

### Dashboard

Vista inicial del panel.

Debe responder rápido:

- ¿Qué citas tengo hoy?
- ¿Qué pagos están pendientes?
- ¿Qué reservas están por expirar?
- ¿Qué clientas requieren atención?
- ¿Hay conflictos o bloqueos próximos?

### Agenda

Vista calendario para operar disponibilidad.

Debe permitir:

- ver ocupación,
- crear cita manual,
- bloquear horario,
- reprogramar,
- cancelar,
- distinguir horario normal y extra-cupo.

### Citas

Listado operativo con filtros.

Estados mínimos:

- `PENDIENTE_PAGO`
- `PAGO_CONFIRMADO`
- `EXPIRADA`
- `CANCELADA`
- `ASISTIDA`
- `NO_SHOW`

### Clientas

Ficha unificada por email/teléfono.

Debe mostrar:

- datos de contacto,
- historial,
- próxima cita,
- sellos,
- recompensas,
- notas internas,
- no-shows/cancelaciones.

### Configuración

Debe contener:

- horarios semanales,
- excepciones,
- bloqueos,
- extra-cupos,
- parámetros operativos,
- credenciales nunca visibles.

## Backend Boundaries

### Admin API

Responsable de acciones internas:

- confirmar pago,
- validar asistencia,
- crear cita manual,
- cancelar cita,
- reprogramar,
- marcar no-show,
- modificar horarios.

Todas requieren sesión admin válida.

### Booking API

Responsable de reservas públicas:

- consultar disponibilidad,
- crear reserva,
- iniciar estado `PENDIENTE_PAGO`,
- generar código de validación,
- enviar confirmación.

Debe tener rate limit e input validation.

### Notification API

Responsable de mensajes transaccionales:

- confirmación,
- recordatorio de pago,
- recordatorio de cita,
- fidelidad,
- reactivación.

No debe mezclar lógica de agenda con plantillas de mensaje.

## Data Model Direction

Mientras Google Sheets siga siendo la persistencia principal, cada transición debe ser explícita.

Campos recomendados para reservas:

- `status`
- `paymentStatus`
- `attendanceStatus`
- `createdBy`
- `updatedAt`
- `cancelledAt`
- `cancelReason`
- `rescheduledFrom`
- `noShowAt`
- `auditLog`

Tradeoff: agregar columnas al Sheet es menos elegante que una DB relacional, pero permite profesionalizar el flujo sin introducir una migración grande prematura.

## Implementation Strategy

### Slice 1: Foundation

Implementar seguridad y limpieza sin cambiar UX principal.

Riesgo bajo para Vanessa, alto impacto técnico.

### Slice 2: Single Scheduling Engine

Unificar disponibilidad antes de agregar reprogramación/cancelación avanzada.

Riesgo medio: afecta reservas.

### Slice 3: Admin Operations

Agregar dashboard, estados y acciones operativas.

Riesgo medio/alto: toca flujos diarios.

### Slice 4: Automation

Agregar recordatorios y retención cuando los estados sean confiables.

Riesgo bajo si los eventos del dominio ya están ordenados.

## Review Notes

Revisar este change como roadmap coordinador. La implementación concreta debe dividirse en changes pequeños y verificables. No conviene hacer un mega-PR.
