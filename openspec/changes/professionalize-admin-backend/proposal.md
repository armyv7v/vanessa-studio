# Proposal: Professionalize Admin and Backend Operations

> **Severidad: HIGH**
> Tipo: roadmap / architecture / product
> Specs afectadas: `admin-panel`, `booking-api`, `scheduling-config`, `payments-loyalty`, `notifications`, `deployment-architecture`

## Why

Vanessa Studio ya resuelve el flujo básico de reservas, pagos manuales, validación de asistencia y fidelidad. El siguiente salto no es "agregar más pantallas": es convertir el sistema en una herramienta profesional de gestión de citas, comparable en criterio operativo a plataformas como AgendaPro.

Hoy el producto tiene cuatro límites principales:

1. **Seguridad admin débil.** El login actual depende de password expuesta en bundle, cookie forgeable y guardias client-side.
2. **Backend fragmentado.** El frontend convive con Next API routes, Netlify Functions, Apps Script y restos Cloudflare.
3. **Agenda con lógica duplicada.** Hay múltiples fuentes de horarios, slots y capacidad.
4. **Panel admin operativo, pero no gerencial.** Permite validar pagos/asistencia y gestionar horarios, pero todavía no ofrece dashboard, ficha de clienta, métricas, trazabilidad ni automatizaciones robustas.

Si se construye UI encima de estas bases sin corregirlas, el sistema parecerá más profesional, pero seguirá siendo frágil. Primero estructura; después experiencia.

## What Changes

Este change coordina una mejora por fases. No reemplaza los changes existentes: los ordena como programa de trabajo.

### Fase 1: Seguridad y backend confiable

- Ejecutar `harden-admin-auth`.
- Ejecutar `harden-api-routes`.
- Consolidar variables críticas con `consolidate-env-vars`.
- Remover rutas y artefactos legacy que aumentan superficie de ataque.

Resultado esperado: el panel admin y las APIs sensibles quedan protegidas server-side.

### Fase 2: Arquitectura backend clara

- Formalizar `vanessa-studio-backend` como backend principal.
- Deprecar rutas legacy de Apps Script para booking.
- Eliminar Cloudflare Worker y scripts muertos.
- Definir un cliente API único en frontend para llamadas operativas.

Resultado esperado: una sola topología entendible para mantener, depurar y desplegar.

### Fase 3: Motor profesional de agenda

- Ejecutar `unify-slot-and-hours-logic`.
- Usar una única fuente de verdad para horarios.
- Asegurar soporte consistente para:
  - horario normal,
  - extra-cupos,
  - excepciones,
  - bloqueos,
  - duración por servicio,
  - conflictos de Calendar,
  - creación manual admin.

Resultado esperado: el mismo cálculo de disponibilidad se usa en cliente, admin y backend.

### Fase 4: Panel admin estilo plataforma de gestión

Transformar el panel desde "validación de citas" hacia "centro de operaciones".

Capacidades objetivo:

- Dashboard diario.
- Gestión completa de citas.
- Reprogramación.
- Cancelación con motivo.
- Marcado de `NO_SHOW`.
- Confirmación de depósito.
- Validación de asistencia.
- Ficha de clienta.
- Historial de reservas.
- Fidelidad integrada.
- Alertas operativas.

Resultado esperado: Vanessa puede gestionar el negocio desde el panel sin depender de revisión manual dispersa.

### Fase 5: Automatización y retención

- Recordatorios de pago pendiente.
- Recordatorios pre-cita.
- Avisos de reserva expirada.
- Seguimiento post-atención.
- Alertas de fidelidad.
- Alertas de clientas inactivas.

Resultado esperado: el sistema reduce trabajo manual y aumenta asistencia/retención.

## Out of Scope

- Migrar inmediatamente todo a una base de datos relacional.
- Integrar pagos online en esta primera etapa.
- Rediseñar todo el frontend público.
- Crear una app móvil.
- Reemplazar Google Sheets antes de estabilizar el modelo operativo.

Esas decisiones pueden ser correctas más adelante, pero hacerlas ahora sería mezclar fundaciones con decoración. Primero ordenamos el dominio.

## Success Criteria

- Las rutas admin no son accesibles sin sesión server-side válida.
- No existen passwords admin `NEXT_PUBLIC_*`.
- El flujo de citas usa una lógica única de disponibilidad.
- El panel muestra estado operativo diario sin depender de inspección manual del Sheet.
- Cada reserva tiene estado claro y transiciones auditables.
- Vanessa puede ver una ficha de clienta con historial y fidelidad.
- Las automatizaciones reducen acciones manuales repetitivas.

## Related

- `openspec/changes/harden-admin-auth`
- `openspec/changes/harden-api-routes`
- `openspec/changes/harden-secrets-and-gitignore`
- `openspec/changes/consolidate-env-vars`
- `openspec/changes/consolidate-config-drift`
- `openspec/changes/formalize-backend-submodule`
- `openspec/changes/remove-cloudflare-dead-code`
- `openspec/changes/unify-slot-and-hours-logic`
