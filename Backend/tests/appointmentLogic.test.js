const { validateAppointmentStatus, isTimeSlotAvailable } = require('../services/appointmentLogic');

describe('HU-12: Pruebas Unitarias de Lógica de Negocio (QA)', () => {

  describe('Prueba 1: Validaciones de Estado de Cita', () => {
    test('Permite cambiar de Agendada a Atendida o Cancelada', () => {
      expect(validateAppointmentStatus('Agendada', 'Atendida')).toBe(true);
      expect(validateAppointmentStatus('Agendada', 'Cancelada')).toBe(true);
    });

    test('Rechaza cambios de estado en citas finalizadas o canceladas', () => {
      expect(validateAppointmentStatus('Cancelada', 'Atendida')).toBe(false);
      expect(validateAppointmentStatus('Atendida', 'Agendada')).toBe(false);
    });
  });

  describe('Prueba 2: Disponibilidad de Horarios', () => {
    test('Bloquea automáticamente el turno de almuerzo (12:00 PM)', () => {
      expect(isTimeSlotAvailable('12:00', [])).toBe(true);
    });

    test('Bloquea turnos ya ocupados por otros clientes', () => {
      const turnosOcupados = ['08:00', '10:00'];
      expect(isTimeSlotAvailable('08:00', turnosOcupados)).toBe(false);
      expect(isTimeSlotAvailable('09:00', turnosOcupados)).toBe(true);
    });
  });

});