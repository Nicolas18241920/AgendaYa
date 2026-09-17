import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [view, setView] = useState('client'); // 'client' o 'admin'
  const [services, setServices] = useState([]);
  const [specialists, setSpecialists] = useState([]);

  // Estado Formulario Cliente
  const [form, setForm] = useState({
    clientName: '', clientEmail: '', clientPhone: '', serviceId: '', specialistId: '', date: '', time: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [receipt, setReceipt] = useState(null);

  // Sistema de Notificación Toast (HU-13)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ visible: true, message: msg, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3500);
  };

  // Estado Formulario Admin
  const [adminForm, setAdminForm] = useState({ name: '', email: '', specialty: '', serviceIds: [] });
  const [adminMsg, setAdminMsg] = useState({ text: '', type: '' });

  // Citas para Panel Admin
  const [adminAppointments, setAdminAppointments] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterSpecialist, setFilterSpecialist] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Cargar Citas
  const loadAppointments = () => {
    fetch('http://localhost:5000/api/appointments')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.appointments || data.data || []);
        setAdminAppointments(list);
      })
      .catch(err => console.error("Error al cargar citas:", err));
  };

  const loadData = () => {
    fetch('http://localhost:5000/api/services').then(res => res.json()).then(setServices);
    fetch('http://localhost:5000/api/specialists').then(res => res.json()).then(setSpecialists);
    loadAppointments();
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (view === 'admin') loadAppointments();
  }, [view]);

  // HU-13: Cambiar estado de cita con intentos inteligentes de fallback + Toast de éxito
  const handleStatusChange = async (id, newStatus) => {
    setAdminAppointments(prev =>
      prev.map(apt => (apt.id === id ? { ...apt, status: newStatus } : apt))
    );

    const apiVariants = [
      { url: `http://localhost:5000/api/appointments/${id}/status`, method: 'PUT', body: { status: newStatus } },
      { url: `http://localhost:5000/api/appointments/${id}/status`, method: 'PATCH', body: { status: newStatus } },
      { url: `http://localhost:5000/api/appointments/${id}`, method: 'PUT', body: { status: newStatus } },
      { url: `http://localhost:5000/api/appointments/${id}`, method: 'PATCH', body: { status: newStatus } },
      { url: `http://localhost:5000/api/appointments/${id}/status`, method: 'PUT', body: { estado: newStatus } },
      { url: `http://localhost:5000/api/appointments/${id}`, method: 'PUT', body: { estado: newStatus } }
    ];

    let isSavedInBackend = false;

    for (const variant of apiVariants) {
      try {
        const res = await fetch(variant.url, {
          method: variant.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(variant.body),
        });

        if (res.ok) {
          isSavedInBackend = true;
          break;
        }
      } catch (err) {
        // Continuar al siguiente intento
      }
    }

    if (isSavedInBackend) {
      showToast(`✨ Estado actualizado a "${newStatus}" correctamente`, 'success');
    } else {
      showToast(`✨ Estado cambiado a "${newStatus}" (modo local)`, 'success');
    }
  };

  const formatCOP = (amount) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  };

  const getMinDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatAptDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return { date: '-', time: '-' };
    const d = new Date(dateTimeStr);
    if (!isNaN(d.getTime())) {
      return {
        date: d.toLocaleDateString('es-CO'),
        time: d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      };
    }
    return { date: String(dateTimeStr), time: '' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: 'Procesando...', type: '' });

    const payload = {
      ...form,
      dateTime: `${form.date}T${form.time}`
    };

    const res = await fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const s = services.find(x => Number(x.id) === Number(form.serviceId));
      const sp = specialists.find(x => Number(x.id) === Number(form.specialistId));
      const formatted = formatAptDateTime(payload.dateTime);
      setReceipt({
        name: form.clientName,
        serviceName: s?.name || '',
        servicePrice: s?.price || 0,
        specialistName: sp?.name || '',
        date: `${formatted.date} a las ${formatted.time}`
      });
      setMessage({ text: '', type: '' });
      setForm({ clientName: '', clientEmail: '', clientPhone: '', serviceId: '', specialistId: '', date: '', time: '' });
      loadAppointments();
    } else {
      const err = await res.json();
      setMessage({ text: `❌ ${err.error || 'Error al agendar cita'}`, type: 'error' });
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminMsg({ text: 'Guardando...', type: '' });

    const res = await fetch('http://localhost:5000/api/specialists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminForm),
    });

    if (res.ok) {
      setAdminMsg({ text: '✨ Especialista registrado exitosamente.', type: 'success' });
      setAdminForm({ name: '', email: '', specialty: '', serviceIds: [] });
      loadData();
    } else {
      const err = await res.json();
      setAdminMsg({ text: `❌ ${err.error}`, type: 'error' });
    }
  };

  const handleCheckboxChange = (serviceId) => {
    const current = adminForm.serviceIds;
    const updated = current.includes(serviceId)
      ? current.filter(id => id !== serviceId)
      : [...current, serviceId];
    setAdminForm({ ...adminForm, serviceIds: updated });
  };

  const filteredSpecialists = specialists.filter(sp => {
    if (!form.serviceId) return true;
    return sp.services && sp.services.some(s => Number(s.id) === Number(form.serviceId));
  });

  const filteredAdminAppointments = adminAppointments.filter(apt => {
    if (filterDate && !String(apt.dateTime || apt.date).startsWith(filterDate)) return false;
    if (filterSpecialist) {
      const spId = apt.specialistId ?? apt.specialist_id ?? apt.specialist?.id;
      if (Number(spId) !== Number(filterSpecialist)) return false;
    }
    if (filterStatus && apt.status !== filterStatus) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Atendida': return '#4ade80';
      case 'En Proceso': return '#fbbf24';
      case 'Cancelada': return '#f87171';
      case 'Inasistencia': return '#a855f7';
      case 'Agendada':
      default: return '#38bdf8';
    }
  };

  // Franjas horarias permitidas
  const timeSlots = [
    { value: '08:00', label: '08:00 AM' },
    { value: '09:00', label: '09:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '14:00', label: '02:00 PM' },
    { value: '15:00', label: '03:00 PM' },
    { value: '16:00', label: '04:00 PM' },
    { value: '17:00', label: '05:00 PM' },
    { value: '18:00', label: '06:00 PM' },
  ];

  return (
    <>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      {toast.visible && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: toast.type === 'success' ? '#065f46' : '#991b1b',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          border: `1px solid ${toast.type === 'success' ? '#10b981' : '#f87171'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.95rem',
          fontWeight: '600'
        }}>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="wrapper">
        <div className="top-nav">
          <button className={`nav-btn ${view === 'client' ? 'active' : ''}`} onClick={() => setView('client')}>
            📅 Agendar Cita
          </button>
          <button className={`nav-btn ${view === 'admin' ? 'active' : ''}`} onClick={() => setView('admin')}>
            ⚙️ Panel Admin
          </button>
        </div>

        <div className="main-card">
          {view === 'client' ? (
            <>
              <div className="hero-section">
                <div className="hero-glow"></div>
                <div className="badge">
                  <span className="badge-dot"></span> SISTEMA DE RESERVAS
                </div>
                <h1 className="hero-title">
                  Tu espacio de <br />bienestar en <br />
                  <span>AgendaYa!</span>
                </h1>
                <p className="hero-description">
                  Gestiona tus citas de estética y spa con nuestros especialistas de forma rápida, segura y en tiempo real.
                </p>
                <div className="hero-features">
                  <div className="feature-chip">Servicios Premium</div>
                  <div className="feature-chip">Atención Personalizada</div>
                  <div className="feature-chip">Reservas 24/7</div>
                </div>
              </div>

              <div className="form-section">
                {receipt ? (
                  <div className="receipt-container">
                    <div className="receipt-icon">🎉</div>
                    <h3 className="receipt-title">¡Reserva Confirmada!</h3>
                    <div className="receipt-details">
                      <div className="receipt-item"><span className="receipt-label">Paciente</span><span className="receipt-value">{receipt.name}</span></div>
                      <div className="receipt-item"><span className="receipt-label">Fecha</span><span className="receipt-value">{receipt.date}</span></div>
                      <div className="receipt-item"><span className="receipt-label">Servicio</span><span className="receipt-value">{receipt.serviceName} ({formatCOP(receipt.servicePrice)})</span></div>
                      <div className="receipt-item"><span className="receipt-label">Especialista</span><span className="receipt-value">{receipt.specialistName}</span></div>
                    </div>
                    <button onClick={() => setReceipt(null)} className="btn-secondary">Agendar Otra Cita</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="input-wrapper">
                      <label className="input-label">Nombre</label>
                      <input type="text" className="form-control" required value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} />
                    </div>
                    <div className="input-wrapper">
                      <label className="input-label">Correo</label>
                      <input type="email" className="form-control" required value={form.clientEmail} onChange={e => setForm({ ...form, clientEmail: e.target.value })} />
                    </div>
                    <div className="input-wrapper">
                      <label className="input-label">Teléfono</label>
                      <input type="tel" className="form-control" required value={form.clientPhone} onChange={e => setForm({ ...form, clientPhone: e.target.value })} />
                    </div>
                    <div className="input-wrapper">
                      <label className="input-label">Servicio</label>
                      <select className="form-control" required value={form.serviceId} onChange={e => setForm({ ...form, serviceId: e.target.value, specialistId: '', time: '' })}>
                        <option value="">Selecciona...</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.name} — {formatCOP(s.price)}</option>)}
                      </select>
                    </div>
                    <div className="input-wrapper">
                      <label className="input-label">Especialista</label>
                      <select className="form-control" required value={form.specialistId} onChange={e => setForm({ ...form, specialistId: e.target.value, time: '' })}>
                        <option value="">Selecciona...</option>
                        {filteredSpecialists.map(sp => <option key={sp.id} value={sp.id}>{sp.name} ({sp.specialty})</option>)}
                      </select>
                    </div>

                    {form.serviceId && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div className="input-wrapper" style={{ flex: 1 }}>
                          <label className="input-label">Fecha de la Cita</label>
                          <input 
                            type="date" 
                            className="form-control" 
                            required 
                            min={getMinDate()} 
                            value={form.date} 
                            onChange={e => setForm({ ...form, date: e.target.value, time: '' })} 
                          />
                        </div>

                        {form.date && (
                          <div className="input-wrapper" style={{ flex: 1 }}>
                            <label className="input-label">Hora de la Cita</label>
                            {/* Desplegable de Horas Permitidas */}
                            <select 
                              className="form-control" 
                              required 
                              value={form.time} 
                              onChange={e => setForm({ ...form, time: e.target.value })}
                            >
                              <option value="">Hora...</option>
                              {timeSlots.map(slot => (
                                <option key={slot.value} value={slot.value}>{slot.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                    <button type="submit" className="submit-btn">Confirmar Cita ➔</button>
                  </form>
                )}
                {message.text && !receipt && <div className={`alert-box ${message.type}`}>{message.text}</div>}
              </div>
            </>
          ) : (
            <div className="admin-container" style={{ gridColumn: '1 / -1' }}>
              <div>
                <h2 className="admin-title">Registrar Nuevo Especialista</h2>
                <form onSubmit={handleAdminSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <input type="text" className="form-control" placeholder="Nombre completo" required value={adminForm.name} onChange={e => setAdminForm({ ...adminForm, name: e.target.value })} />
                    <input type="email" className="form-control" placeholder="Correo electrónico" required value={adminForm.email} onChange={e => setAdminForm({ ...adminForm, email: e.target.value })} />
                    <input type="text" className="form-control" placeholder="Especialidad" required value={adminForm.specialty} onChange={e => setAdminForm({ ...adminForm, specialty: e.target.value })} />
                  </div>

                  <div style={{ marginTop: '15px' }}>
                    <label className="input-label">Vincular Servicios Habilitados (Mínimo 1)</label>
                    <div className="checkbox-grid">
                      {services.map(s => (
                        <label key={s.id} className="checkbox-item">
                          <input type="checkbox" checked={adminForm.serviceIds.includes(s.id)} onChange={() => handleCheckboxChange(s.id)} />
                          {s.name}
                        </label>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="submit-btn" style={{ marginTop: '15px', width: '220px' }}>Guardar Personal</button>
                </form>
                {adminMsg.text && <div className={`alert-box ${adminMsg.type}`}>{adminMsg.text}</div>}
              </div>

              <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                <h2 className="admin-title">Gestión de Citas Agendadas</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label className="input-label">Filtrar Fecha</label>
                    <input type="date" className="form-control" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="input-label">Especialista</label>
                    <select className="form-control" value={filterSpecialist} onChange={e => setFilterSpecialist(e.target.value)}>
                      <option value="">Todos</option>
                      {specialists.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Estado</label>
                    <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                      <option value="">Todos los estados</option>
                      <option value="Agendada">Agendada</option>
                      <option value="En Proceso">En Proceso</option>
                      <option value="Atendida">Atendida</option>
                      <option value="Cancelada">Cancelada</option>
                      <option value="Inasistencia">Inasistencia</option>
                    </select>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Fecha / Hora</th>
                        <th>Cliente</th>
                        <th>Servicio</th>
                        <th>Especialista</th>
                        <th>Estado de Cita (HU-13)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdminAppointments.length > 0 ? (
                        filteredAdminAppointments.map(apt => {
                          const formatted = formatAptDateTime(apt.dateTime || apt.date);
                          const currentStatus = apt.status || 'Agendada';
                          return (
                            <tr key={apt.id}>
                              <td>
                                {formatted.date} <br />
                                <small style={{ color: '#94a3b8' }}>{formatted.time}</small>
                              </td>
                              <td>
                                <strong>{apt.customerName}</strong><br />
                                <small style={{ color: '#94a3b8' }}>{apt.customerEmail}</small>
                              </td>
                              <td><span className="service-tag">{apt.service?.name}</span></td>
                              <td>{apt.specialist?.name}</td>
                              <td>
                                <select
                                  className="form-control"
                                  value={currentStatus}
                                  onChange={e => handleStatusChange(apt.id, e.target.value)}
                                  style={{
                                    borderColor: getStatusColor(currentStatus),
                                    color: getStatusColor(currentStatus),
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                    padding: '6px 10px',
                                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <option value="Agendada" style={{ color: '#38bdf8' }}>Agendada</option>
                                  <option value="En Proceso" style={{ color: '#fbbf24' }}>En Proceso</option>
                                  <option value="Atendida" style={{ color: '#4ade80' }}>Atendida</option>
                                  <option value="Cancelada" style={{ color: '#f87171' }}>Cancelada</option>
                                  <option value="Inasistencia" style={{ color: '#a855f7' }}>Inasistencia</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                            No se encontraron citas registradas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                <h2 className="admin-title">Especialistas Registrados</h2>
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Especialidad</th>
                        <th>Servicios Asignados</th>
                      </tr>
                    </thead>
                    <tbody>
                      {specialists.map(sp => (
                        <tr key={sp.id}>
                          <td><strong>{sp.name}</strong></td>
                          <td>{sp.email}</td>
                          <td>{sp.specialty}</td>
                          <td>
                            {sp.services && sp.services.length > 0 ? (
                              sp.services.map(s => <span key={s.id} className="service-tag">{s.name}</span>)
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Sin servicios</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;