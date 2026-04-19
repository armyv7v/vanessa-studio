import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isSameDay, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import HorarioEditor from '../../components/HorarioEditor';
import AdminShell from '../../components/AdminShell';
import { hasAdminToken } from '../../lib/adminAuth';
import { ArrowLeftIcon, ArrowRightIcon, CalendarIcon } from '../../components/BrandMotifs';

const HORARIOS_ENDPOINT = process.env.NEXT_PUBLIC_BACKEND_HORARIOS_URL || 'https://vanessastudioback.netlify.app/.netlify/functions/horarios';

export default function AdminHorarios() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [horarios, setHorarios] = useState({});
  const [disabledDays, setDisabledDays] = useState([]);
  const [disabledDates, setDisabledDates] = useState([]);
  const [blackoutRanges, setBlackoutRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarBlockMode, setCalendarBlockMode] = useState('day');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!hasAdminToken()) {
          router.push('/admin/login');
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);

        const res = await fetch(HORARIOS_ENDPOINT);
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error || 'No se pudo cargar la configuración de horarios.');
        }

        setHorarios(data?.horarioAtencion || {});
        setDisabledDays(data?.disabledDays || []);
        setDisabledDates(Array.isArray(data?.disabledDates) ? data.disabledDates : []);
        setBlackoutRanges(Array.isArray(data?.blackoutRanges) ? data.blackoutRanges : []);
      } catch (e) {
        setError(e.message || 'No se pudo cargar horarios.');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleSave = async () => {
    try {
      setError(null);

        const res = await fetch(HORARIOS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ horarioAtencion: horarios, disabledDays, disabledDates, blackoutRanges }),
        });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Error al guardar horarios');

      alert('Horarios guardados correctamente');
    } catch (e) {
      setError(e.message);
      alert(e.message);
    }
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
  if (error) {
    return (
      <AdminShell
        title="Administrar horarios"
        description="Configura horarios de atención y bloquea sábados o domingos específicos del mes para controlar la disponibilidad visible en la reserva."
      >
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
            Error: {error}
          </div>
        </div>
      </AdminShell>
    );
  }

  const ordinalOptions = [1, 2, 3, 4, 5];
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 1 }),
  });
  const calendarWeekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const toggleDisabledDay = (code) => {
    setDisabledDays((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code].sort()
    );
  };

  const removeDisabledDate = (date) => {
    setDisabledDates((prev) => prev.filter((item) => item !== date));
  };

  const toggleDisabledDate = (dateKey) => {
    setDisabledDates((prev) => prev.includes(dateKey) ? prev.filter((item) => item !== dateKey) : [...prev, dateKey].sort());
  };

  const toggleBlackoutRangeForDate = (mode, baseDate) => {
    const start = mode === 'month' ? startOfMonth(baseDate) : startOfWeek(baseDate, { weekStartsOn: 1 });
    const end = mode === 'month' ? endOfMonth(baseDate) : endOfWeek(baseDate, { weekStartsOn: 1 });

    const targetRange = {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
      label: mode === 'month' ? `Mes ${format(baseDate, 'MM/yyyy')}` : `Semana ${format(start, 'dd/MM')} - ${format(end, 'dd/MM')}`,
    };

    setBlackoutRanges((prev) => {
      const exists = prev.some((range) => range.start === targetRange.start && range.end === targetRange.end);
      if (exists) {
        return prev.filter((range) => !(range.start === targetRange.start && range.end === targetRange.end));
      }
      return [...prev, targetRange].sort((a, b) => a.start.localeCompare(b.start));
    });
  };

  const removeBlackoutRange = (rangeToDelete) => {
    setBlackoutRanges((prev) => prev.filter((range) => !(range.start === rangeToDelete.start && range.end === rangeToDelete.end)));
  };

  const clearExpiredBlackouts = () => {
    setDisabledDates((prev) => prev.filter((date) => date >= todayKey));
    setBlackoutRanges((prev) => prev.filter((range) => range.end >= todayKey));
  };

  const isDateInsideRange = (dateKey) => blackoutRanges.some((range) => dateKey >= range.start && dateKey <= range.end);

  const handleCalendarBlockToggle = (day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    setSelectedCalendarDate(dateKey);
    if (calendarBlockMode === 'day') {
      toggleDisabledDate(dateKey);
      return;
    }

    toggleBlackoutRangeForDate(calendarBlockMode, day);
  };

  const applyQuickBlockAction = (mode) => {
    if (!selectedCalendarDate) return;

    const selectedDate = new Date(`${selectedCalendarDate}T12:00:00`);
    if (mode === 'day') {
      toggleDisabledDate(selectedCalendarDate);
      return;
    }

    toggleBlackoutRangeForDate(mode, selectedDate);
  };

  return (
    <AdminShell
      title="Administrar horarios"
      description="Configura horarios de atención y bloquea sábados o domingos específicos del mes para controlar la disponibilidad visible en la reserva."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="admin-highlight-card rounded-3xl p-5 sm:p-6">
          <p className="admin-section-kicker">Operación del calendario</p>
          <h2 className="mt-3 text-xl font-bold" style={{ color: 'var(--ink-medium)' }}>Ajusta disponibilidad real del estudio</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: 'var(--ink-muted)' }}>
            Aquí defines la ventana de atención por día y también ocultas sábados o domingos específicos para que el flujo público nunca muestre espacios que no quieres abrir.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#f3d9e4] bg-white/80 p-4 shadow-[0_10px_24px_rgba(225,27,116,0.06)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--brand-light)' }}>Bloqueos ordinales</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--ink-medium)' }}>{disabledDays.length}</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--ink-faint)' }}>Sábados y domingos ordinales ocultos</p>
            </div>
            <div className="rounded-2xl border border-[#f3d9e4] bg-white/80 p-4 shadow-[0_10px_24px_rgba(225,27,116,0.06)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--brand-light)' }}>Fechas puntuales</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--ink-medium)' }}>{disabledDates.length}</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--ink-faint)' }}>Días específicos fuera de agenda</p>
            </div>
            <div className="rounded-2xl border border-[#f3d9e4] bg-white/80 p-4 shadow-[0_10px_24px_rgba(225,27,116,0.06)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--brand-light)' }}>Rangos activos</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--ink-medium)' }}>{blackoutRanges.length}</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--ink-faint)' }}>Semanas o meses completos bloqueados</p>
            </div>
          </div>
        </div>

        <div className="admin-surface-card rounded-3xl p-6 shadow-sm" style={{ border: '1px solid rgba(242, 200, 212, 0.6)', background: 'rgba(255,255,255,0.97)' }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--ink-medium)' }}>Calendario visual de bloqueos</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--ink-muted)' }}>
                Haz clic sobre un día para bloquearlo o desbloquearlo rápidamente. Los rangos semanales y mensuales aparecen resaltados.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setCalendarMonth((prev) => subMonths(prev, 1))} className="rounded-full p-2" style={{ background: 'var(--bg-blush)', color: 'var(--brand)' }}>
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="rounded-full border px-4 py-2 text-sm font-semibold capitalize" style={{ borderColor: 'var(--gold-lighter)', color: 'var(--ink-medium)', background: 'rgba(255,255,255,0.92)' }}>
                {format(calendarMonth, 'MMMM yyyy')}
              </div>
              <button type="button" onClick={() => setCalendarMonth((prev) => addMonths(prev, 1))} className="rounded-full p-2" style={{ background: 'var(--bg-blush)', color: 'var(--brand)' }}>
                <ArrowRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-5">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                {[
                  { id: 'day', label: 'Bloqueo por día' },
                  { id: 'week', label: 'Bloqueo por semana' },
                  { id: 'month', label: 'Bloqueo por mes' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setCalendarBlockMode(mode.id)}
                    className="rounded-full px-4 py-2 text-sm font-semibold transition"
                    style={calendarBlockMode === mode.id
                      ? { background: 'linear-gradient(160deg, #F04A94 0%, #E11B74 55%, #B8105D 100%)', color: '#fff', boxShadow: '0 8px 18px rgba(225,27,116,0.20)' }
                      : { background: 'var(--bg-blush)', color: 'var(--ink-muted)', border: '1px solid var(--gold-lighter)' }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.12em] sm:gap-2 sm:text-xs" style={{ color: 'var(--ink-faint)' }}>
                {calendarWeekDays.map((day) => <div key={day}>{day}</div>)}
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarDays.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const isCurrentMonthDay = isSameMonth(day, calendarMonth);
                  const isToday = isSameDay(day, new Date());
                  const isBlockedDay = disabledDates.includes(dateKey);
                  const isInRange = isDateInsideRange(dateKey);
                  const isSelectedDate = selectedCalendarDate === dateKey;

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => handleCalendarBlockToggle(day)}
                      title={isBlockedDay ? 'Día bloqueado manualmente' : isInRange ? 'Fecha incluida en un rango bloqueado' : 'Fecha disponible'}
                      aria-label={`${format(day, "d 'de' MMMM", { locale: es })}: ${isBlockedDay ? 'bloqueado' : isInRange ? 'dentro de rango bloqueado' : 'disponible'}`}
                      className="admin-calendar-day h-[68px] rounded-2xl border p-2 text-left transition sm:h-[78px] sm:p-2.5 md:h-[88px]"
                      style={isBlockedDay
                        ? { background: 'rgba(251, 146, 60, 0.20)', borderColor: isSelectedDate ? '#EA580C' : '#FB923C', color: '#9A3412', boxShadow: isSelectedDate ? '0 0 0 2px rgba(234,88,12,0.18), 0 12px 24px rgba(251,146,60,0.16)' : '0 12px 24px rgba(251,146,60,0.16)' }
                        : isInRange
                          ? { background: 'rgba(254, 215, 170, 0.38)', borderColor: isSelectedDate ? '#EA580C' : '#FDBA74', color: '#9A3412', boxShadow: isSelectedDate ? '0 0 0 2px rgba(234,88,12,0.14)' : 'none' }
                          : { background: 'rgba(134, 239, 172, 0.16)', borderColor: isSelectedDate ? '#16A34A' : '#86EFAC', color: '#166534', opacity: isCurrentMonthDay ? 1 : 0.42, boxShadow: isSelectedDate ? '0 0 0 2px rgba(34,197,94,0.12)' : 'none' }}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold sm:text-[15px]">{format(day, 'd')}</span>
                          {isToday ? <CalendarIcon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" /> : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5" style={{ background: isBlockedDay ? '#F97316' : isInRange ? '#FB923C' : '#22C55E' }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-2xl border border-[#f3d9e4] bg-[#fff8fc] p-4 text-sm leading-6" style={{ color: 'var(--ink-muted)' }}>
                El modo activo ahora es <strong style={{ color: 'var(--brand-dark)' }}>{calendarBlockMode === 'day' ? 'bloqueo por día' : calendarBlockMode === 'week' ? 'bloqueo por semana' : 'bloqueo por mes'}</strong>. Haz clic sobre cualquier fecha del calendario para aplicar o quitar ese tipo de bloqueo.
              </div>
              <div className="rounded-2xl border border-[#f3d9e4] bg-white/90 p-4 text-sm" style={{ color: 'var(--ink-muted)' }}>
                <p className="font-semibold" style={{ color: 'var(--ink-medium)' }}>
                  Fecha seleccionada: {selectedCalendarDate || 'ninguna'}
                </p>
                <div className="mt-3 grid gap-2">
                  <button type="button" onClick={() => applyQuickBlockAction('day')} disabled={!selectedCalendarDate} className="premium-button-secondary disabled:opacity-50 disabled:cursor-not-allowed">
                    Alternar día exacto
                  </button>
                  <button type="button" onClick={() => applyQuickBlockAction('week')} disabled={!selectedCalendarDate} className="premium-button-secondary disabled:opacity-50 disabled:cursor-not-allowed">
                    Alternar semana completa
                  </button>
                  <button type="button" onClick={() => applyQuickBlockAction('month')} disabled={!selectedCalendarDate} className="premium-button-secondary disabled:opacity-50 disabled:cursor-not-allowed">
                    Alternar mes completo
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2"><span className="h-4 w-4 rounded-lg border" style={{ background: 'rgba(251, 146, 60, 0.20)', borderColor: '#FB923C' }} /> Naranja: bloqueado</div>
              <div className="flex items-center gap-2"><span className="h-4 w-4 rounded-lg border" style={{ background: 'rgba(254, 215, 170, 0.38)', borderColor: '#FDBA74' }} /> Ámbar: dentro de rango bloqueado</div>
              <div className="flex items-center gap-2"><span className="h-4 w-4 rounded-lg border" style={{ background: 'rgba(134, 239, 172, 0.16)', borderColor: '#86EFAC' }} /> Verde: disponible</div>
            </div>
          </div>
        </div>

        {/* Horario Editor Card */}
        <div
          className="admin-surface-card rounded-3xl p-6 shadow-sm"
          style={{
            border: '1px solid rgba(242, 200, 212, 0.6)',
            background: 'rgba(255,255,255,0.97)',
          }}
        >
          {Object.entries(horarios).map(([dia, rango]) => (
            <HorarioEditor
              key={dia}
              dia={dia}
              rango={rango}
              horarios={horarios}
              setHorarios={setHorarios}
            />
          ))}
        </div>

        {/* Disabled Days Card */}
        <div
          className="admin-surface-card rounded-3xl p-6 shadow-sm"
          style={{
            border: '1px solid var(--gold-lighter)',
            background: 'linear-gradient(135deg, var(--gold-lightest), rgba(255,255,255,0.90))',
          }}
        >
          <h2
            className="mb-2 text-lg font-bold"
            style={{ color: 'var(--ink-medium)' }}
          >
            Días deshabilitados del calendario
          </h2>
          <p className="mb-4 text-sm" style={{ color: 'var(--ink-muted)' }}>
            Marca qué sábados o domingos del mes no deben aparecer disponibles en el flujo de reserva.
          </p>

          <div className="space-y-4">
            {/* Sábados */}
            <div>
              <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--ink-muted)' }}>
                Sábados
              </p>
              <div className="flex flex-wrap gap-2">
                {ordinalOptions.map((ordinal) => {
                  const code = `SAT${ordinal}`;
                  const active = disabledDays.includes(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggleDisabledDay(code)}
                      className="rounded-full border px-3 py-2 text-sm font-medium transition hover:-translate-y-px"
                      style={
                        active
                          ? {
                              background: 'linear-gradient(160deg, #F04A94 0%, #E11B74 55%, #B8105D 100%)',
                              borderColor: 'var(--brand)',
                              color: '#fff',
                              boxShadow: '0 8px 18px rgba(225,27,116,0.22)',
                            }
                          : {
                              background: 'rgba(255,255,255,0.96)',
                              borderColor: 'var(--gold-lighter)',
                              color: 'var(--ink-muted)',
                            }
                      }
                    >
                      {ordinal}° sábado
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Domingos */}
            <div>
              <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--ink-muted)' }}>
                Domingos
              </p>
              <div className="flex flex-wrap gap-2">
                {ordinalOptions.map((ordinal) => {
                  const code = `SUN${ordinal}`;
                  const active = disabledDays.includes(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggleDisabledDay(code)}
                      className="rounded-full border px-3 py-2 text-sm font-medium transition hover:-translate-y-px"
                      style={
                        active
                          ? {
                              background: 'linear-gradient(160deg, #F04A94 0%, #E11B74 55%, #B8105D 100%)',
                              borderColor: 'var(--brand)',
                              color: '#fff',
                              boxShadow: '0 8px 18px rgba(225,27,116,0.22)',
                            }
                          : {
                              background: 'rgba(255,255,255,0.96)',
                              borderColor: 'var(--gold-lighter)',
                              color: 'var(--ink-muted)',
                            }
                      }
                    >
                      {ordinal}° domingo
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="admin-surface-card rounded-3xl p-6 shadow-sm" style={{ border: '1px solid rgba(242, 200, 212, 0.6)', background: 'rgba(255,255,255,0.97)' }}>
          <h2 className="mb-2 text-lg font-bold" style={{ color: 'var(--ink-medium)' }}>Resumen de bloqueos activos</h2>
          <p className="mb-5 text-sm" style={{ color: 'var(--ink-muted)' }}>
            Este bloque resume lo que está activo ahora mismo para que puedas revisarlo o limpiar bloqueos viejos sin salir del flujo principal.
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#f3d9e4] bg-white/80 p-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--brand-light)' }}>Fechas exactas</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {disabledDates.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>No hay fechas puntuales bloqueadas.</p>
                ) : disabledDates.map((date) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => removeDisabledDate(date)}
                    className="rounded-full border px-3 py-2 text-sm font-medium transition hover:-translate-y-px"
                    style={{ background: 'rgba(255,255,255,0.96)', borderColor: 'var(--gold-lighter)', color: 'var(--ink-muted)' }}
                  >
                    {date} · quitar
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#f3d9e4] bg-white/80 p-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--brand-light)' }}>Rangos activos</h3>
              <div className="mt-4 space-y-2">
                {blackoutRanges.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>No hay rangos bloqueados.</p>
                ) : blackoutRanges.map((range) => (
                  <div key={`${range.start}-${range.end}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[#f3d9e4] bg-[#fff8fc] px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--ink-medium)' }}>{range.label || `${range.start} → ${range.end}`}</p>
                      <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>{range.start} hasta {range.end}</p>
                    </div>
                    <button type="button" onClick={() => removeBlackoutRange(range)} className="rounded-full border px-3 py-2 text-xs font-semibold" style={{ borderColor: 'var(--gold-lighter)', color: 'var(--brand)' }}>
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#f3d9e4] bg-[#fff8fc] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ink-medium)' }}>Mantenimiento rápido de bloqueos</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--ink-faint)' }}>Elimina fechas pasadas y rangos cuyo fin ya venció para mantener la agenda limpia.</p>
            </div>
            <button type="button" onClick={clearExpiredBlackouts} className="premium-button-secondary">
              Limpiar vencidos
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="premium-button"
        >
          Guardar Cambios
        </button>
      </div>
    </AdminShell>
  );
}
