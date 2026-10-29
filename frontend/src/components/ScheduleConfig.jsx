import React, { useState } from 'react';

const ScheduleConfig = () => {
  const [formData, setFormData] = useState({
    dayOfWeek: '1', // 1 = Lunes por defecto
    isOpen: true,
    openTime: '08:00',
    closeTime: '18:00',
    breakStart: '12:00',
    breakEnd: '13:00'
  });
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg({ text: 'Guardando...', type: 'info' });

    try {
      const response = await fetch('http://localhost:5000/api/schedule/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        // Aquí atrapamos el error del Criterio 2 (ej. si hora de cierre es menor a apertura)
        setStatusMsg({ text: data.error, type: 'error' });
      } else {
        setStatusMsg({ text: '¡Horario guardado exitosamente!', type: 'success' });
      }
    } catch (error) {
      setStatusMsg({ text: 'Error al conectar con el servidor', type: 'error' });
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>⚙️ Configuración de Horario General (HU-03)</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* CRITERIO 1: Seleccionar días de la semana */}
        <div>
          <label><strong>Día de la semana:</strong></label>
          <select name="dayOfWeek" value={formData.dayOfWeek} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
            <option value="1">Lunes</option>
            <option value="2">Martes</option>
            <option value="3">Miércoles</option>
            <option value="4">Jueves</option>
            <option value="5">Viernes</option>
            <option value="6">Sábado</option>
            <option value="7">Domingo</option>
          </select>
        </div>

        <div>
          <label>
            <input type="checkbox" name="isOpen" checked={formData.isOpen} onChange={handleChange} />
            {' '}¿Se atiende este día?
          </label>
        </div>

        {formData.isOpen && (
          <>
            {/* CRITERIO 2: Horas de Apertura y Cierre */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label>Apertura:</label>
                <input type="time" name="openTime" value={formData.openTime} onChange={handleChange} style={{ width: '100%', padding: '8px' }} required />
              </div>
              <div style={{ flex: 1 }}>
                <label>Cierre:</label>
                <input type="time" name="closeTime" value={formData.closeTime} onChange={handleChange} style={{ width: '100%', padding: '8px' }} required />
              </div>
            </div>

            {/* CRITERIO 3: Pausa Operativa (Almuerzo) */}
            <div style={{ display: 'flex', gap: '10px', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
              <div style={{ flex: 1 }}>
                <label>Inicio Pausa:</label>
                <input type="time" name="breakStart" value={formData.breakStart} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label>Fin Pausa:</label>
                <input type="time" name="breakEnd" value={formData.breakEnd} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
              </div>
            </div>
          </>
        )}

        <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Guardar Configuración
        </button>

        {/* Mensajes de validación y éxito */}
        {statusMsg.text && (
          <div style={{ 
            padding: '10px', 
            marginTop: '10px', 
            color: statusMsg.type === 'error' ? '#721c24' : '#155724',
            backgroundColor: statusMsg.type === 'error' ? '#f8d7da' : '#d4edda',
            border: '1px solid',
            borderRadius: '4px'
          }}>
            {statusMsg.text}
          </div>
        )}
      </form>
    </div>
  );
};

export default ScheduleConfig;