import { useRouter } from 'next/router';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { addDays, subDays, endOfDay, endOfWeek, format, startOfDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Check,
  RotateCcw,
  MessageSquare,
  Clock,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Search,
  CheckCircle2,
  Trash2,
  CalendarDays,
  ExternalLink,
  Save,
  X,
  Sparkles,
} from 'lucide-react';
import AdminShell from '../../components/AdminShell';
import AdminMetricIcon from '../../components/AdminMetricIcon';
import { hasAdminToken } from '../../lib/adminAuth';
import { getBackendApiUrl } from '../../lib/backendRouting';

const API_BASE = getBackendApiUrl();

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
      start: startOfDay(subDays(today, 90)),
      end: endOfDay(addDays(today, 90)),
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
  const [filter, setFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [showActionRequired, setShowActionRequired] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState('');
  const [submittingCode, setSubmittingCode] = useState('');
  const [confirmingPaymentCode, setConfirmingPaymentCode] = useState('');
  const [sweepingPayments, setSweepingPayments] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [actionPanel, setActionPanel] = useState(null);
  const [actionDraft, setActionDraft] = useState({});
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const dateRange = useMemo(() => getFilterRange(filter), [filter]);

  // Chequear sesión admin vigente
  useEffect(() => {
    async function checkAuth() {
      if (!(await hasAdminToken())) {
        router.push('/admin/login');
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  const refreshReservations = useCallback(async () => {
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
  }, [dateRange.end, dateRange.start]);

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshReservations();
  }, [isAuthenticated, refreshReservations]);

  // Resumen de estadísticas
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

  const operationsSummary = useMemo(() => {
    const attendancePending = reservations.filter((reservation) => (
      reservation.paymentStatus === 'PAGO_CONFIRMADO' && !reservation.attended
    )).length;
    const actionRequired = paymentSummary.pending + paymentSummary.expired + attendancePending;
    const completionRate = paymentSummary.total
      ? Math.round(((paymentSummary.confirmed + reservations.filter((item) => item.attended).length) / (paymentSummary.total * 2)) * 100)
      : 0;

    return {
      actionRequired,
      attendancePending,
      completionRate,
    };
  }, [paymentSummary.confirmed, paymentSummary.expired, paymentSummary.pending, paymentSummary.total, reservations]);

  // Filtrado y búsqueda de reservas
  const visibleReservations = useMemo(() => {
    let result = reservations;

    if (paymentFilter !== 'all') {
      result = result.filter((reservation) => {
        const status = reservation.isExpired ? 'EXPIRADA' : reservation.paymentStatus;
        return status === paymentFilter;
      });
    }

    if (showActionRequired) {
      result = result.filter((reservation) => {
        const status = reservation.isExpired ? 'EXPIRADA' : reservation.paymentStatus;
        return status === 'PENDIENTE_PAGO' || status === 'EXPIRADA' || (status === 'PAGO_CONFIRMADO' && !reservation.attended);
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((res) => {
        return (
          res.name?.toLowerCase().includes(query) ||
          res.email?.toLowerCase().includes(query) ||
          res.phone?.toLowerCase().includes(query) ||
          res.code?.toLowerCase().includes(query) ||
          res.service?.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [paymentFilter, showActionRequired, searchQuery, reservations]);

  // Agrupamiento por fecha
  const groupedReservations = useMemo(() => {
    const groups = {};
    visibleReservations.forEach((reservation) => {
      const dateKey = reservation.dateLabel || 'Sin Fecha';
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(reservation);
    });
    return groups;
  }, [visibleReservations]);

  const runAdminReservationOperation = async (operation, payload = {}) => {
    const res = await fetch('/api/admin/reservation-operation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation, payload }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || 'No se pudo completar la operación admin.');
    }

    return data;
  };

  const openActionPanel = (mode, reservation) => {
    const startDate = reservation.startLocal ? reservation.startLocal.slice(0, 10) : '';
    const startTime = reservation.startLocal ? reservation.startLocal.slice(11, 16) : '';

    setError('');
    setSuccessMessage('');
    setActionPanel({ mode, code: reservation.code });
    setActionDraft({
      name: reservation.name || '',
      email: reservation.email || '',
      phone: reservation.phone || '',
      service: reservation.service || '',
      date: startDate,
      start: startTime,
      durationMin: reservation.duration || '60',
    });
  };

  const closeActionPanel = () => {
    setActionPanel(null);
    setActionDraft({});
  };

  const updateActionDraft = (field, value) => {
    setActionDraft((prev) => ({ ...prev, [field]: value }));
  };

  const runReservationAction = async (mode, reservationCode) => {
    const endpointByMode = {
      edit: 'reservation-update',
      reschedule: 'reservation-reschedule',
      cancel: 'reservation-cancel',
    };

    const payloadByMode = {
      edit: {
        code: reservationCode,
        client: {
          name: actionDraft.name,
          email: actionDraft.email,
          phone: actionDraft.phone,
        },
        service: actionDraft.service,
      },
      reschedule: {
        code: reservationCode,
        date: actionDraft.date,
        start: actionDraft.start,
        durationMin: Number(actionDraft.durationMin),
      },
      cancel: { code: reservationCode },
    };

    try {
      setActionSubmitting(true);
      setError('');
      setSuccessMessage('');

      const data = await runAdminReservationOperation(endpointByMode[mode], payloadByMode[mode]);

      await refreshReservations();
      setSuccessMessage(data?.message || 'Cita actualizada correctamente.');
      closeActionPanel();
    } catch (actionError) {
      setError(actionError.message || 'No se pudo completar la acción sobre la cita.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleConfirmPayment = async (reservationCode) => {
    try {
      setConfirmingPaymentCode(reservationCode);
      setError('');
      setSuccessMessage('');

      const data = await runAdminReservationOperation('confirm-payment', { code: reservationCode });

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
      setSuccessMessage(data?.message || 'Pago confirmado y cupo liberado en agenda.');
    } catch (paymentError) {
      setError(paymentError.message || 'No se pudo confirmar el pago.');
    } finally {
      setConfirmingPaymentCode('');
    }
  };

  const handleSweepExpiredPayments = async () => {
    try {
      setSweepingPayments(true);
      setError('');
      setSuccessMessage('');
      const data = await runAdminReservationOperation('expire-pending-payments');

      await refreshReservations();
      setSuccessMessage(data?.message || 'Liberación de vencidas ejecutada correctamente.');
    } catch (sweepError) {
      setError(sweepError.message || 'No se pudo ejecutar la liberación.');
    } finally {
      setSweepingPayments(false);
    }
  };

  const handleValidate = async (reservationCode) => {
    try {
      setSubmittingCode(reservationCode);
      setError('');
      setSuccessMessage('');

      await runAdminReservationOperation('validate-attendance', { code: reservationCode });

      setReservations((prev) => prev.map((reservation) => (
        reservation.code === reservationCode
          ? {
              ...reservation,
              attended: true,
              validatedAt: new Date().toISOString(),
            }
          : reservation
      )));
      setSuccessMessage('Asistencia validada y tarjeta de fidelidad actualizada.');
    } catch (validationError) {
      setError(validationError.message || 'No se pudo validar la cita.');
    } finally {
      setSubmittingCode('');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-50/40">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#E11B74] border-t-transparent" />
          <p className="text-xs font-semibold text-neutral-500">Verificando sesión admin...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <Head>
        <title>Validar Citas & Pagos | Admin Vanessa Nails</title>
      </Head>

      <AdminShell
        title="Validar Citas & Abonos"
        description="Confirma transferencias bancarias de abonos, reagenda turnos y valida asistencia de clientas."
      >
        <div className="space-y-6">
          {/* Alertas */}
          {error && (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-900 shadow-sm animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <p>{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-950 shadow-sm animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <p>{successMessage}</p>
            </div>
          )}

          {/* Tarjetas KPI de Resumen Operativo */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-pink-200/70 bg-white/90 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Citas en Rango</p>
                  <p className="mt-1 text-2xl font-bold text-neutral-900">{visibleReservations.length}</p>
                </div>
                <div className="rounded-xl bg-pink-50 p-2 text-pink-600">
                  <CalendarDays className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-neutral-500">{paymentSummary.total} cargadas en total</p>
            </div>

            <div className="rounded-2xl border border-amber-200/70 bg-white/90 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Por Validar / Abono</p>
                  <p className="mt-1 text-2xl font-bold text-amber-900">{paymentSummary.pending}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-amber-700">Esperando comprobante</p>
            </div>

            <div className="rounded-2xl border border-emerald-200/70 bg-white/90 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Abonos Confirmados</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-900">{paymentSummary.confirmed}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-emerald-700">{operationsSummary.attendancePending} esperan asistencia</p>
            </div>

            <div className="rounded-2xl border border-pink-200/70 bg-white/90 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#E11B74]">Acciones Críticas</p>
                  <p className="mt-1 text-2xl font-bold text-[#E11B74]">{operationsSummary.actionRequired}</p>
                </div>
                <div className="rounded-xl bg-pink-50 p-2 text-[#E11B74]">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-neutral-500">Abonos o asistencia pendientes</p>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="rounded-3xl border border-pink-200/70 bg-white/90 p-4 sm:p-5 shadow-sm space-y-4 backdrop-blur-md">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Buscador */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar por clienta, teléfono, email, código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-pink-200/80 bg-white/80 pl-10 pr-4 py-2 text-xs sm:text-sm text-neutral-800 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              {/* Botones de acción rápida */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={refreshReservations}
                  disabled={listLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-pink-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-pink-50 active:scale-95 transition disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${listLoading ? 'animate-spin text-pink-600' : ''}`} />
                  <span>Refrescar</span>
                </button>
                <button
                  type="button"
                  onClick={handleSweepExpiredPayments}
                  disabled={sweepingPayments}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#E11B74] to-[#C5A059] px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:opacity-90 active:scale-95 transition disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Liberar Vencidas</span>
                </button>
              </div>
            </div>

            {/* Chips de Fecha y Estados */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-pink-100/70">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'today', label: 'Hoy' },
                  { id: 'week', label: 'Esta Semana' },
                  { id: 'all', label: 'Histórico (90d)' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                      filter === tab.id
                        ? 'bg-neutral-900 text-white shadow-sm'
                        : 'bg-pink-50 text-neutral-600 hover:bg-pink-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowActionRequired(!showActionRequired)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition border ${
                    showActionRequired
                      ? 'border-pink-400 bg-pink-100/80 text-pink-700 shadow-sm'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{showActionRequired ? 'Filtro: Acción Requerida' : 'Mostrar Todas'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Listado de Citas */}
          <div className="space-y-4">
            {listLoading && reservations.length === 0 ? (
              <div className="rounded-3xl border border-pink-200/60 bg-white/80 p-8 text-center backdrop-blur-md">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-pink-600 border-t-transparent" />
                <p className="mt-3 text-xs font-semibold text-neutral-500">Cargando citas operativas...</p>
              </div>
            ) : visibleReservations.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-pink-200 bg-white/70 p-10 text-center backdrop-blur-md">
                <CalendarDays className="mx-auto h-10 w-10 text-pink-300 mb-2" />
                <h3 className="font-display text-sm font-bold text-neutral-800">No hay citas en este filtro</h3>
                <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
                  {showActionRequired
                    ? 'No hay citas con abonos pendientes ni acciones pendientes de atención en este rango.'
                    : 'Prueba cambiando el rango de fechas o el término de búsqueda.'}
                </p>
                {showActionRequired && (
                  <button
                    onClick={() => setShowActionRequired(false)}
                    className="mt-3 text-xs font-bold text-pink-600 hover:underline"
                  >
                    Ver todas las citas confirmadas →
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedReservations).map(([dateLabel, dateReservations]) => (
                  <div key={dateLabel} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-gradient-to-r from-[#E11B74] to-[#C5A059] px-3 py-1 text-xs font-bold text-white shadow-sm capitalize">
                        {dateLabel}
                      </span>
                      <div className="h-px flex-1 bg-pink-200/60" />
                      <span className="text-xs font-semibold text-neutral-500">
                        {dateReservations.length} {dateReservations.length === 1 ? 'cita' : 'citas'}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {dateReservations.map((reservation) => {
                        const status = reservation.isExpired ? 'EXPIRADA' : reservation.paymentStatus;
                        const waPhone = reservation.phone ? reservation.phone.replace(/\D/g, '') : '';
                        const waMessage = `Hola ${reservation.name}, te escribo de Vanessa Nails Studio con respecto a tu cita del día ${reservation.dateLabel} a las ${reservation.timeLabel}...`;
                        const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}` : null;

                        return (
                          <div
                            key={reservation.code}
                            className="flex flex-col justify-between rounded-3xl border border-pink-200/70 bg-white/95 p-4 shadow-sm transition hover:shadow-md backdrop-blur-md"
                          >
                            <div>
                              {/* Header Card: Hora + Badges */}
                              <div className="flex items-center justify-between border-b border-pink-100/70 pb-3">
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center gap-1 rounded-xl bg-pink-50 px-2.5 py-1 text-xs font-bold text-pink-700 border border-pink-200/70">
                                    <Clock className="h-3.5 w-3.5 text-pink-600" />
                                    {reservation.timeLabel}
                                  </span>
                                  <span className="text-[10px] font-mono text-neutral-400">
                                    #{reservation.code}
                                  </span>
                                </div>

                                <div>
                                  {status === 'PENDIENTE_PAGO' && (
                                    <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                      Pendiente Abono
                                    </span>
                                  )}
                                  {status === 'PAGO_CONFIRMADO' && (
                                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                      Abono Confirmado
                                    </span>
                                  )}
                                  {status === 'EXPIRADA' && (
                                    <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                      Expirada
                                    </span>
                                  )}
                                  {reservation.attended && (
                                    <span className="ml-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                                      Asistió ✓
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Info Clienta */}
                              <div className="mt-3 flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#E11B74] to-[#C5A059] text-xs font-bold text-white shadow-sm">
                                  {reservation.name ? reservation.name.charAt(0).toUpperCase() : 'C'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="truncate font-display text-sm font-bold text-neutral-900">
                                    {reservation.name}
                                  </h4>
                                  <p className="text-xs font-semibold text-pink-600">
                                    {reservation.service}
                                  </p>
                                  <p className="mt-1 text-[11px] text-neutral-500">
                                    📞 {reservation.phone || 'Sin teléfono'} · ✉️ {reservation.email}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Acciones Rápidas */}
                            <div className="mt-4 pt-3 border-t border-pink-100/70 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                {waUrl && (
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition shadow-sm"
                                    title="Contactar por WhatsApp"
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </a>
                                )}
                                {reservation.htmlLink && (
                                  <a
                                    href={reservation.htmlLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100 transition shadow-sm"
                                    title="Ver en Google Calendar"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                {status === 'PENDIENTE_PAGO' && (
                                  <button
                                    type="button"
                                    disabled={confirmingPaymentCode === reservation.code}
                                    onClick={() => handleConfirmPayment(reservation.code)}
                                    className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition disabled:opacity-50"
                                  >
                                    {confirmingPaymentCode === reservation.code ? (
                                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5" />
                                    )}
                                    <span>Confirmar Pago</span>
                                  </button>
                                )}

                                {status === 'PAGO_CONFIRMADO' && !reservation.attended && (
                                  <button
                                    type="button"
                                    disabled={submittingCode === reservation.code}
                                    onClick={() => handleValidate(reservation.code)}
                                    className="flex items-center gap-1 rounded-xl bg-pink-600 hover:bg-pink-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition disabled:opacity-50"
                                  >
                                    {submittingCode === reservation.code ? (
                                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    )}
                                    <span>Validar Asistencia</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => openActionPanel('reschedule', reservation)}
                                  className="rounded-xl border border-pink-200 bg-pink-50/80 hover:bg-pink-100 px-2.5 py-1.5 text-[11px] font-bold text-pink-700 transition"
                                >
                                  Reagendar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openActionPanel('cancel', reservation)}
                                  className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-2 py-1.5 text-[11px] font-bold text-rose-700 transition"
                                  title="Eliminar hora"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Modal de Acción (Reagendar / Cancelar / Editar) */}
                            {actionPanel?.code === reservation.code && (
                              <div className="mt-3 rounded-2xl border border-pink-200 bg-pink-50/90 p-3.5 text-xs space-y-3 animate-fadeIn">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold uppercase tracking-wider text-neutral-700 text-[10px]">
                                    {actionPanel.mode === 'reschedule' ? 'Reagendar Turno' : 'Eliminar Cita'}
                                  </span>
                                  <button onClick={closeActionPanel} className="text-neutral-400 hover:text-neutral-600">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                {actionPanel.mode === 'reschedule' ? (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-bold text-neutral-600">Nueva Fecha</label>
                                      <input
                                        type="date"
                                        value={actionDraft.date || ''}
                                        onChange={(e) => updateActionDraft('date', e.target.value)}
                                        className="w-full rounded-xl border border-pink-200 bg-white px-2 py-1 text-xs outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-neutral-600">Nueva Hora</label>
                                      <input
                                        type="time"
                                        value={actionDraft.start || ''}
                                        onChange={(e) => updateActionDraft('start', e.target.value)}
                                        className="w-full rounded-xl border border-pink-200 bg-white px-2 py-1 text-xs outline-none"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-rose-700 text-[11px]">
                                    ¿Seguro que deseas eliminar esta reserva y liberar el cupo en Google Calendar y Sheets?
                                  </p>
                                )}

                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    onClick={closeActionPanel}
                                    className="rounded-lg bg-white px-2.5 py-1 font-semibold text-neutral-600 border border-neutral-200"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => runReservationAction(actionPanel.mode, reservation.code)}
                                    disabled={actionSubmitting}
                                    className={`rounded-lg px-3 py-1 font-bold text-white ${
                                      actionPanel.mode === 'cancel' ? 'bg-rose-600' : 'bg-pink-600'
                                    }`}
                                  >
                                    {actionSubmitting ? 'Guardando...' : 'Confirmar'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AdminShell>
    </>
  );
}
