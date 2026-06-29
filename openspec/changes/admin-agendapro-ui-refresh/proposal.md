# Change: admin-agendapro-ui-refresh

## Why

El panel admin ya funciona, pero todavia se siente como un panel interno decorado, no como un cockpit operativo tipo AgendaPro.cl. La referencia correcta no es copiar colores ni pantallas exactas, sino elevar la experiencia a un SaaS de gestion de citas: lectura rapida, KPIs accionables, jerarquia clara y menos friccion para confirmar abonos/validar asistencia.

## What changes

- Agregar una capa visual de "centro operativo" en el panel admin.
- Priorizar metricas accionables: citas visibles, acciones criticas, abonos confirmados y asistencias pendientes.
- Mejorar la barra superior del `AdminShell` con contexto de operacion y sesion segura.
- Mantener comportamiento/API intactos; este cambio es UI/UX y no modifica reglas de negocio.

## Scope

In:
- `components/AdminShell.js`
- `pages/admin/validar-citas.js`
- `styles/globals.css`
- `openspec/specs/admin-panel/spec.md`

Out:
- Cambios de backend.
- Cambios en auth, pagos o validacion.
- Rediseño completo de todas las rutas admin en este slice.
