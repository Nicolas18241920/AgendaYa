const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const VALID_STATUSES = ['Agendada', 'Completada', 'Cancelada'];

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Auxiliar para construir rangos de día completos en UTC
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
// RUTA DE HEALTHCHECK
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor y base de datos operativos' });
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
    const { name, email, specialty, serviceIds } = req.body;

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

// ==========================================
// HU-05, HU-06 y HU-07: Crear cita
// ==========================================
app.post('/api/appointments', async (req, res) => {
  try {
    const { clientName, clientEmail, clientPhone, dateTime, serviceId, specialistId } = req.body;

    if (!clientName || !clientEmail || !dateTime || !serviceId || !specialistId) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben ser diligenciados.' });
    }

    if (!isValidEmail(clientEmail)) {
      return res.status(400).json({ error: 'El correo electrónico del cliente no es válido.' });
    }

    const newStart = new Date(dateTime);
    if (isNaN(newStart.getTime())) {
      return res.status(400).json({ error: 'La fecha y hora proporcionadas no tienen un formato válido.' });
    }

    if (newStart < new Date()) {
      return res.status(400).json({ error: 'No es posible agendar citas en fechas u horas pasadas.' });
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

    const newEnd = new Date(newStart.getTime() + service.durationMin * 60000);

    // Búsqueda amplia para garantizar coincidencia de traslape
    const searchStart = new Date(newStart);
    searchStart.setDate(searchStart.getDate() - 1);
    const searchEnd = new Date(newStart);
    searchEnd.setDate(searchEnd.getDate() + 2);

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

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error al agendar cita:', error);
    res.status(500).json({ error: 'No se pudo registrar la cita debido a un error interno.' });
  }
});


// ==========================================
// HU-08: Franjas disponibles (Devuelve formato HH:mm compatible con Frontend)
// ==========================================
app.get('/api/appointments/available-slots', async (req, res) => {
  try {
    const { date, specialistId, serviceId } = req.query;

    if (!date || !specialistId || !serviceId) {
      return res.status(400).json({ error: 'Faltan parámetros: date, specialistId o serviceId.' });
    }

    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) }
    });
    if (!service) return res.status(404).json({ error: 'Servicio no encontrado.' });

    // 1. Obtener todas las citas activas del especialista
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        specialistId: Number(specialistId),
        status: { not: 'Cancelada' }
      },
      include: { service: true }
    });

    // 2. Extraer año, mes y día de la fecha recibida
    let targetYear, targetMonth, targetDay;
    if (date.includes('-')) {
      const parts = date.split('T')[0].split('-').map(Number);
      [targetYear, targetMonth, targetDay] = parts;
    } else if (date.includes('/')) {
      const parts = date.split('/').map(Number);
      if (parts[0] > 1000) [targetYear, targetMonth, targetDay] = parts;
      else [targetDay, targetMonth, targetYear] = parts;
    }

    // 3. Generar franjas de trabajo (08:00 a 18:00)
    const openingHour = 8;
    const closingHour = 18;
    const availableSlots = [];
    const durationMin = service.durationMin || 30;

    for (let hour = openingHour; hour < closingHour; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const slotStartMin = hour * 60 + min;
        const slotEndMin = slotStartMin + durationMin;

        if (slotEndMin > closingHour * 60) continue;

        const timeString = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

        // 4. Filtrar si la franja choca con una cita activa del mismo día
        const isOccupied = existingAppointments.some((apt) => {
          const aptDate = new Date(apt.date);
          
          const isSameDay = 
            (aptDate.getUTCFullYear() === targetYear && aptDate.getUTCMonth() + 1 === targetMonth && aptDate.getUTCDate() === targetDay) ||
            (aptDate.getFullYear() === targetYear && aptDate.getMonth() + 1 === targetMonth && aptDate.getDate() === targetDay);

          if (!isSameDay) return false;

          const aptStartMin = aptDate.getUTCHours() * 60 + aptDate.getUTCMinutes();
          const aptEndMin = aptStartMin + (apt.service?.durationMin || 30);

          const aptLocalStartMin = aptDate.getHours() * 60 + aptDate.getMinutes();
          const aptLocalEndMin = aptLocalStartMin + (apt.service?.durationMin || 30);

          return (slotStartMin < aptEndMin && slotEndMin > aptStartMin) ||
                 (slotStartMin < aptLocalEndMin && slotEndMin > aptLocalStartMin);
        });

        if (!isOccupied) {
          availableSlots.push(timeString);
        }
      }
    }

    console.log(`[DEBUG HU-08] Citas encontradas: ${existingAppointments.length} | Franjas devueltas:`, availableSlots);
    res.json({ availableSlots });
  } catch (error) {
    console.error('Error calculando disponibilidad:', error);
    res.status(500).json({ error: 'Error al consultar disponibilidad.' });
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});