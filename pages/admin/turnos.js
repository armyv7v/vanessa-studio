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
import { bookAppointment, getAvailableSlots, getAvailableSlotsRange } from '../../lib/api';
import AdminShell from '../../components/AdminShell';
import { hasAdminToken } from '../../lib/adminAuth';
import { services } from '../../lib/services';
import horariosConfig from '../../config/horarios.json';

// ── Brand palette availability map ────────────────────────────
// Keeps semantic meaning (green=good, red=bad) but tinted
// to match the brand blush/warm palette
const AVAILABILITY_COLORS = {
  high:   { bg: 'rgba(200, 240, 215, 0.80)', border: '#86EFAC' }, // green tint — high availability
  medium: { bg: 'rgba(251, 244, 227, 0.90)', border: '#C5A059' }, // gold tint — medium
  low:    { bg: 'rgba(255, 220, 200, 0.80)', border: '#FDBA74' }, // warm orange — low
  veryLow:{ bg: 'rgba(254, 202, 202, 0.70)', border: '#FCA5A5' }, // rose-red — very low
};

const HORARIOS_ENDPOINT = process.env.NEXT_PUBLIC_BACKEND_HORARIOS_URL || 'https://vanessastudioback.netlify.app/.netlify/functions/horarios';

export default function AdminTurnos() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [horarioAtencion, setHorarioAtencion] = useState(horariosConfig.horarioAtencion || {});
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

  // Auth
  useEffect(() => {
    const checkAuth = () => {
      if (!hasAdminToken()) {
        router.push('/admin/login');
        setLoading(false);
        return;
      }
      setIsAuthenticated(hasAdminToken());
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
        }
      } catch {
        // fallback local config only
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

  // Uses brand-aware color map instead of raw Tailwind colors
  const getAvailabilityStyle = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const totalPossibleSlots = 26;
    const availableCount = availableSlots.filter(
      (slot) => format(parseISO(slot.start), 'yyyy-MM-dd') === dayStr
    ).length;
    const pct = (availableCount / totalPossibleSlots) * 100;

    if (pct > 75) return AVAILABILITY_COLORS.high;
    if (pct > 50) return AVAILABILITY_COLORS.medium;
    if (pct > 25) return AVAILABILITY_COLORS.low;
    return AVAILABILITY_COLORS.veryLow;
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

    const slots = await getAvailableSlotsRange(start, end);
    setAvailableSlots(slots);
  }, [currentDate, viewMode]);

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
      throw new Error('Ese horario ya no está disponible para la duración del servicio seleccionado.');
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

      setBookingSuccess('Cita creada correctamente desde el panel admin.');
      setSelectedDayEvents(null);
      await refreshSlots();
      setBookingForm((previous) => ({ ...previous, name: '', email: '', phone: '' }));
    } catch (error) {
      setBookingError(error.message || 'No se pudo crear la cita.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Data fetch
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

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, #FFFBFD 0%, #FFF0F6 50%, #FDF6EF 100%)',
        }}
      >
        <div
          className="h-12 w-12 animate-spin rounded-full border-2 border-b-transparent"
          style={{ borderColor: 'var(--brand) transparent var(--brand) var(--brand)' }}
        />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const days = viewMode === 'month'
    ? eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
        end:   endOfWeek(endOfMonth(currentDate),     { weekStartsOn: 1 }),
      })
    : eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end:   endOfWeek(currentDate,   { weekStartsOn: 1 }),
      });

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <AdminShell
      title="Calendario de turnos"
      description="Visualiza disponibilidad por semana o mes, detecta demanda y revisa qué días tienen más o menos espacios libres."
    >
      <Head>
        <title>Admin Turnos | Vanessa Studio</title>
      </Head>

      <div className="mx-auto max-w-6xl">
        {/* ── Top bar ─────────────────────────────────────── */}
        <div className="mb-4 flex flex-col items-center justify-between gap-4 md:flex-row">
          <h1
            className="text-3xl font-bold"
            style={{ color: 'var(--ink-medium)' }}
          >
            📅 Calendario de Turnos
          </h1>

          {/* View Mode Toggle */}
          <div
            className="flex items-center rounded-xl p-1 shadow-sm"
            style={{
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid var(--gold-lighter)',
            }}
          >
            {['month', 'week'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="rounded-lg px-4 py-2 text-sm font-medium transition"
                style={
                  viewMode === mode
                    ? {
                        background: 'linear-gradient(160deg, #F04A94 0%, #E11B74 55%, #B8105D 100%)',
                        color: '#fff',
                        boxShadow: '0 6px 14px rgba(225,27,116,0.20)',
                      }
                    : { color: 'var(--ink-muted)' }
                }
              >
                {mode === 'month' ? 'Mes' : 'Semana'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Availability Legend ──────────────────────────── */}
        <div
          className="mb-4 rounded-xl p-4 shadow-sm"
          style={{
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid var(--gold-lighter)',
          }}
        >
          <h3
            className="mb-2 text-sm font-semibold"
            style={{ color: 'var(--ink-muted)' }}
          >
            Disponibilidad:
          </h3>
          <div className="flex flex-wrap gap-4 text-xs">
            {[
              { label: 'Alta (>75%)',    style: AVAILABILITY_COLORS.high    },
              { label: 'Media (50-75%)', style: AVAILABILITY_COLORS.medium  },
              { label: 'Baja (25-50%)',  style: AVAILABILITY_COLORS.low     },
              { label: 'Muy baja (<25%)',style: AVAILABILITY_COLORS.veryLow },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div
                  className="h-6 w-6 rounded"
                  style={{
                    background: item.style.bg,
                    border: `1px solid ${item.style.border}`,
                  }}
                />
                <span style={{ color: 'var(--ink-muted)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Calendar ─────────────────────────────────────── */}
        <div
          className="overflow-hidden rounded-2xl shadow-lg"
          style={{ background: 'rgba(255,255,255,0.98)' }}
        >
          {/* Calendar Header */}
          <div
            className="flex items-center justify-between border-b p-4"
            style={{
              borderColor: 'rgba(242,200,212,0.5)',
              background: 'rgba(254,240,248,0.60)',
            }}
          >
            <button
              onClick={prevPeriod}
              className="rounded-full p-2 transition hover:scale-110"
              style={{ color: 'var(--brand)', background: 'var(--bg-blush)' }}
            >
              ←
            </button>
            <h2
              className="text-xl font-semibold capitalize"
              style={{ color: 'var(--ink-medium)' }}
            >
              {format(
                currentDate,
                viewMode === 'month' ? 'MMMM yyyy' : "'Semana del' d 'de' MMMM",
                { locale: es }
              )}
            </h2>
            <button
              onClick={nextPeriod}
              className="rounded-full p-2 transition hover:scale-110"
              style={{ color: 'var(--brand)', background: 'var(--bg-blush)' }}
            >
              →
            </button>
          </div>

          {/* Week day labels */}
          <div
            className="grid grid-cols-7 border-b"
            style={{
              borderColor: 'rgba(242,200,212,0.4)',
              background: 'rgba(254,240,248,0.40)',
            }}
          >
            {weekDays.map((day) => (
              <div
                key={day}
                className="py-3 text-center text-sm font-semibold"
                style={{ color: 'var(--ink-faint)' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div
            className={`grid grid-cols-7 ${viewMode === 'month' ? 'auto-rows-fr' : 'h-[600px]'}`}
          >
            {days.map((day) => {
              const isToday       = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);
              const dayEvents     = getEventsForDay(day);
              const availStyle    = getAvailabilityStyle(day);

              return (
                <div
                  key={day.toString()}
                  onClick={() => setSelectedDayEvents({ date: day, events: dayEvents })}
                  className="relative min-h-[100px] cursor-pointer border-b border-r p-2 transition hover:opacity-80"
                  style={{
                    borderColor: 'rgba(242,200,212,0.30)',
                    background: !isCurrentMonth && viewMode === 'month'
                      ? 'rgba(249,249,249,0.60)'
                      : availStyle.bg,
                    opacity: !isCurrentMonth && viewMode === 'month' ? 0.45 : 1,
                    outline: isToday ? '2px solid var(--brand)' : 'none',
                    outlineOffset: isToday ? '-2px' : '0',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium"
                      style={
                        isToday
                          ? {
                              background: 'linear-gradient(160deg, #F04A94 0%, #E11B74 100%)',
                              color: '#fff',
                            }
                          : { color: 'var(--ink-muted)' }
                      }
                    >
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-bold"
                        style={{
                          background: 'var(--brand-lightest)',
                          color: 'var(--brand)',
                        }}
                      >
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 space-y-1">
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <div
                        key={i}
                        className="truncate rounded px-1 py-0.5 text-xs"
                        style={{
                          background: 'rgba(200,240,215,0.80)',
                          color: '#166534',
                          borderLeft: '2px solid #86EFAC',
                        }}
                      >
                        {format(parseISO(event.start), 'HH:mm')} — Libre
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div
                        className="pl-1 text-xs"
                        style={{ color: 'var(--ink-faint)' }}
                      >
                        + {dayEvents.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Day Detail Modal ──────────────────────────────────── */}
      {selectedDayEvents ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(28, 10, 20, 0.50)' }}
          onClick={() => setSelectedDayEvents(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
            style={{ background: '#fff' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between p-4 text-white"
              style={{
                background: 'linear-gradient(160deg, #F04A94 0%, #E11B74 55%, #B8105D 100%)',
              }}
            >
              <h3 className="text-lg font-bold capitalize">
                {format(selectedDayEvents.date, "EEEE d 'de' MMMM", { locale: es })}
              </h3>
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="rounded-full p-1 text-white transition"
                style={{ background: 'rgba(255,255,255,0.18)' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {selectedDayEvents.events.length === 0 ? (
                <p
                  className="py-8 text-center text-sm"
                  style={{ color: 'var(--ink-faint)' }}
                >
                  No hay turnos disponibles para este día.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.events.map((event, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-xl border p-3"
                      style={{
                        background: 'rgba(200,240,215,0.50)',
                        borderColor: '#86EFAC',
                      }}
                    >
                      <div className="flex items-center">
                        <div
                          className="mr-3 rounded px-2 py-1 text-sm font-bold"
                          style={{
                            background: 'rgba(200,240,215,0.80)',
                            color: '#166534',
                          }}
                        >
                          {format(parseISO(event.start), 'HH:mm')}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: 'var(--ink-medium)' }}>
                            Turno Disponible
                          </p>
                          <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                            {format(parseISO(event.start), 'HH:mm')} — {event.end}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openBookingModal(event)}
                        className="rounded-xl px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                        style={{ background: 'linear-gradient(160deg, #F04A94 0%, #E11B74 55%, #B8105D 100%)' }}
                      >
                        Crear cita
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className="p-4 text-right"
              style={{
                background: 'var(--bg-blush)',
                borderTop: '1px solid rgba(242,200,212,0.50)',
              }}
            >
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="premium-button-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bookingSlot ? (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/55 p-3 sm:p-4" onClick={closeBookingModal}>
          <div className="flex min-h-full items-start justify-center py-3 sm:items-center sm:py-6">
            <div
              className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-3rem)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 p-4 sm:p-5 text-white" style={{ background: 'linear-gradient(160deg, #F04A94 0%, #E11B74 55%, #B8105D 100%)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-pink-100">Reserva manual</p>
                    <h3 className="mt-1 text-lg font-bold sm:text-xl">Crear cita desde turno libre</h3>
                    <p className="mt-2 text-sm text-pink-50">
                      {format(parseISO(bookingSlot.start), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                  <button type="button" onClick={closeBookingModal} className="rounded-full p-2 transition hover:bg-white/10" aria-label="Cerrar modal">
                    ✕
                  </button>
                </div>
              </div>

              <form onSubmit={handleBookingSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                  {bookingError ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                      {bookingError}
                    </div>
                  ) : null}

                  {bookingSuccess ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                      {bookingSuccess}
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Servicio</label>
                    <select
                      value={bookingForm.serviceId}
                      onChange={(e) => setBookingForm((previous) => ({ ...previous, serviceId: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                    >
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} ({service.duration} min)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Nombre</label>
                    <input
                      type="text"
                      value={bookingForm.name}
                      onChange={(e) => setBookingForm((previous) => ({ ...previous, name: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                      placeholder="Nombre de la clienta"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                    <input
                      type="email"
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm((previous) => ({ ...previous, email: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                      placeholder="correo@cliente.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Teléfono</label>
                    <input
                      type="tel"
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm((previous) => ({ ...previous, phone: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="rounded-xl border border-pink-100 bg-pink-50 px-4 py-3 text-sm text-pink-900">
                    La cita se validará nuevamente contra disponibilidad real antes de enviarse al backend.
                  </div>
                </div>

                <div className="shrink-0 border-t border-slate-100 bg-white/95 p-4 backdrop-blur sm:p-5">
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeBookingModal}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingBooking}
                      className="w-full rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      style={{ background: 'linear-gradient(160deg, #F04A94 0%, #E11B74 55%, #B8105D 100%)' }}
                    >
                      {submittingBooking ? 'Creando cita...' : 'Crear cita'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
