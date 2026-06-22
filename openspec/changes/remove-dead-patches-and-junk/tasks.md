# Tasks: Remove Dead Patches and Junk Files

- [ ] Crear branch `chore/remove-dead-patches` desde `main`
- [ ] `git rm clasp-setup.patch extra-cupos-and-extra-flag.patch fix-availability.patch fix-duplicate-imports.patch fix-tailwind-styles.patch patch1.diff stable-slots-v1.patch`
- [ ] `git rm nul npx vanessa-nails@1.0.0 new.sh`
  - Si `git rm nul` falla en Windows: `del /f /q "\\?\C:\Users\EnderJavier\Documents\Proyectos WEB\vanessa_nails\vanessa-studio\nul"` y luego `git rm --cached nul`
- [ ] Añadir a `.gitignore`: `nul`, `npx`, `*-@*` (patrón defensivo para artefactos npm pack)
- [ ] Verificar: `git status` limpio, `ls *.patch *.diff` no retorna nada
- [ ] `npm run build` pasa sin errores
- [ ] Commit: `chore: remove dead patches and junk files`
