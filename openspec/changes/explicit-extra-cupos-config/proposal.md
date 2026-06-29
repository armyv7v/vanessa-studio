# Proposal: Explicit Extra-Cupos Config

## Why

Hoy `extra-cupos` existe como comportamiento del frontend, pero NO como configuración explícita del panel admin. Eso obliga a depender de un fallback (`18:00–20:00`) aunque la fuente remota de horarios no lo modele.

## What Changes

- Agregar `extraCuposConfig` al modelo de configuración de horarios.
- Permitir editar esa franja desde `/admin/horarios`.
- Hacer que `BookingFlow` use `extraCuposConfig` remota cuando el modo sea `extra`.
- Mantener fallback local si la config remota no está disponible.

## Impact

- El modo extra deja de depender de inferencias implícitas.
- El panel admin pasa a controlar explícitamente la franja extendida.
- Se profesionaliza el modelo de scheduling sin romper el flujo actual.
