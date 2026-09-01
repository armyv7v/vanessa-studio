import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DateTime } from 'luxon';
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, addMonths, subMonths, addWeeks, subWeeks,
  isSameMonth, isSameDay, parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CalendarDays,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { bookAppointment, getAvailableSlots, getAvailableSlotsRange } from '../../lib/api';
import AdminShell from '../../components/AdminShell';
import { hasAdminToken } from '../../lib/adminAuth';
import { isAllowedBusinessDay } from '../../lib/calendarConfig';
import { services } from '../../lib/services';
import horariosConfig from '../../config/horarios.json';

const OPEN_HOUR = 9;
const CLOSE_HOUR = 22;
const TOTAL_MINUTES = (CLOSE_HOUR - OPEN_HOUR) * 60;

const UNIQUE_DURATIONS = [...new Set(services.map((s) => s.duration))].sort((a, b) => a - b);
const MIN_DURATION = UNIQUE_DURATIONS[0];

const AVAILABILITY_COLORS = {
  blocked: { bg: 'rgba(244, 114, 182, 0.12)', border: '#F472B6', text: '#9D174D' },
  available: { bg: 'rgba(16, 185, 129, 0.09)', border: '#10B981', text: '#065F46' },
  occupied: { bg: 'rgba(239, 68, 68, 0.08)', border: '#F87171', text: '#991B1B' },
};

const HORARIOS_ENDPOINT = '/api/horarios';

