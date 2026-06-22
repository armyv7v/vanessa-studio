# Tasks: Add README and Onboarding

> Ejecutar tras `consolidate-env-vars` y `formalize-backend-submodule` para tener info definitiva.

## 1. Borrador de README.md
- [ ] Crear `README.md` en raíz con las 9 secciones del proposal
- [ ] Diagrama ASCII simple de la arquitectura
- [ ] Tabla de env vars (alineada con `consolidate-env-vars`)
- [ ] Sección backend según la decisión de `formalize-backend-submodule`

## 2. Revisar con specs
- [ ] Confirmar que lo descrito en README coincide con `openspec/specs/deployment-architecture/spec.md`
- [ ] Confirmar que los scripts listados existen en `package.json`

## 3. Enlaces a docs
- [ ] Verificar que `DESIGN.md`, `ADMIN_PANEL_GUIDE.md` existen tras `refresh-stale-docs`
- [ ] Verificar que `openspec/project.md` y `AGENTS.md` existen
- [ ] Añadir sección "Contributing" breve: "lee AGENTS.md antes de cambiar comportamiento"

## 4. Validación de onboarding
- [ ] Pedir a alguien (o a un agente IA) que intente clonar y correr siguiendo solo el README
- [ ] Documentar fricciones encontradas
- [ ] Iterar el README hasta que el setup sea reproducible

## 5. Commit
- [ ] Commit: `docs: add README with architecture, setup, and env vars`

## 6. Sección backend en repo del backend
- [ ] Crear `README.md` en `vanessa-studio-backend/` (cuando se formalice como repo aparte)
- [ ] Documentar: setup, env vars (Google OAuth, Brevo, Twilio, PIN), deploy Netlify, scheduled functions
