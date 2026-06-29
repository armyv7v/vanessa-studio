# Tasks: Unify Slot and Hours Logic

## 1. Auditoría previa
- [x] `grep -rn "available-slots\|getAvailableSlotsRange" pages/ components/ lib/` → confirmar si alguien consume `/api/available-slots`
- [x] Si lo usa algo: documentar dónde y reconsiderar opción B (refactor vs eliminar)

## 2. Eliminar motor duplicado en lib/api.js
- [x] Identificar los imports actuales de `lib/api.js` que consumen `generateTimeSlots`/`buildAvailableRange`/`isSlotBusy` locales
- [x] Reemplazar por `import { generateTimeSlots, isSlotBusy } from './slots'`
- [x] Borrar las implementaciones locales en `lib/api.js:30-99`
- [x] `npm run build` pasa
- [ ] Commit: `refactor(slots): remove duplicate slot engine from lib/api.js`

## 3. Eliminar o refactorizar /api/available-slots.js
- [x] Si nada lo consume: `git rm pages/api/available-slots.js` + borrar referencias en `lib/api.js` (`getAvailableSlotsRange`)
- [x] Si algo lo consume: refactorizar para que pida config admin vía Netlify y no use hours hardcoded
- [ ] Commit: `refactor(slots): remove unused available-slots route` (o el correspondiente)

## 4. Hacer que BookingFlow lea business hours de la config admin
- [x] Modificar `BookingFlow.js`: el fetch inicial a `/api/gs-check?action=getConfig` ya existe — usarlo para derivar `window` por modo (normal/extra) en vez de recibirlo por props hardcoded
- [x] Mantener props como override solo para tests
- [x] Actualizar `pages/index.js` y `pages/extra-cupos.js`: ya no pasan windows hardcoded; solo pasan `mode: 'normal' | 'extra'`
- [ ] Commit: `refactor(booking): derive business hours from admin config instead of hardcoded windows`

## 5. Demover calendarConfig como fallback only
- [x] Documentar en `lib/calendarConfig.js` (comentario en cabecera) que es fallback cuando la config admin no carga
- [ ] No cambiar la lógica (sigue siendo el safety net)

## 6. Alinear config/horarios.json con la realidad
- [x] Actualizar `config/horarios.json` con el default real (10:00–18:00 normal, 18:00–20:00 extra, sábado condicional, domingo off)
- [x] Comentario en el JSON aclarando que es fallback
- [ ] Commit: `chore(config): align horarios.json default with runtime rules`

## 7. Pruebas
- [ ] Flujo de reserva normal muestra los mismos slots que antes
- [ ] Flujo extra-cupos muestra slots 18–20
- [ ] Si se editan horarios vía admin, BookingFlow los refleja tras reload
- [x] Si la config admin falla al cargar, el flujo cae a calendarConfig sin crashear

## 8. Actualizar spec
- [x] Actualizar `openspec/specs/scheduling-config/spec.md` para reflejar la fuente única de horas
- [ ] Commit: `docs(spec): update scheduling-config for unified hours source`
