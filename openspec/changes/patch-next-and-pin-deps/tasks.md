# Tasks: Patch Next.js and Pin Dependencies

> Ejecutar tras `remove-cloudflare-dead-code`.

## 1. Verificar versiones disponibles
- [ ] `npm view next version` → ver la latest
- [ ] `npm view next versions --json | findstr "14.2"` → listar todos los 14.2.x
- [ ] Elegir el **último 14.2.x** estable (no beta/RC)

## 2. Bump Next + eslint-config-next
- [ ] `npm install next@14.2.<ULTIMO> eslint-config-next@14.2.<ULTIMO>`
- [ ] Verificar `package.json` quedó con versiones pinneadas
- [ ] `npm run build` pasa
- [ ] `npm run lint` pasa
- [ ] Commit: `fix(deps): bump next to 14.2.<X> (security patches)`

## 3. Apretar engines.node
- [ ] Editar `package.json`:
  ```json
  "engines": { "node": ">=20.0.0 <23" }
  ```
- [ ] Verificar que Vercel usa Node 20 (Project Settings → Functions/General)
- [ ] Commit: `chore(engines): require Node >=20 (drop EOL Node 18)`

## 4. Auditar otras deps con `latest` o rangos sueltos
- [ ] `grep -E '"[^"]+":\s*"(latest|\^|~)' package.json` → listar
- [ ] Para cada una: decidir si mantener caret/tilde (OK para la mayoría) o pin (solo para deps críticas)
- [ ] Tras `remove-cloudflare-dead-code`, no debería quedar ninguna `latest`

## 5. Auditar CVEs conocidos
- [ ] `npm audit` → revisar output
- [ ] Para cada vulnerability HIGH/CRITICAL: bump o sustituir
- [ ] Documentar falsos positivos o unpatchables en este archivo
- [ ] Commit (si aplica): `fix(deps): address npm audit vulnerabilities`

## 6. Pruebas finales
- [ ] `npm run build` pasa
- [ ] `npm run dev` arranca sin warnings nuevos
- [ ] Deploy preview en Vercel funciona
- [ ] Flujo de reserva extremo a extremo funciona
- [ ] Panel admin funciona
