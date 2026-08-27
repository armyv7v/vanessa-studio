# Proposal: Remove Cloudflare Dead Code

> **Severidad: CRITICAL**
> Tipo: cleanup / debt
> Spec afectada: `deployment-architecture`

## Why

El deploy target oficial es **Vercel** (`vanessa-studio.vercel.app`), pero el repo arrastra toda la infraestructura de **2 migraciones a Cloudflare abandonadas** (OpenNext + Pages + Worker standalone). Esto incluye:

- `.cf-deploy/` con **74 archivos tracked** (commit `caadccd`), incluyendo un `_worker.js` de **665 KB** — puro build artifact commiteado, que infla el repo y la historia de git.
- `wrangler.jsonc` (worker name con typo: `vanessa-studiols`), `open-next.config.mjs` y `open-next.config.ts` (este último es una **segunda config conflictiva** del mismo tool).
- `package.json` scripts `build:cf`, `preview:cf`, `deploy:cf`, `upload:cf`, `cf-typegen` — **deployan activamente a Cloudflare** contra el target Vercel.
- `deploy.sh` que deploya el output de Vercel a Cloudflare Pages (incoherente post-migración).
- `fix-edge-cloudflare.ps1` (PowerShell, CF edge patch).
- `api-worker/` — Worker TypeScript completo con su `wrangler.toml`, `tsconfig.json`, `vitest.config.mts`, `worker-configuration.d.ts` (335KB). Solo implementa `/api/slots` y `/api/gs-check`, ya cubiertos por rutas Next.js.
- Deps `@opennextjs/cloudflare: "latest"`, `wrangler: "latest"` (no reproducibles).
- `pages/wrangler.toml` (0 bytes, archivo vacío dentro de `pages/`).

Estos artefactos **confunden al deploy real**, generan ruido en el código y en diffs, y abren la puerta a que alguien ejecute accidentalmente `npm run deploy:cf` creyendo que es el deploy oficial.

## What Changes

Eliminar toda la maquinaria Cloudflare, dejando un deploy Vercel limpio y reproducible.

### Archivos a borrar (vía `git rm`)
- [CRITICAL] `.cf-deploy/` (todo el directorio, 74 archivos)
- [HIGH] `wrangler.jsonc`
- [HIGH] `open-next.config.mjs`
- [HIGH] `open-next.config.ts`
- [HIGH] `deploy.sh`
- [HIGH] `fix-edge-cloudflare.ps1`
- [HIGH] `api-worker/` (todo el directorio)
- [MEDIUM] `pages/wrangler.toml` (vacío)
- [LOW] `.wrangler/` (local, añadir a `.gitignore`)

### `package.json` a editar
- Eliminar scripts: `build:cf`, `preview:cf`, `deploy:cf`, `upload:cf`, `cf-typegen`
- Eliminar devDependencies: `@opennextjs/cloudflare`, `wrangler`
- Evaluar eliminación de `esbuild` (añadido en `1b3028e` "fix(cf): add missing esbuild dependency" — probablemente solo lo usa OpenNext)

### `.gitignore` a editar
- Añadir: `.wrangler/`, `.cf-deploy/` (defensivo)

## Impacto

- **Sin cambios funcionales.** El deploy Vercel ya funciona; esto solo remueve ruido.
- **Reducción de tamaño del repo:** ~665 KB de `_worker.js` + 335 KB de `worker-configuration.d.ts` + 74 archivos del build.
- **Riesgo:** verificar que `NEXT_PUBLIC_API_WORKER_URL` no esté seteada en Vercel (si lo está, hay que quitarla para que el frontend no intente llamar al Worker inexistente — pertenece a `consolidate-env-vars`).

## Evidencia

- `.cf-deploy/_worker.js` (665 KB) — commit `caadccd`
- `package.json:11-15` — scripts `*:cf`
- `package.json:33,43` — deps `@opennextjs/cloudflare`, `wrangler` con `latest`
- `wrangler.jsonc:1` — worker name `vanessa-studiols` (typo)
- `api-worker/src/index.ts:34-40` — rutas duplicadas
- `deploy.sh:4` — `wrangler pages deploy .vercel/output/static`
