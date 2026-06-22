# Design: Formalize Backend Submodule

> Alternativas evaluadas con detalle. Companion de `proposal.md`.

## Contexto

`vanessa-studio-backend/` contiene 145 MB con su propio `.git`, `package.json`, `node_modules`, y está gitignored en el padre. Deploya a `vanessastudioback.netlify.app`. El frontend lo referencia por URL hardcodeada en múltiples archivos.

## Opción A — Git submodule

```
vanessa-studio/
  .gitmodules
  vanessa-studio-backend/   ← submodule
```

**Pasos:**
1. Crear repo GitHub `armyv7v/vanessa-studio-backend` (si no existe).
2. Push del contenido actual del backend a ese repo.
3. En el frontend: `git rm -r --cached vanessa-studio-backend` (no se trackea, solo referencia).
4. Quitar entrada de `.gitignore`.
5. `git submodule add https://github.com/armyv7v/vanessa-studio-backend.git vanessa-studio-backend`.
6. Commit del `.gitmodules`.
7. Documentar `git clone --recursive` y `git submodule update --init --recursive`.

**Pros:**
- ✅ Relación explícita entre frontend y backend.
- ✅ Versionado independiente (puedes fijar el backend a un commit específico).
- ✅ CI por repo, más simple.
- ✅ Estándar de la industria para esta situación.

**Cons:**
- ⚠️ Submodules en Windows (cmd/PowerShell) son notoriamente frágiles — paths largos, permisos.
- ⚠️ Require educar al equipo en `submodule update`.
- ⚠️ Deploy Netlify del backend debe configurarse para hacer pull del submodule (o deployar directo desde su repo).

## Opción B — Repo separado, sin submodule

```
~/code/
  vanessa-studio/              ← este repo
  vanessa-studio-backend/      ← repo aparte, clonado al lado
```

**Pasos:**
1. Crear repo GitHub `armyv7v/vanessa-studio-backend`.
2. Push del backend a ese repo.
3. Borrar la carpeta `vanessa-studio-backend/` del frontend working tree.
4. Quitar entrada de `.gitignore` (ya no aplica).
5. Documentar en README que hay que clonar el backend al lado.

**Pros:**
- ✅ Máxima simplicidad — sin magia de submodules.
- ✅ Deploy Netlify directo desde el repo del backend (estándar).
- ✅ Cero fricción en Windows.

**Cons:**
- ⚠️ Co-evolución manual: un cambio coordinado requiere 2 PRs en 2 repos.
- ⚠️ No hay versionado cruzado (no sabes qué commit del backend matchea el frontend).

## Opción C — Monorepo

```
vanessa-studio/
  apps/
    web/        ← Next.js
    api/        ← Netlify functions
```

**Descartada** porque:
- ❌ Deploy dual (Vercel + Netlify) desde un monorepo requiere configuración no trivial.
- ❌ Workspaces npm añaden complejidad.
- ❌ No aporta mucho sobre la Opción A para este caso.

## Recomendación

**Opción B** (repo separado) por simplicidad y porque el frontend y backend cambian a ritmos distintos (el backend es muy estable; el frontend cambia seguido por diseño). La co-evolución manual es rara y manejable.

Si en el futuro los cambios coordinados se vuelven frecuentes, migrar a **Opción A** es trivial.

## Post-decisión

Sea cual sea, hay que:
1. Asegurar que el repo del backend tenga su propio `README.md` y `.env.example`.
2. Documentar en el frontend `README.md` cómo correr ambos localmente.
3. Considerar un script `dev.sh` que levante los dos servers.
