# Panel Admin de Gestión de Turnos

## Descripción

El panel admin te permite crear citas manualmente cuando un cliente no puede hacerlo desde el sitio web. Es útil para:

- Casos donde el cliente no puede acceder al sitio web
- Cuando llamas por teléfono y quieres crear una cita directamente
- Para gestionar casos excepcionales o reprogramaciones
- Como respaldo si el sistema de reserva en línea tiene problemas

## Acceso

**URL:** `https://tudominio.com/admin/turnos`

### Autenticación

El panel está protegido con contraseña. Hay dos formas de configurar la autenticación:

#### Opción 1: Contraseña Simple (Recomendado para desarrollo)

Agrega esta variable a tu `.env.local`:

```env
NEXT_PUBLIC_ADMIN_PASSWORD=tuContraseña123
```

Luego, en la página de login, ingresa esta contraseña. La sesión se guarda en `sessionStorage`, así que se cierra cuando cierras la pestaña.

#### Opción 2: Token Bearer (Recomendado para producción)

Si quieres un sistema más robusto, activa la validación de token en `/pages/api/admin/cita.js`:

```javascript
// Descomenta estas líneas:
if (!checkAdminAuth(req)) {
  return res.status(401).json({ error: 'Unauthorized - Token requerido' });
}
```

Luego configura:

```env
NEXT_PUBLIC_ADMIN_TOKEN=token-super-secreto-123
```

Cuando llamadas a la API, incluye:

```bash
Authorization: Bearer token-super-secreto-123
```

## Cómo Usar

### Paso 1: Selecciona el Tipo de Cupo

- **Normal (10:00-21:00):** Horario regular de atención
- **Extra Cupo (18:00-20:00):** Turnos extendidos con recargo

### Paso 2: Selecciona el Servicio

Elige entre los 8 servicios disponibles:

- Retoque (120 min)
- Reconstrucción Uñas Mordidas (180 min)
- Uñas Acrílicas (180 min)
- Uñas Polygel (180 min)
- Uñas Softgel (180 min)
- Kapping o Baño Polygel/Acrílico (150 min)
- Reforzamiento Nivelación Rubber (150 min)
- Esmaltado Permanente (90 min)

### Paso 3: Selecciona la Fecha

Puedes elegir entre los próximos 30 días. Solo aparecen fechas habilitadas según tu configuración de Google Calendar.

### Paso 4: Elige el Horario Disponible

El sistema consulta Google Calendar en tiempo real y muestra solo los horarios libres. Si no hay disponibilidad:

- Intenta otro día
- Intenta cambiar el servicio (algunos duran menos tiempo)
- Verifica en Google Calendar que el horario esté libre

### Paso 5: Ingresa Datos del Cliente

- **Nombre:** Requerido
- **Email:** Requerido (valida que sea un email válido)
- **Teléfono:** Opcional

### Paso 6: Crear Cita

Haz click en "Crear Cita". El sistema:

1. Valida que no haya conflicto con otras citas
2. Agrega el evento a Google Calendar
3. Envía un email automático al cliente
4. Guarda los datos en tu Google Sheet

## Estructura de Archivos Creados

```
vanessa-studio/
├── pages/
│   └── admin/
│       └── turnos.js                    # Panel admin (página principal)
├── pages/api/
│   └── admin/
│       └── cita.js                      # Endpoint para crear cita
└── lib/
    └── withAdminAuth.js                 # HOC de autenticación
```

## Variables de Entorno Requeridas

Asegúrate que ya están configuradas (deberían estarlo):

```env
# Google Calendar (requerido)
NEXT_PUBLIC_GCAL_CALENDAR_ID=your-calendar-id@group.calendar.google.com
GCAL_API_KEY=your-google-calendar-api-key

# Google Apps Script (requerido)
NEXT_PUBLIC_GAS_WEBHOOK_URL=https://script.google.com/macros/d/...
# O
GAS_WEBAPP_URL=https://script.google.com/macros/d/...

# Timezone (recomendado)
NEXT_PUBLIC_TZ=America/Santiago

# Admin (nuevo - agrega si falta)
NEXT_PUBLIC_ADMIN_PASSWORD=tuContraseña123
```

## Validaciones

El sistema valida:

- **Email válido:** Debe tener formato de email
- **Datos completos:** Nombre y email son obligatorios
- **Fecha y hora válidas:** Se convierte a ISO8601 con tu timezone
- **Duración válida:** Se calcula automáticamente según el servicio
- **Sin conflictos:** Google Calendar verifica que no haya otra cita
- **Google Apps Script:** Valida antes de crear el evento

## Errores Comunes

### "No hay horarios disponibles"

**Causas:**
- Google Calendar está lleno ese día
- El servicio es muy largo para los huecos disponibles
- El horario configurado está fuera de atención

**Soluciones:**
- Intenta otro día
- Intenta un servicio más corto
- Verifica Google Calendar manualmente

### "Email invalido"

**Causa:** El email no tiene formato válido

**Solución:** Asegúrate de escribir: `usuario@dominio.com`

### "Error al crear la cita"

**Causas posibles:**
- Falta configurar `GAS_WEBAPP_URL`
- El webhook de Google Apps Script no está activo
- Faltan credenciales de Google Calendar
- Conflicto en Google Calendar (otra cita al mismo tiempo)

**Soluciones:**
1. Revisa los logs del servidor (vercel, etc.)
2. Verifica que Google Apps Script esté publicado como webapp
3. Verifica que Google Calendar API esté habilitada
4. Intenta crear la cita con otra fecha/hora

## Flujo Técnico

```
Usuario Admin
    ↓
Panel Admin (/admin/turnos)
    ↓ (GET /api/slots)
Google Calendar API
    ↓ (horarios disponibles)
Panel muestra horarios libres
    ↓
Admin selecciona e ingresa datos
    ↓ (POST /api/admin/cita)
Endpoint valida datos
    ↓ (POST a GAS_WEBAPP_URL)
Google Apps Script
    ├ → Agrega evento a Google Calendar
    ├ → Envía email al cliente
    └ → Guarda en Google Sheet
    ↓
Confirmación al usuario
```

## Diferencias con Reserva en Línea

| Aspecto | Online | Admin |
|--------|--------|-------|
| **Quién crea** | Cliente | Administrador |
| **Autenticación** | Ninguna | Contraseña/Token |
| **Validación** | Automática | Manual + Automática |
| **Confirmación** | Email + Página | Email |
| **Auditoría** | Menor | Mayor (admin crea) |

## Seguridad

⚠️ **IMPORTANTE:**

- No compartas la contraseña admin
- Para producción, usa un token fuerte generado aleatoriamente
- Considera agregar logs de auditoría (quién creó qué cita y cuándo)
- La sesión se cierra al cerrar la pestaña (seguridad)

## Próximas Mejoras Sugeridas

1. **Auditoría:** Registrar quién creó cada cita y cuándo
2. **Búsqueda:** Poder ver/editar citas ya creadas
3. **Notificaciones:** Enviar notificación al cliente antes de la cita
4. **Descuentos:** Permitir aplicar códigos o descuentos al crear
5. **Cancelaciones:** Poder cancelar citas desde el admin

## Soporte

Si encuentras problemas:

1. Revisa los logs del servidor
2. Verifica que Google Apps Script esté activo
3. Asegúrate que Google Calendar API tiene permisos
4. Prueba con un email de prueba primero

---

**Última actualización:** 2025-04-14
**Versión:** 1.0.0
