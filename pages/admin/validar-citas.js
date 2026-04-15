import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import AdminShell from '../../components/AdminShell';
import { hasAdminToken } from '../../lib/adminAuth';

export default function ValidarCitas() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!hasAdminToken()) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
      setLoading(false);
    }
  }, [router]);

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, #FFFBFD 0%, #FFF0F6 50%, #FDF6EF 100%)',
        }}
      >
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-b-transparent"
            style={{ borderColor: 'var(--brand) transparent var(--brand) var(--brand)' }}
          />
          <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Filter tab helper
  const filterTabs = [
    { id: 'today', label: 'Hoy' },
    { id: 'week',  label: 'Esta semana' },
    { id: 'all',   label: 'Todas' },
  ];

  return (
    <AdminShell
      title="Validar citas"
      description="Panel de validación manual de asistencia. Respaldo para casos donde el QR no esté disponible."
    >
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Filter + Content Card */}
        <div
          className="rounded-3xl p-6 shadow-sm"
          style={{
            border: '1px solid rgba(242, 200, 212, 0.6)',
            background: 'rgba(255,255,255,0.97)',
          }}
        >
          {/* Filter Tabs */}
          <div className="mb-6 flex flex-wrap gap-3">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className="rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-px"
                style={
                  filter === tab.id
                    ? {
                        background: 'linear-gradient(160deg, #F04A94 0%, #E11B74 55%, #B8105D 100%)',
                        color: '#fff',
                        boxShadow: '0 8px 18px rgba(225,27,116,0.20)',
                      }
                    : {
                        background: 'var(--bg-blush)',
                        color: 'var(--ink-muted)',
                        border: '1px solid var(--gold-lighter)',
                      }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status banner — "En desarrollo" */}
          <div
            className="rounded-2xl border-2 p-6 text-center"
            style={{
              borderColor: 'var(--gold-lighter)',
              background: 'var(--gold-lightest)',
            }}
          >
            <p
              className="mb-2 font-semibold"
              style={{ color: 'var(--gold-dark)' }}
            >
              Función en desarrollo
            </p>
            <p className="mb-4 text-sm" style={{ color: 'var(--ink-muted)' }}>
              Este panel todavía no lista citas manualmente. El método recomendado sigue siendo la validación con QR.
            </p>
            <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>
              Próximo paso sugerido: traer citas por rango y habilitar validación manual desde este dashboard.
            </p>
          </div>
        </div>

        {/* Instructions Card */}
        <div
          className="rounded-3xl p-6 shadow-sm"
          style={{
            border: '1px solid rgba(242, 200, 212, 0.6)',
            background: 'rgba(255,255,255,0.97)',
          }}
        >
          <h2
            className="mb-4 text-xl font-bold"
            style={{ color: 'var(--ink-medium)' }}
          >
            Instrucciones
          </h2>
          <div className="space-y-4">
            {[
              {
                icon: '📱',
                title: 'Validación con QR (Recomendado)',
                desc: 'Escanea el código QR que la clienta trae en su email de confirmación.',
              },
              {
                icon: '✍️',
                title: 'Validación manual (backup)',
                desc: 'Este panel será el respaldo cuando el QR no funcione o la clienta no lo tenga.',
              },
              {
                icon: '💅',
                title: 'Sellos automáticos',
                desc: 'La validación correcta debe seguir sumando automáticamente el sello a la fidelidad.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-2xl p-4"
                style={{
                  background: 'var(--bg-blush)',
                  border: '1px solid rgba(242,200,212,0.5)',
                }}
              >
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--ink-medium)' }}>
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--ink-faint)' }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
