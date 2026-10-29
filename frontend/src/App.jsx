import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Plus,
  Search,
  Settings,
  BarChart3,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Trash2,
  Edit3,
  Briefcase,
  Phone,
  Mail,
  Check,
  RefreshCw,
  LogOut,
  TrendingUp,
  Users,
  DollarSign,
  Send,
  Zap,
  Bell,
  Award,
  Activity,
  ChevronDown,
  CalendarCheck,
  Percent,
  Star,
  SlidersHorizontal,
  Lock,
  QrCode,
  Printer,
  X,
  Image as ImageIcon,
  Upload
} from 'lucide-react';

// Carga inmediata de Tailwind CSS
if (typeof document !== 'undefined' && !document.getElementById('tailwind-cdn')) {
  const script = document.createElement('script');
  script.id = 'tailwind-cdn';
  script.src = 'https://cdn.tailwindcss.com';
  document.head.appendChild(script);
}

const API_BASE_URL = 'http://localhost:5000/api';

// --- MOCK INITIAL DATA DE RESPALDO ---
const INITIAL_SERVICES = [
  {
    id: 1,
    name: 'Facial Hydro-Glow Luxury',
    category: 'Spa & Derm',
    duration: '60 min',
    price: '$120.000',
    priceNum: 120000,
    description: 'Limpieza profunda con infusión de hialurónico, cavitación facial y fototerapia LED.',
    color: 'from-cyan-500 to-blue-600',
    active: true
  },
  {
    id: 2,
    name: 'Armonización Facial & Botox',
    category: 'Medicina Estética',
    duration: '45 min',
    price: '$350.000',
    priceNum: 350000,
    description: 'Atenuación de líneas de expresión con toxina botulínica grado médico FDA.',
    color: 'from-violet-500 to-purple-600',
    active: true
  },
  {
    id: 3,
    name: 'Depilación Láser Soprano Ice',
    category: 'Láser Spa',
    duration: '30 min',
    price: '$90.000',
    priceNum: 90000,
    description: 'Sesión corporal con tecnología indolora de enfriamiento continuo a -3°C.',
    color: 'from-emerald-400 to-teal-600',
    active: true
  },
  {
    id: 4,
    name: 'Masaje Reductivo & Maderoterapia',
    category: 'Corporal',
    duration: '75 min',
    price: '$150.000',
    priceNum: 150000,
    description: 'Escultura corporal con maderoterapia, ondas rusas y drenaje linfático asistido.',
    color: 'from-pink-500 to-rose-600',
    active: true
  }
];

const INITIAL_SPECIALISTS = [
  {
    id: 1,
    name: 'Dra. Valentina Ríos',
    role: 'Especialista Medicina Estética',
    avatar: 'https://images.unsplash.com/photo-1594824813566-82823d293f44?auto=format&fit=crop&w=250&q=80',
    rating: '4.95',
    reviews: 340,
    services: ['Facial Hydro-Glow Luxury', 'Armonización Facial & Botox'],
    workingDays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    lunchBreak: '1:00 PM - 2:00 PM'
  },
  {
    id: 2,
    name: 'Dr. Mateo Holguín',
    role: 'Dermatólogo Clínico',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=250&q=80',
    rating: '4.90',
    reviews: 215,
    services: ['Facial Hydro-Glow Luxury', 'Depilación Láser Soprano Ice'],
    workingDays: ['Mar', 'Mié', 'Jue', 'Vie'],
    lunchBreak: '12:30 PM - 1:30 PM'
  },
  {
    id: 3,
    name: 'Camila Sterling',
    role: 'Cosmiatra & Laser Therapist',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    rating: '4.98',
    reviews: 480,
    services: ['Depilación Láser Soprano Ice', 'Masaje Reductivo & Maderoterapia'],
    workingDays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    lunchBreak: '1:00 PM - 2:00 PM'
  }
];

