# Tasks: Cleanup Git Remotes and Branches

## 1. Auditoría de branches con commits únicos
- [ ] `git log main..fix-overlap-prod --oneline` → si output vacío, safe delete; si tiene commits, revisar
- [ ] `git log main..origin/fix/slots-legacy-proxy --oneline` → mismo
- [ ] `git log main..origin/chore/reset-integrations --oneline` → mismo
- [ ] Para cualquier branch con commits únicos: decidir merge/cherry-pick antes de borrar

## 2. Listar branches remotas extras
- [ ] `git ls-remote --heads origin` → confirmar lista completa
- [ ] Cualquier otra branch remota > 6 meses sin actividad: candidata a delete

## 3. Eliminar remote `cf`
- [ ] `git remote remove cf`
- [ ] Verificar: `git remote -v` solo muestra `origin`
- [ ] (Opcional) archivar el repo `vanessa-studio-new.git` en GitHub settings (marcarlo como archived)

## 4. Eliminar branches locales
- [ ] `git branch -D fix-overlap-prod` (si auditoría del paso 1 lo permite)
- [ ] Verificar: `git branch` ya no la lista

## 5. Eliminar branches remotas
- [ ] `git push origin --delete fix/slots-legacy-proxy`
- [ ] `git push origin --delete chore/reset-integrations`
- [ ] Verificar: `git ls-remote --heads origin` ya no las lista

## 6. Documentación
- [ ] Actualizar `openspec/specs/deployment-architecture/spec.md` si menciona el remote `cf`
- [ ] Commit (si cambió algo trackeado): `chore(git): remove abandoned cf remote and stale branches`
  - Nota: la mayoría de estas operaciones no tocan archivos trackeados, así que puede no haber commit directo. Documentar el cambio en el `tasks.md` o en `RETRO.md` de este change.
