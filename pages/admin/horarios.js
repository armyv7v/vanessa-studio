import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import HorarioEditor from '../../components/HorarioEditor';
import AdminShell from '../../components/AdminShell';
import { hasAdminToken } from '../../lib/adminAuth';

const HORARIOS_ENDPOINT = process.env.NEXT_PUBLIC_BACKEND_HORARIOS_URL || 'https://vanessastudioback.netlify.app/.netlify/functions/horarios';

export default function AdminHorarios() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [horarios, setHorarios] = useState({});
  const [disabledDays, setDisabledDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        body: JSON.stringify({ horarioAtencion: horarios, disabledDays }),
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

  return (
    <AdminShell
      title="Administrar horarios"
      description="Configura horarios de atención y bloquea sábados o domingos específicos del mes para controlar la disponibilidad visible en la reserva."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Horario Editor Card */}
        <div
          className="rounded-3xl p-6 shadow-sm"
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
          className="rounded-3xl p-6 shadow-sm"
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
