const { setGlobalOptions } = require("firebase-functions/v2");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
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

// Admin phone number
const ADMIN_PHONE = "whatsapp:+34615412222";

// URLs de las apps
const VACATION_APP_URL = "https://horarios-vacaciones.vercel.app";

// ============================================
// FUNCIONES COMPARTIDAS
// ============================================

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
const formatDateES = (date) => {
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

// ============================================
// PATRICK MASAJES - RECORDATORIOS DE CITAS
// ============================================

// Función programada que se ejecuta cada hora para enviar recordatorios
exports.sendAppointmentReminders = onSchedule(
  {
    schedule: "0 * * * *", // Cada hora en punto
    timeZone: "Europe/Madrid",
  },
  async (event) => {
    logger.info("Ejecutando verificación de recordatorios de citas...");

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
      if (aptDate > now) {
        appointments.push({ id: doc.id, ...data });
      }
    });

    logger.info(`Verificando ${appointments.length} citas futuras para ${Object.keys(clients).length} clientes con WhatsApp`);

    // Obtener recordatorios ya enviados
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

      let shouldSend = false;
      let reminderKey = `${apt.id}_${client.whatsappReminder}`;

      if (client.whatsappReminder === '24h' && hoursUntilApt <= 24 && hoursUntilApt > 23) {
        shouldSend = true;
      } else if (client.whatsappReminder === '48h' && hoursUntilApt <= 48 && hoursUntilApt > 47) {
        shouldSend = true;
      } else if (client.whatsappReminder === '1week' && hoursUntilApt <= 168 && hoursUntilApt > 167) {
        shouldSend = true;
      }

      if (shouldSend && !sentReminders.has(reminderKey)) {
        const message = `🗓️ Recordatorio de cita\n\n` +
          `Hola ${client.nombre}! Te recordamos tu cita de masaje:\n\n` +
          `📅 ${formatDateES(aptDate)}\n` +
          `🕐 ${formatTime(aptDate)}\n` +
          `⏱️ Duración: ${apt.duration} minutos\n\n` +
          `¡Te esperamos!`;

        const phone = client.telefono.startsWith('+') ? client.telefono : `+34${client.telefono}`;
        const sent = await sendWhatsApp(`whatsapp:${phone}`, message);

        if (sent) {
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

    logger.info(`Recordatorios de citas enviados: ${remindersSent}`);
  }
);

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
    `📅 ${formatDateES(aptDate)}\n` +
    `🕐 ${formatTime(aptDate)}\n` +
    `⏱️ Duración: ${apt.duration} minutos\n\n` +
    `¡Te esperamos!`;

  const phone = client.telefono.startsWith('+') ? client.telefono : `+34${client.telefono}`;
  const result = await sendWhatsApp(`whatsapp:${phone}`, message);

  res.json({ success: result, phone, message });
});

// ============================================
// VACATION MANAGER - SOLICITUDES DE VACACIONES
// ============================================

// Obtener fechas de una solicitud de vacaciones
const getRequestDates = (request) => {
  if (request.isRange) {
    const dates = [];
    let cur = new Date(request.startDate);
    const end = new Date(request.endDate);
    while (cur <= end) {
      const dateStr = cur.toISOString().split("T")[0];
      const dayOfWeek = cur.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dates.push(dateStr);
      }
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }
  return request.dates || [];
};

