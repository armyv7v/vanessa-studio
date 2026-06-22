# Tasks: Refresh Stale Docs

## 1. DESIGN.md
- [ ] Leer `DESIGN.md` actual y comparar con `tailwind.config.js`, `styles/globals.css`, `components/BrandMotifs.js`
- [ ] Decidir: reescribir o archivar
- [ ] **Opción reescribir:** actualizar secciones de paleta, tipografía, componentes `.premium-*`, motion, iconos (BrandMotifs reemplazó a lucide en la mayoría)
- [ ] **Opción archivar:** `mkdir -p docs/archive && git mv DESIGN.md docs/archive/DESIGN-pre-2026-06.md`
- [ ] En cualquier caso, añadir nota en `openspec/specs/` o README apuntando al design system actual
- [ ] Commit: `docs(design): refresh DESIGN.md for premium-minimalist redesign` (o `archive`)

## 2. ADMIN_PANEL_GUIDE.md
- [ ] Leer versión actual
- [ ] Reescribir:
  - Flujo login con device token (o el nuevo server-side tras `harden-admin-auth`)
  - 3 páginas admin (Horarios, Turnos, Validar citas)
  - PIN para mutaciones sensibles
  - Logout limpia cookie + localStorage
- [ ] Commit: `docs(admin): rewrite panel guide for device-login + current pages`

## 3. Consolidar guías WhatsApp
- [ ] Leer las 6 guías en `vanessa-studio-backend/docs/`
- [ ] Identificar contenido único vs duplicado
- [ ] Crear `vanessa-studio-backend/docs/WHATSAPP.md` unificado (solo Twilio):
  - Setup Twilio
  - Configuración producción
  - Webhook inbound
  - Recordatorios
  - Chatbot FAQ
- [ ] `git rm 360dialog-setup.md twilio-setup.md twilio-whatsapp-produccion.md whatsapp-setup.md whatsapp-reminders-setup.md update-chatbot-info.md`
- [ ] (Opcional) `git mv` de las útiles a `docs/archive/` en vez de borrar
- [ ] Commit (en el repo del backend): `docs: consolidate WhatsApp guides into single Twilio doc`

## 4. Documentación de referencias cruzadas
- [ ] En `openspec/specs/notifications/spec.md`: actualizar la sección "Documentación existente" para que apunte al nuevo `WHATSAPP.md` único
- [ ] En `README.md` (cuando se cree en `add-readme-and-onboarding`): enlazar a DESIGN.md, ADMIN_PANEL_GUIDE.md, WHATSAPP.md
