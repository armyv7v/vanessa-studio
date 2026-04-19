import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, addMonths, subMonths, addWeeks, subWeeks,
  isSameMonth, isSameDay, parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { getAvailableSlotsRange } from '../../lib/api';
import AdminShell from '../../components/AdminShell';
import { hasAdminToken } from '../../lib/adminAuth';

// ── Scheduling constants ────────────────────────────────────
const SERVICE_DURATION_MIN = 120;  // duración real del turno (2h)
const STEP_MINUTES = 30;           // granularidad de candidatos
const OPEN_HOUR = 9;
const CLOSE_HOUR = 22;
// Capacidad real: cuántas citas SIN solapamiento caben en la jornada
const REAL_MAX_CAPACITY = Math.floor(((CLOSE_HOUR - OPEN_HOUR) * 60) / SERVICE_DURATION_MIN); // = 6

// ── Brand palette availability map ────────────────────────────
// Keeps semantic meaning (green=good, red=bad) but tinted
// to match the brand blush/warm palette
const AVAILABILITY_COLORS = {
  high:   { bg: 'rgba(200, 240, 215, 0.80)', border: '#86EFAC' }, // green tint — high availability
  medium: { bg: 'rgba(251, 244, 227, 0.90)', border: '#C5A059' }, // gold tint — medium
  low:    { bg: 'rgba(255, 220, 200, 0.80)', border: '#FDBA74' }, // warm orange — low
  veryLow:{ bg: 'rgba(254, 202, 202, 0.70)', border: '#FCA5A5' }, // rose-red — very low
};

export default function AdminTurnos() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);

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

  // Data fetch
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        let start, end;
        if (viewMode === 'month') {
          start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
          end   = endOfWeek(endOfMonth(currentDate),   { weekStartsOn: 1 });
        } else {
          start = startOfWeek(currentDate, { weekStartsOn: 1 });
          end   = endOfWeek(currentDate,   { weekStartsOn: 1 });
        }
        const slots = await getAvailableSlotsRange(start, end);
        setAvailableSlots(slots);
      } catch (error) {
        console.error('Error fetching slots:', error);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [isAuthenticated, currentDate, viewMode]);

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

  // Calcula cuántas citas REALES (sin solapamiento) caben entre los
  // candidatos disponibles de un día. Recorre los slots ordenados y
  // escoge el siguiente cuyo start >= el end del último seleccionado.
  const getRealCapacity = (daySlots) => {
    if (!daySlots.length) return 0;
    let count = 0;
    let lastEnd = null;
    for (const slot of daySlots) {
      const sStart = parseISO(slot.start);
      if (!lastEnd || sStart >= lastEnd) {
        // end viene como 'HH:mm'; reconstituirlo con la fecha del slot
        const dayStr = format(sStart, 'yyyy-MM-dd');
        const endParts = slot.end.split(':');
        const endDate = new Date(sStart);
        endDate.setHours(parseInt(endParts[0], 10), parseInt(endParts[1], 10), 0, 0);
        lastEnd = endDate;
        count++;
      }
    }
    return count;
  };

  // Availability style based on REAL capacity (non-overlapping fits)
  const getAvailabilityStyle = (day) => {
    const daySlots = getEventsForDay(day);
    const realFits = getRealCapacity(daySlots);
    const pct = (realFits / REAL_MAX_CAPACITY) * 100;

    if (pct > 75) return AVAILABILITY_COLORS.high;
    if (pct > 50) return AVAILABILITY_COLORS.medium;
    if (pct > 25) return AVAILABILITY_COLORS.low;
    return AVAILABILITY_COLORS.veryLow;
  };

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
            Capacidad del día (citas de {SERVICE_DURATION_MIN} min):
          </h3>
          <div className="flex flex-wrap gap-4 text-xs">
            {[
              { label: `Alta (${Math.ceil(REAL_MAX_CAPACITY * 0.75)}-${REAL_MAX_CAPACITY} citas)`, style: AVAILABILITY_COLORS.high },
              { label: `Media (${Math.ceil(REAL_MAX_CAPACITY * 0.50)}-${Math.ceil(REAL_MAX_CAPACITY * 0.75) - 1} citas)`, style: AVAILABILITY_COLORS.medium },
              { label: `Baja (${Math.ceil(REAL_MAX_CAPACITY * 0.25)}-${Math.ceil(REAL_MAX_CAPACITY * 0.50) - 1} citas)`, style: AVAILABILITY_COLORS.low },
              { label: `Muy baja (0-${Math.ceil(REAL_MAX_CAPACITY * 0.25) - 1} citas)`, style: AVAILABILITY_COLORS.veryLow },
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
                    {dayEvents.length > 0 && (() => {
                      const realFits = getRealCapacity(dayEvents);
                      return (
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-bold"
                          style={{
                            background: 'var(--brand-lightest)',
                            color: 'var(--brand)',
                          }}
                          title={`${realFits} citas posibles (de ${REAL_MAX_CAPACITY} máx)`}
                        >
                          {realFits}/{REAL_MAX_CAPACITY}
                        </span>
                      );
                    })()}
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
                        {format(parseISO(event.start), 'HH:mm')}→{event.end}
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
                <>
                  {/* Capacidad real del día */}
                  <div
                    className="mb-4 flex items-center gap-2 rounded-lg p-3"
                    style={{
                      background: 'rgba(254,240,248,0.60)',
                      border: '1px solid rgba(242,200,212,0.50)',
                    }}
                  >
                    <span className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                      Capacidad real:
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{ background: 'var(--brand-lightest)', color: 'var(--brand)' }}
                    >
                      {getRealCapacity(selectedDayEvents.events)}/{REAL_MAX_CAPACITY} citas
                    </span>
                    <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                      ({SERVICE_DURATION_MIN} min c/u)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedDayEvents.events.map((event, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl border p-3 w-full"
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
                              {format(parseISO(event.start), 'HH:mm')} → {event.end}
                            </p>
                          </div>
                          <span
                            className="ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                            style={{
                              background: 'rgba(200,240,215,0.60)',
                              color: '#166534',
                            }}
                          >
                            {SERVICE_DURATION_MIN} min
                          </span>
                        </div>
                        
                        <button 
                          onClick={() => {
                            const dateStr = format(selectedDayEvents.date, 'yyyy-MM-dd');
                            const timeStr = format(parseISO(event.start), 'HH:mm');
                            router.push(`/admin/agendar?date=${dateStr}&time=${timeStr}`);
                          }}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:scale-105 active:scale-95"
                          style={{ background: 'linear-gradient(160deg, #F04A94 0%, #E11B74 100%)' }}
                        >
                          Crear cita
                        </button>
                      </div>
                    ))}
                  </div>
                </>
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
    </AdminShell>
  );
}