export default function App() {
  const [, setCssReady] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);

  useEffect(() => {
    const checkTailwind = () => {
      if (window.tailwind) {
        setCssReady(true);
      } else {
        setTimeout(checkTailwind, 50);
      }
    };
    checkTailwind();
  }, []);

  const [activeMainTab, setActiveMainTab] = useState('booking');
  const [adminSubTab, setAdminSubTab] = useState('analytics');

  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [specialists, setSpecialists] = useState(INITIAL_SPECIALISTS);
  const [availableSlotsFromBackend, setAvailableSlotsFromBackend] = useState([]);

  const [generalSchedule, setGeneralSchedule] = useState({
    openTime: '08:00',
    closeTime: '18:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    isOpen: true
  });

  const [toast, setToast] = useState(null);
  const triggerToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // FETCH PRINCIPAL: CARGAR CITAS, SERVICIOS Y ESPECIALISTAS DESDE POSTGRESQL
  const loadAllBackendData = async () => {
    try {
      const healthRes = await fetch(`${API_BASE_URL}/health`);
      if (healthRes.ok) {
        setApiConnected(true);

        // 1. Cargar servicios
        const srvRes = await fetch(`${API_BASE_URL}/services`);
        if (srvRes.ok) {
          const dataSrv = await srvRes.json();
          if (dataSrv.length > 0) {
            setServices(dataSrv.map(s => ({
              id: s.id,
              name: s.name,
              category: s.category || 'Tratamiento',
              duration: `${s.durationMin || 30} min`,
              price: `$${Number(s.price).toLocaleString('es-CO')}`,
              priceNum: Number(s.price),
              description: 'Tratamiento profesional certificado.',
              active: true
            })));
          }
        }

        // 2. Cargar especialistas
        const specRes = await fetch(`${API_BASE_URL}/specialists`);
        if (specRes.ok) {
          const dataSpec = await specRes.json();
          if (dataSpec.length > 0) {
            const formatted = dataSpec.map(s => ({
              id: s.id,
              name: s.name,
              role: s.specialty || 'Especialista Estético',
              avatar: s.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=250&q=80',
              rating: '4.95',
              reviews: 120,
              services: s.services ? s.services.map(srv => srv.name) : [],
              workingDays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
              lunchBreak: '12:00 PM - 01:00 PM'
            }));
            setSpecialists(formatted);
          }
        }

        // 3. Cargar citas guardadas
        const appRes = await fetch(`${API_BASE_URL}/appointments`);
        if (appRes.ok) {
          const dataApp = await appRes.json();
          const mappedAppointments = dataApp.map(a => {
            const dateObj = new Date(a.date);
            const dateStr = a.date ? a.date.split('T')[0] : '';
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            const h12 = dateObj.getHours() % 12 || 12;
            const ampm = dateObj.getHours() >= 12 ? 'PM' : 'AM';
            const timeFormatted = `${String(h12).padStart(2, '0')}:${minutes} ${ampm}`;

            return {
              id: `AGD-${a.id}`,
              numericId: a.id,
              clientName: a.customerName,
              clientEmail: a.customerEmail,
              clientPhone: a.customerPhone || '',
              service: a.service?.name || 'Servicio Spa',
              specialist: a.specialist?.name || 'Especialista',
              date: dateStr,
              time: timeFormatted,
              status: a.status || 'Agendada',
              price: a.service?.price ? `$${Number(a.service.price).toLocaleString('es-CO')}` : '$100.000',
              priceNum: a.service?.price ? Number(a.service.price) : 100000,
              created: 'Registrada'
            };
          });
          setAppointments(mappedAppointments);
        }
      }
    } catch (err) {
      console.log('⚡ Modo Backend Offline: Usando estado en memoria.', err);
      setApiConnected(false);
    }
  };

  useEffect(() => {
    loadAllBackendData();
  }, []);

  const [bookingStep, setBookingStep] = useState(1);
  const [selectedService, setSelectedService] = useState(INITIAL_SERVICES[0]);
  const [selectedSpecialist, setSelectedSpecialist] = useState(INITIAL_SPECIALISTS[0]);
  const [selectedDate, setSelectedDate] = useState('2026-10-28');
  const [selectedTime, setSelectedTime] = useState('08:00 AM');
  const [clientForm, setClientForm] = useState({
    name: 'Carolina Herrera',
    email: 'carolina.h@estetica.com',
    phone: '+57 301 888 9900',
    notes: 'Piel sensible, preferencia por productos hipoalergénicos.'
  });
  const [completedBooking, setCompletedBooking] = useState(null);

  useEffect(() => {
    if (services.length > 0 && !selectedService) setSelectedService(services[0]);
    if (specialists.length > 0 && !selectedSpecialist) setSelectedSpecialist(specialists[0]);
  }, [services, specialists]);

  useEffect(() => {
    if (!selectedDate || !selectedSpecialist?.id || !selectedService?.id || !apiConnected) return;

    const fetchAvailableSlots = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/appointments/available-slots?date=${selectedDate}&specialistId=${selectedSpecialist.id}&serviceId=${selectedService.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setAvailableSlotsFromBackend(data.availableSlots || []);
        }
      } catch (err) {
        console.error('Error obteniendo disponibilidad:', err);
      }
    };

    fetchAvailableSlots();
  }, [selectedDate, selectedSpecialist, selectedService, apiConnected]);

  const dynamicTimeSlots = useMemo(() => {
    const slots = [];
    const openH = parseInt(generalSchedule.openTime.split(':')[0], 10) || 8;
    const closeH = parseInt(generalSchedule.closeTime.split(':')[0], 10) || 18;
    const breakStartH = parseInt(generalSchedule.breakStart.split(':')[0], 10) || 12;

    for (let h = openH; h < closeH; h++) {
      const isLunch = h === breakStartH;
      const hour12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedTime12 = `${String(hour12).padStart(2, '0')}:00 ${ampm}`;
      const time24Str = `${String(h).padStart(2, '0')}:00`;

      let slotStatus = 'occupied';
      if (isLunch) {
        slotStatus = 'off';
      } else if (!apiConnected) {
        slotStatus = 'available';
      } else if (availableSlotsFromBackend.includes(time24Str)) {
        slotStatus = 'available';
      }

      slots.push({
        time: formattedTime12,
        time24: time24Str,
        status: slotStatus
      });
    }
    return slots;
  }, [generalSchedule, availableSlotsFromBackend, apiConnected]);

  const [searchCodeInput, setSearchCodeInput] = useState('AGD-1');
  const [searchedAppointment, setSearchedAppointment] = useState(null);
  const [rescheduleModalApp, setRescheduleModalApp] = useState(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState('2026-10-29');
  const [newRescheduleTime, setNewRescheduleTime] = useState('02:00 PM');

  const [adminSearch, setAdminSearch] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('Todas');
  const [adminSpecFilter, setAdminSpecFilter] = useState('Todos');
  const [adminDateFilter, setAdminDateFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('Hoy');
  const [isCronRunning, setIsCronRunning] = useState(false);

  // ==========================================
  // LÓGICA DE FILTRADO Y CÁLCULO DE KPIS DINÁMICOS POR RANGO
  // ==========================================
  const filteredByRangeAppointments = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    return appointments.filter(app => {
      if (!app.date) return false;

      if (dateRangeFilter === 'Hoy') {
        return app.date === todayStr;
      }
      
      if (dateRangeFilter === 'Semana') {
        const appDate = new Date(app.date);
        const diffDays = Math.abs((now - appDate) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }

      if (dateRangeFilter === 'Mes') {
        const appDate = new Date(app.date);
        return appDate.getFullYear() === now.getFullYear() && appDate.getMonth() === now.getMonth();
      }

      return true; // 'Todos'
    });
  }, [appointments, dateRangeFilter]);

  const kpis = useMemo(() => {
    const total = filteredByRangeAppointments.length;
    const cancelled = filteredByRangeAppointments.filter(a => a.status === 'Cancelada').length;
    const active = filteredByRangeAppointments.filter(a => a.status !== 'Cancelada').length;

    // Calcular ingresos sumando el valor de cada cita activa
    const totalRevenue = filteredByRangeAppointments
      .filter(a => a.status !== 'Cancelada')
      .reduce((acc, curr) => {
        const num = curr.priceNum || Number(String(curr.price).replace(/[^0-9]/g, '')) || 0;
        return acc + num;
      }, 0);

    // Días de rango para capacidad
    let daysCount = 1;
    if (dateRangeFilter === 'Semana') daysCount = 7;
    if (dateRangeFilter === 'Mes' || dateRangeFilter === 'Todos') daysCount = 30;

    const totalCapacity = (specialists.length || 1) * 10 * daysCount;
    const occupancyRate = totalCapacity > 0 ? Math.min(100, Math.round((active / totalCapacity) * 100)) : 0;

    return {
      total,
      cancelled,
      active,
      occupancyRate: active > 0 && occupancyRate === 0 ? 12.5 : occupancyRate,
      totalRevenueFormatted: `$${totalRevenue.toLocaleString('es-CO')}`
    };
  }, [filteredByRangeAppointments, specialists, dateRangeFilter]);

  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState({
    name: '',
    category: 'Spa & Derm',
    duration: '45 min',
    price: '$100.000',
    description: ''
  });

  const [showAddSpecialistForm, setShowAddSpecialistForm] = useState(false);
  const [newSpecialistForm, setNewSpecialistForm] = useState({
    name: '',
    role: '',
    avatar: '',
    email: '',
    lunchBreak: '1:00 PM - 2:00 PM',
    selectedServices: []
  });

  const [editingSpecialist, setEditingSpecialist] = useState(null);

  const [blockedDays, setBlockedDays] = useState(['2026-11-01 (Festivo)', '2026-11-15 (Capacitación Derm)']);
  const [blockDateInput, setBlockDateInput] = useState('');

  const handleLocalFileUpload = (file, callback) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      triggerToast('Por favor selecciona un archivo de imagen válido.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      callback(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCompleteBookingSubmit = async (e) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.email) {
      triggerToast('Por favor completa todos los campos requeridos.', 'error');
      return;
    }

    const timeParts = selectedTime.split(' ');
    let [hStr, mStr] = timeParts[0].split(':');
    let hNum = parseInt(hStr, 10);
    if (timeParts[1] === 'PM' && hNum < 12) hNum += 12;
    if (timeParts[1] === 'AM' && hNum === 12) hNum = 0;
    const formatted24h = `${String(hNum).padStart(2, '0')}:${mStr}:00`;

    let createdAppointmentObj = null;

    if (apiConnected) {
      try {
        const response = await fetch(`${API_BASE_URL}/appointments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: clientForm.name,
            clientEmail: clientForm.email,
            clientPhone: clientForm.phone,
            date: selectedDate,
            time: formatted24h,
            serviceId: selectedService?.id || 1,
            specialistId: selectedSpecialist?.id || 1
          })
        });

        if (response.ok) {
          const resData = await response.json();
          createdAppointmentObj = {
            id: `AGD-${resData.id}`,
            numericId: resData.id,
            clientName: clientForm.name,
            clientEmail: clientForm.email,
            clientPhone: clientForm.phone || '+57 300 000 0000',
            service: selectedService ? selectedService.name : 'Tratamiento Spa',
            specialist: selectedSpecialist ? selectedSpecialist.name : 'Especialista',
            date: selectedDate,
            time: selectedTime,
            status: 'Agendada',
            price: selectedService ? selectedService.price : '$100.000',
            priceNum: selectedService?.priceNum || 100000,
            created: 'Ahora mismo'
          };
          await loadAllBackendData();
        } else {
          const errBody = await response.json();
          triggerToast(errBody.error || 'No se pudo agendar la cita.', 'error');
          return;
        }
      } catch (err) {
        console.error('Error enviando reserva al backend:', err);
        triggerToast('Error de conexión con el servidor.', 'error');
        return;
      }
    } else {
      const randomId = `AGD-${Math.floor(1000 + Math.random() * 9000)}`;
      createdAppointmentObj = {
        id: randomId,
        clientName: clientForm.name,
        clientEmail: clientForm.email,
        clientPhone: clientForm.phone || '+57 300 000 0000',
        service: selectedService ? selectedService.name : 'Tratamiento Spa Custom',
        specialist: selectedSpecialist ? selectedSpecialist.name : 'Profesional Disponible',
        date: selectedDate,
        time: selectedTime,
        status: 'Agendada',
        price: selectedService ? selectedService.price : '$100.000',
        priceNum: selectedService?.priceNum || 100000,
        created: 'Ahora mismo'
      };
      setAppointments([createdAppointmentObj, ...appointments]);
    }

    setCompletedBooking(createdAppointmentObj);
    triggerToast(`¡Cita agendada exitosamente! Código: ${createdAppointmentObj.id}`);
  };

  const handleSearchSelfService = (e) => {
    e?.preventDefault();
    const cleanQuery = searchCodeInput.trim().toUpperCase();
    const found = appointments.find(
      a => a.id.toUpperCase() === cleanQuery || 
           `#${a.numericId}` === cleanQuery || 
           a.clientEmail.toLowerCase() === cleanQuery.toLowerCase()
    );
    if (found) {
      setSearchedAppointment(found);
    } else {
      setSearchedAppointment(null);
      triggerToast('No se encontró ninguna cita activa con ese código o correo.', 'error');
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    const rawNumericId = appId.replace('AGD-', '').replace('#', '');
    
    setAppointments(prev =>
      prev.map(app => (app.id === appId || app.numericId === Number(rawNumericId) ? { ...app, status: newStatus } : app))
    );
    if (searchedAppointment && (searchedAppointment.id === appId || searchedAppointment.numericId === Number(rawNumericId))) {
      setSearchedAppointment({ ...searchedAppointment, status: newStatus });
    }

    if (apiConnected) {
      try {
        await fetch(`${API_BASE_URL}/appointments/${rawNumericId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        await loadAllBackendData();
      } catch (err) {
        console.error('Error actualizando estado en backend:', err);
      }
    }

    triggerToast(`Cita ${appId} actualizada a estado "${newStatus}"`);
  };

  const handleExecuteCron = async () => {
    setIsCronRunning(true);
    if (apiConnected) {
      try {
        await fetch(`${API_BASE_URL}/cron/send-reminders`, { method: 'POST' });
      } catch (err) {
        console.error('Error ejecutando Cron:', err);
      }
    }
    setTimeout(() => {
      setIsCronRunning(false);
      triggerToast('⚡ Recordatorios enviándose a clientes programados.', 'success');
    }, 1200);
  };

  const handleConfirmReschedule = () => {
    if (!rescheduleModalApp) return;
    setAppointments(prev =>
      prev.map(app =>
        app.id === rescheduleModalApp.id
          ? { ...app, date: newRescheduleDate, time: newRescheduleTime, status: 'Agendada' }
          : app
      )
    );
    if (searchedAppointment && searchedAppointment.id === rescheduleModalApp.id) {
      setSearchedAppointment({
        ...searchedAppointment,
        date: newRescheduleDate,
        time: newRescheduleTime,
        status: 'Agendada'
      });
    }
    triggerToast(`Cita ${rescheduleModalApp.id} reagendada para ${newRescheduleDate} a las ${newRescheduleTime}`);
    setRescheduleModalApp(null);
  };

  const handleCreateService = (e) => {
    e.preventDefault();
    if (!newServiceForm.name) return;
    const newSrv = {
      id: Date.now(),
      name: newServiceForm.name,
      category: newServiceForm.category,
      duration: newServiceForm.duration,
      price: newServiceForm.price,
      priceNum: 100000,
      description: newServiceForm.description || 'Tratamiento estético avanzado.',
      color: 'from-cyan-500 to-indigo-600',
      active: true
    };
    setServices([...services, newSrv]);
    setShowAddServiceForm(false);
    setNewServiceForm({ name: '', category: 'Spa & Derm', duration: '45 min', price: '$100.000', description: '' });
    triggerToast(`Nuevo servicio "${newSrv.name}" agregado al catálogo.`);
  };

  const handleCreateSpecialist = async (e) => {
    e.preventDefault();
    if (!newSpecialistForm.name || !newSpecialistForm.role) {
      triggerToast('Por favor completa el nombre y cargo del especialista.', 'error');
      return;
    }

    const defaultPhoto = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=250&q=80';
    const newSpecObj = {
      id: Date.now(),
      name: newSpecialistForm.name,
      role: newSpecialistForm.role,
      avatar: newSpecialistForm.avatar.trim() !== '' ? newSpecialistForm.avatar : defaultPhoto,
      rating: '5.0',
      reviews: 1,
      services: newSpecialistForm.selectedServices.length > 0
        ? newSpecialistForm.selectedServices
        : [services[0]?.name || 'Facial Hydro-Glow Luxury'],
      workingDays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      lunchBreak: newSpecialistForm.lunchBreak || '1:00 PM - 2:00 PM'
    };

    if (apiConnected) {
      try {
        await fetch(`${API_BASE_URL}/specialists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newSpecialistForm.name,
            email: newSpecialistForm.email || `profesional${Date.now()}@agendaya.com`,
            specialty: newSpecialistForm.role,
            avatar: newSpecObj.avatar,
            serviceIds: services.slice(0, 2).map(s => s.id)
          })
        });
        await loadAllBackendData();
      } catch (err) {
        console.error('Error enviando especialista al backend:', err);
      }
    } else {
      setSpecialists([...specialists, newSpecObj]);
    }

    setShowAddSpecialistForm(false);
    setNewSpecialistForm({
      name: '',
      role: '',
      avatar: '',
      email: '',
      lunchBreak: '1:00 PM - 2:00 PM',
      selectedServices: []
    });
    triggerToast(`¡Nuevo profesional "${newSpecObj.name}" registrado con éxito!`);
  };

  const handleSaveEditedSpecialist = async (e) => {
    e.preventDefault();
    if (!editingSpecialist) return;

    setSpecialists(prev =>
      prev.map(s => (s.id === editingSpecialist.id ? { ...editingSpecialist } : s))
    );

    if (apiConnected) {
      try {
        await fetch(`${API_BASE_URL}/specialists/${editingSpecialist.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editingSpecialist.name,
            specialty: editingSpecialist.role,
            avatar: editingSpecialist.avatar
          })
        });
        await loadAllBackendData();
      } catch (err) {
        console.error('Error actualizando especialista en backend:', err);
      }
    }

    triggerToast(`¡Perfil de ${editingSpecialist.name} actualizado correctamente!`);
    setEditingSpecialist(null);
  };

  const handleSaveGeneralSchedule = async () => {
    if (apiConnected) {
      try {
        await fetch(`${API_BASE_URL}/schedule/general`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dayOfWeek: 1,
            isOpen: generalSchedule.isOpen,
            openTime: generalSchedule.openTime,
            closeTime: generalSchedule.closeTime,
            breakStart: generalSchedule.breakStart,
            breakEnd: generalSchedule.breakEnd
          })
        });
      } catch (err) {
        console.error('Error guardando horario en backend:', err);
      }
    }
    triggerToast('⚡ Horario general y turnos actualizados correctamente.');
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const matchSearch =
        app.clientName.toLowerCase().includes(adminSearch.toLowerCase()) ||
        app.id.toLowerCase().includes(adminSearch.toLowerCase()) ||
        app.service.toLowerCase().includes(adminSearch.toLowerCase());
      const matchStatus = adminStatusFilter === 'Todas' || app.status === adminStatusFilter;
      const matchSpec = adminSpecFilter === 'Todos' || app.specialist === adminSpecFilter;
      const matchDate = !adminDateFilter || app.date === adminDateFilter;
      return matchSearch && matchStatus && matchSpec && matchDate;
    });
  }, [appointments, adminSearch, adminStatusFilter, adminSpecFilter, adminDateFilter]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Agendada':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]';
      case 'Atendida':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]';
      case 'Cancelada':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]';
      case 'En Proceso':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]';
      case 'Inasistencia':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <>
      <style>{`
        img { max-width: 100% !important; height: auto !important; }
        input, select, textarea { color-scheme: dark; }
      `}</style>

      <div className="min-h-screen bg-[#080c14] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black relative overflow-x-hidden antialiased pb-12">
        
        <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[160px] pointer-events-none" />
        <div className="fixed top-[40%] left-[30%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#0f172a]/95 backdrop-blur-2xl border border-cyan-500/30 text-white px-5 py-4 rounded-2xl shadow-[0_10px_30px_rgba(0,242,254,0.2)] animate-bounce">
            <Zap className="w-5 h-5 text-cyan-400 animate-pulse flex-shrink-0" />
            <span className="text-xs font-semibold tracking-wide">{toast.msg}</span>
          </div>
        )}

        <header className="sticky top-4 z-40 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-[#0d1322]/80 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-full px-4 sm:px-6 py-3 flex items-center justify-between transition-all">
            <div
              onClick={() => setActiveMainTab('booking')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[1.5px] shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:scale-105 transition">
                <div className="w-full h-full bg-[#080c14] rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                    AgendaYa!
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full">
                    PRO
                  </span>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <span className={`w-1.5 h-1.5 rounded-full ${apiConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  {apiConnected ? 'API Backend Conectada' : 'Modo Frontend Demo'}
                </span>
              </div>
            </div>

            <nav className="flex items-center gap-1 bg-[#151c2e]/90 p-1.5 rounded-full border border-white/10 shadow-inner">
              <button
                onClick={() => setActiveMainTab('booking')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                  activeMainTab === 'booking'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Agendar Cita</span>
              </button>

              <button
                onClick={() => {
                  setActiveMainTab('self-service');
                  if (!searchedAppointment) handleSearchSelfService();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                  activeMainTab === 'self-service'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mi Cita (Autogestión)</span>
              </button>

              <button
                onClick={() => setActiveMainTab('admin')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                  activeMainTab === 'admin'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden sm:inline">Panel Admin</span>
              </button>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* VISTA 1: RESERVA DE CLIENTE */}
          {activeMainTab === 'booking' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 space-y-6 pt-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Gestión de Citas Spa & Medicina Estética</span>
                </div>

                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                  Reserva Tu Experiencia de <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400 bg-clip-text text-transparent">Bienestar VIP.</span>
                </h1>

                <p className="text-slate-400 text-sm leading-relaxed">
                  Elige tu tratamiento de alta gama, selecciona tu especialista certificado y asegura tu agenda en tiempo real con confirmación instantánea.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-[#0f172a]/60 border border-white/10 backdrop-blur-md">
                    <Zap className="w-5 h-5 text-cyan-400 mb-2" />
                    <h4 className="text-xs font-bold text-white">Atención 24/7</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Reserva en 30 seg</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#0f172a]/60 border border-white/10 backdrop-blur-md">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
                    <h4 className="text-xs font-bold text-white">Confirmación</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Ticket digital único</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#0f172a]/60 border border-white/10 backdrop-blur-md">
                    <Award className="w-5 h-5 text-purple-400 mb-2" />
                    <h4 className="text-xs font-bold text-white">Premium Spa</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Especialistas Top</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#11192e] to-[#1a1033] border border-cyan-500/20 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 overflow-hidden flex-shrink-0">
                      {specialists.map(s => (
                        <img
                          key={s.id}
                          src={s.avatar}
                          alt={s.name}
                          className="inline-block w-10 h-10 rounded-full border-2 border-[#080c14] object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80';
                          }}
                        />
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>4.96 / 5.0 Rating</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">+1,480 pacientes atendidas este mes</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/30 whitespace-nowrap">
                    ● Disponibilidad Hoy
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7 bg-[#0f172a]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
                  {[
                    { step: 1, label: 'Datos' },
                    { step: 2, label: 'Servicio' },
                    { step: 3, label: 'Especialista' },
                    { step: 4, label: 'Horario' },
                  ].map((s) => (
                    <button
                      key={s.step}
                      onClick={() => setBookingStep(s.step)}
                      className={`flex items-center gap-2 transition ${
                        bookingStep === s.step
                          ? 'text-cyan-400 font-bold'
                          : bookingStep > s.step
                          ? 'text-emerald-400 font-semibold'
                          : 'text-slate-500'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          bookingStep === s.step
                            ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                            : bookingStep > s.step
                            ? 'bg-emerald-500 text-black'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {bookingStep > s.step ? <Check className="w-4 h-4" /> : s.step}
                      </div>
                      <span className="text-xs hidden sm:inline">{s.label}</span>
                    </button>
                  ))}
                </div>

                {bookingStep === 1 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-cyan-400" />
                        1. Información del Paciente
                      </h3>
                      <span className="text-xs text-slate-400">Paso 1 de 4</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Nombre Completo *</label>
                        <input
                          type="text"
                          value={clientForm.name}
                          onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                          placeholder="Ej: Carolina Herrera"
                          className="w-full px-4 py-3 bg-[#162032] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Correo Electrónico *</label>
                          <input
                            type="email"
                            value={clientForm.email}
                            onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                            placeholder="carolina@ejemplo.com"
                            className="w-full px-4 py-3 bg-[#162032] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">WhatsApp / Celular</label>
                          <input
                            type="text"
                            value={clientForm.phone}
                            onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                            placeholder="+57 300 000 0000"
                            className="w-full px-4 py-3 bg-[#162032] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Observaciones o Condición Médica</label>
                        <textarea
                          rows="2"
                          value={clientForm.notes}
                          onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                          placeholder="Alergias, medicamentos o detalles de piel..."
                          className="w-full px-4 py-2.5 bg-[#162032] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={() => setBookingStep(2)}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition flex items-center gap-2"
                      >
                        <span>Siguiente: Seleccionar Servicio</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {bookingStep === 2 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                        2. Elige tu Tratamiento Spa
                      </h3>
                      <button onClick={() => setBookingStep(1)} className="text-xs text-cyan-400 hover:underline">Volver a datos</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {services.map((srv) => (
                        <div
                          key={srv.id}
                          onClick={() => setSelectedService(srv)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                            selectedService?.id === srv.id
                              ? 'bg-gradient-to-b from-cyan-500/20 to-blue-600/10 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                              : 'bg-[#162032]/60 border-white/10 hover:border-white/30 hover:bg-[#162032]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30">
                                {srv.category}
                              </span>
                              <span className="text-xs font-black text-white">{srv.price}</span>
                            </div>
                            <h4 className="text-sm font-bold text-white mb-1">{srv.name}</h4>
                            <p className="text-[11px] text-slate-400 line-clamp-2">{srv.description}</p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-300">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cyan-400" /> {srv.duration}
                            </span>
                            {selectedService?.id === srv.id && (
                              <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> Seleccionado
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 flex justify-between items-center">
                      <button onClick={() => setBookingStep(1)} className="text-xs text-slate-400 hover:text-white">Atrás</button>
                      <button
                        onClick={() => setBookingStep(3)}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition flex items-center gap-2"
                      >
                        <span>Siguiente: Seleccionar Especialista</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {bookingStep === 3 && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-cyan-400" />
                        3. Selecciona tu Especialista
                      </h3>
                      <button onClick={() => setBookingStep(2)} className="text-xs text-cyan-400 hover:underline">Volver a servicios</button>
                    </div>

                    <div className="space-y-3">
                      {specialists.map((spec) => (
                        <div
                          key={spec.id}
                          onClick={() => setSelectedSpecialist(spec)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            selectedSpecialist?.id === spec.id
                              ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/10 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.25)] ring-1 ring-purple-400'
                              : 'bg-[#162032]/60 border-white/10 hover:border-white/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={spec.avatar}
                              alt={spec.name}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-cyan-500/40"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80';
                              }}
                            />
                            <div>
                              <h4 className="text-sm font-bold text-white">{spec.name}</h4>
                              <p className="text-[11px] text-slate-400">{spec.role}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                                  <Star className="w-2.5 h-2.5 fill-amber-400" /> {spec.rating} ({spec.reviews})
                                </span>
                              </div>
                            </div>
                          </div>

                          {selectedSpecialist?.id === spec.id && (
                            <div className="w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 flex justify-between items-center">
                      <button onClick={() => setBookingStep(2)} className="text-xs text-slate-400 hover:text-white">Atrás</button>
                      <button
                        onClick={() => setBookingStep(4)}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition flex items-center gap-2"
                      >
                        <span>Siguiente: Elegir Fecha & Hora</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {bookingStep === 4 && (
                  <form onSubmit={handleCompleteBookingSubmit} className="space-y-5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-cyan-400" />
                        4. Selecciona Fecha & Hora
                      </h3>
                      <button type="button" onClick={() => setBookingStep(3)} className="text-xs text-cyan-400 hover:underline">Volver a especialista</button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Fecha Disponibilidad</label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full px-4 py-3 bg-[#162032] border border-white/10 rounded-xl text-sm text-white font-semibold focus:outline-none focus:border-cyan-500 transition"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Turnos Generados ({selectedDate})</label>
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="flex items-center gap-1 text-cyan-400"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Disponible</span>
                            <span className="flex items-center gap-1 text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-600" /> Reservado</span>
                            <span className="flex items-center gap-1 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-500" /> Pausa</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          {dynamicTimeSlots.map((slot) => {
                            const isSelected = selectedTime === slot.time;
                            const isOccupied = slot.status === 'occupied';
                            const isOff = slot.status === 'off';

                            return (
                              <button
                                type="button"
                                key={slot.time}
                                disabled={isOccupied || isOff}
                                onClick={() => setSelectedTime(slot.time)}
                                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all relative ${
                                  isSelected
                                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] font-black'
                                    : isOccupied
                                    ? 'bg-slate-900/60 text-slate-600 border-slate-800 line-through cursor-not-allowed'
                                    : isOff
                                    ? 'bg-rose-950/20 text-rose-500/60 border-rose-900/30 cursor-not-allowed text-[11px]'
                                    : 'bg-[#162032] text-slate-200 border-white/10 hover:border-cyan-500/50 hover:bg-[#1f2c44]'
                                }`}
                              >
                                {slot.time}
                                {isOff && <span className="block text-[8px] no-underline font-normal text-rose-400">Almuerzo</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#121b2d] border border-cyan-500/20 text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tratamiento:</span>
                          <span className="font-bold text-white">{selectedService?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Especialista:</span>
                          <span className="font-bold text-white">{selectedSpecialist?.name}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2">
                          <span className="text-slate-400">Inversión Total:</span>
                          <span className="font-black text-cyan-400 text-sm">{selectedService?.price}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between items-center">
                      <button type="button" onClick={() => setBookingStep(3)} className="text-xs text-slate-400 hover:text-white">Atrás</button>
                      <button
                        type="submit"
                        className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-black font-black text-xs rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-[1.02] transition"
                      >
                        🚀 Confirmar & Generar Cita VIP
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* VISTA 2: AUTOGESTIÓN DE CLIENTE */}
          {activeMainTab === 'self-service' && (
            <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                  <Search className="w-3.5 h-3.5" />
                  <span>Autogestión de Citas Paciente</span>
                </div>
                <h2 className="text-3xl font-black text-white">Consulta, Reagenda o Cancela tu Cita</h2>
                <p className="text-slate-400 text-xs max-w-md mx-auto">
                  Ingresa tu código único de reserva (Ej: <span className="text-cyan-400 font-mono font-bold">AGD-1</span>) o correo registrado para gestionar tu estado en tiempo real.
                </p>
              </div>

              <form onSubmit={handleSearchSelfService} className="flex gap-2 bg-[#0f172a]/90 p-2 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
                <input
                  type="text"
                  value={searchCodeInput}
                  onChange={(e) => setSearchCodeInput(e.target.value)}
                  placeholder="Código #AGD-X o Correo registrado"
                  className="flex-1 px-4 py-3 bg-[#162032] text-white font-mono uppercase text-sm rounded-xl border border-white/5 focus:outline-none focus:border-cyan-500 transition placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:from-cyan-400 hover:to-blue-500 transition flex items-center gap-2"
                >
                  <Search className="w-4 h-4" /> Buscar Cita
                </button>
              </form>

              {searchedAppointment ? (
                <div className="bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-6 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">Código Referencia</span>
                      <h3 className="text-2xl font-black text-cyan-400 font-mono tracking-wider">{searchedAppointment.id}</h3>
                    </div>

                    <span className={`px-4 py-1.5 rounded-full text-xs font-black border ${getStatusBadgeClass(searchedAppointment.status)}`}>
                      ● {searchedAppointment.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-[#162032]/80 border border-white/5 space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Paciente</span>
                      <h5 className="text-white font-bold text-sm">{searchedAppointment.clientName}</h5>
                      <p className="text-slate-400">{searchedAppointment.clientEmail}</p>
                      <p className="text-slate-400">{searchedAppointment.clientPhone}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#162032]/80 border border-white/5 space-y-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Detalles Tratamiento</span>
                      <h5 className="text-cyan-300 font-bold text-sm">{searchedAppointment.service}</h5>
                      <p className="text-slate-300">Con {searchedAppointment.specialist}</p>
                      <p className="text-emerald-400 font-extrabold">Inversión: {searchedAppointment.price}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#162032]/80 border border-white/5 space-y-1 sm:col-span-2 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Fecha & Hora Reservada</span>
                        <p className="text-white font-black text-sm">{searchedAppointment.date} — {searchedAppointment.time}</p>
                      </div>
                      <CalendarCheck className="w-8 h-8 text-cyan-400/50" />
                    </div>
                  </div>

                  {searchedAppointment.status === 'Agendada' && (
                    <div className="pt-2 flex gap-3">
                      <button
                        onClick={() => handleUpdateStatus(searchedAppointment.id, 'Cancelada')}
                        className="flex-1 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition"
                      >
                        ❌ Cancelar Cita
                      </button>
                      <button
                        onClick={() => setRescheduleModalApp(searchedAppointment)}
                        className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition"
                      >
                        📅 Reagendar Cita
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#0f172a]/50 rounded-3xl border border-white/5 space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">Ingresa un código válido para previsualizar los detalles de la reserva.</p>
                </div>
              )}
            </div>
          )}

          {/* VISTA 3: PANEL ADMIN DE CONTROL */}
          {activeMainTab === 'admin' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a]/90 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-2xl">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-cyan-400 tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                    Panel de Administración SaaS
                  </span>
                  <h2 className="text-2xl font-black text-white mt-2">Control General AgendaYa! Pro</h2>
                </div>

                <button
                  disabled={isCronRunning}
                  onClick={handleExecuteCron}
                  className="px-5 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-black font-black text-xs rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:scale-105 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Zap className={`w-4 h-4 ${isCronRunning ? 'animate-spin' : ''}`} />
                  <span>{isCronRunning ? 'Ejecutando Cron HU-10...' : '⚡ Ejecutar Cron Recordatorios 24h (HU-10)'}</span>
                </button>
              </div>

              <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
                {[
                  { id: 'analytics', label: '📊 Analytics & KPIs' },
                  { id: 'appointments', label: '📋 Citas Agendadas' },
                  { id: 'schedules', label: '⏰ Horarios & Pausas' },
                  { id: 'staff-services', label: '👨‍⚕️ Personal & Servicios' },
                ].map((subTab) => (
                  <button
                    key={subTab.id}
                    onClick={() => setAdminSubTab(subTab.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      adminSubTab === subTab.id
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {subTab.label}
                  </button>
                ))}
              </div>

              {adminSubTab === 'analytics' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-300">Resumen Estadístico de Clínica</h3>
                    <div className="flex items-center gap-1 bg-[#162032] p-1 rounded-xl border border-white/10">
                      {['Hoy', 'Semana', 'Mes', 'Todos'].map((rng) => (
                        <button
                          key={rng}
                          onClick={() => setDateRangeFilter(rng)}
                          className={`px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                            dateRangeFilter === rng
                              ? 'bg-cyan-500 text-black shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {rng}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0f172a]/90 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Total Citas ({dateRangeFilter})</span>
                        <Calendar className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="text-3xl font-black text-white">{kpis.total}</div>
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-2">
                        <TrendingUp className="w-3 h-3" /> Registradas en {dateRangeFilter}
                      </span>
                    </div>

                    <div className="bg-[#0f172a]/90 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Citas Canceladas</span>
                        <XCircle className="w-4 h-4 text-rose-400" />
                      </div>
                      <div className="text-3xl font-black text-white">{kpis.cancelled}</div>
                      <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1 mt-2">
                        Cancelaciones en el período
                      </span>
                    </div>

                    <div className="bg-[#0f172a]/90 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider">% Ocupación Médica</span>
                        <Activity className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-3xl font-black text-white">{kpis.occupancyRate}%</div>
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-2">
                        Calculado sobre citas activas
                      </span>
                    </div>

                    <div className="bg-[#0f172a]/90 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Ingresos Estimados</span>
                        <DollarSign className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="text-3xl font-black text-white">{kpis.totalRevenueFormatted}</div>
                      <span className="text-[10px] text-purple-300 font-bold flex items-center gap-1 mt-2">
                        Suma del valor de citas en {dateRangeFilter}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {adminSubTab === 'appointments' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#0f172a]/80 p-4 rounded-2xl border border-white/10">
                    <div className="relative col-span-1 sm:col-span-1">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Buscar paciente, código..."
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#162032] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <select
                      value={adminStatusFilter}
                      onChange={(e) => setAdminStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-[#162032] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Todas">Filtrar Estado (Todas)</option>
                      <option value="Agendada">Agendada</option>
                      <option value="En Proceso">En Proceso</option>
                      <option value="Atendida">Atendida</option>
                      <option value="Cancelada">Cancelada</option>
                      <option value="Inasistencia">Inasistencia</option>
                    </select>

                    <select
                      value={adminSpecFilter}
                      onChange={(e) => setAdminSpecFilter(e.target.value)}
                      className="px-3 py-2 bg-[#162032] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Todos">Especialista (Todos)</option>
                      {specialists.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>

                    <input
                      type="date"
                      value={adminDateFilter}
                      onChange={(e) => setAdminDateFilter(e.target.value)}
                      className="px-3 py-2 bg-[#162032] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="bg-[#0f172a]/90 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead>
                          <tr className="bg-[#141d30] font-bold text-white uppercase text-[10px] tracking-wider border-b border-white/10">
                            <th className="p-4">Código</th>
                            <th className="p-4">Paciente</th>
                            <th className="p-4">Tratamiento & Especialista</th>
                            <th className="p-4">Fecha / Hora</th>
                            <th className="p-4">Estado (Interactivo)</th>
                            <th className="p-4 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-medium">
                          {filteredAppointments.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-slate-500">
                                No hay citas que coincidan con los filtros aplicados.
                              </td>
                            </tr>
                          ) : (
                            filteredAppointments.map((app) => (
                              <tr key={app.id} className="hover:bg-white/5 transition">
                                <td className="p-4 font-mono font-bold text-cyan-400">{app.id}</td>
                                <td className="p-4">
                                  <span className="font-bold text-white block">{app.clientName}</span>
                                  <span className="text-[10px] text-slate-400">{app.clientPhone}</span>
                                </td>
                                <td className="p-4">
                                  <span className="text-cyan-300 font-semibold block">{app.service}</span>
                                  <span className="text-[10px] text-slate-400">{app.specialist}</span>
                                </td>
                                <td className="p-4">
                                  <span className="text-white font-bold block">{app.date}</span>
                                  <span className="text-[10px] text-slate-400">{app.time}</span>
                                </td>
                                <td className="p-4">
                                  <select
                                    value={app.status}
                                    onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold border bg-[#162032] focus:outline-none ${getStatusBadgeClass(app.status)}`}
                                  >
                                    <option value="Agendada">Agendada</option>
                                    <option value="En Proceso">En Proceso</option>
                                    <option value="Atendida">Atendida</option>
                                    <option value="Cancelada">Cancelada</option>
                                    <option value="Inasistencia">Inasistencia</option>
                                  </select>
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => {
                                      setSearchCodeInput(app.id);
                                      setSearchedAppointment(app);
                                      setActiveMainTab('self-service');
                                    }}
                                    className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded-lg border border-cyan-500/30 transition"
                                  >
                                    Ver Ficha
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {adminSubTab === 'schedules' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                  <div className="bg-[#0f172a]/90 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 space-y-5 shadow-xl">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                      <Clock className="w-5 h-5 text-cyan-400" />
                      <div>
                        <h4 className="font-bold text-white text-base">Horario de Atención General (HU-03)</h4>
                        <p className="text-[10px] text-slate-400">Modifica la apertura, cierre y pausa operativa global.</p>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Apertura Clínica</label>
                          <input
                            type="time"
                            value={generalSchedule.openTime}
                            onChange={(e) => setGeneralSchedule({ ...generalSchedule, openTime: e.target.value })}
                            className="w-full p-3 bg-[#162032] border border-white/10 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-cyan-500 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Cierre Clínica</label>
                          <input
                            type="time"
                            value={generalSchedule.closeTime}
                            onChange={(e) => setGeneralSchedule({ ...generalSchedule, closeTime: e.target.value })}
                            className="w-full p-3 bg-[#162032] border border-white/10 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-cyan-500 transition"
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#162032]/80 border border-white/5 space-y-3">
                        <span className="font-bold text-cyan-300 block text-xs">Pausa General de Almuerzo</span>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-400 mb-1 text-[10px]">Inicio Pausa</label>
                            <input
                              type="time"
                              value={generalSchedule.breakStart}
                              onChange={(e) => setGeneralSchedule({ ...generalSchedule, breakStart: e.target.value })}
                              className="w-full p-2.5 bg-[#0f172a] border border-white/10 rounded-xl text-slate-200 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 mb-1 text-[10px]">Fin Pausa</label>
                            <input
                              type="time"
                              value={generalSchedule.breakEnd}
                              onChange={(e) => setGeneralSchedule({ ...generalSchedule, breakEnd: e.target.value })}
                              className="w-full p-2.5 bg-[#0f172a] border border-white/10 rounded-xl text-slate-200 font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleSaveGeneralSchedule}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black rounded-xl text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] transition"
                      >
                        Guardar Configuración General
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#0f172a]/90 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 space-y-5 shadow-xl">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                      <Lock className="w-5 h-5 text-rose-400" />
                      <div>
                        <h4 className="font-bold text-white text-base">Bloqueo de Días / Festivos (HU-04)</h4>
                        <p className="text-[10px] text-slate-400">Inhabilita fechas completas para la agenda.</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ej: 2026-12-25 (Navidad)"
                          value={blockDateInput}
                          onChange={(e) => setBlockDateInput(e.target.value)}
                          className="flex-1 p-3 bg-[#162032] border border-white/10 rounded-xl text-white focus:outline-none focus:border-rose-400"
                        />
                        <button
                          onClick={() => {
                            if (blockDateInput) {
                              setBlockedDays([...blockedDays, blockDateInput]);
                              setBlockDateInput('');
                              triggerToast('Día bloqueado exitosamente en agenda.');
                            }
                          }}
                          className="px-5 py-3 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 rounded-xl font-bold transition"
                        >
                          Bloquear
                        </button>
                      </div>

                      <div className="space-y-2 pt-2">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Fechas Bloqueadas Activas:</span>
                        {blockedDays.map((bDay, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-[#162032] border border-white/5 flex justify-between items-center text-slate-300">
                            <span>{bDay}</span>
                            <button
                              onClick={() => {
                                setBlockedDays(blockedDays.filter((_, i) => i !== idx));
                                triggerToast('Bloqueo retirado.');
                              }}
                              className="text-rose-400 font-bold hover:underline"
                            >
                              Eliminar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {adminSubTab === 'staff-services' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-white">Catálogo de Servicios & Especialistas Roster</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShowAddServiceForm(!showAddServiceForm);
                          setShowAddSpecialistForm(false);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 hover:scale-105 transition"
                      >
                        <Plus className="w-4 h-4" /> Registrar Servicio
                      </button>

                      <button
                        onClick={() => {
                          setShowAddSpecialistForm(!showAddSpecialistForm);
                          setShowAddServiceForm(false);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 hover:scale-105 transition"
                      >
                        <User className="w-4 h-4" /> Registrar Trabajador
                      </button>
                    </div>
                  </div>

                  {showAddServiceForm && (
                    <form onSubmit={handleCreateService} className="p-6 bg-[#0f172a] rounded-3xl border border-cyan-500/30 space-y-4 animate-fade-in shadow-2xl">
                      <h4 className="font-bold text-cyan-400 text-sm">Añadir Nuevo Servicio al Catálogo</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <input
                          type="text"
                          placeholder="Nombre del servicio (Ej: Peeling Químico)"
                          value={newServiceForm.name}
                          onChange={(e) => setNewServiceForm({ ...newServiceForm, name: e.target.value })}
                          className="p-3 bg-[#162032] border border-white/10 rounded-xl text-white"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Precio (Ej: $180.000)"
                          value={newServiceForm.price}
                          onChange={(e) => setNewServiceForm({ ...newServiceForm, price: e.target.value })}
                          className="p-3 bg-[#162032] border border-white/10 rounded-xl text-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowAddServiceForm(false)} className="px-4 py-2 text-xs text-slate-400">Cancelar</button>
                        <button type="submit" className="px-5 py-2 bg-cyan-500 text-black font-bold text-xs rounded-xl">Guardar Servicio</button>
                      </div>
                    </form>
                  )}

                  {showAddSpecialistForm && (
                    <form onSubmit={handleCreateSpecialist} className="p-6 bg-[#0f172a] rounded-3xl border border-purple-500/40 space-y-5 animate-fade-in shadow-2xl">
                      <div className="border-b border-white/10 pb-3">
                        <h4 className="font-bold text-purple-400 text-base flex items-center gap-2">
                          <User className="w-5 h-5" /> Registrar Nuevo Profesional & Cargar Foto
                        </h4>
                        <p className="text-slate-400 text-xs mt-0.5">Sube una foto directamente desde tus archivos y asigna los servicios que atiende.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Nombre Completo *</label>
                          <input
                            type="text"
                            placeholder="Ej: Dra. Sofía Martínez"
                            value={newSpecialistForm.name}
                            onChange={(e) => setNewSpecialistForm({ ...newSpecialistForm, name: e.target.value })}
                            className="w-full p-3 bg-[#162032] border border-white/10 rounded-xl text-white focus:border-purple-400 focus:outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Cargo / Especialidad *</label>
                          <input
                            type="text"
                            placeholder="Ej: Cosmiatra Avanzada"
                            value={newSpecialistForm.role}
                            onChange={(e) => setNewSpecialistForm({ ...newSpecialistForm, role: e.target.value })}
                            className="w-full p-3 bg-[#162032] border border-white/10 rounded-xl text-white focus:border-purple-400 focus:outline-none"
                            required
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-2">
                          <label className="block text-slate-300 font-bold">Foto de Perfil (Subir archivo local)</label>
                          <div className="flex flex-col sm:flex-row gap-4 items-center bg-[#162032] p-4 rounded-2xl border border-white/10">
                            <div className="w-16 h-16 rounded-full bg-[#080c14] border-2 border-purple-500/50 overflow-hidden flex items-center justify-center flex-shrink-0">
                              {newSpecialistForm.avatar ? (
                                <img
                                  src={newSpecialistForm.avatar}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-slate-500" />
                              )}
                            </div>

                            <div className="flex-1 space-y-2 w-full">
                              <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-md">
                                <Upload className="w-4 h-4" />
                                <span>Seleccionar foto desde mi equipo...</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleLocalFileUpload(e.target.files[0], (dataUrl) => {
                                    setNewSpecialistForm({ ...newSpecialistForm, avatar: dataUrl });
                                  })}
                                />
                              </label>
                              {newSpecialistForm.avatar && (
                                <button
                                  type="button"
                                  onClick={() => setNewSpecialistForm({ ...newSpecialistForm, avatar: '' })}
                                  className="block text-[10px] text-rose-400 hover:underline font-semibold"
                                >
                                  Quitar foto seleccionada
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-2 space-y-2 pt-2">
                          <label className="block text-slate-300 font-bold">Vincular Servicios que Atiende:</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#162032] p-3 rounded-2xl border border-white/10">
                            {services.map((srv) => {
                              const isChecked = newSpecialistForm.selectedServices.includes(srv.name);
                              return (
                                <label key={srv.id} className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer p-1.5 hover:bg-white/5 rounded-lg transition">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setNewSpecialistForm({
                                          ...newSpecialistForm,
                                          selectedServices: newSpecialistForm.selectedServices.filter(s => s !== srv.name)
                                        });
                                      } else {
                                        setNewSpecialistForm({
                                          ...newSpecialistForm,
                                          selectedServices: [...newSpecialistForm.selectedServices, srv.name]
                                        });
                                      }
                                    }}
                                    className="rounded border-white/20 text-purple-500 focus:ring-purple-400"
                                  />
                                  <span>{srv.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowAddSpecialistForm(false)} className="px-4 py-2 text-xs text-slate-400 hover:text-white">Cancelar</button>
                        <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg">
                          Guardar Especialista
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {services.map((srv) => (
                      <div key={srv.id} className="p-5 rounded-2xl bg-[#0f172a]/90 border border-white/10 flex flex-col justify-between space-y-3">
                        <div>
                          <span className="text-[9px] font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30 uppercase">
                            {srv.category}
                          </span>
                          <h4 className="font-bold text-white text-sm mt-2">{srv.name}</h4>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{srv.description}</p>
                        </div>
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                          <span className="text-cyan-400 font-black text-xs">{srv.price}</span>
                          <span className="text-[10px] text-slate-400">{srv.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h4 className="text-base font-bold text-white pt-4">Especialistas Certificados Habilitados</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {specialists.map((spec) => (
                      <div key={spec.id} className="p-5 rounded-2xl bg-[#0f172a]/90 border border-white/10 flex flex-col justify-between space-y-3 relative group">
                        <div className="flex items-center gap-4">
                          <img
                            src={spec.avatar}
                            alt={spec.name}
                            className="w-14 h-14 rounded-full object-cover ring-2 ring-cyan-500/30 flex-shrink-0"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80';
                            }}
                          />
                          <div>
                            <h5 className="font-bold text-white text-sm">{spec.name}</h5>
                            <p className="text-xs text-slate-400">{spec.role}</p>
                            <span className="inline-block mt-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              ● Activo
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex justify-end">
                          <button
                            onClick={() => setEditingSpecialist({ ...spec })}
                            className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold rounded-xl border border-purple-500/30 flex items-center gap-1.5 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Cambiar Foto / Editar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </main>

        {/* MODAL EDICIÓN ESPECIALISTA */}
        {editingSpecialist && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <form onSubmit={handleSaveEditedSpecialist} className="bg-[#0f172a] border border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-purple-400" />
                  Editar Perfil & Foto de {editingSpecialist.name}
                </h4>
                <button type="button" onClick={() => setEditingSpecialist(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={editingSpecialist.name}
                    onChange={(e) => setEditingSpecialist({ ...editingSpecialist, name: e.target.value })}
                    className="w-full p-3 bg-[#162032] border border-white/10 rounded-xl text-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Cargo / Especialidad</label>
                  <input
                    type="text"
                    value={editingSpecialist.role}
                    onChange={(e) => setEditingSpecialist({ ...editingSpecialist, role: e.target.value })}
                    className="w-full p-3 bg-[#162032] border border-white/10 rounded-xl text-white font-bold"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-300 font-bold">Foto de Perfil Actual</label>
                  <div className="flex flex-col sm:flex-row gap-4 items-center bg-[#162032] p-4 rounded-2xl border border-white/10">
                    <img
                      src={editingSpecialist.avatar}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-purple-500/50 flex-shrink-0"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80';
                      }}
                    />

                    <div className="flex-1 space-y-2 w-full">
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-md">
                        <Upload className="w-4 h-4" />
                        <span>Subir nueva foto desde mi equipo...</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleLocalFileUpload(e.target.files[0], (dataUrl) => {
                            setEditingSpecialist({ ...editingSpecialist, avatar: dataUrl });
                          })}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSpecialist(null)}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs rounded-xl shadow-lg"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL TICKET DIGITAL */}
        {completedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-[#0f172a] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,242,254,0.3)] space-y-6 relative overflow-hidden">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-emerald-400 rounded-full flex items-center justify-center mx-auto text-black shadow-[0_0_20px_rgba(6,182,212,0.6)]">
                  <Check className="w-10 h-10 stroke-[3]" />
                </div>
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                  Reserva Confirmada Exitosamente
                </span>
                <h3 className="text-2xl font-black text-white">¡Tu Cita Esta Lista!</h3>
              </div>

              <div className="p-4 rounded-2xl bg-[#162032] border border-white/10 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-slate-400 uppercase text-[10px] font-bold">Código de Reserva</span>
                  <span className="text-xl font-black text-cyan-400 font-mono">{completedBooking.id}</span>
                </div>

                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Paciente:</span>
                    <span className="font-bold text-white">{completedBooking.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tratamiento:</span>
                    <span className="font-bold text-cyan-300">{completedBooking.service}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Especialista:</span>
                    <span className="font-bold text-white">{completedBooking.specialist}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fecha & Hora:</span>
                    <span className="font-extrabold text-white">{completedBooking.date} a las {completedBooking.time}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                    <QrCode className="w-10 h-10 text-cyan-400" />
                    <span>Muestra este ticket al llegar a recepción.</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSearchCodeInput(completedBooking.id);
                    setSearchedAppointment(completedBooking);
                    setCompletedBooking(null);
                    setActiveMainTab('self-service');
                  }}
                  className="flex-1 py-3 bg-cyan-500 text-black font-black text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  Ver Ficha en Autogestión
                </button>
                <button
                  onClick={() => setCompletedBooking(null)}
                  className="px-4 py-3 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL REAGENDAR CITA */}
        {rescheduleModalApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h4 className="font-bold text-white text-base">Reagendar Cita #{rescheduleModalApp.id}</h4>
                <button onClick={() => setRescheduleModalApp(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nueva Fecha</label>
                  <input
                    type="date"
                    value={newRescheduleDate}
                    onChange={(e) => setNewRescheduleDate(e.target.value)}
                    className="w-full p-3 bg-[#162032] border border-white/10 rounded-xl text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nuevo Horario</label>
                  <select
                    value={newRescheduleTime}
                    onChange={(e) => setNewRescheduleTime(e.target.value)}
                    className="w-full p-3 bg-[#162032] border border-white/10 rounded-xl text-white font-bold"
                  >
                    <option value="08:00 AM">08:00 AM</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setRescheduleModalApp(null)}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmReschedule}
                  className="flex-1 py-3 bg-cyan-500 text-black font-black text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  Confirmar Cambio
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}