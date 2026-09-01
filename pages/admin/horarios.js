import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isSameDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CalendarDays,
  Clock,
  Sparkles,
  Lock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Save,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import HorarioEditor from '../../components/HorarioEditor';
import AdminShell from '../../components/AdminShell';
import { hasAdminToken } from '../../lib/adminAuth';

const HORARIOS_ENDPOINT = '/api/horarios';

export default function AdminHorarios() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [horarios, setHorarios] = useState({});
  const [disabledDays, setDisabledDays] = useState([]);
  const [disabledDates, setDisabledDates] = useState([]);
  const [blackoutRanges, setBlackoutRanges] = useState([]);
  const [extraCuposConfig, setExtraCuposConfig] = useState({
    enabled: true,
    start: '18:00',
    end: '20:00',
    daysToShow: 35,
    extraChargeClp: 5000,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        setExtraCuposConfig(
          data?.extraCuposConfig || {
            enabled: true,
            start: '18:00',
            end: '20:00',
            daysToShow: 35,
            extraChargeClp: 5000,
          }
        );
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
      setSaving(true);
      setError(null);
      setSuccessMsg('');

      const res = await fetch(HORARIOS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          horarioAtencion: horarios,
          disabledDays,
          disabledDates,
          blackoutRanges,
          extraCuposConfig,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Error al guardar horarios');

      setSuccessMsg('¡Horarios y reglas de agenda guardados con éxito!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      setError(e.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-50/40">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#E11B74] border-t-transparent" />
          <p className="text-xs font-semibold text-neutral-500">Cargando configuración de horarios...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

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
    setDisabledDates((prev) =>
      prev.includes(dateKey) ? prev.filter((item) => item !== dateKey) : [...prev, dateKey].sort()
    );
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
    setBlackoutRanges((prev) =>
      prev.filter((range) => !(range.start === rangeToDelete.start && range.end === rangeToDelete.end))
    );
  };

  const clearExpiredBlackouts = () => {
    setDisabledDates((prev) => prev.filter((date) => date >= todayKey));
    setBlackoutRanges((prev) => prev.filter((range) => range.end >= todayKey));
  };

  const isDateInsideRange = (dateKey) =>
    blackoutRanges.some((range) => dateKey >= range.start && dateKey <= range.end);

  const handleCalendarBlockToggle = (day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    setSelectedCalendarDate(dateKey);
    if (calendarBlockMode === 'day') {
      toggleDisabledDate(dateKey);
      return;
    }

    toggleBlackoutRangeForDate(calendarBlockMode, day);
  };

  return (
    <>
      <Head>
        <title>Horarios & Bloqueos | Admin Vanessa Nails</title>
      </Head>

      <AdminShell
        title="Configuración de Horarios & Bloqueos"
        description="Ajusta las horas de apertura por día de la semana, bloquea fechas por vacaciones y configura los extra-cupos."
      >
        <div className="space-y-6 pb-20">
          {/* Mensajes de feedback */}
          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 animate-fadeIn">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tarjetas KPI de Resumen */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-pink-200/70 bg-white/90 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Bloqueos Ordinales</p>
                  <p className="mt-1 text-2xl font-bold text-neutral-900">{disabledDays.length}</p>
                </div>
                <div className="rounded-xl bg-pink-50 p-2 text-pink-600">
                  <Lock className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-neutral-500">Sábados o domingos recurrentes</p>
            </div>

            <div className="rounded-2xl border border-amber-200/70 bg-white/90 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Fechas Puntuales</p>
                  <p className="mt-1 text-2xl font-bold text-amber-900">{disabledDates.length}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                  <CalendarDays className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-amber-700">Días específicos cerrados</p>
            </div>

            <div className="rounded-2xl border border-emerald-200/70 bg-white/90 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Rangos de Vacaciones</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-900">{blackoutRanges.length}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-emerald-700">Semanas o meses bloqueados</p>
            </div>
          </div>

          {/* Sección 1: Franjas Horarias Semanales */}
          <div className="rounded-3xl border border-pink-200/70 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2 border-b border-pink-100 pb-3">
              <div className="rounded-xl bg-pink-100/70 p-2 text-pink-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-neutral-900">
                  Horario de Atención Habitual
                </h3>
                <p className="text-xs text-neutral-500">
                  Establece la hora de apertura y cierre para cada día de la semana.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dia) => (
                <HorarioEditor
                  key={dia}
                  dia={dia}
                  rango={horarios[dia] || []}
                  horarios={horarios}
                  setHorarios={setHorarios}
                />
              ))}
            </div>
          </div>

          {/* Sección 2: Calendario Visual de Bloqueos */}
          <div className="rounded-3xl border border-pink-200/70 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-md space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-amber-100/70 p-2 text-amber-700">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-neutral-900">
                    Calendario Visual de Bloqueos & Vacaciones
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Haz clic sobre cualquier fecha para bloquearla o liberarla al instante.
                  </p>
                </div>
              </div>

              {/* Selector de Modo de Bloqueo */}
              <div className="flex items-center gap-1 rounded-2xl border border-pink-200 bg-pink-50/60 p-1">
                {[
                  { id: 'day', label: 'Por Día' },
                  { id: 'week', label: 'Por Semana' },
                  { id: 'month', label: 'Por Mes' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setCalendarBlockMode(mode.id)}
                    className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                      calendarBlockMode === mode.id
                        ? 'bg-gradient-to-r from-[#E11B74] to-[#C5A059] text-white shadow-sm'
                        : 'text-neutral-600 hover:text-pink-600'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Navegación del Mes */}
            <div className="flex items-center justify-between border-b border-pink-100/60 py-2">
              <button
                type="button"
                onClick={() => setCalendarMonth((prev) => subMonths(prev, 1))}
                className="rounded-xl border border-pink-200 bg-white p-2 text-pink-600 hover:bg-pink-50 shadow-sm transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <h4 className="font-display text-sm sm:text-base font-bold capitalize text-neutral-800">
                {format(calendarMonth, 'MMMM yyyy', { locale: es })}
              </h4>

              <button
                type="button"
                onClick={() => setCalendarMonth((prev) => addMonths(prev, 1))}
                className="rounded-xl border border-pink-200 bg-white p-2 text-pink-600 hover:bg-pink-50 shadow-sm transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 text-center text-xs font-bold text-neutral-500 py-1 bg-pink-50/30 rounded-xl">
              {calendarWeekDays.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Celdas del calendario */}
            <div className="grid grid-cols-7 auto-rows-fr gap-1">
              {calendarDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const isCurrentMonthDay = isSameMonth(day, calendarMonth);
                const isToday = isSameDay(day, new Date());
                const isBlockedDay = disabledDates.includes(dateKey);
                const isInRange = isDateInsideRange(dateKey);

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => handleCalendarBlockToggle(day)}
                    className={`relative min-h-[70px] sm:min-h-[85px] rounded-2xl border p-2 text-left transition select-none ${
                      !isCurrentMonthDay
                        ? 'opacity-30 bg-neutral-50 border-neutral-100'
                        : isBlockedDay
                        ? 'border-pink-300 bg-pink-100/70 text-pink-900 shadow-sm'
                        : isInRange
                        ? 'border-amber-300 bg-amber-100/70 text-amber-900 shadow-sm'
                        : 'border-emerald-200/80 bg-emerald-50/40 text-emerald-900 hover:bg-emerald-100/50'
                    }`}
                    style={{
                      outline: isToday ? '2px solid #E11B74' : 'none',
                      outlineOffset: isToday ? '-2px' : '0',
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                          isToday
                            ? 'bg-gradient-to-tr from-[#E11B74] to-[#C5A059] text-white shadow-sm'
                            : 'text-neutral-700'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>

                      <span className="text-[9px] font-bold uppercase tracking-wider">
                        {isBlockedDay ? 'Bloqueado' : isInRange ? 'En Rango' : 'Libre'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Leyenda y Acciones de limpieza */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-pink-100/70 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-neutral-600 font-medium">Disponible</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-pink-500" />
                  <span className="text-neutral-600 font-medium">Bloqueado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-neutral-600 font-medium">En Rango Vacacional</span>
                </div>
              </div>

              <button
                type="button"
                onClick={clearExpiredBlackouts}
                className="flex items-center gap-1 rounded-xl border border-pink-200 bg-white px-3 py-1.5 text-xs font-bold text-pink-700 shadow-sm hover:bg-pink-50 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Limpiar Vencidos</span>
              </button>
            </div>
          </div>

          {/* Sección 3: Bloqueo de Sábados y Domingos del Mes */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-pink-200/70 bg-white/90 p-5 shadow-sm backdrop-blur-md space-y-3">
              <h3 className="font-display text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Lock className="h-4 w-4 text-pink-600" />
                Sábados Deshabilitados del Mes
              </h3>
              <p className="text-xs text-neutral-500">
                Selecciona qué sábados del mes no estarán disponibles para agendar.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {ordinalOptions.map((ordinal) => {
                  const code = `SAT${ordinal}`;
                  const active = disabledDays.includes(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggleDisabledDay(code)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-sm ${
                        active
                          ? 'bg-gradient-to-r from-[#E11B74] to-[#C5A059] text-white shadow-pink-500/20'
                          : 'border border-pink-200 bg-pink-50/50 text-neutral-700 hover:bg-pink-100/60'
                      }`}
                    >
                      {ordinal}° Sábado
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-pink-200/70 bg-white/90 p-5 shadow-sm backdrop-blur-md space-y-3">
              <h3 className="font-display text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Lock className="h-4 w-4 text-pink-600" />
                Domingos Deshabilitados del Mes
              </h3>
              <p className="text-xs text-neutral-500">
                Selecciona qué domingos del mes no estarán disponibles para agendar.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {ordinalOptions.map((ordinal) => {
                  const code = `SUN${ordinal}`;
                  const active = disabledDays.includes(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggleDisabledDay(code)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-sm ${
                        active
                          ? 'bg-gradient-to-r from-[#E11B74] to-[#C5A059] text-white shadow-pink-500/20'
                          : 'border border-pink-200 bg-pink-50/50 text-neutral-700 hover:bg-pink-100/60'
                      }`}
                    >
                      {ordinal}° Domingo
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sección 4: Configuración de Extra Cupos */}
          <div className="rounded-3xl border border-pink-200/70 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2 border-b border-pink-100 pb-3">
              <div className="rounded-xl bg-pink-100/70 p-2 text-pink-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-neutral-900">
                  Configuración de Extra-Cupos
                </h3>
                <p className="text-xs text-neutral-500">
                  Reglas y recargo para la página especial de turnos de sobrecupo (<code>/extra-cupos</code>).
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="rounded-2xl border border-pink-200/80 bg-pink-50/40 p-4 block cursor-pointer">
                <span className="block text-xs font-bold text-neutral-700 uppercase mb-2">Habilitado</span>
                <input
                  type="checkbox"
                  checked={Boolean(extraCuposConfig?.enabled)}
                  onChange={(e) =>
                    setExtraCuposConfig((prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                  className="h-5 w-5 accent-[#E11B74]"
                />
              </label>

              <label className="rounded-2xl border border-pink-200/80 bg-white p-4 block">
                <span className="block text-xs font-bold text-neutral-700 uppercase mb-2">Hora Inicio Extra</span>
                <input
                  type="time"
                  value={extraCuposConfig?.start || '18:00'}
                  onChange={(e) =>
                    setExtraCuposConfig((prev) => ({ ...prev, start: e.target.value }))
                  }
                  className="w-full rounded-xl border border-pink-200 px-3 py-2 text-xs font-bold text-neutral-800 outline-none"
                />
              </label>

              <label className="rounded-2xl border border-pink-200/80 bg-white p-4 block">
                <span className="block text-xs font-bold text-neutral-700 uppercase mb-2">Hora Fin Extra</span>
                <input
                  type="time"
                  value={extraCuposConfig?.end || '20:00'}
                  onChange={(e) =>
                    setExtraCuposConfig((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="w-full rounded-xl border border-pink-200 px-3 py-2 text-xs font-bold text-neutral-800 outline-none"
                />
              </label>

              <label className="rounded-2xl border border-pink-200/80 bg-white p-4 block">
                <span className="block text-xs font-bold text-neutral-700 uppercase mb-2">Horizonte (Días)</span>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={extraCuposConfig?.daysToShow || 35}
                  onChange={(e) =>
                    setExtraCuposConfig((prev) => ({
                      ...prev,
                      daysToShow: Number(e.target.value) || 35,
                    }))
                  }
                  className="w-full rounded-xl border border-pink-200 px-3 py-2 text-xs font-bold text-neutral-800 outline-none"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Barra Flotante de Guardar Cambios */}
        <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-5xl">
          <div className="flex items-center justify-between rounded-3xl border border-pink-200/80 bg-white/95 p-3.5 shadow-xl backdrop-blur-lg">
            <p className="hidden sm:block text-xs font-semibold text-neutral-600 pl-2">
              Los cambios afectarán la disponibilidad pública de inmediato.
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E11B74] to-[#C5A059] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-pink-500/20 active:scale-95 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Guardando Cambios...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Guardar Horarios & Bloqueos</span>
                </>
              )}
            </button>
          </div>
        </div>
      </AdminShell>
    </>
  );
}
