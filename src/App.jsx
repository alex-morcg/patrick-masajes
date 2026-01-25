import React, { useState, useEffect } from 'react';
import { Calendar, Users, BarChart3, Plus, ChevronLeft, ChevronRight, Edit2, Trash2, X, Tag, Check, Phone, Repeat, Clock, AlertTriangle, CalendarOff, Loader, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { db, collection, doc, setDoc, onSnapshot, deleteDoc } from './firebase';

const generateId = () => Math.random().toString(36).substr(2, 9);

const formatDate = (date) => new Date(date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
const formatTime = (date) => new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

const getWeekDays = (date) => {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
};

const getMonthDays = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  const startPadding = (firstDay.getDay() + 6) % 7;
  for (let i = startPadding; i > 0; i--) days.push({ date: new Date(year, month, 1 - i), isCurrentMonth: false });
  for (let i = 1; i <= lastDay.getDate(); i++) days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  const endPadding = 42 - days.length;
  for (let i = 1; i <= endPadding; i++) days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  return days;
};

const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);
const DURATIONS = [45, 60, 90, 120];

const DEFAULT_SCHEDULE = {
  0: null,
  1: null,
  2: { start: '08:00', end: '16:00' },
  3: { start: '08:00', end: '16:00' },
  4: { start: '08:00', end: '16:00' },
  5: null,
  6: null,
};

const DEFAULT_HOLIDAYS = [
  { id: '1', date: '2025-01-01', name: 'Año Nuevo' },
  { id: '2', date: '2025-01-06', name: 'Reyes Magos' },
  { id: '3', date: '2025-04-18', name: 'Viernes Santo' },
  { id: '4', date: '2025-04-21', name: 'Lunes de Pascua' },
  { id: '5', date: '2025-05-01', name: 'Día del Trabajo' },
  { id: '6', date: '2025-06-09', name: 'Lunes de Pentecostés' },
  { id: '7', date: '2025-06-24', name: 'San Juan' },
  { id: '8', date: '2025-08-15', name: 'Asunción de la Virgen' },
  { id: '9', date: '2025-09-11', name: 'Diada de Catalunya' },
  { id: '10', date: '2025-09-24', name: 'La Mercè' },
  { id: '11', date: '2025-10-12', name: 'Fiesta Nacional de España' },
  { id: '12', date: '2025-11-01', name: 'Todos los Santos' },
  { id: '13', date: '2025-12-06', name: 'Día de la Constitución' },
  { id: '14', date: '2025-12-08', name: 'Inmaculada Concepción' },
  { id: '15', date: '2025-12-25', name: 'Navidad' },
  { id: '16', date: '2025-12-26', name: 'San Esteban' },
  { id: '17', date: '2026-01-01', name: 'Año Nuevo' },
  { id: '18', date: '2026-01-06', name: 'Reyes Magos' },
  { id: '19', date: '2026-04-03', name: 'Viernes Santo' },
  { id: '20', date: '2026-04-06', name: 'Lunes de Pascua' },
  { id: '21', date: '2026-05-01', name: 'Día del Trabajo' },
  { id: '22', date: '2026-05-25', name: 'Lunes de Pentecostés' },
  { id: '23', date: '2026-06-24', name: 'San Juan' },
  { id: '24', date: '2026-08-15', name: 'Asunción de la Virgen' },
  { id: '25', date: '2026-09-11', name: 'Diada de Catalunya' },
  { id: '26', date: '2026-09-24', name: 'La Mercè' },
  { id: '27', date: '2026-10-12', name: 'Fiesta Nacional de España' },
  { id: '28', date: '2026-11-01', name: 'Todos los Santos' },
  { id: '29', date: '2026-12-06', name: 'Día de la Constitución' },
  { id: '30', date: '2026-12-08', name: 'Inmaculada Concepción' },
  { id: '31', date: '2026-12-25', name: 'Navidad' },
  { id: '32', date: '2026-12-26', name: 'San Esteban' },
  { id: '33', date: '2027-01-01', name: 'Año Nuevo' },
  { id: '34', date: '2027-01-06', name: 'Reyes Magos' },
  { id: '35', date: '2027-03-26', name: 'Viernes Santo' },
  { id: '36', date: '2027-03-29', name: 'Lunes de Pascua' },
  { id: '37', date: '2027-05-01', name: 'Día del Trabajo' },
  { id: '38', date: '2027-05-17', name: 'Lunes de Pentecostés' },
  { id: '39', date: '2027-06-24', name: 'San Juan' },
  { id: '40', date: '2027-08-15', name: 'Asunción de la Virgen' },
  { id: '41', date: '2027-09-11', name: 'Diada de Catalunya' },
  { id: '42', date: '2027-09-24', name: 'La Mercè' },
  { id: '43', date: '2027-10-12', name: 'Fiesta Nacional de España' },
  { id: '44', date: '2027-11-01', name: 'Todos los Santos' },
  { id: '45', date: '2027-12-06', name: 'Día de la Constitución' },
  { id: '46', date: '2027-12-08', name: 'Inmaculada Concepción' },
  { id: '47', date: '2027-12-25', name: 'Navidad' },
  { id: '48', date: '2027-12-26', name: 'San Esteban' },
];

