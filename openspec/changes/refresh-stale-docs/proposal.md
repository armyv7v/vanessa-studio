# Proposal: Refresh Stale Docs

> **Severidad: MEDIUM**
> Tipo: documentation
> Specs afectadas: `notifications`, `admin-panel`

## Why

1. **`DESIGN.md` (23 KB)** data de `2026-04-15`, **pre-rediseño**. Los commits `22736d5`, `abad9aa`, `87e21e9`, `7cc3012` (Jun 2026) hicieron una migración al design "premium minimalist" que este doc no refleja. Es activamente engañoso.

2. **`ADMIN_PANEL_GUIDE.md`** data de `2026-04-14`, pre-refactor de login (`8a5a999 "implement device-based login"`, `a8de76c "clear admin_device_token"`). Describe un flujo que ya no es.

3. **6 guías WhatsApp para 3 providers** en `vanessa-studio-backend/docs/`:
   - `360dialog-setup.md` (provider no implementado)
   - `twilio-setup.md` (implementado)
   - `twilio-whatsapp-produccion.md` (Twilio prod)
   - `whatsapp-setup.md` (genérico)
   - `whatsapp-reminders-setup.md` (recordatorios)
   - `update-chatbot-info.md` (chatbot)
   
   Solo **Twilio** está en uso (`vanessa-studio-backend/package.json` no tiene SDK de 360dialog). Las demás son ruido o conflictivas.

## What Changes

1. **`DESIGN.md`:** reescribir o archivar. Si se reescribe: describir el design system actual (tokens de `tailwind.config.js`, `BrandMotifs`, paleta minimalista, componentes `.premium-*`). Si se archiva: mover a `docs/archive/DESIGN-pre-2026-06.md` y marcar el reemplazo.
2. **`ADMIN_PANEL_GUIDE.md`:** reescribir post-refactor. Documentar device login, validación PIN, y coordinar con `harden-admin-auth` cuando se aplique.
3. **Consolidar guías WhatsApp** en un único `vanessa-studio-backend/docs/WHATSAPP.md` (Twilio), archivar las demás.

## Impacto

- Documentación alineada con el código.
- Menos confusión para nuevos developers/agentes.
- Reduce risk de seguir instrucciones stale.

## Evidencia

- `DESIGN.md` — mtime 2026-04-15, 23 KB
- `ADMIN_PANEL_GUIDE.md` — mtime 2026-04-14
- `vanessa-studio-backend/docs/` — 6 archivos
- Commits de rediseño: `22736d5`, `abad9aa`, `87e21e9`, `7cc3012`, `fe0b9ef`
- Commits de auth: `8a5a999`, `a8de76c`
