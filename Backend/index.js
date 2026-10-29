const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const VALID_STATUSES = ['Agendada', 'En Proceso', 'Atendida', 'Cancelada', 'Inasistencia'];

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const getUtcDayRange = (dateInput) => {
  const d = new Date(dateInput);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');

  const startOfDay = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  const endOfDay = new Date(`${year}-${month}-${day}T23:59:59.999Z`);
  return { startOfDay, endOfDay };
};

// ==========================================
// CONFIGURACIÓN Y TRANSMISOR DE CORREO (HU-09 & HU-10)
// ==========================================
let transporter;

nodemailer.createTestAccount().then(account => {
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: account.user,
      pass: account.pass
    }
  });
  console.log('📧 Servidor de correo listo (Ethereal Mail).');
}).catch(err => {
  console.error('⚠️ No se pudo conectar con Ethereal:', err.message);
});

async function sendConfirmationEmail(appointmentData) {
  const { id, clientName, clientEmail, serviceName, specialistName, date, time } = appointmentData;

  console.log(`\n------------------------------------------------------`);
  console.log(`✉️ [HU-09] Correo de confirmación para: ${clientEmail}`);
  console.log(`📋 ID Cita: #${id} | Cliente: ${clientName}`);
  console.log(`💅 Servicio: ${serviceName} | Especialista: ${specialistName}`);
  console.log(`📅 Fecha y Hora: ${date} a las ${time}`);

  const mailOptions = {
    from: '"AgendaYa! Reservas" <no-reply@agendaya.com>',
    to: clientEmail,
    subject: `✨ Confirmación de Reserva #${id} - AgendaYa!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; background-color: #ffffff; color: #0f172a;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0d9488; margin: 0;">¡Reserva Confirmada en AgendaYa!</h2>
          <p style="color: #64748b; font-size: 0.9em; margin-top: 5px;">Tu espacio de bienestar ha sido reservado</p>
        </div>
        
        <p>Hola <strong>${clientName}</strong>,</p>
        <p>Tu cita ha sido registrada con éxito. A continuación encuentras el resumen completo de tu reserva:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.95em;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Código / ID de Reserva:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0d9488;">#${id}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Servicio:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${serviceName}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Especialista:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${specialistName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Fecha:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${date}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Hora:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${time}</td>
          </tr>
        </table>
      </div>
    `,
  };

  try {
    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 ABRIR CORREO EN VIVO: ${previewUrl}`);
      }
    }
  } catch (err) {
    console.error(`⚠️ Error al enviar correo: ${err.message}`);
  }
}

// ==========================================
// RUTA DE HEALTHCHECK
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor y base de datos operativos' });
});

// ==========================================
// HU-14: Dashboard de Métricas
// ==========================================
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const { range = 'today' } = req.query;
    const now = new Date();
    let whereClause = {};

    if (range === 'today') {
      const startDate = new Date(); startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(); endDate.setHours(23, 59, 59, 999);
      whereClause = { date: { gte: startDate, lte: endDate } };
    } else if (range === 'week') {
      const dayOfWeek = now.getDay() || 7;
      const startDate = new Date(); 
      startDate.setDate(now.getDate() - dayOfWeek + 1); 
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate); 
      endDate.setDate(startDate.getDate() + 6); 
      endDate.setHours(23, 59, 59, 999);
      whereClause = { date: { gte: startDate, lte: endDate } };
    } else if (range === 'month') {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      whereClause = { date: { gte: startDate, lte: endDate } };
    }

    const appointments = await prisma.appointment.findMany({ where: whereClause });

    const totalAppointments = appointments.length;
    const cancelledAppointments = appointments.filter(a => a.status === 'Cancelada').length;
    const activeAppointments = appointments.filter(a => a.status !== 'Cancelada').length;

    const totalSpecialists = await prisma.specialist.count();
    const activeSpecialists = totalSpecialists || 1;

    let daysCount = 1;
    if (range === 'week') daysCount = 7;
    if (range === 'month' || range === 'all') daysCount = 30;

    const totalSlotsCapacity = activeSpecialists * 10 * daysCount;
    const rawRate = totalSlotsCapacity > 0 ? (activeAppointments / totalSlotsCapacity) * 100 : 0;
    const occupancyRate = rawRate > 0 && rawRate < 1 ? Number(rawRate.toFixed(1)) : Math.round(rawRate);

    res.json({ range, totalAppointments, cancelledAppointments, occupancyRate });
  } catch (error) {
    console.error('Error calculando métricas HU-14:', error);
    res.status(500).json({ error: 'Error al calcular métricas del dashboard.' });
  }
});

// ==========================================
// HU-01: Obtener lista de servicios
// ==========================================
app.get('/api/services', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(services);
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ error: 'Error interno al consultar los servicios.' });
  }
});

// ==========================================
// HU-02: Obtener especialistas con servicios
// ==========================================
app.get('/api/specialists', async (req, res) => {
  try {
    const specialists = await prisma.specialist.findMany({
      include: { services: true },
      orderBy: { name: 'asc' }
    });
    res.json(specialists);
  } catch (error) {
    console.error('Error al obtener especialistas:', error);
    res.status(500).json({ error: 'Error interno al consultar los especialistas.' });
  }
});

// ==========================================
// HU-02: Registrar especialista vinculando servicios
// ==========================================
app.post('/api/specialists', async (req, res) => {
  try {
    const { name, email, specialty, avatar, serviceIds } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'El nombre del especialista es obligatorio.' });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Debes proporcionar un correo electrónico válido.' });
    }

    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ 
        error: 'Debes vincular al menos un servicio habilitado para este especialista.' 
      });
    }

    const existingServices = await prisma.service.findMany({
      where: { id: { in: serviceIds.map((id) => Number(id)) } }
    });

    if (existingServices.length !== serviceIds.length) {
      return res.status(400).json({ 
        error: 'Uno o varios de los servicios seleccionados no existen.' 
      });
    }

    const specialist = await prisma.specialist.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        specialty: specialty ? specialty.trim() : null,
        avatar: avatar || null,
        services: {
          connect: serviceIds.map((id) => ({ id: Number(id) })),
        },
      },
      include: { services: true },
    });

    res.status(201).json(specialist);
  } catch (error) {
    console.error('Error al registrar especialista:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado.' });
    }
    res.status(500).json({ error: 'No se pudo completar el registro del especialista.' });
  }
});

// Actualizar datos / foto del especialista
app.put('/api/specialists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specialty, avatar, serviceIds } = req.body;

    const specialistId = Number(id);
    if (isNaN(specialistId)) {
      return res.status(400).json({ error: 'ID de especialista no válido.' });
    }

    const updateData = {
      ...(name && { name: name.trim() }),
      ...(specialty !== undefined && { specialty: specialty ? specialty.trim() : null }),
      ...(avatar !== undefined && { avatar })
    };

    if (serviceIds && Array.isArray(serviceIds)) {
      updateData.services = {
        set: serviceIds.map((sId) => ({ id: Number(sId) }))
      };
    }

    const updated = await prisma.specialist.update({
      where: { id: specialistId },
      data: updateData,
      include: { services: true }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error actualizando especialista:', error);
    res.status(500).json({ error: 'Error al actualizar el especialista.' });
  }
});

// Eliminar especialista
app.delete('/api/specialists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const specialistId = Number(id);

    await prisma.specialist.delete({
      where: { id: specialistId }
    });

    res.json({ message: 'Especialista eliminado con éxito.' });
  } catch (error) {
    console.error('Error eliminando especialista:', error);
    res.status(500).json({ error: 'Error al eliminar el especialista.' });
  }
});

// ==========================================
// GESTIÓN DE PACIENTES / CLIENTES (Soporta /api/patients y /api/pacientes)
// ==========================================
app.get(['/api/patients', '/api/pacientes'], async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { id: 'desc' }
    });
    res.json(patients);
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({ error: 'Error interno al consultar los pacientes.' });
  }
});

app.post(['/api/patients', '/api/pacientes'], async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'El nombre del paciente es obligatorio.' });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Debes proporcionar un correo electrónico válido.' });
    }

    const patient = await prisma.patient.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null
      }
    });

    res.status(201).json(patient);
  } catch (error) {
    console.error('Error al registrar paciente:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El correo electrónico del paciente ya existe.' });
    }
    res.status(500).json({ error: 'No se pudo registrar el paciente en la base de datos.' });
  }
});

app.put(['/api/patients/:id', '/api/pacientes/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const patientId = Number(id);
    if (isNaN(patientId)) {
      return res.status(400).json({ error: 'ID de paciente no válido.' });
    }

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        ...(name && { name: name.trim() }),
        ...(email && isValidEmail(email) && { email: email.trim().toLowerCase() }),
        ...(phone !== undefined && { phone: phone ? phone.trim() : null })
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error actualizando paciente:', error);
    res.status(500).json({ error: 'Error al actualizar el paciente.' });
  }
});

app.delete(['/api/patients/:id', '/api/pacientes/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = Number(id);

    await prisma.patient.delete({
      where: { id: patientId }
    });

    res.json({ message: 'Paciente eliminado exitosamente.' });
  } catch (error) {
    console.error('Error eliminando paciente:', error);
    res.status(500).json({ error: 'Error al eliminar el paciente.' });
  }
});

// ==========================================
// HU-05, HU-06, HU-07 y HU-09: Crear cita y auto-guardar paciente
// ==========================================
app.post('/api/appointments', async (req, res) => {
  try {
    const { clientName, clientEmail, clientPhone, dateTime, serviceId, specialistId, date: bodyDate, time: bodyTime } = req.body;

    if (!clientName || !clientEmail || (!dateTime && (!bodyDate || !bodyTime)) || !serviceId || !specialistId) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben ser diligenciados.' });
    }

    if (!isValidEmail(clientEmail)) {
      return res.status(400).json({ error: 'El correo electrónico del cliente no es válido.' });
    }

    const fullDateTimeStr = dateTime || `${bodyDate}T${bodyTime}`;
    const newStart = new Date(fullDateTimeStr);

    if (isNaN(newStart.getTime())) {
      return res.status(400).json({ error: 'La fecha y hora proporcionadas no tienen un formato válido.' });
    }

    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) }
    });
    if (!service) {
      return res.status(404).json({ error: 'El servicio seleccionado no existe.' });
    }

    const specialist = await prisma.specialist.findUnique({
      where: { id: Number(specialistId) },
      include: { services: true }
    });
    if (!specialist) {
      return res.status(404).json({ error: 'El especialista seleccionado no existe.' });
    }

    const offersService = specialist.services.some((s) => s.id === Number(serviceId));
    if (!offersService) {
      return res.status(400).json({ 
        error: 'El especialista seleccionado no realiza el servicio solicitado.' 
      });
    }

    const newEnd = new Date(newStart.getTime() + (service.durationMin || 30) * 60000);

    const searchStart = new Date(newStart.getTime() - 24 * 60 * 60 * 1000);
    const searchEnd = new Date(newStart.getTime() + 24 * 60 * 60 * 1000);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        specialistId: Number(specialistId),
        status: { not: 'Cancelada' },
        date: { gte: searchStart, lte: searchEnd }
      },
      include: { service: true }
    });

    const isOverlapping = existingAppointments.some((apt) => {
      const aptStart = new Date(apt.date).getTime();
      const aptDuration = (apt.service && apt.service.durationMin) ? apt.service.durationMin : 30;
      const aptEnd = aptStart + (aptDuration * 60000);

      return newStart.getTime() < aptEnd && newEnd.getTime() > aptStart;
    });

    if (isOverlapping) {
      return res.status(409).json({ 
        error: 'El especialista ya cuenta con una cita agendada en esa franja horaria. Selecciona otro horario.' 
      });
    }

    // 1. Crear la cita
    const appointment = await prisma.appointment.create({
      data: {
        customerName: clientName.trim(),
        customerEmail: clientEmail.trim().toLowerCase(),
        customerPhone: clientPhone ? clientPhone.trim() : '',
        date: newStart,
        serviceId: Number(serviceId),
        specialistId: Number(specialistId),
        status: 'Agendada'
      },
      include: { service: true, specialist: true }
    });

    // 2. AUTO-GUARDAR PACIENTE EN LA TABLA PATIENT
    try {
      await prisma.patient.upsert({
        where: { email: clientEmail.trim().toLowerCase() },
        update: {
          name: clientName.trim(),
          phone: clientPhone ? clientPhone.trim() : null
        },
        create: {
          name: clientName.trim(),
          email: clientEmail.trim().toLowerCase(),
          phone: clientPhone ? clientPhone.trim() : null
        }
      });
    } catch (pErr) {
      console.error('Aviso: No se pudo auto-guardar en la tabla de pacientes:', pErr.message);
    }

    res.status(201).json(appointment);

    const dateFormatted = bodyDate || fullDateTimeStr.split('T')[0];
    const timeFormatted = bodyTime || fullDateTimeStr.split('T')[1];

    sendConfirmationEmail({
      id: appointment.id,
      clientName: appointment.customerName,
      clientEmail: appointment.customerEmail,
      serviceName: appointment.service?.name || service.name,
      specialistName: appointment.specialist?.name || specialist.name,
      date: dateFormatted,
      time: timeFormatted
    });

  } catch (error) {
    console.error('Error al agendar cita:', error);
    res.status(500).json({ error: 'No se pudo registrar la cita debido a un error interno.' });
  }
});

// ==========================================
// HU-12: Consultar agenda interna con filtros
// ==========================================
app.get('/api/appointments', async (req, res) => {
  try {
    const { date, startDate, endDate, specialistId, status } = req.query;
    let whereClause = {};

    if (specialistId) {
      whereClause.specialistId = Number(specialistId);
    }

    if (status && VALID_STATUSES.includes(status)) {
      whereClause.status = status;
    }

    if (date) {
      const { startOfDay, endOfDay } = getUtcDayRange(date);
      whereClause.date = { gte: startOfDay, lte: endOfDay };
    } else if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) whereClause.date.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: { 
        service: true, 
        specialist: true 
      },
      orderBy: { date: 'asc' }
    });

    res.json(appointments);
  } catch (error) {
    console.error('Error obteniendo agenda:', error);
    res.status(500).json({ error: 'Error interno al consultar la agenda de citas.' });
  }
});

// ==========================================
// HU-13: Actualizar el estado de la cita
// ==========================================
app.put('/api/appointments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointmentId = Number(id);
    if (isNaN(appointmentId)) {
      return res.status(400).json({ error: 'El ID de la cita no es válido.' });
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ 
        error: `Estado no válido. Los estados permitidos son: ${VALID_STATUSES.join(', ')}` 
      });
    }

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!existingAppointment) {
      return res.status(404).json({ error: 'La cita solicitada no fue encontrada.' });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
      include: { service: true, specialist: true }
    });

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'No se pudo actualizar el estado de la cita.' });
  }
});

// ==========================================
// HU-03: Configurar horario general
// ==========================================
app.post('/api/schedule/general', async (req, res) => {
  try {
    const { dayOfWeek, isOpen, openTime, closeTime, breakStart, breakEnd } = req.body;

    if (isOpen && openTime && closeTime) {
      if (openTime >= closeTime) {
        return res.status(400).json({ error: 'La hora de cierre debe ser posterior a la de apertura.' });
      }
    }

    if (breakStart && breakEnd) {
      if (breakStart >= breakEnd) {
        return res.status(400).json({ error: 'El inicio de la pausa debe ser antes del fin de la pausa.' });
      }
      if (breakStart < openTime || breakEnd > closeTime) {
        return res.status(400).json({ error: 'La pausa debe estar estrictamente dentro del horario de atención.' });
      }
    }

    const schedule = await prisma.generalSchedule.upsert({
      where: { dayOfWeek: parseInt(dayOfWeek) },
      update: { isOpen, openTime, closeTime, breakStart, breakEnd },
      create: { dayOfWeek: parseInt(dayOfWeek), isOpen, openTime, closeTime, breakStart, breakEnd }
    });

    res.status(200).json({ message: 'Horario configurado exitosamente', schedule });
  } catch (error) {
    console.error('Error al configurar horario:', error);
    res.status(500).json({ error: 'Error interno al guardar el horario general.' });
  }
});

// ==========================================
// HU-04: Horarios y días libres por especialista
// ==========================================
let specialistSchedules = {};
let specialistDaysOff = {};

app.post('/api/specialists/:id/days-off', (req, res) => {
  const { id } = req.params;
  const { date } = req.body; 
  if (!specialistDaysOff[id]) specialistDaysOff[id] = [];
  
  if (specialistDaysOff[id].includes(date)) {
    specialistDaysOff[id] = specialistDaysOff[id].filter(d => d !== date);
  } else {
    specialistDaysOff[id].push(date);
  }
  res.json({ message: 'Días libres actualizados', daysOff: specialistDaysOff[id] });
});

app.get('/api/specialists/:id/days-off', (req, res) => {
  res.json(specialistDaysOff[req.params.id] || []);
});

app.post('/api/specialists/:id/schedule', (req, res) => {
  const { id } = req.params;
  const { dayOfWeek, start, end } = req.body;
  if (!specialistSchedules[id]) specialistSchedules[id] = {};
  specialistSchedules[id][dayOfWeek] = { start, end };
  res.json({ message: 'Horario del especialista actualizado', schedule: specialistSchedules[id] });
});

app.get('/api/specialists/:id/schedule', (req, res) => {
  res.json(specialistSchedules[req.params.id] || {});
});

// ==========================================
// MOTOR UNIFICADO DE DISPONIBILIDAD (CORREGIDO)
// ==========================================
app.get('/api/appointments/available-slots', async (req, res) => {
  try {
    const { date, specialistId, serviceId } = req.query;

    if (!date || !specialistId || !serviceId) {
      return res.status(400).json({ error: 'Faltan parámetros obligatorios.' });
    }

    const dateString = date.split('T')[0];
    if (specialistDaysOff[specialistId] && specialistDaysOff[specialistId].includes(dateString)) {
      return res.json({ availableSlots: [], message: 'Día libre del especialista.' });
    }

    const service = await prisma.service.findUnique({ where: { id: Number(serviceId) } });
    if (!service) return res.status(404).json({ error: 'Servicio no encontrado.' });

    const targetDateObj = new Date(`${dateString}T00:00:00`);
    let dayOfWeek = targetDateObj.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7; 

    const scheduleConfig = await prisma.generalSchedule.findUnique({ where: { dayOfWeek } });
    
    if (scheduleConfig && !scheduleConfig.isOpen) {
      return res.json({ availableSlots: [], message: 'Cerrado por horario general.' });
    }

    const timeToMin = (timeStr) => {
      if (!timeStr) return null;
      const [h, m] = timeStr.split(':').map(Number);
      return (h * 60) + m;
    };

    let openMin = scheduleConfig?.openTime ? timeToMin(scheduleConfig.openTime) : 8 * 60;
    let closeMin = scheduleConfig?.closeTime ? timeToMin(scheduleConfig.closeTime) : 18 * 60;
    const breakStartMin = scheduleConfig?.breakStart ? timeToMin(scheduleConfig.breakStart) : null;
    const breakEndMin = scheduleConfig?.breakEnd ? timeToMin(scheduleConfig.breakEnd) : null;

    if (specialistSchedules[specialistId] && specialistSchedules[specialistId][dayOfWeek]) {
      const spStartMin = timeToMin(specialistSchedules[specialistId][dayOfWeek].start);
      const spEndMin = timeToMin(specialistSchedules[specialistId][dayOfWeek].end);
      if (spStartMin > openMin) openMin = spStartMin; 
      if (spEndMin < closeMin) closeMin = spEndMin; 
    }

    const searchStart = new Date(`${dateString}T00:00:00.000Z`);
    searchStart.setDate(searchStart.getDate() - 1);
    const searchEnd = new Date(`${dateString}T23:59:59.999Z`);
    searchEnd.setDate(searchEnd.getDate() + 1);

    const existingAppointments = await prisma.appointment.findMany({
      where: { 
        specialistId: Number(specialistId), 
        status: { not: 'Cancelada' },
        date: { gte: searchStart, lte: searchEnd }
      },
      include: { service: true }
    });

    const durationMin = service.durationMin || 30;
    const availableSlots = [];

    for (let currentMin = openMin; currentMin + durationMin <= closeMin; currentMin += 30) {
      const slotStartMin = currentMin;
      const slotEndMin = slotStartMin + durationMin;

      if (breakStartMin !== null && breakEndMin !== null) {
        if (slotStartMin < breakEndMin && slotEndMin > breakStartMin) {
          continue; 
        }
      }

      const h = Math.floor(slotStartMin / 60);
      const m = slotStartMin % 60;
      const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      // Comparación por milisegundos reales absolutos
      const slotStart = new Date(`${dateString}T${timeString}:00`);
      const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);

      const isOccupied = existingAppointments.some((apt) => {
        const aptStart = new Date(apt.date).getTime();
        const aptDuration = apt.service?.durationMin || 30;
        const aptEnd = aptStart + (aptDuration * 60000);

        return (slotStart.getTime() < aptEnd && slotEnd.getTime() > aptStart);
      });

      if (!isOccupied) {
        availableSlots.push(timeString);
      }
    }

    res.json({ availableSlots });
  } catch (error) {
    console.error('Error calculando disponibilidad:', error);
    res.status(500).json({ error: 'Error interno al consultar disponibilidad.' });
  }
});

// ==========================================
// HU-10: Recordatorio Programado
// ==========================================
app.post('/api/cron/send-reminders', async (req, res) => {
  try {
    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const appointmentsToRemind = await prisma.appointment.findMany({
      where: {
        date: { gte: tomorrowStart, lte: tomorrowEnd },
        status: 'Agendada'
      },
      include: { service: true, specialist: true }
    });

    let sentCount = 0;
    for (const apt of appointmentsToRemind) {
      const formattedDate = new Date(apt.date).toLocaleDateString('es-CO');
      const formattedTime = new Date(apt.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

      console.log(`⏰ [HU-10 CRON] Enviando recordatorio a ${apt.customerEmail} para la cita #${apt.id}`);
      
      if (transporter) {
        await transporter.sendMail({
          from: '"AgendaYa! Recordatorios" <no-reply@agendaya.com>',
          to: apt.customerEmail,
          subject: `⏰ Recordatorio: Tu cita es mañana en AgendaYa! (#${apt.id})`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #0d9488;">¡Hola ${apt.customerName}!</h2>
              <p>Te recordamos que tienes una cita programada para <strong>mañana ${formattedDate} a las ${formattedTime}</strong>.</p>
              <ul>
                <li><strong>Servicio:</strong> ${apt.service?.name}</li>
                <li><strong>Especialista:</strong> ${apt.specialist?.name}</li>
                <li><strong>Código de Reserva:</strong> #${apt.id}</li>
              </ul>
              <p>Si necesitas cancelar o cambiar tu horario, utiliza la opción de autogestión en nuestra web con tu código #${apt.id}.</p>
            </div>
          `
        });
        sentCount++;
      }
    }

    res.json({ message: `Recordatorios procesados con éxito. Correos enviados: ${sentCount}`, total: appointmentsToRemind.length });
  } catch (error) {
    console.error('Error enviando recordatorios HU-10:', error);
    res.status(500).json({ error: 'Error al procesar recordatorios.' });
  }
});

// ==========================================
// HU-11: Autogestión - Buscar Cita por ID/Código
// ==========================================
app.get('/api/appointments/manage/:id', async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);
    if (isNaN(appointmentId)) {
      return res.status(400).json({ error: 'El código de cita no es válido.' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true, specialist: true }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'No se encontró ninguna reserva con ese código.' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error al buscar cita HU-11:', error);
    res.status(500).json({ error: 'Error interno al consultar la cita.' });
  }
});

// ==========================================
// HU-11: Autogestión - Cancelar Cita
// ==========================================
app.put('/api/appointments/manage/:id/cancel', async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada.' });
    }

    if (appointment.status === 'Cancelada') {
      return res.status(400).json({ error: 'La cita ya se encuentra cancelada.' });
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'Cancelada' }
    });

    res.json({ message: 'Cita cancelada exitosamente.', appointment: updated });
  } catch (error) {
    console.error('Error cancelando cita HU-11:', error);
    res.status(500).json({ error: 'Error al cancelar la cita.' });
  }
});

// ==========================================
// HU-11: Autogestión - Reagendar Cita
// ==========================================
app.put('/api/appointments/manage/:id/reschedule', async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const { newDate, newTime } = req.body;

    if (!newDate || !newTime) {
      return res.status(400).json({ error: 'Debes proporcionar la nueva fecha y hora.' });
    }

    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada.' });
    }

    const daysOff = specialistDaysOff[appointment.specialistId] || [];
    if (daysOff.includes(newDate)) {
      return res.status(400).json({ error: 'El especialista no atiende en la fecha seleccionada (Día libre).' });
    }

    const newStart = new Date(`${newDate}T${newTime}`);

    const existingOverlaps = await prisma.appointment.findMany({
      where: {
        specialistId: appointment.specialistId,
        status: { not: 'Cancelada' },
        id: { not: appointmentId },
        date: newStart
      }
    });

    if (existingOverlaps.length > 0) {
      return res.status(409).json({ error: 'El especialista ya tiene una cita reservada en el nuevo horario seleccionado.' });
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        date: newStart,
        status: 'Agendada'
      }
    });

    res.json({ message: 'Cita reagendada exitosamente.', appointment: updated });
  } catch (error) {
    console.error('Error reagendando cita HU-11:', error);
    res.status(500).json({ error: 'Error al reagendar la cita.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo y funcionando en http://localhost:${PORT}`);
});