const DEFAULT_SPECIALS = [
  { id: '1', name: 'Casa Barcelona', color: 'bg-blue-200' },
  { id: '2', name: 'En Jofisa', color: 'bg-purple-200' },
  { id: '3', name: 'Primera visita', color: 'bg-green-200' },
  { id: '4', name: 'Descuento', color: 'bg-red-200' },
];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('calendar');
  const [calView, setCalView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [specials, setSpecials] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  
  const [modal, setModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [editFuture, setEditFuture] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [statsSortKey, setStatsSortKey] = useState('nombre');
  const [statsSortDir, setStatsSortDir] = useState('asc');
  const [hoveredDay, setHoveredDay] = useState(null);

  // Cargar datos de Firebase en tiempo real
  useEffect(() => {
    const unsubscribers = [];

    // Clientes
    unsubscribers.push(
      onSnapshot(collection(db, 'clients'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClients(data);
      })
    );

    // Citas
    unsubscribers.push(
      onSnapshot(collection(db, 'appointments'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAppointments(data);
      })
    );

    // Etiquetas
    unsubscribers.push(
      onSnapshot(collection(db, 'specials'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSpecials(data.length > 0 ? data : DEFAULT_SPECIALS);
      })
    );

    // Festivos
    unsubscribers.push(
      onSnapshot(collection(db, 'holidays'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHolidays(data.length > 0 ? data : DEFAULT_HOLIDAYS);
      })
    );

    // Horario
    unsubscribers.push(
      onSnapshot(doc(db, 'settings', 'schedule'), (snapshot) => {
        if (snapshot.exists()) {
          setSchedule(snapshot.data());
        }
        setLoading(false);
      })
    );

    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  const getClient = (id) => clients.find(c => c.id === id);
  const getAptsForDate = (date) => appointments.filter(a => isSameDay(new Date(a.dateTime), date));
  const getAptsForHour = (date, hour) => appointments.filter(a => { const d = new Date(a.dateTime); return isSameDay(d, date) && d.getHours() === hour; });

  const isHoliday = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.find(h => h.date === dateStr);
  };

  const checkConflicts = (aptData, excludeId = null) => {
    const start = new Date(aptData.dateTime);
    const end = new Date(start.getTime() + aptData.duration * 60000);
    const dayOfWeek = start.getDay();
    const conflicts = [];

    const holiday = isHoliday(start);
    if (holiday) {
      conflicts.push({ type: 'holiday', message: `Festivo: ${holiday.name}` });
    }

    const daySchedule = schedule[dayOfWeek];
    if (!daySchedule) {
      conflicts.push({ type: 'schedule', message: 'Patrick no trabaja este día' });
    } else {
      const [startH, startM] = daySchedule.start.split(':').map(Number);
      const [endH, endM] = daySchedule.end.split(':').map(Number);
      const scheduleStart = startH * 60 + startM;
      const scheduleEnd = endH * 60 + endM;
      const aptStart = start.getHours() * 60 + start.getMinutes();
      const aptEnd = end.getHours() * 60 + end.getMinutes();

      if (aptStart < scheduleStart || aptEnd > scheduleEnd) {
        conflicts.push({ type: 'schedule', message: `Fuera del horario laboral (${daySchedule.start} - ${daySchedule.end})` });
      }
    }

    const overlapping = appointments.filter(a => {
      if (excludeId && a.id === excludeId) return false;
      const aStart = new Date(a.dateTime);
      const aEnd = new Date(aStart.getTime() + a.duration * 60000);
      return start < aEnd && end > aStart;
    });

    if (overlapping.length > 0) {
      const clientNames = overlapping.map(a => getClient(a.clientId)?.nombre).join(', ');
      conflicts.push({ type: 'overlap', message: `Solapamiento con: ${clientNames}` });
    }

    return conflicts;
  };

  const navigate = (dir) => {
    const d = new Date(currentDate);
    if (calView === 'day') d.setDate(d.getDate() + dir);
    else if (calView === 'week') d.setDate(d.getDate() + dir * 7);
    else if (calView === 'year') d.setFullYear(d.getFullYear() + dir);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  // CRUD Operations with Firebase
  const saveClient = async (data) => {
    const id = editItem?.id || generateId();
    await setDoc(doc(db, 'clients', id), data);
    setModal(null);
    setEditItem(null);
  };

  const deleteClient = async (id) => {
    await deleteDoc(doc(db, 'clients', id));
    // También eliminar sus citas
    const clientApts = appointments.filter(a => a.clientId === id);
    for (const apt of clientApts) {
      await deleteDoc(doc(db, 'appointments', apt.id));
    }
    setConfirmDel(null);
  };

  const saveAppointment = async (data) => {
    if (editItem) {
      if (editFuture && editItem.seriesId) {
        const originalDate = new Date(editItem.dateTime);
        const newDate = new Date(data.dateTime);
        const timeDiff = newDate.getTime() - originalDate.getTime();
        
        const editFromDate = new Date(editItem.dateTime);
        const toUpdate = appointments.filter(a => a.seriesId === editItem.seriesId && new Date(a.dateTime) >= editFromDate);
        
        for (const apt of toUpdate) {
          const aptDate = new Date(apt.dateTime);
          aptDate.setTime(aptDate.getTime() + timeDiff);
          await setDoc(doc(db, 'appointments', apt.id), { ...apt, ...data, dateTime: aptDate.toISOString() });
        }
      } else {
        const { skipDates, ...aptData } = data;
        await setDoc(doc(db, 'appointments', editItem.id), aptData);
      }
    } else {
      const { skipDates = [], recurrenceDuration, ...aptData } = data;
      const seriesId = aptData.recurrence ? generateId() : null;
      const base = new Date(aptData.dateTime);

      // Calcular iteraciones basado en recurrenceDuration (en meses)
      const months = recurrenceDuration || 6;
      let iterations = 1;
      if (aptData.recurrence === 'weekly') iterations = Math.round(months * 4.33);
      else if (aptData.recurrence === 'biweekly') iterations = Math.round(months * 2.17);
      else if (aptData.recurrence === 'monthly') iterations = months;

      for (let i = 0; i < iterations; i++) {
        const d = new Date(base);
        if (aptData.recurrence === 'weekly') d.setDate(d.getDate() + i * 7);
        if (aptData.recurrence === 'biweekly') d.setDate(d.getDate() + i * 14);
        if (aptData.recurrence === 'monthly') d.setMonth(d.getMonth() + i);

        const dateStr = d.toISOString().split('T')[0];
        if (!skipDates.includes(dateStr)) {
          const id = generateId();
          await setDoc(doc(db, 'appointments', id), { ...aptData, dateTime: d.toISOString(), seriesId });
        }
      }
    }
    setModal(null);
    setEditItem(null);
    setEditFuture(false);
  };

  const deleteAppointment = async (apt, delFuture) => {
    if (delFuture && apt.seriesId) {
      const now = new Date();
      const toDelete = appointments.filter(a => a.seriesId === apt.seriesId && new Date(a.dateTime) >= now);
      for (const a of toDelete) {
        await deleteDoc(doc(db, 'appointments', a.id));
      }
    } else {
      await deleteDoc(doc(db, 'appointments', apt.id));
    }
    setConfirmDel(null);
    setModal(null);
    setEditItem(null);
  };

  const saveSpecial = async (data) => {
    const id = editItem?.id || generateId();
    await setDoc(doc(db, 'specials', id), data);
    setModal(null);
    setEditItem(null);
  };

  const deleteSpecial = async (id) => {
    await deleteDoc(doc(db, 'specials', id));
    // Actualizar citas que tenían esta etiqueta
    for (const apt of appointments) {
      if (apt.specials?.includes(id)) {
        await setDoc(doc(db, 'appointments', apt.id), { ...apt, specials: apt.specials.filter(s => s !== id) });
      }
    }
    setConfirmDel(null);
  };

  const saveHoliday = async (data) => {
    if (editItem) {
      await setDoc(doc(db, 'holidays', editItem.id), data);
    } else if (Array.isArray(data)) {
      for (const h of data) {
        const id = generateId();
        await setDoc(doc(db, 'holidays', id), h);
      }
    } else {
      const id = generateId();
      await setDoc(doc(db, 'holidays', id), data);
    }
    setModal(null);
    setEditItem(null);
  };

  const deleteHoliday = async (id) => {
    await deleteDoc(doc(db, 'holidays', id));
    setConfirmDel(null);
  };

  const updateSchedule = async (newSchedule) => {
    setSchedule(newSchedule);
    await setDoc(doc(db, 'settings', 'schedule'), newSchedule);
  };

  const stats = clients.map(c => {
    const past = appointments.filter(a => a.clientId === c.id && new Date(a.dateTime) < new Date());
    return { client: c, total: past.length, revenue: past.reduce((s, a) => s + (a.cost || 0), 0), avgDur: past.length ? Math.round(past.reduce((s, a) => s + a.duration, 0) / past.length) : 0 };
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-amber-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-stone-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 pb-20 lg:pb-0 lg:flex">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 bg-stone-800 p-3 flex items-center justify-between z-30 lg:hidden">
        <div>
          <h1 className="text-lg font-bold text-amber-200">Patrick</h1>
          <p className="text-xs text-stone-500">v1.2</p>
        </div>
        <button onClick={() => { setModal('appointment'); setEditItem(null); }} className="bg-amber-200 text-stone-800 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1">
          <Plus size={16} /> Cita
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-stone-800 z-30 lg:hidden">
        <div className="flex justify-around py-2">
          {[
            { id: 'calendar', icon: Calendar, label: 'Calendario' },
            { id: 'clients', icon: Users, label: 'Clientes' },
            { id: 'specials', icon: Tag, label: 'Etiquetas' },
            { id: 'schedule', icon: Clock, label: 'Horario' },
            { id: 'stats', icon: BarChart3, label: 'Stats' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center py-1 px-3 rounded-lg ${view === item.id ? 'text-amber-200' : 'text-stone-500'}`}
            >
              <item.icon size={20} />
              <span className="text-xs mt-0.5">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-56 bg-stone-800 p-6 flex-col gap-2 min-h-screen">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-amber-200">Patrick</h1>
          <p className="text-xs text-stone-400 tracking-widest">MASAJES</p>
          <p className="text-xs text-stone-500 mt-1">v1.0</p>
        </div>
        
        {[
          { id: 'calendar', icon: Calendar, label: 'Calendario' },
          { id: 'clients', icon: Users, label: 'Clientes' },
          { id: 'specials', icon: Tag, label: 'Etiquetas' },
          { id: 'schedule', icon: Clock, label: 'Horario' },
          { id: 'holidays', icon: CalendarOff, label: 'Vacaciones' },
          { id: 'stats', icon: BarChart3, label: 'Estadísticas' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${view === item.id ? 'bg-amber-200 text-stone-800' : 'text-stone-400 hover:bg-stone-700 hover:text-amber-200'}`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-3 pt-16 lg:p-8 lg:pt-8">
        {/* CALENDAR */}
        {view === 'calendar' && (
          <>
            <div className="hidden lg:flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-stone-800">Calendario</h2>
              <button onClick={() => { setModal('appointment'); setEditItem(null); }} className="flex items-center gap-2 bg-stone-800 text-amber-200 px-5 py-3 rounded-lg font-medium hover:bg-stone-700 transition-all">
                <Plus size={18} /> Nueva Cita
              </button>
            </div>

            {/* Mobile: Vista selector simplificada */}
            <div className="flex items-center justify-between bg-white p-2 rounded-xl shadow-sm mb-4 lg:mb-6 lg:p-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-stone-100 rounded-lg"><ChevronLeft size={20} /></button>
              <div className="flex-1 text-center">
                <h3 className="text-sm lg:text-lg font-semibold">
                  {calView === 'list' && 'Próximas citas'}
                  {calView === 'day' && formatDate(currentDate)}
                  {calView === 'week' && `${formatDate(getWeekDays(currentDate)[0])} - ${formatDate(getWeekDays(currentDate)[6])}`}
                  {calView === 'month' && currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  {calView === 'year' && currentDate.getFullYear()}
                </h3>
              </div>
              <button onClick={() => navigate(1)} className="p-2 hover:bg-stone-100 rounded-lg"><ChevronRight size={20} /></button>
            </div>

            {/* Vista tabs */}
            <div className="flex gap-1 bg-stone-100 p-1 rounded-lg mb-4 lg:mb-6">
              {['list', 'day', 'week', 'month', 'year'].map(v => (
                <button key={v} onClick={() => setCalView(v)} className={`flex-1 py-2 rounded-md text-xs lg:text-sm font-medium transition-all ${calView === v ? 'bg-white shadow-sm' : 'hover:bg-stone-200'}`}>
                  {v === 'list' ? 'Lista' : v === 'day' ? 'Día' : v === 'week' ? 'Sem' : v === 'month' ? 'Mes' : 'Año'}
                </button>
              ))}
            </div>

            {calView === 'list' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="flex border-b">
                  <button
                    onClick={() => setShowCompleted(false)}
                    className={`flex-1 py-3 text-sm font-medium transition-all ${!showCompleted ? 'border-b-2 border-amber-500 text-amber-700' : 'text-stone-500'}`}
                  >
                    Próximas
                  </button>
                  <button
                    onClick={() => setShowCompleted(true)}
                    className={`flex-1 py-3 text-sm font-medium transition-all ${showCompleted ? 'border-b-2 border-amber-500 text-amber-700' : 'text-stone-500'}`}
                  >
                    Pasadas
                  </button>
                </div>
                {(() => {
                  const now = new Date();
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  const apts = showCompleted
                    ? appointments
                        .filter(a => new Date(a.dateTime) < today)
                        .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
                    : appointments
                        .filter(a => new Date(a.dateTime) >= today)
                        .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
                  
                  const grouped = {};
                  apts.forEach(apt => {
                    const dateKey = new Date(apt.dateTime).toDateString();
                    if (!grouped[dateKey]) grouped[dateKey] = [];
                    grouped[dateKey].push(apt);
                  });

                  const days = Object.keys(grouped).sort((a, b) => 
                    showCompleted ? new Date(b) - new Date(a) : new Date(a) - new Date(b)
                  );
                  
                  if (days.length === 0) {
                    return <div className="p-8 text-center text-stone-400">{showCompleted ? 'No hay citas pasadas' : 'No hay citas próximas'}</div>;
                  }

                  return days.map(dateKey => (
                    <div key={dateKey}>
                      <div className={`px-3 py-2 font-medium sticky top-0 text-sm ${showCompleted ? 'bg-stone-200 text-stone-500' : 'bg-stone-100 text-stone-700'}`}>
                        {new Date(dateKey).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                      {grouped[dateKey].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)).map(apt => {
                        const c = getClient(apt.clientId);
                        const sp = specials.filter(s => apt.specials?.includes(s.id));
                        const aptSpecial = specials.find(s => apt.specials?.includes(s.id));
                        const bgColor = aptSpecial?.color || 'bg-amber-200';
                        const isPastApt = new Date(apt.dateTime) < now;
                        
                        return (
                          <button
                            key={apt.id}
                            onClick={() => { setModal('appointment'); setEditItem(apt); }}
                            className={`w-full flex items-center gap-3 p-3 border-b hover:bg-stone-50 text-left ${isPastApt ? 'opacity-60' : ''}`}
                          >
                            <div className={`w-1.5 h-10 rounded-full ${isPastApt ? 'bg-stone-300' : bgColor}`}></div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium text-sm truncate ${isPastApt ? 'text-stone-500' : ''}`}>{c?.nombre} {c?.apellido}</div>
                              <div className="text-xs text-stone-500 truncate">
                                {formatTime(apt.dateTime)} · {apt.duration}min
                                {apt.cost ? ` · ${apt.cost}€` : ''}
                              </div>
                            </div>
                            {apt.seriesId && <Repeat size={14} className="text-stone-400 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            )}

            {calView === 'week' && (
              <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-8 border-b">
                    <div className="p-3 bg-stone-50"></div>
                    {getWeekDays(currentDate).map((d, i) => {
                      const isPastDay = d < new Date(new Date().setHours(0,0,0,0));
                      const holiday = isHoliday(d);
                      return (
                        <div key={i} className={`p-3 text-center ${isSameDay(d, new Date()) ? 'bg-amber-200' : isPastDay ? 'bg-stone-200 text-stone-400' : holiday ? 'bg-red-100' : 'bg-stone-50'}`}>
                          <div className="text-xs text-stone-500 uppercase">{d.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
                          <div className={`font-semibold ${holiday && !isPastDay ? 'text-red-600' : ''}`}>{d.getDate()}</div>
                          {holiday && !isPastDay && <div className="text-xs text-red-500 truncate">{holiday.name}</div>}
                        </div>
                      );
                    })}
                  </div>
                  {HOURS.map(hour => (
                    <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
                      <div className="p-2 text-right text-sm text-stone-400 bg-stone-50 border-r">{hour}:00</div>
                      {getWeekDays(currentDate).map((d, i) => {
                        const daySchedule = schedule[d.getDay()];
                        const isWorkingHour = daySchedule && (() => {
                          const [startH] = daySchedule.start.split(':').map(Number);
                          const [endH] = daySchedule.end.split(':').map(Number);
                          return hour >= startH && hour < endH;
                        })();
                        const isPastDay = d < new Date(new Date().setHours(0,0,0,0));
                        const holiday = isHoliday(d);
                        
                        return (
                          <div key={i} className={`p-1 min-h-16 border-r last:border-r-0 ${isPastDay ? 'bg-stone-200' : holiday ? 'bg-red-50' : !isWorkingHour ? 'bg-stone-100' : ''}`}>
                            {getAptsForHour(d, hour).map(apt => {
                              const c = getClient(apt.clientId);
                              const aptSpecial = specials.find(s => apt.specials?.includes(s.id));
                              const bgColor = aptSpecial?.color || 'bg-amber-200';
                              return (
                                <button key={apt.id} onClick={() => { setModal('appointment'); setEditItem(apt); }} className={`w-full text-left p-2 rounded-lg text-xs font-medium mb-1 ${isPastDay ? 'bg-stone-300 text-stone-500' : bgColor}`}>
                                  {c?.nombre}
                                  <span className="block text-xs opacity-70">{apt.duration}min</span>
                                  {apt.seriesId && <Repeat size={10} className="inline ml-1" />}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {calView === 'month' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="grid grid-cols-7">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} className="p-2 lg:p-3 text-center text-xs lg:text-sm font-medium text-stone-500 bg-stone-50 border-b">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {getMonthDays(currentDate).map((obj, i) => {
                    const apts = getAptsForDate(obj.date);
                    const isPastDay = obj.date < new Date(new Date().setHours(0,0,0,0));
                    const holiday = isHoliday(obj.date);
                    const dateStr = obj.date.toISOString().split('T')[0];
                    return (
                      <div
                        key={i}
                        onClick={() => { setCurrentDate(obj.date); setCalView('day'); }}
                        onMouseEnter={() => apts.length > 0 && setHoveredDay(dateStr)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`p-1 lg:p-2 min-h-16 lg:min-h-24 border-b border-r cursor-pointer hover:bg-amber-50 relative ${!obj.isCurrentMonth ? 'bg-stone-50 opacity-50' : isPastDay ? 'bg-stone-100' : holiday ? 'bg-red-50' : ''} ${isSameDay(obj.date, new Date()) ? 'bg-amber-100' : ''}`}
                      >
                        <div className={`w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-full text-xs lg:text-sm ${isSameDay(obj.date, new Date()) ? 'bg-amber-300 font-bold' : isPastDay ? 'text-stone-400' : holiday ? 'bg-red-200 text-red-700' : ''}`}>{obj.date.getDate()}</div>
                        {holiday && <div className="text-xs text-red-600 truncate hidden lg:block">{holiday.name}</div>}
                        {apts.length > 0 && <span className={`text-xs px-1 lg:px-2 py-0.5 lg:py-1 rounded-full ${isPastDay ? 'bg-stone-200 text-stone-500' : 'bg-amber-200'}`}>{apts.length}</span>}

                        {/* Tooltip on hover */}
                        {hoveredDay === dateStr && apts.length > 0 && (
                          <div className="absolute z-50 left-0 top-full mt-1 bg-white border rounded-lg shadow-lg p-2 min-w-[160px]" onClick={e => e.stopPropagation()}>
                            <div className="text-xs font-semibold mb-2 text-stone-700">
                              {obj.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                            <div className="space-y-1">
                              {apts.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)).map(apt => {
                                const c = getClient(apt.clientId);
                                const aptSpecial = specials.find(s => apt.specials?.includes(s.id));
                                const bgColor = aptSpecial?.color || 'bg-amber-100';
                                return (
                                  <div key={apt.id} className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${bgColor}`}>
                                    <span className="font-medium">{formatTime(apt.dateTime)}</span>
                                    <span className="truncate">{c?.nombre} {c?.apellido}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {calView === 'day' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-stone-50 border-b">
                  <h3 className="font-semibold">{currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                </div>
                <div className="flex">
                  <div className="w-16 lg:w-20 flex-shrink-0">
                    {HOURS.map(hour => (
                      <div key={hour} className="h-20 p-2 lg:p-4 text-xs lg:text-sm text-stone-400 bg-stone-50 border-r border-b">{hour}:00</div>
                    ))}
                  </div>
                  
                  <div className="flex-1 relative">
                    {HOURS.map(hour => {
                      const daySchedule = schedule[currentDate.getDay()];
                      const isWorkingHour = daySchedule && (() => {
                        const [startH] = daySchedule.start.split(':').map(Number);
                        const [endH] = daySchedule.end.split(':').map(Number);
                        return hour >= startH && hour < endH;
                      })();
                      
                      return (
                        <div key={hour} className={`h-20 border-b relative ${!isWorkingHour ? 'bg-stone-100' : ''}`}>
                          <div className="absolute w-full h-px bg-stone-100" style={{ top: '25%' }}></div>
                          <div className="absolute w-full h-px bg-stone-200" style={{ top: '50%' }}></div>
                          <div className="absolute w-full h-px bg-stone-100" style={{ top: '75%' }}></div>
                        </div>
                      );
                    })}
                    
                    {(() => {
                      const dayApts = appointments
                        .filter(a => isSameDay(new Date(a.dateTime), currentDate))
                        .map(apt => {
                          const start = new Date(apt.dateTime);
                          const end = new Date(start.getTime() + apt.duration * 60000);
                          return { ...apt, start, end };
                        });

                      const getOverlapInfo = (apt) => {
                        const overlapping = dayApts.filter(a => 
                          a.id !== apt.id && apt.start < a.end && apt.end > a.start
                        );
                        
                        if (overlapping.length === 0) return { total: 1, index: 0 };
                        
                        const group = [apt, ...overlapping].sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
                        const index = group.findIndex(a => a.id === apt.id);
                        return { total: group.length, index };
                      };

                      const firstHour = HOURS[0];
                      const pxPerHour = 80;

                      return dayApts.map(apt => {
                        const c = getClient(apt.clientId);
                        const aptSpecial = specials.find(s => apt.specials?.includes(s.id));
                        const bgColor = aptSpecial?.color || 'bg-amber-200';
                        
                        const startMinutes = (apt.start.getHours() - firstHour) * 60 + apt.start.getMinutes();
                        const topPx = (startMinutes / 60) * pxPerHour;
                        const heightPx = (apt.duration / 60) * pxPerHour;
                        
                        const { total, index } = getOverlapInfo(apt);
                        const widthPercent = 100 / total;
                        const leftPercent = index * widthPercent;
                        
                        return (
                          <button 
                            key={apt.id} 
                            onClick={() => { setModal('appointment'); setEditItem(apt); }} 
                            className={`absolute ${bgColor} rounded-lg px-2 py-1 text-left hover:opacity-80 transition-all overflow-hidden z-10`}
                            style={{ 
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                              left: `calc(${leftPercent}% + 4px)`,
                              width: `calc(${widthPercent}% - 8px)`
                            }}
                          >
                            <div className="font-semibold text-sm truncate">{c?.nombre} {c?.apellido}</div>
                            <div className="text-xs opacity-70 truncate">
                              {formatTime(apt.dateTime)} · {apt.duration}min
                              {apt.cost ? ` · ${apt.cost}€` : ''}
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}

            {calView === 'year' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[900px]">
                    {/* Header con días de la semana */}
                    <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b-2 border-stone-300">
                      <div className="bg-stone-50 p-2 text-xs font-semibold text-stone-500"></div>
                      {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map(d => (
                        <div key={d} className="bg-stone-50 p-2 text-xs font-semibold text-stone-500 text-center border-l border-stone-200">{d}</div>
                      ))}
                    </div>

                    {/* Grid del año */}
                    <div>
                      {(() => {
                        const year = currentDate.getFullYear();
                        const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

                        // Generar todas las semanas del año
                        const getAllWeeksOfYear = () => {
                          const weeks = [];
                          const startDate = new Date(year, 0, 1);
                          const endDate = new Date(year, 11, 31);

                          // Encontrar el lunes de la semana que contiene el 1 de enero
                          let current = new Date(startDate);
                          const dayOfWeek = current.getDay();
                          const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                          current.setDate(current.getDate() + diff);

                          // Generar semanas hasta pasar el 31 de diciembre
                          while (current <= endDate || current.getDay() !== 1) {
                            const week = [];
                            for (let i = 0; i < 7; i++) {
                              week.push(new Date(current));
                              current.setDate(current.getDate() + 1);
                            }
                            weeks.push(week);
                            if (current > endDate && current.getDay() === 1) break;
                          }
                          return weeks;
                        };

                        const weeks = getAllWeeksOfYear();
                        const today = new Date();
                        const todayStr = today.toISOString().split('T')[0];

                        // Comprobar si una semana contiene el primer día de un mes
                        const getMonthStart = (week) => {
                          return week.find(d => d.getDate() === 1 && d.getFullYear() === year);
                        };

                        return weeks.map((week, weekIdx) => {
                          const monthLabelDay = getMonthStart(week);
                          const isMonthStart = !!monthLabelDay;

                          return (
                            <div
                              key={weekIdx}
                              className={`grid grid-cols-[60px_repeat(7,1fr)] border-b border-stone-200 ${isMonthStart ? 'border-t-2 border-t-stone-400' : ''}`}
                            >
                              {/* Columna del mes */}
                              <div className={`bg-stone-50 p-1 text-xs font-bold text-stone-700 flex items-center justify-center border-r border-stone-200 ${isMonthStart ? 'bg-stone-100' : ''}`}>
                                {monthLabelDay && monthNames[monthLabelDay.getMonth()]}
                              </div>

                              {/* Días */}
                              {week.map((date, dayIdx) => {
                                const dateStr = date.toISOString().split('T')[0];
                                const isCurrentYear = date.getFullYear() === year;
                                const holiday = isHoliday(date);
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                const isToday = dateStr === todayStr;
                                const apts = isCurrentYear ? getAptsForDate(date) : [];
                                const aptCount = apts.length;
                                const isPastDay = date < new Date(new Date().setHours(0,0,0,0));

                                // Determinar color de fondo
                                let bgClass = 'bg-white';
                                let textClass = 'text-stone-900';

                                if (!isCurrentYear) {
                                  bgClass = 'bg-stone-50';
                                  textClass = 'text-stone-300';
                                } else if (holiday) {
                                  bgClass = 'bg-red-100';
                                  textClass = 'text-red-700';
                                } else if (isWeekend) {
                                  bgClass = 'bg-stone-100';
                                  textClass = 'text-stone-400';
                                } else if (isPastDay) {
                                  bgClass = 'bg-stone-50';
                                  textClass = 'text-stone-400';
                                }

                                return (
                                  <div
                                    key={dayIdx}
                                    className={`${bgClass} p-1 min-h-[36px] relative cursor-pointer hover:ring-2 hover:ring-amber-300 border-l border-stone-200 ${isToday ? 'ring-2 ring-amber-500 ring-inset' : ''}`}
                                    onMouseEnter={() => aptCount > 0 && setHoveredDay(dateStr)}
                                    onMouseLeave={() => setHoveredDay(null)}
                                    onClick={() => { setCurrentDate(date); setCalView('day'); }}
                                  >
                                    <div className={`text-xs font-medium ${textClass} ${isToday ? 'bg-amber-400 text-white rounded-full w-5 h-5 flex items-center justify-center' : ''}`}>
                                      {date.getDate()}
                                    </div>

                                    {/* Indicador de festivo */}
                                    {holiday && isCurrentYear && (
                                      <div className="absolute bottom-0.5 left-0.5">
                                        <span className="text-[8px] text-red-600 truncate max-w-full block leading-tight">{holiday.name.slice(0, 8)}</span>
                                      </div>
                                    )}

                                    {/* Badge de citas */}
                                    {isCurrentYear && aptCount > 0 && (
                                      <div className="absolute bottom-0.5 right-0.5">
                                        <div className={`${isPastDay ? 'bg-stone-400' : 'bg-amber-500'} text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1`}>
                                          {aptCount}
                                        </div>
                                      </div>
                                    )}

                                    {/* Tooltip on hover */}
                                    {hoveredDay === dateStr && aptCount > 0 && (
                                      <div className="absolute z-50 left-0 top-full mt-1 bg-white border rounded-lg shadow-lg p-2 min-w-[160px]" onClick={e => e.stopPropagation()}>
                                        <div className="text-xs font-semibold mb-2 text-stone-700">
                                          {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </div>
                                        <div className="space-y-1">
                                          {apts.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)).map(apt => {
                                            const c = getClient(apt.clientId);
                                            const aptSpecial = specials.find(s => apt.specials?.includes(s.id));
                                            const bgColor = aptSpecial?.color || 'bg-amber-100';
                                            return (
                                              <div key={apt.id} className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${bgColor}`}>
                                                <span className="font-medium">{formatTime(apt.dateTime)}</span>
                                                <span className="truncate">{c?.nombre} {c?.apellido}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* CLIENTS */}
        {view === 'clients' && (
          <>
            <div className="flex justify-between items-center mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-3xl font-bold text-stone-800">Clientes</h2>
              <button onClick={() => { setModal('client'); setEditItem(null); }} className="flex items-center gap-1 bg-stone-800 text-amber-200 px-3 py-2 lg:px-5 lg:py-3 rounded-lg font-medium hover:bg-stone-700 text-sm">
                <Plus size={16} /> Nuevo
              </button>
            </div>
            <div className="space-y-2 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
              {clients.map(c => (
                <div key={c.id} className="bg-white p-3 lg:p-6 rounded-xl shadow-sm flex items-center gap-3 lg:block">
                  <div className="w-10 h-10 lg:w-14 lg:h-14 bg-amber-200 rounded-xl flex items-center justify-center text-sm lg:text-xl font-bold lg:mb-4 flex-shrink-0">{c.nombre?.[0]}{c.apellido?.[0]}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm lg:text-lg truncate">{c.nombre} {c.apellido}</h3>
                    <p className="flex items-center gap-1 text-stone-500 text-xs lg:text-sm"><Phone size={12} />{c.telefono}</p>
                  </div>
                  <div className="flex gap-1 lg:pt-4 lg:mt-4 lg:border-t">
                    <button onClick={() => { setModal('client'); setEditItem(c); }} className="p-2 border rounded-lg hover:bg-stone-50"><Edit2 size={14} /></button>
                    <button onClick={() => setConfirmDel({ type: 'client', item: c })} className="p-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            {clients.length === 0 && (
              <div className="text-center py-12 text-stone-400">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>No hay clientes</p>
              </div>
            )}
          </>
        )}

        {/* SPECIALS */}
        {view === 'specials' && (
          <>
            <div className="flex justify-between items-center mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-3xl font-bold text-stone-800">Etiquetas</h2>
              <button onClick={() => { setModal('special'); setEditItem(null); }} className="flex items-center gap-1 bg-stone-800 text-amber-200 px-3 py-2 lg:px-5 lg:py-3 rounded-lg font-medium hover:bg-stone-700 text-sm">
                <Plus size={16} /> Nueva
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm">
              {specials.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 lg:p-4 hover:bg-stone-50 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 lg:w-10 lg:h-10 ${s.color || 'bg-amber-200'} rounded-lg flex items-center justify-center`}><Tag size={14} /></div>
                    <span className="text-sm lg:text-base">{s.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setModal('special'); setEditItem(s); }} className="p-2 hover:bg-stone-100 rounded-lg"><Edit2 size={14} /></button>
                    <button onClick={() => setConfirmDel({ type: 'special', item: s })} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* SCHEDULE */}
        {view === 'schedule' && (
          <>
            <div className="mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-3xl font-bold text-stone-800">Horario</h2>
            </div>
            <div className="bg-white rounded-xl shadow-sm">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 lg:p-4 border-b last:border-b-0 gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!schedule[idx]}
                      onChange={e => updateSchedule({
                        ...schedule,
                        [idx]: e.target.checked ? { start: '08:00', end: '16:00' } : null
                      })}
                      className="w-4 h-4 accent-amber-500"
                    />
                    <span className="font-medium text-sm w-10">{day}</span>
                  </div>
                  {schedule[idx] ? (
                    <div className="flex items-center gap-1 text-sm">
                      <input
                        type="time"
                        value={schedule[idx].start}
                        onChange={e => updateSchedule({
                          ...schedule,
                          [idx]: { ...schedule[idx], start: e.target.value }
                        })}
                        className="p-1.5 border rounded-lg w-24"
                      />
                      <span>-</span>
                      <input
                        type="time"
                        value={schedule[idx].end}
                        onChange={e => updateSchedule({
                          ...schedule,
                          [idx]: { ...schedule[idx], end: e.target.value }
                        })}
                        className="p-1.5 border rounded-lg w-24"
                      />
                    </div>
                  ) : (
                    <span className="text-stone-400 text-sm">Libre</span>
                  )}
                </div>
              ))}
            </div>

            {/* Link a vacaciones en mobile */}
            <button 
              onClick={() => setView('holidays')}
              className="mt-4 w-full bg-white p-4 rounded-xl shadow-sm flex items-center justify-between lg:hidden"
            >
              <div className="flex items-center gap-3">
                <CalendarOff size={20} className="text-red-500" />
                <span className="font-medium">Vacaciones y Festivos</span>
              </div>
              <ChevronRight size={20} className="text-stone-400" />
            </button>
          </>
        )}

        {/* HOLIDAYS */}
        {view === 'holidays' && (
          <>
            <div className="flex justify-between items-center mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-3xl font-bold text-stone-800">Vacaciones</h2>
              <button onClick={() => { setModal('holiday'); setEditItem(null); }} className="flex items-center gap-1 bg-stone-800 text-amber-200 px-3 py-2 lg:px-5 lg:py-3 rounded-lg font-medium hover:bg-stone-700 text-sm">
                <Plus size={16} /> Añadir
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm">
              {holidays
                .filter(h => new Date(h.date) >= new Date(new Date().setHours(0,0,0,0)))
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(h => (
                  <div key={h.id} className="flex items-center justify-between p-3 lg:p-4 hover:bg-stone-50 border-b last:border-b-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-500 flex-shrink-0">
                        <CalendarOff size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-sm block truncate">{h.name}</span>
                        <div className="text-xs text-stone-500">
                          {new Date(h.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => { setModal('holiday'); setEditItem(h); }} className="p-2 hover:bg-stone-100 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => setConfirmDel({ type: 'holiday', item: h })} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              {holidays.filter(h => new Date(h.date) >= new Date(new Date().setHours(0,0,0,0))).length === 0 && (
                <div className="p-8 text-center text-stone-400">No hay festivos próximos</div>
              )}
            </div>
          </>
        )}

        {/* STATS */}
        {view === 'stats' && (
          <>
            <h2 className="text-xl lg:text-3xl font-bold text-stone-800 mb-4 lg:mb-6">Estadísticas</h2>
            {stats.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-stone-50 border-b">
                        <th className="text-left p-3 lg:p-4">
                          <button
                            onClick={() => {
                              if (statsSortKey === 'nombre') {
                                setStatsSortDir(statsSortDir === 'asc' ? 'desc' : 'asc');
                              } else {
                                setStatsSortKey('nombre');
                                setStatsSortDir('asc');
                              }
                            }}
                            className="flex items-center gap-1 font-medium text-sm text-stone-600 hover:text-stone-900"
                          >
                            Cliente
                            {statsSortKey === 'nombre' ? (
                              statsSortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            ) : (
                              <ArrowUpDown size={14} className="text-stone-400" />
                            )}
                          </button>
                        </th>
                        <th className="text-right p-3 lg:p-4">
                          <button
                            onClick={() => {
                              if (statsSortKey === 'total') {
                                setStatsSortDir(statsSortDir === 'asc' ? 'desc' : 'asc');
                              } else {
                                setStatsSortKey('total');
                                setStatsSortDir('desc');
                              }
                            }}
                            className="flex items-center gap-1 font-medium text-sm text-stone-600 hover:text-stone-900 ml-auto"
                          >
                            Sesiones
                            {statsSortKey === 'total' ? (
                              statsSortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            ) : (
                              <ArrowUpDown size={14} className="text-stone-400" />
                            )}
                          </button>
                        </th>
                        <th className="text-right p-3 lg:p-4">
                          <button
                            onClick={() => {
                              if (statsSortKey === 'revenue') {
                                setStatsSortDir(statsSortDir === 'asc' ? 'desc' : 'asc');
                              } else {
                                setStatsSortKey('revenue');
                                setStatsSortDir('desc');
                              }
                            }}
                            className="flex items-center gap-1 font-medium text-sm text-stone-600 hover:text-stone-900 ml-auto"
                          >
                            Ingresos
                            {statsSortKey === 'revenue' ? (
                              statsSortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            ) : (
                              <ArrowUpDown size={14} className="text-stone-400" />
                            )}
                          </button>
                        </th>
                        <th className="text-right p-3 lg:p-4">
                          <button
                            onClick={() => {
                              if (statsSortKey === 'avgDur') {
                                setStatsSortDir(statsSortDir === 'asc' ? 'desc' : 'asc');
                              } else {
                                setStatsSortKey('avgDur');
                                setStatsSortDir('desc');
                              }
                            }}
                            className="flex items-center gap-1 font-medium text-sm text-stone-600 hover:text-stone-900 ml-auto"
                          >
                            <span className="hidden sm:inline">Media</span>
                            <span className="sm:hidden">Med.</span>
                            {statsSortKey === 'avgDur' ? (
                              statsSortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            ) : (
                              <ArrowUpDown size={14} className="text-stone-400" />
                            )}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...stats].sort((a, b) => {
                        let cmp = 0;
                        if (statsSortKey === 'nombre') {
                          cmp = `${a.client.nombre} ${a.client.apellido}`.localeCompare(`${b.client.nombre} ${b.client.apellido}`);
                        } else if (statsSortKey === 'total') {
                          cmp = a.total - b.total;
                        } else if (statsSortKey === 'revenue') {
                          cmp = a.revenue - b.revenue;
                        } else if (statsSortKey === 'avgDur') {
                          cmp = a.avgDur - b.avgDur;
                        }
                        return statsSortDir === 'asc' ? cmp : -cmp;
                      }).map(s => (
                        <tr key={s.client.id} className="border-b last:border-b-0 hover:bg-stone-50">
                          <td className="p-3 lg:p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-amber-200 rounded-lg flex items-center justify-center font-bold text-xs lg:text-sm flex-shrink-0">
                                {s.client.nombre?.[0]}{s.client.apellido?.[0]}
                              </div>
                              <span className="font-medium text-sm truncate">{s.client.nombre} {s.client.apellido}</span>
                            </div>
                          </td>
                          <td className="p-3 lg:p-4 text-right font-semibold">{s.total}</td>
                          <td className="p-3 lg:p-4 text-right font-semibold text-amber-600">{s.revenue}€</td>
                          <td className="p-3 lg:p-4 text-right font-semibold">{s.avgDur}'</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-stone-400">
                <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                <p>No hay estadísticas</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODALS */}
      {modal === 'client' && (
        <Modal title={editItem ? 'Editar Cliente' : 'Nuevo Cliente'} onClose={() => { setModal(null); setEditItem(null); }}>
          <ClientForm client={editItem} onSave={saveClient} onCancel={() => { setModal(null); setEditItem(null); }} />
        </Modal>
      )}

      {modal === 'appointment' && (
        <Modal title={editItem ? 'Editar Cita' : 'Nueva Cita'} onClose={() => { setModal(null); setEditItem(null); setEditFuture(false); }}>
          <AppointmentForm 
            apt={editItem} 
            clients={clients} 
            specials={specials}
            appointments={appointments}
            checkConflicts={checkConflicts}
            holidays={holidays}
            isHoliday={isHoliday}
            onSave={saveAppointment} 
            onDelete={(apt, future) => setConfirmDel({ type: 'appointment', item: apt, future })}
            onCancel={() => { setModal(null); setEditItem(null); setEditFuture(false); }}
            editFuture={editFuture}
            setEditFuture={setEditFuture}
          />
        </Modal>
      )}

      {modal === 'special' && (
        <Modal title={editItem ? 'Editar Etiqueta' : 'Nueva Etiqueta'} onClose={() => { setModal(null); setEditItem(null); }}>
          <SpecialForm special={editItem} onSave={saveSpecial} onCancel={() => { setModal(null); setEditItem(null); }} />
        </Modal>
      )}

      {modal === 'holiday' && (
        <Modal title={editItem ? 'Editar Festivo' : 'Nuevo Festivo'} onClose={() => { setModal(null); setEditItem(null); }}>
          <HolidayForm holiday={editItem} onSave={saveHoliday} onCancel={() => { setModal(null); setEditItem(null); }} />
        </Modal>
      )}

      {confirmDel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full">
            <p className="mb-6">¿Eliminar {confirmDel.type === 'client' ? 'este cliente y todas sus citas' : confirmDel.type === 'special' ? 'esta etiqueta' : confirmDel.type === 'holiday' ? 'este festivo' : 'esta cita'}?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDel(null)} className="px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={() => {
                if (confirmDel.type === 'client') deleteClient(confirmDel.item.id);
                else if (confirmDel.type === 'special') deleteSpecial(confirmDel.item.id);
                else if (confirmDel.type === 'holiday') deleteHoliday(confirmDel.item.id);
                else deleteAppointment(confirmDel.item, confirmDel.future);
              }} className="px-4 py-2 bg-red-500 text-white rounded-lg">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white p-6 rounded-xl w-full max-w-md max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ClientForm({ client, onSave, onCancel }) {
  const [nombre, setNombre] = useState(client?.nombre || '');
  const [apellido, setApellido] = useState(client?.apellido || '');
  const [telefono, setTelefono] = useState(client?.telefono || '');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1">Nombre</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-200 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1">Apellido</label>
        <input value={apellido} onChange={e => setApellido(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-200 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1">Teléfono</label>
        <input value={telefono} onChange={e => setTelefono(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-200 outline-none" />
      </div>
      <div className="flex gap-3 pt-4">
        <button onClick={onCancel} className="flex-1 py-3 border rounded-lg font-medium hover:bg-stone-50">Cancelar</button>
        <button onClick={() => nombre && apellido && telefono && onSave({ nombre, apellido, telefono })} className="flex-1 py-3 bg-stone-800 text-amber-200 rounded-lg font-medium hover:bg-stone-700">{client ? 'Guardar' : 'Crear'}</button>
      </div>
    </div>
  );
}

function AppointmentForm({ apt, clients, specials, onSave, onDelete, onCancel, editFuture, setEditFuture, appointments, checkConflicts }) {
  const [clientId, setClientId] = useState(apt?.clientId || '');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const [date, setDate] = useState(apt ? new Date(apt.dateTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(apt ? `${String(new Date(apt.dateTime).getHours()).padStart(2,'0')}:${String(new Date(apt.dateTime).getMinutes()).padStart(2,'0')}` : '10:00');
  const [duration, setDuration] = useState(apt?.duration || 60);
  const [cost, setCost] = useState(apt?.cost?.toString() || '');
  const [selSpecials, setSelSpecials] = useState(apt?.specials || []);
  const [recurrence, setRecurrence] = useState(apt?.recurrence || '');
  const [recurrenceDuration, setRecurrenceDuration] = useState('6'); // meses: 2, 6, 12
  const [skipConflictDates, setSkipConflictDates] = useState([]);

  const isPast = apt && new Date(apt.dateTime) < new Date();
  const toggleSpecial = (id) => setSelSpecials(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const selectedClient = clients.find(c => c.id === clientId);
  
  const filteredClients = clients
    .map(c => ({ ...c, visits: appointments.filter(a => a.clientId === c.id).length }))
    .filter(c => {
      const search = clientSearch.toLowerCase();
      return c.nombre?.toLowerCase().includes(search) || 
             c.apellido?.toLowerCase().includes(search) ||
             c.telefono?.includes(search);
    })
    .sort((a, b) => b.visits - a.visits);

  const selectClient = (c) => {
    setClientId(c.id);
    setClientSearch('');
    setShowClientList(false);
  };

  const currentAptData = {
    dateTime: new Date(`${date}T${time}`).toISOString(),
    duration: Number(duration)
  };
  const conflicts = (date && time && duration) ? checkConflicts(currentAptData, apt?.id) : [];

  const getIterations = () => {
    const months = Number(recurrenceDuration);
    if (recurrence === 'weekly') return Math.round(months * 4.33);
    if (recurrence === 'biweekly') return Math.round(months * 2.17);
    if (recurrence === 'monthly') return months;
    return 1;
  };

  const getRecurringConflicts = () => {
    if (apt || !recurrence) return [];

    const baseDate = new Date(`${date}T${time}`);
    const iterations = getIterations();
    const conflictDates = [];

    for (let i = 1; i < iterations; i++) {
      const d = new Date(baseDate);
      if (recurrence === 'weekly') d.setDate(d.getDate() + i * 7);
      if (recurrence === 'biweekly') d.setDate(d.getDate() + i * 14);
      if (recurrence === 'monthly') d.setMonth(d.getMonth() + i);

      const aptData = { dateTime: d.toISOString(), duration: Number(duration) };
      const dateConflicts = checkConflicts(aptData, null);

      if (dateConflicts.length > 0) {
        conflictDates.push({
          date: d,
          dateStr: d.toISOString().split('T')[0],
          conflicts: dateConflicts
        });
      }
    }

    return conflictDates;
  };

  const recurringConflicts = getRecurringConflicts();

  const toggleSkipDate = (dateStr) => {
    setSkipConflictDates(prev => 
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  const handleSave = () => {
    if (!clientId) return;

    const data = {
      clientId,
      dateTime: new Date(`${date}T${time}`).toISOString(),
      duration: Number(duration),
      cost: cost ? Number(cost) : null,
      specials: selSpecials,
      recurrence: apt ? apt.recurrence : (recurrence || null),
      recurrenceDuration: apt ? apt.recurrenceDuration : (recurrence ? Number(recurrenceDuration) : null),
      seriesId: apt?.seriesId,
      skipDates: skipConflictDates
    };

    onSave(data);
  };

  return (
    <div className="space-y-4">
      {apt?.seriesId && !isPast && (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm mb-2">Cita recurrente:</p>
          <label className="flex items-center gap-2 text-sm"><input type="radio" checked={!editFuture} onChange={() => setEditFuture(false)} />Solo esta</label>
          <label className="flex items-center gap-2 text-sm"><input type="radio" checked={editFuture} onChange={() => setEditFuture(true)} />Esta y futuras</label>
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <AlertTriangle size={18} />
            Conflictos detectados
          </div>
          {conflicts.map((c, i) => (
            <p key={i} className="text-sm text-red-600">• {c.message}</p>
          ))}
        </div>
      )}

      {recurringConflicts.length > 0 && (
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
            <AlertTriangle size={18} />
            Conflictos en fechas recurrentes
          </div>
          <p className="text-sm text-orange-600 mb-3">Selecciona las fechas que quieres saltar:</p>
          {recurringConflicts.map((rc, i) => (
            <label key={i} className="flex items-start gap-2 text-sm text-orange-700 mb-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={skipConflictDates.includes(rc.dateStr)}
                onChange={() => toggleSkipDate(rc.dateStr)}
                className="mt-0.5 accent-orange-500"
              />
              <div>
                <span className="font-medium">{rc.date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                <span className="text-orange-500"> — {rc.conflicts.map(c => c.message).join(', ')}</span>
              </div>
            </label>
          ))}
        </div>
      )}

      <div className="relative">
        <label className="block text-sm font-medium text-stone-600 mb-1">Cliente</label>
        {selectedClient ? (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-amber-50">
            <span className="font-medium">{selectedClient.nombre} {selectedClient.apellido}</span>
            <button type="button" onClick={() => { setClientId(''); setShowClientList(true); }} className="text-stone-400 hover:text-stone-600">
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <input 
              type="text"
              value={clientSearch}
              onChange={e => { setClientSearch(e.target.value); setShowClientList(true); }}
              onFocus={() => setShowClientList(true)}
              placeholder="Buscar cliente..."
              className="w-full p-3 border rounded-lg"
            />
            {showClientList && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
                {filteredClients.length === 0 ? (
                  <div className="p-3 text-stone-400 text-sm">No se encontraron clientes</div>
                ) : (
                  filteredClients.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectClient(c)}
                      className="w-full text-left p-3 hover:bg-amber-50 flex justify-between items-center border-b last:border-b-0"
                    >
                      <span>{c.nombre} {c.apellido}</span>
                      <span className="text-xs text-stone-400">{c.visits} visitas</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">Fecha</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">Hora</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-3 border rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">Duración</label>
          <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full p-3 border rounded-lg">
            {DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">Coste €</label>
          <input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="Opcional" className="w-full p-3 border rounded-lg" />
        </div>
      </div>
      {!apt && (
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">Repetición</label>
          <div className={recurrence ? 'grid grid-cols-2 gap-2' : ''}>
            <select value={recurrence} onChange={e => setRecurrence(e.target.value)} className="w-full p-3 border rounded-lg">
              <option value="">Sin repetición</option>
              <option value="weekly">Semanal</option>
              <option value="biweekly">Cada 2 semanas</option>
              <option value="monthly">Mensual</option>
            </select>
            {recurrence && (
              <select value={recurrenceDuration} onChange={e => setRecurrenceDuration(e.target.value)} className="w-full p-3 border rounded-lg">
                <option value="2">2 meses</option>
                <option value="6">6 meses</option>
                <option value="12">1 año</option>
              </select>
            )}
          </div>
          {recurrence && (
            <p className="text-xs text-stone-500 mt-1">
              Se crearán {getIterations()} citas
            </p>
          )}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-stone-600 mb-2">Etiquetas</label>
        <div className="flex flex-wrap gap-2">
          {specials.map(s => (
            <button key={s.id} type="button" onClick={() => toggleSpecial(s.id)} className={`px-3 py-1 rounded-full text-sm border ${selSpecials.includes(s.id) ? 'bg-amber-200 border-amber-300' : 'hover:bg-stone-50'}`}>
              {selSpecials.includes(s.id) && <Check size={12} className="inline mr-1" />}{s.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        {apt && !isPast && (
          <button onClick={() => onDelete(apt, editFuture)} className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 text-sm">
            <Trash2 size={16} />
            {editFuture && apt.seriesId ? 'Eliminar futuras' : 'Eliminar'}
          </button>
        )}
        <button onClick={onCancel} className="flex-1 py-3 border rounded-lg font-medium hover:bg-stone-50">Cancelar</button>
        <button 
          onClick={handleSave}
          disabled={!clientId}
          className="flex-1 py-3 bg-stone-800 text-amber-200 rounded-lg font-medium hover:bg-stone-700 disabled:opacity-50"
        >
          {apt ? 'Guardar' : 'Crear'}
        </button>
      </div>
    </div>
  );
}

function SpecialForm({ special, onSave, onCancel }) {
  const [name, setName] = useState(special?.name || '');
  const [color, setColor] = useState(special?.color || 'bg-amber-200');

  const colors = [
    { value: 'bg-amber-200', label: 'Ámbar' },
    { value: 'bg-blue-200', label: 'Azul' },
    { value: 'bg-green-200', label: 'Verde' },
    { value: 'bg-purple-200', label: 'Morado' },
    { value: 'bg-red-200', label: 'Rojo' },
    { value: 'bg-pink-200', label: 'Rosa' },
    { value: 'bg-cyan-200', label: 'Cian' },
    { value: 'bg-orange-200', label: 'Naranja' },
    { value: 'bg-teal-200', label: 'Turquesa' },
    { value: 'bg-indigo-200', label: 'Índigo' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1">Nombre</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Casa Barcelona" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-200 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-600 mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {colors.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className={`w-10 h-10 rounded-lg ${c.value} ${color === c.value ? 'ring-2 ring-stone-800 ring-offset-2' : ''}`}
              title={c.label}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <button onClick={onCancel} className="flex-1 py-3 border rounded-lg font-medium hover:bg-stone-50">Cancelar</button>
        <button onClick={() => name && onSave({ name, color })} className="flex-1 py-3 bg-stone-800 text-amber-200 rounded-lg font-medium hover:bg-stone-700">{special ? 'Guardar' : 'Crear'}</button>
      </div>
    </div>
  );
}

function HolidayForm({ holiday, onSave, onCancel }) {
  const [name, setName] = useState(holiday?.name || '');
  const [startDate, setStartDate] = useState(holiday?.date || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(holiday?.date || new Date().toISOString().split('T')[0]);
  const [isRange, setIsRange] = useState(false);

  const handleSave = () => {
    if (!name || !startDate) return;
    
    if (holiday) {
      onSave({ name, date: startDate });
    } else if (isRange && endDate > startDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const holidays = [];
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        holidays.push({ name, date: d.toISOString().split('T')[0] });
      }
      
      onSave(holidays);
    } else {
      onSave({ name, date: startDate });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-600 mb-1">Nombre</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Vacaciones de verano" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-200 outline-none" />
      </div>
      
      {!holiday && (
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="isRange" 
            checked={isRange} 
            onChange={e => setIsRange(e.target.checked)}
            className="w-4 h-4 accent-amber-500"
          />
          <label htmlFor="isRange" className="text-sm text-stone-600 cursor-pointer">Rango de fechas</label>
        </div>
      )}
      
      <div className={isRange && !holiday ? 'grid grid-cols-2 gap-4' : ''}>
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">{isRange && !holiday ? 'Desde' : 'Fecha'}</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 border rounded-lg" />
        </div>
        
        {isRange && !holiday && (
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Hasta</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className="w-full p-3 border rounded-lg" />
          </div>
        )}
      </div>
      
      {isRange && !holiday && startDate && endDate && endDate >= startDate && (
        <p className="text-sm text-stone-500">
          Se crearán {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1} días de "{name || '...'}"
        </p>
      )}
      
      <div className="flex gap-3 pt-4">
        <button onClick={onCancel} className="flex-1 py-3 border rounded-lg font-medium hover:bg-stone-50">Cancelar</button>
        <button onClick={handleSave} disabled={!name || !startDate} className="flex-1 py-3 bg-stone-800 text-amber-200 rounded-lg font-medium hover:bg-stone-700 disabled:opacity-50">{holiday ? 'Guardar' : 'Crear'}</button>
      </div>
    </div>
  );
}
