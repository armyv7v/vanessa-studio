# Tasks: Consolidate Config Drift

## 1. Confirmar que lib/config.js está muerto
- [ ] `grep -rn "lib/config\|from './config'\|from '../config'" pages/ components/ lib/` → debe ser 0
- [ ] Si 0 matches: `git rm lib/config.js`
- [ ] Commit: `chore: remove unused lib/config.js stub`

## 2. Confirmar que lib/dateUtils.js está muerto
- [ ] `grep -rn "dateUtils\|getNextDays" pages/ components/ lib/` → debe ser 0 (o solo la def en dateUtils.js)
- [ ] Si 0 usos externos: `git rm lib/dateUtils.js`
- [ ] Commit: `chore: remove unused lib/dateUtils.js`

## 3. Alinear config/horarios.json (tras unify-slot-and-hours-logic)
- [ ] Editar `config/horarios.json` para reflejar: 10:00–18:00 lun-vie normal, 18:00–20:00 extra, sábado 10:00–14:00, domingo cerrado
- [ ] Añadir comentario: `// fallback cuando ConfiguracionHorarios (sheet) no carga`
- [ ] Commit: `chore(config): align horarios.json with runtime rules`

## 4. Consolidar jsconfig.json → tsconfig.json
- [ ] Abrir `tsconfig.json`, añadir en `compilerOptions`:
  ```json
  "baseUrl": ".",
  "paths": { "@/*": ["./*"] }
  ```
- [ ] `git rm jsconfig.json`
- [ ] `npm run build` pasa
- [ ] `npm run lint` pasa
- [ ] Verificar que imports tipo `@/components/...` (si los hay) resuelven
- [ ] Commit: `chore(tsconfig): merge jsconfig path alias into tsconfig.json`

## 5. date-fns vs luxon (evaluar, separar en otro change si se ejecuta)
- [ ] `grep -rn "from 'date-fns'\|require('date-fns')" .` → contar
- [ ] `grep -rn "from 'luxon'\|require('luxon')" .` → contar
- [ ] Documentar counts aquí para decidir cuál eliminar
- [ ] (Si se decide) crear change separado `consolidate-date-libs` con la migración