export default function AdminTurnos() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('all');

  const selectedDuration = selectedServiceId === 'all'
    ? MIN_DURATION
    : services.find((s) => String(s.id) === selectedServiceId)?.duration || MIN_DURATION;
  const REAL_MAX_CAPACITY = Math.floor(TOTAL_MINUTES / selectedDuration);
  
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [horarioAtencion, setHorarioAtencion] = useState(horariosConfig.horarioAtencion || {});
  const [blackoutConfig, setBlackoutConfig] = useState({ disabledDays: [], disabledDates: [], blackoutRanges: [] });
  const [bookingSlot, setBookingSlot] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    serviceId: String(services[0]?.id || ''),
    name: '',
    email: '',
    phone: '',
  });
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!(await hasAdminToken())) {
        router.push('/admin/login');
        setLoading(false);
        return;
      }
      setIsAuthenticated(true);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchHorarios = async () => {
      try {
        const response = await fetch(HORARIOS_ENDPOINT);
        const data = await response.json().catch(() => null);
        if (response.ok && data?.horarioAtencion) {
          setHorarioAtencion(data.horarioAtencion);
          setBlackoutConfig({
            disabledDays: Array.isArray(data?.disabledDays) ? data.disabledDays : [],
            disabledDates: Array.isArray(data?.disabledDates) ? data.disabledDates : [],
            blackoutRanges: Array.isArray(data?.blackoutRanges) ? data.blackoutRanges : [],
          });
        }
      } catch {
        // fallback
      }
    };

    fetchHorarios();
  }, [isAuthenticated]);

  const nextPeriod = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };

  const prevPeriod = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };

  const getEventsForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return availableSlots
      .filter((slot) => format(parseISO(slot.start), 'yyyy-MM-dd') === dayStr)
      .sort((a, b) => new Date(a.start) - new Date(b.start));
  };

  const getRealCapacity = (daySlots) => {
    if (!daySlots.length) return 0;
    let count = 0;
    let lastEnd = null;
    for (const slot of daySlots) {
      const sStart = parseISO(slot.start);
      if (!lastEnd || sStart >= lastEnd) {
        const endParts = slot.end.split(':');
        const endDate = new Date(sStart);
        endDate.setHours(parseInt(endParts[0], 10), parseInt(endParts[1], 10), 0, 0);
        lastEnd = endDate;
        count++;
      }
    }
    return count;
  };

  const getAvailabilityStyle = (day) => {
    if (!isAllowedBusinessDay(day, blackoutConfig)) {
      return AVAILABILITY_COLORS.blocked;
    }

    const daySlots = getEventsForDay(day);
    return daySlots.length > 0 ? AVAILABILITY_COLORS.available : AVAILABILITY_COLORS.occupied;
  };

  const refreshSlots = useCallback(async () => {
    let start;
    let end;

    if (viewMode === 'month') {
      start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    } else {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    }

    const slots = await getAvailableSlotsRange(start, end, selectedDuration);
    setAvailableSlots(slots);
  }, [currentDate, viewMode, selectedDuration]);

  const openBookingModal = (event) => {
    setBookingSlot(event);
    setBookingError('');
    setBookingSuccess('');
  };

  const closeBookingModal = () => {
    setBookingSlot(null);
    setBookingError('');
    setBookingSuccess('');
    setSubmittingBooking(false);
  };

  const validateServiceFitsSlot = async () => {
    const selectedService = services.find((service) => String(service.id) === bookingForm.serviceId);
    if (!selectedService || !bookingSlot) {
      throw new Error('Servicio o turno inválido.');
    }

    const slotStart = DateTime.fromISO(bookingSlot.start).setZone('America/Santiago');
    const slotEnd = slotStart.plus({ minutes: selectedService.duration });

    const dayName = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][slotStart.weekday === 7 ? 0 : slotStart.weekday];
    const dayHours = horarioAtencion?.[dayName];

    if (!Array.isArray(dayHours) || dayHours.length !== 2) {
      throw new Error('Ese día no tiene horario de atención configurado.');
    }

    const [openHour, openMinute] = dayHours[0].split(':').map(Number);
    const [closeHour, closeMinute] = dayHours[1].split(':').map(Number);
    const dayOpen = slotStart.set({ hour: openHour, minute: openMinute, second: 0, millisecond: 0 });
    const dayClose = slotStart.set({ hour: closeHour, minute: closeMinute, second: 0, millisecond: 0 });

    if (slotStart < dayOpen || slotEnd > dayClose) {
      throw new Error('Ese servicio no entra completo dentro del horario configurado.');
    }

    const busy = await getAvailableSlots(slotStart.toJSDate(), selectedService.id);
    const hasConflict = busy.some((item) => {
      if (!item?.start || !item?.end) return false;
      const busyStart = DateTime.fromISO(item.start).setZone('America/Santiago');
      const busyEnd = DateTime.fromISO(item.end).setZone('America/Santiago');
      return slotStart < busyEnd && slotEnd > busyStart;
    });

    if (hasConflict) {
      throw new Error('Ese horario ya no está disponible para la duración del servicio.');
    }

    return selectedService;
  };

  const handleBookingSubmit = async (event) => {
    event.preventDefault();

    if (!bookingForm.name.trim() || !bookingForm.email.trim()) {
      setBookingError('Nombre y email son obligatorios.');
      return;
    }

    try {
      setSubmittingBooking(true);
      setBookingError('');
      setBookingSuccess('');

      const selectedService = await validateServiceFitsSlot();
      const slotStart = DateTime.fromISO(bookingSlot.start).setZone('America/Santiago');

      await bookAppointment({
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        durationMin: selectedService.duration,
        date: slotStart.toFormat('yyyy-MM-dd'),
        start: slotStart.toFormat('HH:mm'),
        extraCupo: false,
        adminCreated: true,
        client: {
          name: bookingForm.name.trim(),
          email: bookingForm.email.trim(),
          phone: bookingForm.phone.trim(),
        },
      });

      setBookingSuccess('¡Cita creada correctamente desde el panel admin!');
      setSelectedDayEvents(null);
      await refreshSlots();
      setBookingForm((previous) => ({ ...previous, name: '', email: '', phone: '' }));
    } catch (error) {
      setBookingError(error.message || 'No se pudo crear la cita.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        await refreshSlots();
      } catch (error) {
        console.error('Error fetching slots:', error);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [isAuthenticated, refreshSlots]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-50/40">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#E11B74] border-t-transparent" />
          <p className="text-xs font-semibold text-neutral-500">Cargando agenda de turnos...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const days = viewMode === 'month'
    ? eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }),
      })
    : eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      });

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const availableSlotsCount = availableSlots.length;
  const daysWithAvailability = days.filter((day) => getEventsForDay(day).length > 0).length;
  const peakDay = days
    .map((day) => ({ day, count: getEventsForDay(day).length }))
    .sort((a, b) => b.count - a.count)[0];

  return (
    <>
      <Head>
        <title>Agenda de Turnos | Admin Vanessa Nails</title>
      </Head>

      <AdminShell
        title="Agenda de Turnos & Disponibilidad"
        description="Explora los cupos libres por día, visualiza la capacidad real del estudio y agenda citas de forma manual."
      >
        <div className="space-y-6">
          {/* Tarjetas KPI de Disponibilidad */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-pink-200/70 bg-white/90 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Slots Libres</p>
                  <p className="mt-1 text-2xl font-bold text-neutral-900">{availableSlotsCount}</p>
                </div>
                <div className="rounded-xl bg-pink-50 p-2 text-pink-600">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-neutral-500">En el período seleccionado</p>
            </div>

            <div className="rounded-2xl border border-emerald-200/70 bg-white/90 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Días con Cupo</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-900">{daysWithAvailability}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                  <CalendarDays className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-emerald-700">Jornadas con disponibilidad</p>
            </div>

            <div className="rounded-2xl border border-amber-200/70 bg-white/90 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pico de Disponibilidad</p>
                  <p className="mt-1 text-2xl font-bold text-amber-900">
                    {peakDay?.count ? `${peakDay.count} slots` : '0'}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-amber-700">
                {peakDay?.count ? `${format(peakDay.day, "d 'de' MMMM", { locale: es })}` : 'Sin cupos destacados'}
              </p>
            </div>
          </div>

          {/* Barra de Filtros y Control de Vista */}
          <div className="rounded-3xl border border-pink-200/70 bg-white/90 p-4 sm:p-5 shadow-sm space-y-4 backdrop-blur-md">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Filtro por Servicio */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 shrink-0">
                  Servicio:
                </span>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="rounded-2xl border border-pink-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-neutral-800 outline-none shadow-sm focus:border-pink-500"
                >
                  <option value="all">Todos ({MIN_DURATION} min mín.)</option>
                  {services.map((svc) => (
                    <option key={svc.id} value={String(svc.id)}>
                      {svc.name} ({svc.duration} min)
                    </option>
                  ))}
                </select>
              </div>

              {/* Conmutador Mes / Semana & Botón Actualizar */}
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-2xl border border-pink-200 bg-pink-50/60 p-1">
                  {['month', 'week'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`rounded-xl px-3.5 py-1 text-xs font-bold transition ${
                        viewMode === mode
                          ? 'bg-gradient-to-r from-[#E11B74] to-[#C5A059] text-white shadow-sm'
                          : 'text-neutral-600 hover:text-pink-600'
                      }`}
                    >
                      {mode === 'month' ? 'Mes' : 'Semana'}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={refreshSlots}
                  disabled={loadingSlots}
                  className="flex items-center gap-1.5 rounded-2xl border border-pink-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 shadow-sm hover:bg-pink-50 transition"
                  title="Refrescar disponibilidad"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingSlots ? 'animate-spin text-pink-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Leyenda cromática */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-pink-100/70 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-neutral-600 font-medium">Disponible</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="text-neutral-600 font-medium">Ocupado / Sin cupos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-pink-400" />
                <span className="text-neutral-600 font-medium">Bloqueado / No laboral</span>
              </div>
            </div>
          </div>

          {/* Calendario Interactivo */}
          <div className="overflow-hidden rounded-3xl border border-pink-200/70 bg-white/95 shadow-sm backdrop-blur-md">
            {/* Header del Calendario */}
            <div className="flex items-center justify-between border-b border-pink-100 bg-pink-50/40 p-4">
              <button
                onClick={prevPeriod}
                className="rounded-2xl border border-pink-200 bg-white p-2 text-pink-600 shadow-sm hover:bg-pink-50 transition active:scale-95"
                aria-label="Período anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <h3 className="font-display text-base sm:text-lg font-bold capitalize text-neutral-900">
                {format(
                  currentDate,
                  viewMode === 'month' ? 'MMMM yyyy' : "'Semana del' d 'de' MMMM",
                  { locale: es }
                )}
              </h3>

              <button
                onClick={nextPeriod}
                className="rounded-2xl border border-pink-200 bg-white p-2 text-pink-600 shadow-sm hover:bg-pink-50 transition active:scale-95"
                aria-label="Período siguiente"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 border-b border-pink-100 bg-pink-50/20 text-center text-xs font-bold text-neutral-500 py-2.5">
              {weekDays.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Celdas de días */}
            <div className={`grid grid-cols-7 ${viewMode === 'month' ? 'auto-rows-fr' : 'min-h-[500px]'}`}>
              {days.map((day) => {
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentDate);
                const dayEvents = getEventsForDay(day);
                const availStyle = getAvailabilityStyle(day);

                return (
                  <div
                    key={day.toString()}
                    onClick={() => setSelectedDayEvents({ date: day, events: dayEvents })}
                    className="relative min-h-[90px] sm:min-h-[110px] cursor-pointer border-b border-r border-pink-100/60 p-2 transition hover:opacity-90 select-none"
                    style={{
                      background: !isCurrentMonth && viewMode === 'month'
                        ? 'rgba(250, 245, 248, 0.4)'
                        : availStyle.bg,
                      opacity: !isCurrentMonth && viewMode === 'month' ? 0.45 : 1,
                      outline: isToday ? '2px solid #E11B74' : 'none',
                      outlineOffset: isToday ? '-2px' : '0',
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs font-bold ${
                          isToday
                            ? 'bg-gradient-to-tr from-[#E11B74] to-[#C5A059] text-white shadow-sm'
                            : 'text-neutral-700'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[10px] font-bold">
                          {getRealCapacity(dayEvents)}/{REAL_MAX_CAPACITY}
                        </span>
                      )}
                    </div>

                    {/* Vista previa de slots */}
                    <div className="mt-1.5 space-y-1">
                      {dayEvents.slice(0, 2).map((event, i) => (
                        <div
                          key={i}
                          className="truncate rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-1 py-0.5 text-[10px] font-semibold"
                        >
                          {format(parseISO(event.start), 'HH:mm')}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-[9px] font-bold text-neutral-400 pl-0.5">
                          +{dayEvents.length - 2} más
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal de Detalle Diario */}
        {selectedDayEvents && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn"
            onClick={() => setSelectedDayEvents(null)}
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 text-white bg-gradient-to-r from-[#E11B74] to-[#C5A059]">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-pink-100">Detalle de Turnos</p>
                  <h4 className="font-display text-base font-bold capitalize">
                    {format(selectedDayEvents.date, "EEEE d 'de' MMMM", { locale: es })}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedDayEvents(null)}
                  className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                {selectedDayEvents.events.length === 0 ? (
                  <p className="py-8 text-center text-xs text-neutral-500 font-medium">
                    No hay turnos disponibles configurados para este día.
                  </p>
                ) : (
                  selectedDayEvents.events.map((event, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="rounded-xl bg-emerald-600 text-white px-2.5 py-1 text-xs font-bold shadow-sm">
                          {format(parseISO(event.start), 'HH:mm')}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-neutral-800">Turno Libre</p>
                          <p className="text-[11px] text-neutral-500">Hasta las {event.end}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openBookingModal(event)}
                        className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#E11B74] to-[#C5A059] px-3 py-1.5 text-xs font-bold text-white shadow-md active:scale-95 transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Agendar</span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-pink-100 bg-pink-50/40 p-3 text-right">
                <button
                  onClick={() => setSelectedDayEvents(null)}
                  className="rounded-xl bg-white px-4 py-1.5 text-xs font-bold text-neutral-700 border border-neutral-200 shadow-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Agendamiento Manual */}
        {bookingSlot && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-fadeIn"
            onClick={closeBookingModal}
          >
            <div
              className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 text-white bg-gradient-to-r from-[#E11B74] to-[#C5A059]">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-pink-100">Nueva Cita Manual</p>
                  <h4 className="font-display text-base font-bold">
                    {format(parseISO(bookingSlot.start), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
                  </h4>
                </div>
                <button onClick={closeBookingModal} className="rounded-full bg-white/20 p-1.5 text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleBookingSubmit} className="p-5 space-y-4">
                {bookingError && (
                  <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}
                {bookingSuccess && (
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{bookingSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Tratamiento / Servicio</label>
                  <select
                    value={bookingForm.serviceId}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, serviceId: e.target.value }))}
                    className="w-full rounded-2xl border border-pink-200 bg-white p-2.5 text-xs sm:text-sm font-semibold outline-none focus:border-pink-500 shadow-sm"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.duration} min)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Nombre de la Clienta</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Camila Morales"
                    value={bookingForm.name}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-2xl border border-pink-200 bg-white p-2.5 text-xs sm:text-sm outline-none focus:border-pink-500 shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      placeholder="clienta@correo.com"
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-2xl border border-pink-200 bg-white p-2.5 text-xs sm:text-sm outline-none focus:border-pink-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="+56 9 1234 5678"
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-2xl border border-pink-200 bg-white p-2.5 text-xs sm:text-sm outline-none focus:border-pink-500 shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-pink-100">
                  <button
                    type="button"
                    onClick={closeBookingModal}
                    className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-neutral-600 border border-neutral-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBooking}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#E11B74] to-[#C5A059] px-4 py-2 text-xs font-bold text-white shadow-md active:scale-95 transition disabled:opacity-50"
                  >
                    {submittingBooking ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Creando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Confirmar Cita</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AdminShell>
    </>
  );
}
