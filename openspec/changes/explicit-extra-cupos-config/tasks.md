# Tasks: Explicit Extra-Cupos Config

## 1. Modelo de datos
- [x] Agregar `extraCuposConfig` a fallbacks frontend y backend
- [x] Normalizar/validar `extraCuposConfig` en Netlify `horarios.js`
- [x] Propagar `extraCuposConfig` en `/api/horarios` y `/api/gs-check`

## 2. Panel admin
- [x] Cargar `extraCuposConfig` en `/admin/horarios`
- [x] Agregar editor explícito de extra-cupos (enabled, start, end)
- [x] Guardar `extraCuposConfig` junto con `horarioAtencion`

## 3. Booking público
- [x] Hacer que `BookingFlow` use `extraCuposConfig` remoto en modo `extra`
- [x] Mantener fallback si no existe config remota
- [x] Verificar que modo normal no cambie

## 4. Specs
- [x] Actualizar `client-booking`, `admin-panel` y `scheduling-config`

## 5. Verificación
- [x] `npm run build`
- [x] `node --check vanessa-studio-backend/netlify/functions/horarios.js`
- [x] Smoke local de `/api/gs-check?action=getConfig`
