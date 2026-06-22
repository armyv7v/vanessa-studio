# Proposal: Cleanup Git Remotes and Branches

> **Severidad: LOW**
> Tipo: cleanup / repo hygiene

## Why

El repo tiene restos de migraciones anteriores en su config de git:

- **2 remotes:** `origin` (vanessa-studio.git, activo) y `cf` (vanessa-studio-new.git, **repo abandonado** de la migración Cloudflare).
- **Branches stale:**
  - `fix-overlap-prod` — local, sin remote, último commit `2026-04-19` (~2 meses)
  - `origin/fix/slots-legacy-proxy` — remoto, último commit `2025-08-19` (~10 meses)
  - `origin/chore/reset-integrations` — remoto, último commit `2025-08-19` (~10 meses)

Estas ramas no se han mergeado a `main` y sus nombres sugieren que fueron puentes temporales ya obsoletos.

## What Changes

### Remotes
- `git remote remove cf` — el repo `vanessa-studio-new.git` ya no se usa (target es Vercel via `origin`).

### Branches locales
- `git branch -D fix-overlap-prod` (tras verificar que no tiene commits únicos no mergeados).

### Branches remotas
- `git push origin --delete fix/slots-legacy-proxy`
- `git push origin --delete chore/reset-integrations`

### Branches no atacadas
- `main` — mantener (es la default)
- Confirmar si hay otras branches en `origin` revisando `git ls-remote --heads origin`

## Impacto

- Sin impacto funcional.
- Menos ruido en `git branch -a`.
- Evita que alguien haga checkout por error de una branch con código obsoleto.

## Evidencia

- `git remote -v` muestra `origin` y `cf`
- `git branch -a` muestra las branches listadas
- El remote `cf` apunta a `vanessa-studio-new.git` que es el repo abandonado de CF

## Precaución

- **Antes de borrar branches:** ejecutar `git log main..<branch> --oneline` para confirmar que no tienen commits únicos con trabajo no mergeado.
- Si tienen commits únicos valiosos, hacer `git merge --no-ff` o cherry-pick primero.
