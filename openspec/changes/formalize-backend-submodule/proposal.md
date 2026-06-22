# Proposal: Formalize Backend Submodule

> **Severidad: HIGH**
> Tipo: architecture
> Specs afectadas: `deployment-architecture`, `booking-api`, `payments-loyalty`

## Why

`vanessa-studio-backend/` es un **repo git anidado dentro del frontend**, **gitignored** en el padre. Esto significa:

1. **Phantom dependency:** quien clona `vanessa-studio` **no obtiene el backend**. El sistema no funciona sin pasos manuales no documentados.
2. **No hay CI/CD conjunto:** un cambio en el frontend que dependa de un cambio del backend no se prueba junto.
3. **145 MB de `node_modules`** del backend viven en el working tree del frontend sin tracking.
4. **URL hardcoded:** el frontend referencia `https://vanessastudioback.netlify.app/...` en múltiples lugares, pero esa relación no está formalizada en ningún manifiesto.
5. **Dos esquemas de `Reservas`** (11 cols GAS vs 19 cols Netlify) coexisten porque el frontend puede llamar a ambos. Deprecar GAS requiere acordar que Netlify es el único writer.

## What Changes (3 opciones, ver `design.md` para detalle)

### Opción A — Git submodule (recomendada)
- Convertir `vanessa-studio-backend/` en un submodule git apuntando a su repo propio.
- Quitar la entrada de `.gitignore` que lo excluye.
- Documentar `git clone --recursive` en el README.
- **Pros:** relación explícita, versionado independiente, CI por repo.
- **Cons:** submodules son notoriamente frágiles en Windows; requiere que el repo del backend exista en GitHub.

### Opción B — Mover a repo propio sin submodule
- El backend se mueve a un repo GitHub independiente (`vanessa-studio-backend`).
- El frontend lo referencia solo por URL deployada (como hoy), pero documentado.
- Quitar la carpeta física del frontend.
- **Pros:** más simple, sin frictions de submodule.
- **Cons:** pierdes co-evolución atada (cambios coordinados son manuales).

### Opción C — Monorepo (no recomendada)
- Mover el backend dentro del frontend como carpeta normal, deployar desde un solo repo.
- **Pros:** máxima co-evolución.
- **Cons:** rompe el deploy separado (Netlify vs Vercel), requiere Workspaces npm.

## Decisión recomendada
**Opción A (submodule)** si el repo del backend ya existe o se crea fácilmente en GitHub. **Opción B** si Vanessa prefiere mantener separación máxima. **Opción C** descartada por la complejidad de deploy dual.

## Impacto

- Necesita **un repo GitHub para el backend** (crear `armyv7v/vanessa-studio-backend` o similar).
- Update del `.gitignore` y del proceso de clone.
- Documentación obligatoria en README.

## Evidencia

- `vanessa-studio-backend/.git/` existe (nested git repo)
- `.gitignore:30` — `vanessa-studio-backend/` (gitignored en el padre)
- `pages/api/slots.js:4` — URL Netlify hardcodeada
- `pages/api/book.js`, `pages/validar.js`, `pages/admin/*` — múltiples referencias al backend
- `vanessa-studio-backend/package.json` — propio lockfile y deps

## Related

- Depende de `add-readme-and-onboarding` (documentación del setup)
- Coordina con `consolidate-env-vars` (URLs del backend)
- Deprecación del GAS para booking se discute aparte (fuera de scope)
