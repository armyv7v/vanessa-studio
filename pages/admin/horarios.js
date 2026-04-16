import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';
import HorarioEditor from '../../components/HorarioEditor';
import AdminShell from '../../components/AdminShell';
import { hasAdminToken } from '../../lib/adminAuth';

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
  const [singleDisabledDate, setSingleDisabledDate] = useState('');
  const [rangeAnchorDate, setRangeAnchorDate] = useState('');

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

  const toggleDisabledDay = (code) => {
    setDisabledDays((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code].sort()
    );
  };

  const addDisabledDate = () => {
    if (!singleDisabledDate) return;
    setDisabledDates((prev) => Array.from(new Set([...prev, singleDisabledDate])).sort());
    setSingleDisabledDate('');
  };

  const removeDisabledDate = (date) => {
    setDisabledDates((prev) => prev.filter((item) => item !== date));
  };

  const addBlackoutRange = (mode) => {
    if (!rangeAnchorDate) return;

    const baseDate = new Date(`${rangeAnchorDate}T12:00:00`);
    const start = mode === 'month' ? startOfMonth(baseDate) : startOfWeek(baseDate, { weekStartsOn: 1 });
    const end = mode === 'month' ? endOfMonth(baseDate) : endOfWeek(baseDate, { weekStartsOn: 1 });

    const nextRange = {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
      label: mode === 'month' ? `Mes ${format(baseDate, 'MM/yyyy')}` : `Semana ${format(start, 'dd/MM')} - ${format(end, 'dd/MM')}`,
    };

    setBlackoutRanges((prev) => {
      const exists = prev.some((range) => range.start === nextRange.start && range.end === nextRange.end);
      if (exists) return prev;
      return [...prev, nextRange].sort((a, b) => a.start.localeCompare(b.start));
    });
  };

  const removeBlackoutRange = (rangeToDelete) => {
    setBlackoutRanges((prev) => prev.filter((range) => !(range.start === rangeToDelete.start && range.end === rangeToDelete.end)));
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
          <h2 className="mb-2 text-lg font-bold" style={{ color: 'var(--ink-medium)' }}>Bloqueos exactos y rangos completos</h2>
          <p className="mb-5 text-sm" style={{ color: 'var(--ink-muted)' }}>
            Desactiva un día puntual o crea bloqueos completos por semana o por mes. Estos bloqueos prevalecen sobre la disponibilidad normal del calendario.
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#f3d9e4] bg-white/80 p-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--brand-light)' }}>Bloquear día puntual</h3>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="date"
                  value={singleDisabledDate}
                  onChange={(e) => setSingleDisabledDate(e.target.value)}
                  className="rounded-xl border border-[#f2c8d4] bg-white px-4 py-3 outline-none focus:ring-2"
                  style={{ color: 'var(--ink-medium)' }}
                />
                <button type="button" onClick={addDisabledDate} className="premium-button-secondary">
                  Agregar día
                </button>
              </div>

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
              <h3 className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--brand-light)' }}>Bloquear semana o mes</h3>
              <div className="mt-4 flex flex-col gap-3">
                <input
                  type="date"
                  value={rangeAnchorDate}
                  onChange={(e) => setRangeAnchorDate(e.target.value)}
                  className="rounded-xl border border-[#f2c8d4] bg-white px-4 py-3 outline-none focus:ring-2"
                  style={{ color: 'var(--ink-medium)' }}
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="button" onClick={() => addBlackoutRange('week')} className="premium-button-secondary">
                    Bloquear semana
                  </button>
                  <button type="button" onClick={() => addBlackoutRange('month')} className="premium-button-secondary">
                    Bloquear mes
                  </button>
                </div>
              </div>

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
