# Tasks: Professionalize Admin and Backend Operations

## 1. Preparar base segura

- [ ] Ejecutar `harden-secrets-and-gitignore` si quedan secretos locales o defaults inseguros.
- [x] Implementar primera etapa de `harden-admin-auth`.
- [ ] Implementar `harden-api-routes` (avance fuerte: rate limit, validation, CORS local, security headers frontend, Next 14.2.35, Netlify local hardening; pendiente deploy Netlify y deuda breaking restante).
- [x] Verificar que `/admin/*` no renderiza sin sesión válida.
- [x] Verificar que `/api/admin/*` responde `401` sin sesión válida.
- [x] Eliminar uso de `NEXT_PUBLIC_ADMIN_PASSWORD` del login y `.env.example`.

## 2. Consolidar arquitectura backend

- [ ] Ejecutar `formalize-backend-submodule`.
- [ ] Ejecutar `remove-cloudflare-dead-code`.
- [ ] Ejecutar `remove-dead-dependencies` si aplica al panel admin.
- [ ] Ejecutar `consolidate-env-vars`.
- [ ] Documentar backend principal y rutas legacy.
- [ ] Crear cliente API único para llamadas desde admin.

## 3. Unificar agenda y disponibilidad

- [ ] Ejecutar `unify-slot-and-hours-logic`.
- [ ] Ejecutar `consolidate-config-drift`.
- [ ] Definir una fuente de verdad para horarios.
- [ ] Alinear booking público, extra-cupos y creación manual admin.
- [ ] Agregar pruebas/casos manuales para conflictos de Calendar.
- [ ] Verificar zona horaria `America/Santiago`.

## 4. Profesionalizar gestión de citas

- [ ] Definir estados finales de reserva.
- [ ] Agregar transición `CANCELADA`.
- [ ] Agregar transición `NO_SHOW`.
- [ ] Agregar reprogramación con referencia a cita anterior.
- [ ] Agregar motivo de cancelación.
- [ ] Registrar timestamps de acciones críticas.
- [ ] Mostrar historial de acciones en admin.

## 5. Crear dashboard operativo

- [ ] Diseñar resumen diario.
- [ ] Mostrar citas de hoy.
- [ ] Mostrar pagos pendientes.
- [ ] Mostrar reservas por expirar.
- [ ] Mostrar alertas de fidelidad.
- [ ] Mostrar ingresos estimados.
- [ ] Agregar acciones rápidas desde cada card/lista.

## 6. Crear ficha de clienta

- [ ] Resolver identidad de clienta por email/teléfono.
- [ ] Mostrar historial de reservas.
- [ ] Mostrar próxima cita.
- [ ] Mostrar sellos y recompensa.
- [ ] Agregar notas internas.
- [ ] Mostrar no-shows/cancelaciones.

## 7. Automatizar comunicación

- [ ] Definir eventos de dominio que disparan mensajes.
- [ ] Unificar Brevo/Twilio bajo backend.
- [ ] Enviar recordatorio de pago pendiente.
- [ ] Enviar recordatorio pre-cita.
- [ ] Enviar aviso de expiración.
- [ ] Enviar seguimiento post-atención.
- [ ] Enviar alerta de fidelidad/recompensa.

## 8. Verificación final

- [x] `npm run build`.
- [x] Validar login admin.
- [x] Validar creación pública de reserva (rate limit y validación local verificados).
- [ ] Validar creación manual admin.
- [ ] Validar confirmación de pago.
- [ ] Validar asistencia.
- [ ] Validar cancelación/reprogramación/no-show.
- [x] Validar que Vercel sigue siendo deploy target del frontend.

## Review Workload Forecast

- **Estimated changed lines:** > 400 si se implementa completo.
- **400-line budget risk:** High.
- **Chained PRs recommended:** Yes.
- **Decision needed before apply:** Yes.

Implementar por slices. Este change es un roadmap coordinador; no debería convertirse en un único PR gigante.

## Suggested Work Units

### Work Unit 1 — Admin auth server-side
- `lib/adminSession.js`
- `middleware.js`
- `pages/api/admin/login.js`
- `pages/api/admin/logout.js`
- `pages/api/admin/session.js`
- `pages/admin/login.js`
- `lib/adminAuth.js`
- `components/AdminShell.js`
- `pages/api/admin/cita.js`
- `pages/api/horarios.js`
- `pages/admin/horarios.js`
- `pages/admin/turnos.js`
- `pages/admin/validar-citas.js`
- `openspec/specs/admin-panel/spec.md`
- `openspec/changes/harden-admin-auth/tasks.md`
- `.env.example`

**Suggested commit:** `feat(auth): replace client-side admin auth with signed server sessions`

### Work Unit 2 — API hardening and local frontend security
- `lib/apiValidation.js`
- `lib/rateLimit.js`
- `lib/cors.js`
- `pages/api/book.js`
- `pages/api/subscribe-push.js`
- `pages/api/test-config.js`
- `next.config.js`
- `package.json`
- `package-lock.json`
- `openspec/specs/booking-api/spec.md`
- `openspec/specs/deployment-architecture/spec.md`
- `openspec/changes/harden-api-routes/tasks.md`
- `openspec/changes/consolidate-env-vars/tasks.md`
- `next-env.d.ts`

**Suggested commit:** `feat(security): harden frontend api routes and security headers`

### Work Unit 3 — Netlify backend hardening
- `vanessa-studio-backend/netlify/functions/api.js`
- `vanessa-studio-backend/netlify/functions/horarios.js`

**Suggested commit:** `feat(api): harden netlify admin mutations and cors`

### Work Unit 4 — Roadmap / orchestration docs
- `openspec/changes/professionalize-admin-backend/`

**Suggested commit:** `docs(openspec): add professionalize admin backend roadmap`
