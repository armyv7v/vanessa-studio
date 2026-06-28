# Design: Consolidate Backend Routing

## Problem

La resolución actual de backend está distribuida entre helpers, páginas y API routes con convenciones distintas. Eso introduce:

- dependencias implícitas de entorno,
- riesgo de drift,
- fallbacks inconsistentes,
- URLs hardcodeadas repetidas.

## Proposed approach

### 1. Single source of truth

Crear un helper de resolución con prioridad explícita:

1. variable pública específica para backend Netlify
2. base URL pública de backend si existe
3. fallback controlado documentado

No permitir múltiples órdenes distintos según archivo.

### 2. Keep behavior, reduce ambiguity

No cambiar primero el contrato funcional.
Primero consolidar cómo se decide **a dónde** se llama.

### 3. Incremental migration

Aplicar el helper a:

- `lib/api.js`
- `pages/api/available-slots.js`
- `pages/api/gs-check.js`
- `pages/api/slots.js`
- `pages/admin/validar-citas.js`

### 4. Documentation sync

Actualizar specs para que describan la convención real y no una mezcla histórica.

## Risks

- Romper fallbacks locales si se elimina un default antes de documentarlo.
- Confundir flujo GAS vs Netlify si se intenta consolidar y refactorizar lógica al mismo tiempo.

## Mitigation

- Cambios quirúrgicos.
- Build y pruebas manuales por endpoint.
- Mantener slice enfocado solo en routing/config resolution.
