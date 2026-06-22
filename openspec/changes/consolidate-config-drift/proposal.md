# Proposal: Consolidate Config Drift

> **Severidad: MEDIUM**
> Tipo: cleanup / refactor
> Specs afectadas: `scheduling-config`

## Why

Hay varios archivos de config que **no reflejan la realidad runtime** o están **duplicados**:

1. `config/horarios.json` — default 09:00–22:00 todos los días (incl. domingo), pero el runtime usa 10:00–18:00 normal / 18:00–20:00 extra con domingos off.
2. `lib/config.js` (239 B) — **stub incompleto** que duplica `lib/services.js` (solo 2 de 8 servicios, con comentario `// ... resto de servicios`). Aparentemente muerto.
3. `lib/dateUtils.js` — función `getNextDays` que **no se usa** (BookingFlow inlines su propia versión).
4. `jsconfig.json` + `tsconfig.json` coexisten en un proyecto JS/JSX puro. `jsconfig.json` define el alias `@/*` que `tsconfig.json` no redefine — ambos son load-bearing pero confusos.

## What Changes

1. **Alinear `config/horarios.json`** con las reglas runtime reales (tras `unify-slot-and-hours-logic`). Marcarlo explícitamente como fallback.
2. **Eliminar `lib/config.js`** — confirmar primero con `grep -rn "from './config'\|from '../lib/config'\|require.*lib/config" .` que nada lo importa.
3. **Eliminar `lib/dateUtils.js`** — confirmar primero con `grep -rn "dateUtils\|getNextDays" .`.
4. **Consolidar `jsconfig.json` en `tsconfig.json`:** mover el alias `@/*` a `tsconfig.json` (paths), borrar `jsconfig.json`.

## Impacto

- Limpieza, sin cambios funcionales.
- Menos superficie de "¿qué archivo es el correcto?".

## Evidencia

- `config/horarios.json` — 09–22 incl. domingo
- `pages/index.js:16` — window 10:00–18:00
- `lib/calendarConfig.js` — domingos condicionalmente off
- `lib/config.js` — 239 B, solo 2 servicios
- `lib/services.js` — catálogo completo de 8 servicios
- `lib/dateUtils.js` — `getNextDays`
- `grep -rn "from.*lib/config'\|getNextDays" pages/ components/` para confirmar ausencia de uso

## Related

- Ejecutar tras `unify-slot-and-hours-logic` (que actualiza el default de horarios)
