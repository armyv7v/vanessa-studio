import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const API_BASE = process.env.NEXT_PUBLIC_API_WORKER_URL || 'https://vanessastudioback.netlify.app/.netlify/functions/api';

function LoyaltySummary({ card }) {
  if (!card) return null;

  const currentStamps = Number(card.currentStamps || 0);
  const progress = Number(card.progress || 0);
  const rewardAvailable = Boolean(card.rewardAvailable);

  return (
    <div className="mb-8 rounded-2xl border border-pink-100 bg-pink-50/70 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-700">Fidelidad</h3>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-bold text-slate-900">{currentStamps}/6 sellos</p>
          <p className="text-sm text-slate-600">Progreso actual: {progress}%</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${rewardAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
          {rewardAvailable ? 'Premio disponible' : 'En progreso'}
        </span>
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-pink-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mb-4 text-5xl text-rose-500">!</div>
          <h1 className="text-2xl font-bold text-slate-900">Error de validación</h1>
          <p className="mt-2 text-slate-600">{error}</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-6 rounded-full bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Head>
        <title>Validar Asistencia | Vanessa Studio</title>
      </Head>

      <div className="mx-auto max-w-md overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="bg-pink-600 px-6 py-8 text-center text-white">
          <h1 className="text-3xl font-bold">Validar Asistencia</h1>
          <p className="mt-2 text-pink-100">Confirmación de cita</p>
        </div>

        <div className="p-6">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold text-slate-900">{data?.service}</h2>
            <p className="mt-1 text-slate-500">{data?.date} a las {data?.time}</p>
            <div className="mt-4 inline-block rounded-full bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700">
              Cliente: {data?.clientName || data?.name}
            </div>
          </div>

          <LoyaltySummary card={data?.loyaltyCard} />

          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <div className="mb-3 text-5xl text-emerald-500">OK</div>
              <h3 className="text-xl font-bold text-emerald-800">Validación exitosa</h3>
              <p className="mt-2 text-emerald-700">La asistencia quedó registrada correctamente.</p>
            </div>
          ) : (
            <form onSubmit={handleValidate} className="space-y-6">
              <div>
                <label htmlFor="pin" className="mb-1 block text-sm font-medium text-slate-700">
                  PIN de Administrador
                </label>
                <input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength="4"
                  className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.4em] focus:border-pink-500 focus:ring-pink-500"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  required
                />
                <p className="mt-2 text-center text-xs text-slate-500">Ingresa el código de seguridad para validar</p>
              </div>

              {error ? (
                <div className="rounded-xl bg-rose-50 p-3 text-center text-sm text-rose-600">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={validating}
                className={`flex w-full justify-center rounded-xl px-4 py-3 text-sm font-medium text-white transition ${validating ? 'cursor-not-allowed bg-pink-400' : 'bg-pink-600 hover:bg-pink-700'}`}
              >
                {validating ? 'Validando...' : 'Confirmar Asistencia'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