// Buscar conflictos con otros usuarios del mismo departamento
const findConflicts = async (request, userCode) => {
  try {
    const userSnapshot = await db.collection("vacation_users").where("code", "==", userCode).get();
    if (userSnapshot.empty) return [];

    const user = userSnapshot.docs[0].data();
    const userDepts = user.departments || [];
    if (userDepts.length === 0) return [];

    const requestDates = getRequestDates(request);
    if (requestDates.length === 0) return [];

    const requestsSnapshot = await db.collection("vacation_requests")
      .where("status", "in", ["approved", "pending"])
      .get();

    const conflicts = [];

    for (const doc of requestsSnapshot.docs) {
      const otherReq = doc.data();
      if (otherReq.userCode === userCode) continue;

      const otherUserSnapshot = await db.collection("vacation_users").where("code", "==", otherReq.userCode).get();
      if (otherUserSnapshot.empty) continue;

      const otherUser = otherUserSnapshot.docs[0].data();
      const otherDepts = otherUser.departments || [];
      const sharedDepts = userDepts.filter(d => otherDepts.includes(d));

      if (sharedDepts.length === 0) continue;

      const otherDates = getRequestDates(otherReq);
      const overlapping = requestDates.filter(d => otherDates.includes(d));

      if (overlapping.length > 0) {
        conflicts.push({
          userName: `${otherUser.name} ${otherUser.lastName || ""}`.trim(),
          userCode: otherReq.userCode,
          dates: overlapping,
          status: otherReq.status,
          sharedDepts
        });
      }
    }

    return conflicts;
  } catch (error) {
    logger.error("Error buscando conflictos:", error);
    return [];
  }
};

// Cuando se crea una nueva solicitud de vacaciones -> avisar al admin
exports.onVacationRequestCreated = onDocumentCreated(
  "vacation_requests/{requestId}",
  async (event) => {
    const data = event.data.data();

    if (data.status !== "pending") return;

    const conflicts = await findConflicts(data, data.userCode);

    let message = `📋 Nueva solicitud de vacaciones\n\n`;
    message += `👤 Usuario: ${data.userCode}\n`;
    message += `📅 Fechas: ${data.isRange ? `${data.startDate} al ${data.endDate}` : data.dates?.join(", ")}\n`;

    if (data.comments) {
      message += `💬 Comentarios: ${data.comments}\n`;
    }

    if (conflicts.length > 0) {
      message += `\n⚠️ CONFLICTOS DETECTADOS:\n`;
      conflicts.forEach(c => {
        message += `• ${c.userName} (${c.sharedDepts.join(", ")}) - ${c.status === "approved" ? "✅" : "⏳"} ${c.dates.length} día(s)\n`;
      });
    }

    message += `\n🔗 Ver solicitud: ${VACATION_APP_URL}`;

    await sendWhatsApp(ADMIN_PHONE, message);
  }
);

// Cuando se actualiza una solicitud (aprobada/denegada) -> avisar al empleado
exports.onVacationRequestUpdated = onDocumentUpdated(
  "vacation_requests/{requestId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status === "pending" && (after.status === "approved" || after.status === "denied")) {
      const statusText = after.status === "approved" ? "✅ APROBADA" : "❌ DENEGADA";
      const message = `${statusText}\n\nTu solicitud de vacaciones ha sido ${after.status === "approved" ? "aprobada" : "denegada"}.\n\nFechas: ${after.isRange ? `${after.startDate} al ${after.endDate}` : after.dates?.join(", ")}`;

      const usersSnapshot = await db.collection("vacation_users").where("code", "==", after.userCode).get();

      if (!usersSnapshot.empty) {
        const userData = usersSnapshot.docs[0].data();
        if (userData.phone && userData.whatsappNotifications) {
          await sendWhatsApp(`whatsapp:${userData.phone}`, message);
        } else {
          logger.info(`Usuario ${after.userCode} no tiene WhatsApp configurado o notificaciones desactivadas`);
        }
      }

      await sendWhatsApp(ADMIN_PHONE, `[Admin] Solicitud de ${after.userCode} ${after.status === "approved" ? "aprobada" : "denegada"}`);
    }
  }
);

// ============================================
// ENDPOINT DE PRUEBA
// ============================================

exports.testWhatsApp = onRequest(async (req, res) => {
  const result = await sendWhatsApp(ADMIN_PHONE, "🧪 Prueba de WhatsApp!");
  res.json({ success: result });
});
