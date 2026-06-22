# AGENTS.md

Este proyecto usa [**spec-kit**](https://github.com/github/spec-kit) (Spec-Driven Development).
La **fuente de verdad** son las especificaciones en `openspec/`; el código debe implementarlas.

> **Convención raíz:** antes de cambiar comportamiento, lee y actualiza la spec correspondiente en `openspec/specs/`. Antes de tocar código, abre (o reabre) un *change* en `openspec/changes/`.

---

## Reglas operativas (no negociables)

Estas reglas **extienden y refinan** `instrucciones_agentes.md`. En caso de conflicto, prevalece este archivo.

1. **Pensar antes de programar.** Si hay incertidumbre (modelo de datos, seguridad, pagos en Chile), detente y pregunta. No asumas en silencio.
2. **Simplicidad primero.** Código mínimo para resolver el problema actual. Cero abstracción especulativa, cero sobre-ingeniería.
3. **Cambios quirúrgicos.** Modifica solo lo estrictamente necesario. No refactorices código adyacente "de paso". No alteres comentarios/estilo no relacionados.
4. **Verificación orientada a objetivos.** Define criterios de éxito verificables (test, log, output) antes de ejecutar cada paso.
5. **Entorno Windows.** Comandos compatibles con Windows 10 / cmd / PowerShell. Evita rutas exclusivas de Unix.
6. **Deploy target = Vercel.** Cualquier cambio que toque build/deploy debe funcionar en Vercel (https://vanessa-studio.vercel.app/). No reintroducir artefactos Cloudflare/OpenNext.
7. **No rotación silenciosa de secretos.** Si tocas `.env*`, pregunta primero.

---

## Estructura del repositorio

```
openspec/
  project.md                      # Contexto compartido del proyecto (lee primero)
  specs/                          # Especificaciones AS-IS (fuente de verdad)
    <capability>/spec.md          # Una capability por carpeta
  changes/                        # Propuestas de cambio pendientes (auditoría)
    <change-id>/
      proposal.md                 # Qué y por qué cambia
      tasks.md                    # Checklist accionable
      design.md                   # (solo si el cambio es no trivial)
AGENTS.md                         # Este archivo
instrucciones_agentes.md          # Reglas históricas (vigentes como referencia)
```

---

## Topología del sistema (resumen)

| Capa | Tecnología | Deploy | Repo |
|---|---|---|---|
| **Frontend** | Next.js 14 (Pages Router) + Tailwind | **Vercel** | este repo (`vanessa-studio`) |
| **Backend API** | Netlify Functions (Node) + Google APIs (OAuth) | Netlify | `vanessa-studio-backend/` (repo anidado, a formalizar) |
| **Apps Script** | Google Apps Script Web App | Google Cloud | `scripts/google-script/` (gestionado con `clasp`) |
| **Cloudflare Worker** | Worker TypeScript (legacy) | (sin uso real) | `api-worker/` (propuesta: eliminar) |

**Fuente de datos:** Google Sheets (tabs: `Reservas`, `TarjetasFidelidad`, `EmailLog`, `ConfiguracionHorarios`).
**Calendario:** Google Calendar (lectura + escritura).
**Mensajería:** Brevo (email), Twilio (WhatsApp), MailApp (GAS, legacy), web-push.

> Detalle completo: `openspec/specs/deployment-architecture/spec.md`

---

## Flujo de trabajo con spec-kit

1. **Leer contexto:** `openspec/project.md` + la spec de la capability afectada.
2. **Spec-driven:** si el cambio altera comportamiento documentado, actualiza `openspec/specs/<capability>/spec.md` *en el mismo change*.
3. **Cambios grandes:** abre `openspec/changes/<id>/` con `proposal.md` + `tasks.md` antes de tocar código.
4. **Trazabilidad:** cada commit debe rastrearse a una spec o un change. Prefiere conventional commits (`feat:`, `fix:`, `style:`, `docs:`, `chore:`, `refactor:`).
5. **No commit automático** salvo confirmación explícita del usuario.

---

## Comandos del proyecto

```bash
npm run dev          # desarrollo local (Next.js)
npm run build        # build de producción
npm run lint         # ESLint
npm run deploy       # NO EXISTE — deploy es por Vercel (auto-deploy on push a main)

# Google Apps Script (solo si se edita Code.gs)
npm run gs:push      # sube scripts/google-script a Google via clasp
```

> **Eliminados:** los scripts `build:cf`, `preview:cf`, `deploy:cf`, `upload:cf`, `cf-typegen` están marcados para eliminación en `openspec/changes/remove-cloudflare-dead-code/`.

---

## Mapa de especificaciones

| Capability | Spec | Descripción |
|---|---|---|
| Reservas cliente | `specs/client-booking` | Flujo de reserva público |
| Panel admin | `specs/admin-panel` | Login + gestión admin |
| API de reservas | `specs/booking-api` | Rutas `/api/*` |
| Pagos y fidelidad | `specs/payments-loyalty` | Lifecycle de reserva + sellos |
| Notificaciones | `specs/notifications` | Email / WhatsApp / push |
| Config horaria | `specs/scheduling-config` | Horarios y generación de slots |
| Arquitectura | `specs/deployment-architecture` | Topología + modelo de datos |

---

## Notas

- **Idioma:** UI y documentación orientada al usuario en español. Código y specs en español neutro / inglés técnico según convención del archivo.
- **Zona horaria:** `America/Santiago` (CLT). Toda lógica de fechas debe respetarla.
- **Moneda:** CLP (pesos chilenos). Depósito típico: $10.000; recargo extra-cupos: $5.000.
