import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isSameDay, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import HorarioEditor from '../../components/HorarioEditor';
import AdminShell from '../../components/AdminShell';
import AdminMetricIcon from '../../components/AdminMetricIcon';
import { hasAdminToken } from '../../lib/adminAuth';
import { ArrowLeftIcon, ArrowRightIcon } from '../../components/BrandMotifs';

const HORARIOS_ENDPOINT = '/api/horarios';

export default function AdminHorarios() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [horarios, setHorarios] = useState({});
  const [disabledDays, setDisabledDays] = useState([]);
  const [disabledDates, setDisabledDates] = useState([]);
  const [blackoutRanges, setBlackoutRanges] = useState([]);
  const [extraCuposConfig, setExtraCuposConfig] = useState({ enabled: true, start: '18:00', end: '20:00', daysToShow: 35, extraChargeClp: 5000 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarBlockMode, setCalendarBlockMode] = useState('day');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!(await hasAdminToken())) {
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
        setExtraCuposConfig(data?.extraCuposConfig || { enabled: true, start: '18:00', end: '20:00', daysToShow: 35, extraChargeClp: 5000 });
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
      setSuccessMsg('');

      const res = await fetch(HORARIOS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horarioAtencion: horarios, disabledDays, disabledDates, blackoutRanges, extraCuposConfig }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Error al guardar horarios');

      setSuccessMsg('Horarios guardados correctamente');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      setError(e.message);
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
      <div className="admin-workspace space-y-8">
        {successMsg ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 animate-pulse">
            {successMsg}
          </div>
        ) : null}
        <div className="admin-highlight-card rounded-[2rem] p-5 sm:p-7">
          <p className="admin-section-kicker">Operación del calendario</p>
          <h2 className="mt-3 text-xl font-bold" style={{ color: 'var(--ink-medium)' }}>Ajusta disponibilidad real del estudio</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: 'var(--ink-muted)' }}>
            Aquí defines la ventana de atención por día y también ocultas sábados o domingos específicos para que el flujo público nunca muestre espacios que no quieres abrir.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Bloqueos ordinales', value: disabledDays.length, detail: 'S?bados y domingos ordinales ocultos', icon: 'lock' },
              { label: 'Fechas puntuales', value: disabledDates.length, detail: 'D?as espec?ficos fuera de agenda', icon: 'calendar' },
              { label: 'Rangos activos', value: blackoutRanges.length, detail: 'Semanas o meses completos bloqueados', icon: 'pulse' },
            ].map((metric) => (
              <div key={metric.label} className="admin-metric-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-600">{metric.label}</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{metric.value}</p>
                  </div>
                  <AdminMetricIcon type={metric.icon} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-600">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-section-band rounded-[2rem] p-6 shadow-sm" style={{ border: '1px solid rgba(242, 200, 212, 0.6)', background: 'rgba(255,255,255,0.97)' }}>
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

          <div className="mt-5 mb-4 flex flex-wrap gap-2">
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

          <div className="overflow-hidden rounded-2xl border shadow-lg" style={{ borderColor: 'rgba(242,200,212,0.45)', background: 'rgba(255,255,255,0.98)' }}>
            <div
              className="grid grid-cols-7 border-b"
              style={{
                borderColor: 'rgba(242,200,212,0.4)',
                background: 'rgba(254,240,248,0.40)',
              }}
            >
              {calendarWeekDays.map((day) => (
                <div
                  key={day}
                  className="py-3 text-center text-sm font-semibold"
                  style={{ color: 'var(--ink-faint)' }}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr">
              {calendarDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const isCurrentMonthDay = isSameMonth(day, calendarMonth);
                const isToday = isSameDay(day, new Date());
                const isBlockedDay = disabledDates.includes(dateKey);
                const isInRange = isDateInsideRange(dateKey);
                const isSelectedDate = selectedCalendarDate === dateKey;
                const dayTone = isBlockedDay
                  ? { bg: 'rgba(225, 27, 116, 0.08)', border: 'rgba(225, 27, 116, 0.18)', text: 'var(--brand-dark)', label: 'Bloqueado' }
                  : isInRange
                    ? { bg: 'rgba(197, 160, 89, 0.08)', border: 'rgba(197, 160, 89, 0.18)', text: 'var(--gold-dark)', label: 'En rango' }
                    : { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.18)', text: '#065f46', label: 'Disponible' };

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => handleCalendarBlockToggle(day)}
                    title={isBlockedDay ? 'Día bloqueado manualmente' : isInRange ? 'Fecha incluida en un rango bloqueado' : 'Fecha disponible'}
                    aria-label={`${format(day, "d 'de' MMMM", { locale: es })}: ${isBlockedDay ? 'bloqueado' : isInRange ? 'dentro de rango bloqueado' : 'disponible'}`}
                    className="relative min-h-[110px] border-b border-r p-2 text-left transition hover:opacity-90 sm:min-h-[128px]"
                    style={{
                      borderColor: 'rgba(242,200,212,0.30)',
                      background: !isCurrentMonthDay ? 'rgba(249,249,249,0.60)' : dayTone.bg,
                      opacity: !isCurrentMonthDay ? 0.45 : 1,
                      outline: isSelectedDate ? `2px solid ${isBlockedDay || isInRange ? '#EA580C' : 'var(--brand)'}` : (isToday ? '2px solid var(--brand)' : 'none'),
                      outlineOffset: isSelectedDate || isToday ? '-2px' : '0',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium"
                        style={
                          isSelectedDate || isToday
                            ? {
                                background: 'linear-gradient(160deg, #F04A94 0%, #E11B74 100%)',
                                color: '#fff',
                              }
                            : { color: 'var(--ink-muted)' }
                        }
                      >
                        {format(day, 'd')}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                        style={{
                          background: 'rgba(255,255,255,0.72)',
                          color: dayTone.text,
                        }}
                      >
                        {dayTone.label}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-xs" style={{ color: dayTone.text }}>
                      <div className="truncate rounded px-1.5 py-1" style={{ background: 'rgba(255,255,255,0.45)' }}>
                        {calendarBlockMode === 'day' ? 'Click para alternar este dia' : calendarBlockMode === 'week' ? 'Click para alternar la semana' : 'Click para alternar el mes'}
                      </div>
                      {isSelectedDate ? (
                        <div className="truncate rounded px-1.5 py-1 font-semibold" style={{ background: 'rgba(255,255,255,0.68)' }}>
                          Fecha seleccionada
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
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
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-2"><span className="h-4 w-4 rounded-lg border" style={{ background: 'rgba(225, 27, 116, 0.08)', borderColor: 'rgba(225, 27, 116, 0.18)' }} /> Fuchsia: Bloqueado manualmente</div>
            <div className="flex items-center gap-2"><span className="h-4 w-4 rounded-lg border" style={{ background: 'rgba(197, 160, 89, 0.08)', borderColor: 'rgba(197, 160, 89, 0.18)' }} /> Dorado: Dentro de rango bloqueado</div>
            <div className="flex items-center gap-2"><span className="h-4 w-4 rounded-lg border" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.18)' }} /> Esmeralda: Disponible para citas</div>
          </div>
        </div>

        {/* Horario Editor Card */}
        <div
          className="admin-section-band rounded-[2rem] p-6 shadow-sm"
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

        <div
          className="admin-section-band rounded-[2rem] p-6 shadow-sm"
          style={{
            border: '1px solid rgba(242, 200, 212, 0.6)',
            background: 'rgba(255,255,255,0.97)',
          }}
        >
          <div className="mb-5">
            <h2 className="text-lg font-bold" style={{ color: 'var(--ink-medium)' }}>Configuración explícita de extra-cupos</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--ink-muted)' }}>
              Define la franja extendida que usará la página <strong>/extra-cupos</strong> sin depender de fallback implícito.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="rounded-2xl border border-[#f3d9e4] bg-white/85 p-4">
              <span className="mb-2 block text-sm font-semibold" style={{ color: 'var(--ink-medium)' }}>Habilitado</span>
              <input
                type="checkbox"
                checked={Boolean(extraCuposConfig?.enabled)}
                onChange={(event) => setExtraCuposConfig((prev) => ({ ...prev, enabled: event.target.checked }))}
                className="h-5 w-5 accent-[var(--brand)]"
              />
            </label>

            <label className="rounded-2xl border border-[#f3d9e4] bg-white/85 p-4">
              <span className="mb-2 block text-sm font-semibold" style={{ color: 'var(--ink-medium)' }}>Inicio extra</span>
              <input
                type="time"
                value={extraCuposConfig?.start || '18:00'}
                onChange={(event) => setExtraCuposConfig((prev) => ({ ...prev, start: event.target.value }))}
                className="w-full rounded-xl border border-[#f2c8d4] bg-white px-3 py-2"
              />
            </label>

            <label className="rounded-2xl border border-[#f3d9e4] bg-white/85 p-4">
              <span className="mb-2 block text-sm font-semibold" style={{ color: 'var(--ink-medium)' }}>Fin extra</span>
              <input
                type="time"
                value={extraCuposConfig?.end || '20:00'}
                onChange={(event) => setExtraCuposConfig((prev) => ({ ...prev, end: event.target.value }))}
                className="w-full rounded-xl border border-[#f2c8d4] bg-white px-3 py-2"
              />
            </label>

            <label className="rounded-2xl border border-[#f3d9e4] bg-white/85 p-4">
              <span className="mb-2 block text-sm font-semibold" style={{ color: 'var(--ink-medium)' }}>Horizonte (días)</span>
              <input
                type="number"
                min="1"
                max="90"
                value={extraCuposConfig?.daysToShow || 35}
                onChange={(event) => setExtraCuposConfig((prev) => ({ ...prev, daysToShow: Number(event.target.value) || 35 }))}
                className="w-full rounded-xl border border-[#f2c8d4] bg-white px-3 py-2"
              />
            </label>
          </div>
        </div>

        <div className="grid items-start gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        {/* Disabled Days Card */}
        <div
          className="admin-section-band rounded-[2rem] p-6 shadow-sm"
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

        <div className="admin-section-band rounded-[2rem] p-6 shadow-sm" style={{ border: '1px solid rgba(242, 200, 212, 0.6)', background: 'rgba(255,255,255,0.97)' }}>
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

        </div>

        {/* Save Button */}
        <div className="sticky bottom-4 z-10 flex justify-end rounded-[1.5rem] border border-slate-200 bg-white/88 p-3 shadow-[0_18px_46px_rgba(15,23,42,0.12)] backdrop-blur">
        <button
          onClick={handleSave}
          className="premium-button"
        >
          Guardar Cambios
        </button>
        </div>
      </div>
    </AdminShell>
  );
}
