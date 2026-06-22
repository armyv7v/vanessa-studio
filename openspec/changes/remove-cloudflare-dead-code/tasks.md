# Tasks: Remove Cloudflare Dead Code

> Ejecutar en orden. Verificar tras cada paso.

## 1. Backup de seguridad
- [ ] Crear branch `chore/remove-cloudflare-dead-code` desde `main`
- [ ] Confirmar con `git status` que no hay cambios pendientes no guardados

## 2. Eliminar `.cf-deploy/` (CRITICAL)
- [ ] `git rm -r .cf-deploy/`
- [ ] Verificar: `git ls-files .cf-deploy/ | wc -l` debe ser `0`
- [ ] Commit: `chore(cf): remove tracked .cf-deploy build artifacts`

## 3. Eliminar configs y scripts Cloudflare
- [ ] `git rm wrangler.jsonc open-next.config.mjs open-next.config.ts deploy.sh fix-edge-cloudflare.ps1 pages/wrangler.toml`
- [ ] Verificar: ninguno de esos archivos existe ya en el working tree
- [ ] Commit: `chore(cf): remove wrangler/open-next configs and deploy scripts`

## 4. Eliminar `api-worker/` completo
- [ ] `git rm -r api-worker/`
- [ ] Verificar: `git ls-files api-worker/ | wc -l` debe ser `0`
- [ ] Buscar referencias a `api-worker` en el resto del código: `grep -ri "api-worker" --exclude-dir=.git .` → debe estar limpio
- [ ] Commit: `chore(cf): remove standalone api-worker project`

## 5. Limpiar `package.json`
- [ ] Borrar los 5 scripts `*:cf` y `cf-typegen`
- [ ] Borrar devDeps `@opennextjs/cloudflare` y `wrangler`
- [ ] Evaluar si `esbuild` sigue siendo necesario: `grep -ri "esbuild" --include="*.js" --include="*.json" .` (fuera de node_modules) → si no aparece, borrarlo también
- [ ] `npm install` para regenerar `package-lock.json`
- [ ] Verificar: `npm run build` sigue pasando
- [ ] Commit: `chore(deps): remove cloudflare and unused devDependencies`

## 6. Actualizar `.gitignore`
- [ ] Añadir entradas: `.wrangler/`, `.cf-deploy/`, `.open-next/` (ya existe), `open-next.config.*`
- [ ] Commit: `chore(git): ignore cloudflare/open-next artifacts`

## 7. Verificación final
- [ ] `npm run build` pasa sin errores
- [ ] `npm run lint` pasa sin errores nuevos
- [ ] `grep -ri "wrangler\|opennext\|cloudflare" --include="*.js" --include="*.json" --include="*.md" .` (excluyendo `openspec/`, `node_modules`, `instrucciones_agentes.md`) → limpio
- [ ] Deploy preview en Vercel funciona (auto-deploy de la branch)

## 8. Post-merge
- [ ] Verificar en producción `vanessa-studio.vercel.app` que el sitio carga
- [ ] Verificar que una reserva de prueba funciona extremo a extremo
