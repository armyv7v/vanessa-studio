# Tasks: Remove Dead Dependencies

## 1. Confirmar que @sendgrid/mail y react-day-picker no se usan
- [ ] `grep -rn "@sendgrid" pages/ components/ lib/ scripts/` → confirmar 0 matches
- [ ] `grep -rn "react-day-picker\|day-picker\|DayPicker" pages/ components/ lib/` → confirmar 0 matches
- [ ] Si aparecen matches: detener y re-evaluar

## 2. Evaluar lucide-react
- [ ] `grep -rn "lucide-react" pages/ components/` → listar todos los imports
- [ ] Si solo queda `pages/admin/validar-citas.js`: decidir (migrar a BrandMotifs o mantener)
- [ ] Documentar la decisión en `ADMIN_PANEL_GUIDE.md` si se mantiene

## 3. Eliminar deps muertas
- [ ] `npm uninstall @sendgrid/mail react-day-picker`
- [ ] (Opcional) si `lucide-react` se decide eliminar: `npm uninstall lucide-react` tras migrar iconos
- [ ] Verificar: `npm run build` pasa
- [ ] Verificar: `npm run lint` pasa
- [ ] Commit: `chore(deps): remove unused @sendgrid/mail and react-day-picker`

## 4. Evaluar esbuild (tras remove-cloudflare-dead-code)
- [ ] `grep -rn "esbuild" --include="*.js" --include="*.mjs" --include="*.cjs" .` (excluyendo node_modules) → si 0 matches, eliminar
- [ ] `npm uninstall esbuild`
- [ ] `npm run build` pasa
- [ ] Commit: `chore(deps): remove unused esbuild`

## 5. Decisión date-fns vs luxon (separar en otro change si se ejecuta)
- [ ] Contar usos: `grep -rn "from 'date-fns'\|require('date-fns')" .` vs `grep -rn "from 'luxon'\|require('luxon')" .`
- [ ] Documentar en `openspec/changes/consolidate-config-drift` la decisión
- [ ] (Fuera de este change) migrar todo a la lib elegida

## 6. Probar legacy-peer-deps
- [ ] Tras eliminar deps muertas, probar: `rm node_modules package-lock.json && npm install` (sin `.npmrc` temporalmente)
- [ ] Si pasa sin `legacy-peer-deps=true`: eliminar `.npmrc` o documentar por qué se mantiene
- [ ] Si falla: restaurar `.npmrc` y documentar el conflicto en este archivo
