import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AdminShieldIcon, ErrorIcon, ScanIcon, SuccessIcon, SparkleIcon } from '../components/BrandMotifs';

const API_BASE = process.env.NEXT_PUBLIC_API_WORKER_URL || 'https://vanessastudioback.netlify.app/.netlify/functions/api';

function LoyaltySummary({ card }) {
  if (!card) return null;

  const currentStamps = Number(card.currentStamps || 0);
  const progress = Number(card.progress || 0);
  const rewardAvailable = Boolean(card.rewardAvailable);

  // Generate 6 slots
  const slots = Array.from({ length: 6 }, (_, index) => index < currentStamps);

  return (
    <div
      className="premium-panel gloss-panel gradient-outline mb-8 relative p-6 rounded-3xl"
      style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(254, 240, 248, 0.92))' }}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <span className="section-kicker-gold text-[10px]">Tarjeta de fidelidad</span>
          <h3 className="font-display text-lg font-semibold text-[var(--brand-darker)] mt-1">Vanessa Nails Loyalty</h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase border ${
            rewardAvailable
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : 'bg-[#FDE8F2] text-[var(--brand)] border-[#F2C8D4]'
          }`}
        >
          {rewardAvailable ? 'Premio Listo!' : 'En Progreso'}
        </span>
      </div>

      {/* Grid of 6 stamps */}
      <div className="grid grid-cols-6 gap-2 my-5 justify-items-center">
        {slots.map((isStamped, idx) => (
          <div
            key={idx}
            className={`relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full transition-all duration-300 ${
              isStamped
                ? 'bg-gradient-to-br from-[#F04A94] to-[#C5A059] shadow-[0_4px_14px_rgba(225,27,116,0.3)] scale-105'
                : 'border border-dashed border-[#EDD9A3] bg-white/60 text-[#C5A059]/40'
            }`}
          >
            {isStamped ? (
              <SparkleIcon className="h-6 w-6 text-white animate-pulse" />
            ) : (
              <span className="font-display text-sm font-semibold">{idx + 1}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--ink-muted)] border-t border-[#F2C8D4]/40 pt-3">
        <span>{currentStamps} de 6 sellos completados</span>
        <span>{progress}% de progreso</span>
      </div>
    </div>
  );
}

export default function ValidarAsistencia() {
  const router = useRouter();
  const { code } = router.query;

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState(null);
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (!router.isReady || !code) return;

    const fetchReservation = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`${API_BASE}/validate-attendance/${encodeURIComponent(code)}`);
        const payload = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(payload?.error || 'No se pudo encontrar la reserva');
        }

        setData(payload);
      } catch (fetchError) {
        setError(fetchError.message || 'No se pudo encontrar la reserva');
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [code, router.isReady]);

  const handleValidate = async (event) => {
    event.preventDefault();

    if (!pin || pin.length < 4) {
      setError('Por favor ingresa el PIN de administrador (4 dígitos).');
      return;
    }

    try {
      setValidating(true);
      setError('');

      const res = await fetch(`${API_BASE}/validate-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, adminPin: pin }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error || 'Error al validar asistencia');
      }

      setSuccess(true);
      setData((previous) => ({
        ...previous,
        attended: true,
        loyaltyCard: payload?.loyalty || previous?.loyaltyCard || null,
      }));
    } catch (validationError) {
      setError(validationError.message || 'Error al validar asistencia');
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4 py-12"
        style={{
          background: `
            radial-gradient(circle at top,        rgba(225, 27, 116, 0.10), transparent 30%),
            radial-gradient(circle at 85% 12%,    rgba(197, 160,  89, 0.14), transparent 24%),
            linear-gradient(180deg, #FFFBFD 0%, #FFF0F6 45%, #FDF6EF 100%)
          `,
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-t-transparent border-[var(--brand)]" />
          <p className="text-sm font-medium text-[var(--ink-muted)]">Cargando reserva...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4 py-12"
        style={{
          background: `
            radial-gradient(circle at top,        rgba(225, 27, 116, 0.10), transparent 30%),
            radial-gradient(circle at 85% 12%,    rgba(197, 160,  89, 0.14), transparent 24%),
            linear-gradient(180deg, #FFFBFD 0%, #FFF0F6 45%, #FDF6EF 100%)
          `,
        }}
      >
        <div className="w-full max-w-md text-center space-y-6">
          <div className="premium-shell gloss-panel gradient-outline step-fade-in p-8" style={{ borderRadius: '28px' }}>
            <div className="mb-4 flex justify-center text-rose-500">
              <ErrorIcon className="h-12 w-12" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-[var(--brand-darker)]">Error de validación</h1>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">{error}</p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="premium-button-secondary mt-6 w-full"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Validar Asistencia | Vanessa Nails Studio</title>
      </Head>

      <div
        className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
        style={{
          background: `
            radial-gradient(circle at top,        rgba(225, 27, 116, 0.10), transparent 30%),
            radial-gradient(circle at 85% 12%,    rgba(197, 160,  89, 0.14), transparent 24%),
            linear-gradient(180deg, #FFFBFD 0%, #FFF0F6 45%, #FDF6EF 100%)
          `,
        }}
      >
        <div className="w-full max-w-md space-y-8">
          {/* Brand header */}
          <div className="text-center">
            <div
              className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-[22px] shadow-[0_20px_48px_rgba(225,27,116,0.22)]"
              style={{ background: 'linear-gradient(160deg, #F04A94 0%, #E11B74 55%, #B8105D 100%)' }}
            >
              <ScanIcon className="h-7 w-7 text-white" />
            </div>
            <h1
              className="font-display text-3xl font-semibold leading-tight"
              style={{ color: 'var(--brand-darker)', letterSpacing: '-0.02em' }}
            >
              Validar Asistencia
            </h1>
            <p
              className="mt-2 text-sm"
              style={{ color: 'var(--ink-faint)' }}
            >
              Confirmación de cita y fidelidad
            </p>
          </div>

          {/* Validation panel */}
          <div
            className="premium-shell gloss-panel gradient-outline step-fade-in"
            style={{ borderRadius: '28px' }}
          >
            <div className="mb-6 text-center">
              <span className="section-kicker-gold text-[10px]">Detalle de Reserva</span>
              <h2 className="font-display text-2xl font-bold text-[var(--brand-darker)] mt-1">{data?.service}</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{data?.date} a las {data?.time}</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--brand-lightest)] border border-[var(--brand-light)]/20 px-4 py-1.5 text-xs font-semibold text-[var(--brand-dark)]">
                Cliente: {data?.clientName || data?.name}
              </div>
            </div>

            <LoyaltySummary card={data?.loyaltyCard} />

            {success ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center transition-all duration-300">
                <div className="mb-3 flex justify-center text-emerald-500">
                  <SuccessIcon className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-bold text-emerald-800">Validación exitosa</h3>
                <p className="mt-2 text-sm text-emerald-700">La asistencia quedó registrada correctamente.</p>
              </div>
            ) : (
              <form onSubmit={handleValidate} className="space-y-6">
                <div>
                  <label htmlFor="pin" className="mb-2 block text-sm font-semibold text-[var(--ink-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <AdminShieldIcon className="h-4 w-4 text-[var(--brand)]" />
                      <span>PIN de Administrador</span>
                    </span>
                  </label>
                  <input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    maxLength="4"
                    className="premium-input transition-all duration-300 focus:shadow-[0_0_20px_rgba(225,27,116,0.12)] focus:scale-[1.01] bg-white/90 text-center text-2xl tracking-[0.4em]"
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                  <p className="mt-2 text-center text-xs text-[var(--ink-faint)]">Ingresa el PIN de seguridad de 4 dígitos para validar la asistencia</p>
                </div>

                {error ? (
                  <div
                    className="rounded-2xl border px-4 py-3 text-sm font-medium text-center"
                    style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      borderColor: 'rgba(239, 68, 68, 0.18)',
                      color: '#C53030',
                    }}
                    role="alert"
                  >
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={validating}
                  className="premium-button w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {validating ? 'Validando...' : 'Confirmar Asistencia'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

