# Patrick Masajes - Contexto del Proyecto

## Descripción
App de gestión de citas para un negocio de masajes. React + Vite + Tailwind CSS + Firebase.

## Estructura Principal

### Frontend
- **`src/App.jsx`** - Archivo principal (~2000 líneas), contiene toda la lógica y UI
- **`src/firebase.js`** - Configuración de Firebase

### Backend (Cloud Functions)
- **`functions/index.js`** - Firebase Cloud Functions combinadas:
  - **Patrick Masajes**: `sendAppointmentReminders` (scheduler cada hora), `sendReminder` (endpoint manual)
  - **Vacation Manager**: `onVacationRequestCreated`, `onVacationRequestUpdated`
  - **Compartido**: `sendWhatsApp`, `testWhatsApp`
- **`functions/.env`** - Credenciales Twilio (TWILIO_SID, TWILIO_TOKEN, TWILIO_WHATSAPP)

## Colecciones Firebase (Firestore)
- `clients` - Clientes con campos: nombre, apellido, telefono, whatsappReminder (24h/48h/1week/null)
- `appointments` - Citas con: clientId, dateTime, duration, specials[], recurrenceId, recurrenceDuration
- `specials` - Tipos especiales (ubicaciones) con: name, color
- `holidays` - Festivos personalizados
- `feedbacks` - Tareas/feedback con: message, completed, createdAt, completedAt
- `users` - Usuarios con: name, slug (para URL), createdAt
- `logs` - Historial de acciones con: action, details, userId, userName, timestamp
- `sent_reminders` - Registro de recordatorios WhatsApp enviados

## Sistema de Usuarios
- Usuarios identificados por URL: `/patrick`, `/ana`, etc.
- Se detecta automáticamente al cargar la app comparando `window.location.pathname` con `users.slug`
- Todas las acciones se loguean con el usuario actual

## Vistas del Calendario (calView state)
- `day` - Vista diaria con horas
- `week` - Vista semanal (columna de horas sticky)
- `month` - Vista mensual con hover para ver citas
- `year` - Vista anual estilo grid de 52 semanas

## Modales (modal state)
- `appointment` - Crear/editar cita
- `client` - Crear/editar cliente
- `special` - Crear/editar tipo especial
- `holiday` - Crear/editar festivo
- `config` - Configuración de horarios

## Panel de Settings (showSettings state)
- **Tareas**: Lista de feedback/tareas con checkbox
- **Usuarios**: Gestión de usuarios (crear/eliminar)
- **Historial**: Log de todas las acciones (crear/editar/eliminar citas y clientes)

## Funcionalidades Clave
- **Citas recurrentes**: semanal/quincenal/mensual con duración configurable (2m/6m/1y)
- **WhatsApp reminders**: Por cliente, opciones 24h/48h/1week antes
- **Estadísticas**: Tabla ordenable por cliente/sesiones/ingresos/media
- **Festivos**: Predefinidos (Catalunya) + personalizados
- **Doble click**: En cualquier vista de calendario para crear cita rápida
- **Logs**: Historial de todas las acciones con usuario y timestamp

## Comandos Útiles
```bash
# Desarrollo local
npm run dev

# Deploy funciones
cd functions && npm install
firebase deploy --only functions

# Eliminar función específica
firebase functions:delete nombreFuncion
```

## Versión Actual
v1.9

## Notas
- El indicador de "hoy" en vistas usa `isSameDay()` para evitar problemas de timezone
- Los colores principales son amber para UI general, azul para indicador de hoy en year view
- Admin WhatsApp hardcodeado: +34615412222
- Región Firebase: europe-west1
- Columna de horas en vista semana es sticky (z-20) por encima de las citas (z-10)
