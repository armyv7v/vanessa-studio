# Tasks: Harden Secrets and Gitignore

> ⚠️ **Requiere coordinación** con Vercel/Netlify/GAS para no causar downtime.

## 1. Preparar nuevas credenciales (sin tocar producción todavía)
- [ ] En Google Cloud Console: generar nueva `GOOGLE_PRIVATE_KEY` para el service account (o refresh token OAuth del backend)
- [ ] Generar nuevo `GOOGLE_CLIENT_SECRET` OAuth
- [ ] Generar nuevo `GCAL_API_KEY` con restricción de HTTP referrer a `vanessa-studio.vercel.app` y `localhost`
- [ ] Definir nueva `ADMIN_PASSWORD` fuerte (>= 16 chars, mixto)
- [ ] Definir nuevo `ADMIN_VALIDATION_PIN` (mantener 4 dígitos para UX, pero aleatorio no-`2308`)
- [ ] Guardar temporalmente las credenciales nuevas en un gestor de passwords (no en archivos)

## 2. Ventana de mantenimiento (coordinada)
- [ ] Avisar al cliente (Vanessa) de una ventana de ~15 min
- [ ]Actualizar variables en Vercel (Project → Settings → Environment Variables)
- [ ] Actualizar variables en Netlify (Site → Settings → Environment Variables)
- [ ] Si se cambia el PIN: actualizar `ADMIN_VALIDATION_PIN` en Netlify
- [ ] En Google Apps Script: PropertiesService.setScriptProperties() con nuevos valores (no en código)
- [ ] Editar `Code.gs` para leer de PropertiesService en vez de constants hardcodeadas

## 3. Hardening de `.gitignore`
- [ ] Añadir entradas: `.dev.vars`, `.wrangler/`, `nul`, `*.local`
- [ ] Quitar la entrada `.vercel` duplicada (dejar 1)
- [ ] Commit: `chore(git): harden gitignore for secrets and platform artifacts`

## 4. Des-trackear `.dev.vars`
- [ ] `git rm --cached .dev.vars`
- [ ] Commit: `chore: stop tracking .dev.vars (cloudflare secrets file)`

## 5. Limpiar `.env.local` de pseudosecretos
- [ ] Quitar `VERCEL_OIDC_TOKEN` de `.env.local` (es efímero, no pertenece aquí)
- [ ] Verificar que `.env.local` solo contiene valores de desarrollo local (no prod)

## 6. Migrar constants de GAS a PropertiesService
- [ ] Abrir `scripts/google-script/src/Code.gs`
- [ ] Reemplazar las constantes hardcodeadas (líneas 8-17) por lecturas de `PropertiesService.getScriptProperties().getProperty('XXX')`
- [ ] Configurar las properties vía script editor o `clasp` con los nuevos valores
- [ ] `npm run gs:push` para subir el cambio

## 7. Verificación final
- [ ] Una reserva de prueba extremo a extremo funciona (público + admin)
- [ ] `git log --all --full-history -- .env.local` confirma que nunca estuvo commiteada
- [ ] Confirmar con Vanessa que el panel admin funciona con la nueva contraseña

## 8. Post-mortem
- [ ] Documentar el incidente (no es un breach conocido, pero la postura fue arriesgada) en `openspec/changes/harden-secrets-and-gitignore/RETRO.md`
- [ ] Considerar migrar a un gestor de secretos (Vercel + Doppler, AWS Secrets Manager) — fuera de scope de este change
