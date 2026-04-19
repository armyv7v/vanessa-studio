import { useRouter } from 'next/router';
import { useState, useEffect, useMemo } from 'react';
import { addDays, endOfDay, endOfWeek, format, startOfDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import AdminShell from '../../components/AdminShell';
import { hasAdminToken } from '../../lib/adminAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_WORKER_URL || 'https://vanessastudioback.netlify.app/.netlify/functions/api';

function getFilterRange(filter) {
  const today = new Date();

  if (filter === 'week') {
    return {
      start: startOfWeek(today, { weekStartsOn: 1 }),
      end: endOfWeek(today, { weekStartsOn: 1 }),
    };
  }

  if (filter === 'all') {
    return {
      start: startOfDay(today),
      end: endOfDay(addDays(today, 60)),
    };
  }

  return {
    start: startOfDay(today),
    end: endOfDay(today),
  };
}

export default function ValidarCitas() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [filter, setFilter] = useState('today');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [submittingCode, setSubmittingCode] = useState('');
  const [confirmingPaymentCode, setConfirmingPaymentCode] = useState('');
  const [sweepingPayments, setSweepingPayments] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const dateRange = useMemo(() => getFilterRange(filter), [filter]);

  useEffect(() => {
    if (!hasAdminToken()) {
      router.push('/admin/login');
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);
    setLoading(false);
  }, [router]);

  const refreshReservations = async () => {
    try {
      setListLoading(true);
      setError('');

      const params = new URLSearchParams({
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd'),
      });

      const res = await fetch(`${API_BASE}/validate-attendance-list?${params.toString()}`);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo cargar la lista de citas.');
      }

      setReservations(Array.isArray(data?.reservations) ? data.reservations : []);
    } catch (fetchError) {
      setError(fetchError.message || 'No se pudo cargar la lista de citas.');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshReservations();
  }, [dateRange.end, dateRange.start, isAuthenticated]);

  const paymentSummary = useMemo(() => {
    return reservations.reduce((acc, reservation) => {
      const status = reservation.isExpired ? 'EXPIRADA' : (reservation.paymentStatus || 'SIN_ESTADO');
      acc.total += 1;
      if (status === 'PENDIENTE_PAGO') acc.pending += 1;
      if (status === 'PAGO_CONFIRMADO') acc.confirmed += 1;
      if (status === 'EXPIRADA') acc.expired += 1;
      return acc;
    }, { total: 0, pending: 0, confirmed: 0, expired: 0 });
  }, [reservations]);

  const visibleReservations = useMemo(() => {
    if (paymentFilter === 'all') return reservations;
    return reservations.filter((reservation) => {
      const status = reservation.isExpired ? 'EXPIRADA' : reservation.paymentStatus;
      return status === paymentFilter;
    });
  }, [paymentFilter, reservations]);

  const handleConfirmPayment = async (reservationCode) => {
    if (!adminPin || adminPin.length < 4) {
      setError('Ingresa el PIN de administrador para confirmar el pago.');
      return;
    }

    try {
      setConfirmingPaymentCode(reservationCode);
      setError('');
      setSuccessMessage('');

      const res = await fetch(`${API_BASE}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: reservationCode, adminPin }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo confirmar el pago.');
      }

      setReservations((prev) => prev.map((reservation) => (
        reservation.code === reservationCode
          ? {
              ...reservation,
              paymentStatus: data?.reservation?.paymentStatus || 'PAGO_CONFIRMADO',
              paymentConfirmedAt: data?.reservation?.paymentConfirmedAt || new Date().toISOString(),
              releasedAt: '',
              releaseReason: '',
              isExpired: false,
            }
          : reservation
      )));
      setSuccessMessage('Pago confirmado correctamente.');
    } catch (paymentError) {
      setError(paymentError.message || 'No se pudo confirmar el pago.');
    } finally {
      setConfirmingPaymentCode('');
    }
  };

  const handleSweepExpiredPayments = async () => {
    if (!adminPin || adminPin.length < 4) {
      setError('Ingresa el PIN de administrador para liberar reservas vencidas.');
      return;
    }

    try {
      setSweepingPayments(true);
      setError('');
      setSuccessMessage('');

      const res = await fetch(`${API_BASE}/expire-pending-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPin }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo ejecutar la liberacion de vencidas.');
      }

      await refreshReservations();
      setSuccessMessage(data?.message || 'Liberacion de vencidas ejecutada correctamente.');
    } catch (sweepError) {
      setError(sweepError.message || 'No se pudo ejecutar la liberacion de vencidas.');
    } finally {
      setSweepingPayments(false);
    }
  };

  const handleValidate = async (reservationCode) => {
    if (!adminPin || adminPin.length < 4) {
      setError('Ingresa el PIN de administrador para validar manualmente.');
      return;
    }

    try {
      setSubmittingCode(reservationCode);
      setError('');
      setSuccessMessage('');

      const res = await fetch(`${API_BASE}/validate-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: reservationCode, adminPin }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo validar la cita.');
      }

      setReservations((prev) => prev.map((reservation) => (
        reservation.code === reservationCode
          ? {
              ...reservation,
              attended: true,
              validatedAt: new Date().toISOString(),
            }
          : reservation
      )));
      setSuccessMessage('Asistencia validada correctamente.');
    } catch (validationError) {
      setError(validationError.message || 'No se pudo validar la cita.');
    } finally {
      setSubmittingCode('');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-b-transparent" style={{ borderColor: 'var(--brand) transparent var(--brand) var(--brand)' }} />
          <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
      <AdminShell
        title="Validar citas"
        description="Gestiona el pago del abono y luego valida asistencia. Las reservas nuevas nacen pendientes de pago y el backend libera automaticamente las que vencen sin confirmacion."
      >
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="admin-highlight-card rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="admin-section-kicker">Validación editorial</p>
              <div className="mb-4 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-pink-100 bg-pink-50 px-4 py-3 text-sm text-slate-700">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-pink-600">Total</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{paymentSummary.total}</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-slate-700">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-700">Pendientes</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{paymentSummary.pending}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-slate-700">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Confirmadas</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{paymentSummary.confirmed}</p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-slate-700">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-rose-700">Expiradas</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{paymentSummary.expired}</p>
                </div>
              </div>
              <div className="mb-4 flex flex-wrap gap-3">
                {[
                  { id: 'today', label: 'Hoy' },
                  { id: 'week', label: 'Esta semana' },
                  { id: 'all', label: 'Todas' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className="rounded-full px-4 py-2 text-sm font-semibold transition"
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
              <p className="text-sm text-gray-500">
                Mostrando citas desde {format(dateRange.start, "d 'de' MMMM", { locale: es })} hasta {format(dateRange.end, "d 'de' MMMM", { locale: es })}.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'Todos los pagos' },
                  { id: 'PENDIENTE_PAGO', label: 'Pendientes' },
                  { id: 'PAGO_CONFIRMADO', label: 'Confirmados' },
                  { id: 'EXPIRADA', label: 'Expirados' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setPaymentFilter(tab.id)}
                    className="rounded-full px-4 py-2 text-sm font-semibold transition"
                    style={
                      paymentFilter === tab.id
                        ? {
                            background: '#111827',
                            color: '#fff',
                          }
                        : {
                            background: '#f8fafc',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                          }
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full max-w-xs">
              <label htmlFor="admin-pin" className="mb-2 block text-sm font-semibold text-slate-700">PIN de administrador</label>
              <input
                id="admin-pin"
                type="password"
                inputMode="numeric"
                maxLength="4"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                placeholder="2308"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-lg tracking-[0.35em] text-slate-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />
              <button
                type="button"
                onClick={handleSweepExpiredPayments}
                disabled={sweepingPayments}
                className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sweepingPayments ? 'Liberando vencidas...' : 'Liberar vencidas ahora'}
              </button>
            </div>
          </div>

          {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
          {successMessage ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{successMessage}</div> : null}
        </div>

        <div className="admin-surface-card rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-800">Listado manual de citas</h2>
             {listLoading ? <span className="text-sm text-gray-500">Actualizando...</span> : <span className="text-sm text-gray-500">{visibleReservations.length} citas</span>}
           </div>

          {listLoading ? (
            <div className="py-10 text-center text-gray-500">Cargando citas...</div>
          ) : visibleReservations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
              No hay citas para este rango.
            </div>
          ) : (
            <div className="space-y-4">
              {visibleReservations.map((reservation) => {
                const paymentBadge = reservation.paymentStatus === 'EXPIRADA' || reservation.isExpired
                  ? 'Reserva liberada'
                  : reservation.paymentStatus === 'PAGO_CONFIRMADO'
                    ? 'Pago confirmado'
                    : 'Pendiente de pago';
                const paymentBadgeClass = reservation.paymentStatus === 'EXPIRADA' || reservation.isExpired
                  ? 'bg-rose-100 text-rose-700'
                  : reservation.paymentStatus === 'PAGO_CONFIRMADO'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700';

                return (
                <div key={reservation.code} className="admin-list-card rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">{reservation.dateLabel}</span>
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">{reservation.timeLabel}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentBadgeClass}`}>
                          {paymentBadge}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${reservation.attended ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {reservation.attended ? 'Asistencia validada' : 'Pendiente'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{reservation.name}</h3>
                      <p className="text-sm font-medium text-slate-700">{reservation.service}</p>
                      <div className="text-sm text-slate-500">
                        <p>{reservation.email}</p>
                        <p>{reservation.phone || 'Sin teléfono'}</p>
                        <p className="font-mono text-xs text-slate-400">Código: {reservation.code}</p>
                        {reservation.paymentExpiresAt ? <p>Vence pago: {format(new Date(reservation.paymentExpiresAt), 'dd/MM/yyyy HH:mm')}</p> : null}
                        {reservation.paymentConfirmedAt ? <p>Pago confirmado: {format(new Date(reservation.paymentConfirmedAt), 'dd/MM/yyyy HH:mm')}</p> : null}
                        {reservation.releasedAt ? <p>Liberada: {format(new Date(reservation.releasedAt), 'dd/MM/yyyy HH:mm')}</p> : null}
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[220px]">
                      {reservation.htmlLink ? (
                        <a
                          href={reservation.htmlLink}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-white"
                        >
                          Ver en calendario
                        </a>
                      ) : null}
                      <button
                        type="button"
                        disabled={reservation.paymentStatus !== 'PENDIENTE_PAGO' || reservation.isExpired || confirmingPaymentCode === reservation.code}
                        onClick={() => handleConfirmPayment(reservation.code)}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {reservation.paymentStatus === 'PAGO_CONFIRMADO'
                          ? 'Pago ya confirmado'
                          : confirmingPaymentCode === reservation.code
                            ? 'Confirmando pago...'
                            : reservation.paymentStatus === 'EXPIRADA' || reservation.isExpired
                              ? 'Reserva liberada'
                              : 'Confirmar pago'}
                      </button>
                      <button
                        type="button"
                        disabled={reservation.attended || submittingCode === reservation.code || reservation.paymentStatus !== 'PAGO_CONFIRMADO'}
                        onClick={() => handleValidate(reservation.code)}
                        className="rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ background: 'linear-gradient(160deg, #F04A94 0%, #E11B74 55%, #B8105D 100%)' }}
                      >
                        {reservation.attended ? 'Ya validada' : reservation.paymentStatus !== 'PAGO_CONFIRMADO' ? 'Confirma pago primero' : submittingCode === reservation.code ? 'Validando...' : 'Validar asistencia'}
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
