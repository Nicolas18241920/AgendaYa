// Lógica de negocio 1: Validación de transiciones de estado de la cita
function validateAppointmentStatus(currentStatus, newStatus) {
  const validStatuses = ['Agendada', 'En Proceso', 'Atendida', 'Cancelada', 'Inasistencia'];
  
  if (!validStatuses.includes(newStatus)) {
    return false;
  }
  
  // Si la cita ya fue cancelada o atendida, no se permite cambiar de estado
  if (currentStatus === 'Cancelada' || currentStatus === 'Atendida') {
    return false;
  }

  return true;
}

// Lógica de negocio 2: Disponibilidad de horarios (excluye almuerzo de 12:00 a 13:00)
function isTimeSlotAvailable(slotTime, existingSlots = [], breakStart = '12:00', breakEnd = '13:00') {
  if (slotTime >= breakStart && slotTime < breakEnd) {
    return false;
  }

  if (existingSlots.includes(slotTime)) {
    return false;
  }

  return true;
}

module.exports = {
  validateAppointmentStatus,
  isTimeSlotAvailable
};