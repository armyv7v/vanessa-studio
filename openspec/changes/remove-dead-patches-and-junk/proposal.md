# Proposal: Remove Dead Patches and Junk Files

> **Severidad: MEDIUM** (limpieza)
> Tipo: cleanup

## Why

El repo tiene **7 archivos `.patch`/`.diff`** en raíz, todos del commit masivo `2026-04-11 23:26`, que **ya no aplican al árbol actual** o ya están merged. Son ruido histórico que confunde a quien los lee (¿debería aplicar este patch?).

Además hay archivos **junk** creados por redirecciones malformadas en cmd de Windows.

## What Changes

### Patches a borrar (todos muertos/superseded)
| Archivo | Estado | Razón |
|---|---|---|
| `clasp-setup.patch` | Ya aplicado | Crea `scripts/google-script/.clasp.json` y `src/Code.gs` que ya existen |
| `extra-cupos-and-extra-flag.patch` (45 KB) | Ya aplicado | Crea `pages/extra-cupos.js` que ya existe |
| `fix-availability.patch` | Muerto | Renombra `fetchAvailability`→`getAvailability` en `pages/index.js` que ya no usa ninguno (renderiza `<BookingFlow>`) |
| `fix-duplicate-imports.patch` | Muerto | Quita imports duplicados que ya no existen |
| `fix-tailwind-styles.patch` | Ya aplicado | Crea `tailwind.config.js`, `postcss.config.js`, `jsconfig.json` ya presentes |
| `patch1.diff` | Muerto + duplicado | Mismo rename que `fix-availability.patch` |
| `stable-slots-v1.patch` | Muerto | Reescribe `pages/api/slots.js` como edge-runtime; el actual es proxy Netlify totalmente distinto |

### Junk files a borrar
| Archivo | Tamaño | Origen |
|---|---|---|
| `nul` | 191 B | Comando Windows `> nul` que creó un archivo real en vez de redirigir al null device |
| `npx` | 0 B | Redirección `> npx` malformada |
| `vanessa-nails@1.0.0` | 0 B | Artefacto de `npm pack` |
| `new.sh` | 206 B | Helper `git add/commit/push` de 3 líneas — no aporta |

> ⚠️ **Cuidado con `del nul` en cmd de Windows** — puede comportarse mal. Usar `git rm` directamente o `del /f "\\?\C:\...\nul"` si hace falta. Recomendado: borrar vía `git rm` primero.

## Impacto

- Limpieza pura. Sin cambios funcionales.
- `git log` y `git diff` quedan más legibles.

## Evidencia

- Patches todos con fecha `2026-04-11 23:26` (mass-import commit)
- `pages/index.js:3` renderiza `<BookingFlow>`, no usa `fetchAvailability`
- `pages/api/slots.js:4-6` es proxy Netlify, no edge-runtime
- `ls -la` confirma 0 bytes para `npx` y `vanessa-nails@1.0.0`
