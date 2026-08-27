# Proposal: Remove Dead Dependencies

> **Severidad: MEDIUM**
> Tipo: cleanup / deps
> Spec afectada: `notifications` (vía `@sendgrid/mail`)

## Why

Hay dependencias declaradas en `package.json` que **no se importan en ningún lado** del código fuente. Aumentan el tiempo de `npm install`, el tamaño del bundle potencial, y la superficie de CVEs.

## What Changes

### Dependencias confirmadas muertas (cero imports)
| Dep | Tipo | Evidencia |
|---|---|---|
| `@sendgrid/mail` (^8.0.0) | `dependencies` | Búsqueda `require('@sendgrid` y `from '@sendgrid` en `pages/`, `components/`, `lib/` retorna **0 matches**. El email se envía vía Brevo en el backend Netlify. |
| `react-day-picker` (^9.8.1) | `dependencies` | 0 imports en `pages/`, `components/`. El calendario del booking es custom. |

### Dependencias a evaluar
| Dep | Razón para revisar |
|---|---|
| `lucide-react` (^0.542.0) | Solo se usa en `pages/admin/validar-citas.js`. Los commits `7cc3012` y `fe0b9ef` muestran migración **a BrandMotifs** (SVGs custom). Verificar si aún se usa o es leftover. |
| `esbuild` (^0.25.3) | Añadido en `1b3028e` para OpenNext (CF). Verificar tras `remove-cloudflare-dead-code`. |
| `date-fns` (^3.6.0) vs `luxon` (^3.4.4) | Coexisten ambas libs de fecha. Elegir una y consolidar. |

### Sin acción (deps vivas, documentar)
- `luxon`: usado en admin, api, lib
- `lucide-react`: **verificar primero** — si queda solo en `validar-citas.js`, decidir si migrarlo a BrandMotifs o mantenerlo

## Impacto

- Menos `npm install` time, menos lockfile churn.
- Reducción de superficie de CVEs.
- Posible reducción de bundle client (si las muertas terminaban en bundle).

## Evidencia

- `grep -rn "@sendgrid" pages/ components/ lib/` → 0 matches
- `grep -rn "react-day-picker\|day-picker" pages/ components/ lib/` → 0 matches
- `grep -rn "from 'lucide-react'" pages/ components/` → solo `pages/admin/validar-citas.js`
- `package.json:21` — `@sendgrid/mail`
- `package.json:28` — `react-day-picker`

## Orden de ejecución

1. Ejecutar **después** de `remove-cloudflare-dead-code` (para evaluar `esbuild` sin ruido).
2. Antes de `consolidate-env-vars` (que simplifica imports).
