# Proposal: Patch Next.js and Pin Dependencies

> **Severidad: HIGH**
> Tipo: security / deps
> Specs afectadas: `deployment-architecture`

## Why

1. **Next.js 14.2.5** (Jul 2024) tiene múltiples CVEs conocidos parchados en 14.2.x posteriores. Esta es la dep más crítica del proyecto (framework, maneja rutas server-side).
2. **`engines.node: ">=18"`** permite Node 18 (EOL Abr 2025) — Vercel runtime actual es 20/22.
3. **Deps en `latest`:**
   - `@opennextjs/cloudflare: latest` (eliminado en `remove-cloudflare-dead-code`)
   - `wrangler: latest` (eliminado en `remove-cloudflare-dead-code`)
   - Builds no reproducibles.

## What Changes

### Next.js
- Bump `next` y `eslint-config-next` de `14.2.5` al **último 14.2.x** estable (verificar versión actual con `npm view next versions --json | grep "14.2"`).
- Considerar si saltar a 15.x tiene sentido (probablemente no en esta auditoría — cambio mayor).

### engines.node
- Cambiar `"engines": { "node": ">=18" }` → `"engines": { "node": ">=20" }` (o `">=20.0.0 <23"`).
- Asegurar que Vercel usa Node 20 en la config del project.

### Pin versions
- Reemplazar cualquier `"latest"` restante por versión pinneada.
- Tras `remove-cloudflare-dead-code`, las `latest` de CF se van.

## Impacto

- **Next patch:** usualmente backward-compatible dentro de 14.2.x, pero probar build + deploy preview.
- **engines收紧:** no afecta builds en Vercel (ya usa 20+), pero documenta el requisito.
- **Reproducibilidad:** lockfile más estable.

## Evidencia

- `package.json:25` — `"next": "14.2.5"`
- `package.json:39` — `"eslint-config-next": "14.2.5"`
- `package.json:45-47` — `"engines": { "node": ">=18" }`
- `package.json:33,43` — `latest` en CF deps
- Node local: `v24.12.0`

## Related

- Ejecutar **después** de `remove-cloudflare-dead-code` (elimina las `latest` de CF)
