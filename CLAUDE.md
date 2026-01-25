# Patrick Masajes - Contexto del Proyecto

## Descripción
App de gestión de citas para un negocio de masajes. React + Vite + Tailwind CSS + Firebase.

## Estructura Principal

### Frontend
- **`src/App.jsx`** - Archivo principal (~1600 líneas), contiene toda la lógica y UI
- **`src/firebase.js`** - Configuración de Firebase

### Backend (Cloud Functions)
- **`functions/index.js`** - Firebase Cloud Functions combinadas:
  - **Patrick Masajes**: `sendAppointmentReminders` (scheduler cada hora), `sendReminder` (endpoint manual)
  - **Vacation Manager**: `onVacationRequestCreated`, `onVacationRequestUpdated`
  - **Compartido**: `sendWhatsApp`, `testWhatsApp`
- **`functions/.env`** - Credenciales Twilio (TWILIO_SID, TWILIO_TOKEN, TWILIO_WHATSAPP)

## Colecciones Firebase (Firestore)
- `clients` - Clientes con campos: nombre, apellido, telefono, whatsappReminder (24h/48h/1week/null)
- `appointments` - Citas con: clientId, dateTime, duration, specials[], recpiasurrenceId, recurrenceDuration
- `specials` - Tipos especiales (ubicaciones) con: name, color
- `holidays` - Festivos personalizados
- `sent_reminders` - Registro de recordatorios WhatsApp enviados

## Vistas del Calendario (calView state)
- `day` - Vista diaria con horas
- `week` - Vista semanal
- `month` - Vista mensual con hover para ver citas
- `year` - Vista anual estilo grid de 52 semanas

## Modales (modal state)
- `appointment` - Crear/editar cita
- `client` - Crear/editar cliente
- `special` - Crear/editar tipo especial
- `holiday` - Crear/editar festivo
- `config` - Configuración de horarios

## Funcionalidades Clave
- **Citas recurrentes**: semanal/quincenal/mensual con duración configurable (2m/6m/1y)
- **WhatsApp reminders**: Por cliente, opciones 24h/48h/1week antes
- **Estadísticas**: Tabla ordenable por cliente/sesiones/ingresos/media
- **Festivos**: Predefinidos (Catalunya) + personalizados

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
v1.5

## Notas
- El indicador de "hoy" en vistas usa `isSameDay()` para evitar problemas de timezone
- Los colores principales son amber para UI general, azul para indicador de hoy en year view
- Admin WhatsApp hardcodeado: +34615412222
- Región Firebase: europe-west1
