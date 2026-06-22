# Tasks: Formalize Backend Submodule

> Decidir primero entre Opción A (submodule) o B (repo separado). El design.md recomienda B.

## 0. Decisión
- [ ] Confirmar con Vanessa/usuarios qué opción aplicar (A o B)
- [ ] Documentar la decisión en este archivo

## 1. Preparar el repo del backend (común a A y B)
- [ ] Crear repo GitHub `armyv7v/vanessa-studio-backend` (o confirmar si ya existe)
- [ ] Desde dentro de `vanessa-studio-backend/`: verificar que el `.git` local está limpio
- [ ] Push del contenido actual a `origin/main` del nuevo repo
- [ ] Verificar que `vanessastudioback.netlify.app` sigue deployando desde el nuevo repo (reconectar Netlify si hace falta)
- [ ] Confirmar que una reserva de prueba funciona tras el cambio de source

## 2. Si Opción B (repo separado) — RECOMENDADA
- [ ] Salir del frontend repo y borrar la carpeta física: `rm -rf vanessa-studio-backend/`
- [ ] En `.gitignore` del frontend: quitar la línea `vanessa-studio-backend/` (ya no aplica)
- [ ] Commit: `chore: extract vanessa-studio-backend to its own repository`
- [ ] Actualizar `README.md` (ver `add-readme-and-onboarding`) para documentar el setup dual
- [ ] Crear `vanessa-studio-backend/README.md` con setup del backend

## 3. Si Opción A (submodule)
- [ ] `git rm -r --cached vanessa-studio-backend` (preserva working tree)
- [ ] Quitar la entrada `vanessa-studio-backend/` de `.gitignore`
- [ ] `git submodule add https://github.com/armyv7v/vanessa-studio-backend.git vanessa-studio-backend`
- [ ] Commit: `chore: add vanessa-studio-backend as git submodule`
- [ ] Probar en un clone limpio: `git clone --recursive ...` debe funcionar
- [ ] Configurar Netlify para deployar desde el repo del backend directamente

## 4. Documentación (común)
- [ ] En `README.md` del frontend: sección "Arquitectura" explicando que el backend es un repo aparte
- [ ] En `README.md` del backend: setup local, env vars, deploy
- [ ] En `openspec/specs/deployment-architecture/spec.md`: actualizar la topología

## 5. Pruebas
- [ ] Clone limpio del frontend + clone del backend → ambos corren localmente
- [ ] Deploy preview del frontend funciona
- [ ] Deploy del backend funciona
- [ ] Reserva de prueba extremo a extremo funciona

## 6. Deprecación de GAS para booking (opcional, fuera de scope principal)
- [ ] Discutir con Vanessa si se elimina la ruta GAS `doPost` (legacy, 11 cols)
- [ ] Si sí: bloquear `NEXT_PUBLIC_GAS_WEBHOOK_URL` en `/api/book`, eliminar `MailApp.sendEmail`, migrar `sendMaintenanceReminders` al backend Netlify
- [ ] Si no: documentar explícitamente que GAS es fallback legacy
