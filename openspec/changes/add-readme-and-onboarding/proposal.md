# Proposal: Add README and Onboarding

> **Severidad: HIGH**
> Tipo: documentation
> Specs afectadas: `deployment-architecture`

## Why

**No existe `README.md`** en la raíz del repo (`git ls-files | findstr -i readme` retorna vacío). Para un proyecto deployado en producción con 3 backends, 2 repos y múltiples integraciones, esto es un gap crítico de onboarding:

- Nuevos developers (o agentes IA) no saben cómo correr el sistema.
- No hay descripción de la arquitectura en el punto de entrada del repo.
- Las env vars no están documentadas (solo `.env.example` con placeholders).

## What Changes

Crear **`README.md`** en la raíz con:

### 1. Descripción del proyecto
Qué es Vanessa Studio, para quién, link a `https://vanessa-studio.vercel.app/`.

### 2. Arquitectura (resumen)
Diagrama simplificado: Next.js (Vercel) + Netlify backend + Apps Script + Google Sheets/Calendar. Referencia a `openspec/` para detalle.

### 3. Setup local
```bash
git clone <repo>
cd vanessa-studio
npm install
cp .env.example .env.local  # rellenar valores
npm run dev                 # http://localhost:3000
```

### 4. Backend
Documentar que el backend es un repo separado (`vanessa-studio-backend`), cómo clonarlo, y cómo correrlo localmente con `netlify dev`.

### 5. Variables de entorno
Tabla con cada env var: nombre, propósito, pública/server, dónde configurarla (Vercel/Netlify/local).

### 6. Scripts disponibles
`npm run dev`, `build`, `lint`, `gs:push`. Aclarar que NO hay `npm run deploy` (Vercel auto-deploy on push).

### 7. Flujo de trabajo con spec-kit
Enlace a `AGENTS.md` y `openspec/`. Resumen del ciclo `/specify → /plan → /tasks`.

### 8. Documentación relacionada
- `openspec/` — specs y changes
- `DESIGN.md` — design system
- `ADMIN_PANEL_GUIDE.md` — guía admin
- `instrucciones_agentes.md` — reglas históricas

### 9. Deploy
- Frontend: auto-deploy en push a `main` vía Vercel.
- Backend: deploy del repo `vanessa-studio-backend` a Netlify.
- GAS: `npm run gs:push` (clasp).

## Impacto

- Onboarding de 0 a "corriendo localmente" pasa de "adivinar" a "seguir pasos".
- Reduce fricción para cualquier agente IA o humano que entre al repo.

## Evidencia

- `git ls-files | findstr -i readme` → vacío
- 49 items en raíz del repo sin punto de entrada documentado
- Múltiples integraciones no documentadas en ningún sitio central

## Related

- Coordina con `formalize-backend-submodule` (sección de backend del README depende de esa decisión)
- Coordina con `consolidate-env-vars` (tabla de env vars definitiva)
