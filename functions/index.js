const { setGlobalOptions } = require("firebase-functions/v2");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const twilio = require("twilio");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

setGlobalOptions({ maxInstances: 10, region: "europe-west1" });

// Twilio config
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const twilioWhatsApp = `whatsapp:${process.env.TWILIO_WHATSAPP}`;

// Enviar mensaje de WhatsApp
const sendWhatsApp = async (to, message) => {
  try {
    await twilioClient.messages.create({
      body: message,
      from: twilioWhatsApp,
      to: to,
    });
    logger.info(`WhatsApp enviado a ${to}`);
    return true;
  } catch (error) {
    logger.error("Error enviando WhatsApp:", error);
    return false;
  }
};

// Formatear fecha en español
const formatDate = (date) => {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
};

// Formatear hora
const formatTime = (date) => {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Función programada que se ejecuta cada hora para enviar recordatorios
// Revisa las citas y envía recordatorios según la preferencia del cliente
exports.sendAppointmentReminders = onSchedule(
  {
    schedule: "0 * * * *", // Cada hora en punto
    timeZone: "Europe/Madrid",
  },
  async (event) => {
    logger.info("Ejecutando verificación de recordatorios...");

    const now = new Date();

    // Obtener todos los clientes con WhatsApp activado
    const clientsSnapshot = await db.collection("clients").get();
    const clients = {};
    clientsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.telefono && data.whatsappReminder) {
        clients[doc.id] = data;
      }
    });

    if (Object.keys(clients).length === 0) {
      logger.info("No hay clientes con recordatorios de WhatsApp activados");
      return;
    }

    // Obtener citas futuras
    const appointmentsSnapshot = await db.collection("appointments").get();
    const appointments = [];
    appointmentsSnapshot.forEach(doc => {
      const data = doc.data();
      const aptDate = new Date(data.dateTime);
      // Solo citas futuras
      if (aptDate > now) {
        appointments.push({ id: doc.id, ...data });
      }
    });

    logger.info(`Verificando ${appointments.length} citas futuras para ${Object.keys(clients).length} clientes con WhatsApp`);

    // Obtener recordatorios ya enviados (para no duplicar)
    const sentRemindersSnapshot = await db.collection("sent_reminders").get();
    const sentReminders = new Set();
    sentRemindersSnapshot.forEach(doc => {
      sentReminders.add(doc.id);
    });

    let remindersSent = 0;

    for (const apt of appointments) {
      const client = clients[apt.clientId];
      if (!client) continue;

      const aptDate = new Date(apt.dateTime);
      const hoursUntilApt = (aptDate - now) / (1000 * 60 * 60);

      // Determinar si debemos enviar recordatorio según preferencia
      // whatsappReminder: '24h', '48h', '1week'
      let shouldSend = false;
      let reminderKey = `${apt.id}_${client.whatsappReminder}`;

      if (client.whatsappReminder === '24h' && hoursUntilApt <= 24 && hoursUntilApt > 23) {
        shouldSend = true;
      } else if (client.whatsappReminder === '48h' && hoursUntilApt <= 48 && hoursUntilApt > 47) {
        shouldSend = true;
      } else if (client.whatsappReminder === '1week' && hoursUntilApt <= 168 && hoursUntilApt > 167) {
        shouldSend = true;
      }

      // Verificar si ya se envió este recordatorio
      if (shouldSend && !sentReminders.has(reminderKey)) {
        const message = `🗓️ Recordatorio de cita\n\n` +
          `Hola ${client.nombre}! Te recordamos tu cita de masaje:\n\n` +
          `📅 ${formatDate(aptDate)}\n` +
          `🕐 ${formatTime(aptDate)}\n` +
          `⏱️ Duración: ${apt.duration} minutos\n\n` +
          `¡Te esperamos!`;

        const phone = client.telefono.startsWith('+') ? client.telefono : `+34${client.telefono}`;
        const sent = await sendWhatsApp(`whatsapp:${phone}`, message);

        if (sent) {
          // Guardar que ya se envió este recordatorio
          await db.collection("sent_reminders").doc(reminderKey).set({
            appointmentId: apt.id,
            clientId: apt.clientId,
            sentAt: now.toISOString(),
            reminderType: client.whatsappReminder
          });
          remindersSent++;
        }
      }
    }

    logger.info(`Recordatorios enviados: ${remindersSent}`);
  }
);

// Endpoint de prueba para enviar un WhatsApp
exports.testWhatsApp = onRequest(async (req, res) => {
  const phone = req.query.phone || "+34615412222";
  const result = await sendWhatsApp(`whatsapp:${phone}`, "🧪 Prueba de recordatorio de Patrick Masajes!");
  res.json({ success: result });
});

// Endpoint manual para enviar recordatorio a una cita específica
exports.sendReminder = onRequest(async (req, res) => {
  const appointmentId = req.query.appointmentId;

  if (!appointmentId) {
    res.status(400).json({ error: "appointmentId requerido" });
    return;
  }

  const aptDoc = await db.collection("appointments").doc(appointmentId).get();
  if (!aptDoc.exists) {
    res.status(404).json({ error: "Cita no encontrada" });
    return;
  }

  const apt = aptDoc.data();
  const clientDoc = await db.collection("clients").doc(apt.clientId).get();

  if (!clientDoc.exists) {
    res.status(404).json({ error: "Cliente no encontrado" });
    return;
  }

  const client = clientDoc.data();

  if (!client.telefono) {
    res.status(400).json({ error: "Cliente sin teléfono" });
    return;
  }

  const aptDate = new Date(apt.dateTime);
  const message = `🗓️ Recordatorio de cita\n\n` +
    `Hola ${client.nombre}! Te recordamos tu cita de masaje:\n\n` +
    `📅 ${formatDate(aptDate)}\n` +
    `🕐 ${formatTime(aptDate)}\n` +
    `⏱️ Duración: ${apt.duration} minutos\n\n` +
    `¡Te esperamos!`;

  const phone = client.telefono.startsWith('+') ? client.telefono : `+34${client.telefono}`;
  const result = await sendWhatsApp(`whatsapp:${phone}`, message);

  res.json({ success: result, phone, message });
});
