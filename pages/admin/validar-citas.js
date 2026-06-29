import { useRouter } from 'next/router';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { addDays, endOfDay, endOfWeek, format, startOfDay, startOfWeek, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Check,
  RotateCcw,
  MessageSquare,
  Calendar,
  DollarSign,
  Clock,
  Lock,
  RefreshCw,
  AlertCircle,
  Search,
  CheckCircle2,
  Trash2,
  CalendarDays,
  ExternalLink,
  Save,
  X,
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
  const [filter, setFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [showActionRequired, setShowActionRequired] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState('');
  const [adminPin, setAdminPin] = useState('');
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

    // Filtro por Estado de Pago
    if (paymentFilter !== 'all') {
      result = result.filter((reservation) => {
        const status = reservation.isExpired ? 'EXPIRADA' : reservation.paymentStatus;
        return status === paymentFilter;
      });
    }

    // Filtro "Acción Requerida" (Pendientes de pago o Expiradas sin resolver)
    if (showActionRequired) {
      result = result.filter((reservation) => {
        const status = reservation.isExpired ? 'EXPIRADA' : reservation.paymentStatus;
        return status === 'PENDIENTE_PAGO' || status === 'EXPIRADA';
      });
    }

    // Filtro de Búsqueda de Texto
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

  // Agrupamiento por fecha para optimizar espacio
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
    if (!adminPin || adminPin.length < 4) {
      setError('Ingresa el PIN de administrador para operar esta cita.');
      return;
    }

    const endpointByMode = {
      edit: 'reservation-update',
      reschedule: 'reservation-reschedule',
      cancel: 'reservation-cancel',
    };

    const payloadByMode = {
      edit: {
        code: reservationCode,
        adminPin,
        client: {
          name: actionDraft.name,
          email: actionDraft.email,
          phone: actionDraft.phone,
        },
        service: actionDraft.service,
      },
      reschedule: {
        code: reservationCode,
        adminPin,
        date: actionDraft.date,
        start: actionDraft.start,
        durationMin: Number(actionDraft.durationMin),
      },
      cancel: { code: reservationCode, adminPin },
    };

    if (mode === 'cancel') {
      const confirmed = window.confirm('Eliminar esta hora? Se liberara el cupo y se cancelara el evento de Calendar.');
      if (!confirmed) return;
    }

    try {
      setActionSubmitting(true);
      setError('');
      setSuccessMessage('');

      const res = await fetch(`${API_BASE}/${endpointByMode[mode]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadByMode[mode]),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo completar la accion sobre la cita.');
      }

      await refreshReservations();
      setSuccessMessage(data?.message || 'Cita actualizada correctamente.');
      setAdminPin('');
      closeActionPanel();
    } catch (actionError) {
      setError(actionError.message || 'No se pudo completar la accion sobre la cita.');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Manejadores de API
  const handleConfirmPayment = async (reservationCode) => {
    if (!adminPin || adminPin.length < 4) {
      setError('Ingresá el PIN de administrador para confirmar el pago.');
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
      setSuccessMessage(data?.message || 'Pago confirmado correctamente.');
      // Limpiar el PIN de entrada para seguridad
      setAdminPin('');
    } catch (paymentError) {
      setError(paymentError.message || 'No se pudo confirmar el pago.');
    } finally {
      setConfirmingPaymentCode('');
    }
  };

  const handleSweepExpiredPayments = async () => {
    if (!adminPin || adminPin.length < 4) {
      setError('Ingresá el PIN de administrador para liberar reservas vencidas.');
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
        throw new Error(data?.error || 'No se pudo ejecutar la liberación de vencidas.');
      }

      await refreshReservations();
      setSuccessMessage(data?.message || 'Liberación de vencidas ejecutada correctamente.');
      setAdminPin('');
    } catch (sweepError) {
      setError(sweepError.message || 'No se pudo ejecutar la liberación de vencidas.');
    } finally {
      setSweepingPayments(false);
    }
  };

  const handleValidate = async (reservationCode) => {
    if (!adminPin || adminPin.length < 4) {
      setError('Ingresá el PIN de administrador para validar manualmente.');
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
      setSuccessMessage('Asistencia validada correctamente y tarjeta de fidelidad actualizada.');
      setAdminPin('');
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
          <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>Verificando sesión admin...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <AdminShell
      title="Validar citas y abonos"
      description="Liberá turnos confirmando el abono recibido por transferencia, o validá asistencia cuando las clientas lleguen al estudio."
    >
      <div className="admin-workspace space-y-8">
        
        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-sm animate-fadeIn">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
            <p className="font-medium">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 shadow-sm animate-fadeIn">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            <p className="font-medium">{successMessage}</p>
          </div>
        )}

        <section className="admin-command-card rounded-[2rem] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-pink-200 bg-pink-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-pink-800">
                Centro operativo
              </p>
              <h2 className="mt-5 max-w-2xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Agenda, abonos y asistencia en una sola vista
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
                Inspirado en un SaaS de gestion de citas: primero lo urgente, despues el detalle.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={refreshReservations}
                disabled={listLoading}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${listLoading ? 'animate-spin' : ''}`} />
                Actualizar agenda
              </button>
              <button
                type="button"
                onClick={handleSweepExpiredPayments}
                disabled={sweepingPayments}
                className="inline-flex items-center gap-2 rounded-2xl bg-pink-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-pink-900/10 transition hover:-translate-y-px hover:bg-pink-800 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Liberar vencidas
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Citas visibles', value: visibleReservations.length, detail: `${paymentSummary.total} en el rango cargado`, icon: 'calendar' },
              { label: 'Acciones criticas', value: operationsSummary.actionRequired, detail: 'Abonos, vencidas o asistencia', icon: 'bolt' },
              { label: 'Abonos confirmados', value: paymentSummary.confirmed, detail: `${paymentSummary.pending} pendientes de pago`, icon: 'wallet' },
              { label: 'Flujo resuelto', value: `${operationsSummary.completionRate}%`, detail: `${operationsSummary.attendancePending} esperan asistencia`, icon: 'pulse' },
            ].map((metric) => (
              <div key={metric.label} className="admin-metric-card rounded-3xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-4xl font-black text-slate-950">{metric.value}</p>
                  </div>
                  <AdminMetricIcon type={metric.icon} />
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-600">{metric.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Dashboard Grid */}
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          
          {/* Main Controls Section (Left/Top 2 Cols) */}
          <div className="space-y-7">
            
            {/* Search and Filters Card */}
            <div className="admin-section-band rounded-[2rem] p-5 shadow-sm space-y-5 sm:p-6">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email, teléfono, código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white/50 pl-11 pr-4 py-3 text-sm text-slate-800 outline-none transition focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-100"
                />
              </div>

              {/* Range & Filters Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {/* Date range filters */}
                <div className="flex items-center gap-2">
                  {[
                    { id: 'today', label: 'Hoy' },
                    { id: 'week', label: 'Esta Semana' },
                    { id: 'all', label: 'Ver Todo (60 días)' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilter(tab.id)}
                      className="rounded-full px-4 py-2 text-xs font-bold transition-all"
                      style={
                        filter === tab.id
                          ? {
                              background: 'linear-gradient(160deg, #F04A94 0%, #E11B74 55%, #B8105D 100%)',
                              color: '#fff',
                              boxShadow: '0 4px 10px rgba(225,27,116,0.18)',
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

                {/* Show Required Actions Toggle */}
                <button
                  type="button"
                  onClick={() => setShowActionRequired(!showActionRequired)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition border"
                  style={
                    showActionRequired
                      ? {
                          borderColor: 'var(--brand)',
                          background: 'var(--brand-lightest)',
                          color: 'var(--brand)',
                        }
                      : {
                          borderColor: '#cbd5e1',
                          background: '#f8fafc',
                          color: '#64748b',
                        }
                  }
                >
                  <Clock className="h-4 w-4" />
                  {showActionRequired ? 'Filtro: Acción Requerida' : 'Mostrar Completadas'}
                </button>
              </div>

              {/* Detailed Payment Filters (only if action required is off) */}
              {!showActionRequired && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  {[
                    { id: 'all', label: 'Todos los pagos' },
                    { id: 'PENDIENTE_PAGO', label: 'Pendientes' },
                    { id: 'PAGO_CONFIRMADO', label: 'Confirmados' },
                    { id: 'EXPIRADA', label: 'Expiradas/Liberadas' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setPaymentFilter(tab.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        paymentFilter === tab.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Citations List Panel */}
            <div className="admin-section-band rounded-[2rem] p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Turnos Registrados</h2>
                  <p className="text-xs text-slate-500">
                    Mostrando citas desde {format(dateRange.start, "d 'de' MMMM", { locale: es })} hasta {format(dateRange.end, "d 'de' MMMM", { locale: es })}
                  </p>
                </div>
                {listLoading ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-pink-600">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Actualizando...
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-500 rounded-full bg-slate-100 px-2.5 py-1">
                    {visibleReservations.length} {visibleReservations.length === 1 ? 'cita' : 'citas'}
                  </span>
                )}
              </div>

              {listLoading && reservations.length === 0 ? (
                <div className="space-y-4 py-2">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="rounded-2xl border border-slate-100 bg-white p-4">
                      <div className="flex items-start gap-4">
                        <div className="admin-skeleton-row h-16 w-20 rounded-2xl" />
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="admin-skeleton-row h-4 w-32 rounded-full" />
                          <div className="admin-skeleton-row h-5 w-2/3 rounded-full" />
                          <div className="admin-skeleton-row h-3 w-1/2 rounded-full" />
                        </div>
                        <div className="hidden space-y-2 sm:block">
                          <div className="admin-skeleton-row h-9 w-36 rounded-xl" />
                          <div className="admin-skeleton-row h-9 w-36 rounded-xl" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <p className="text-center text-xs font-semibold" style={{ color: 'var(--ink-faint)' }}>
                    Cargando agenda operativa...
                  </p>
                </div>
              ) : visibleReservations.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                  <CalendarDays className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">Sin citas para mostrar</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {showActionRequired 
                      ? 'No hay citas con acciones pendientes de abono o asistencia en este rango de tiempo.'
                      : 'No se encontraron citas que coincidan con los filtros o la búsqueda actual.'}
                  </p>
                  {showActionRequired && (
                    <button
                      onClick={() => setShowActionRequired(false)}
                      className="mt-4 text-xs font-bold text-pink-600 hover:text-pink-700 hover:underline"
                    >
                      Ver historial de citas confirmadas y completadas
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedReservations).map(([dateLabel, dateReservations]) => (
                    <div key={dateLabel} className="space-y-3">
                      
                      {/* Section Date Header */}
                      <div className="flex items-center gap-3 py-1">
                        <h3 className="font-display text-base font-semibold text-slate-800 capitalize">
                          {dateLabel}
                        </h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        {dateReservations.map((reservation) => {
                          const status = reservation.isExpired ? 'EXPIRADA' : reservation.paymentStatus;
                          
                          // WhatsApp Message Helper
                          const waPhone = reservation.phone ? reservation.phone.replace(/\D/g, '') : '';
                          const waMessage = `Hola ${reservation.name}, te escribo de Vanessa Nails Studio con respecto a tu cita del día ${reservation.dateLabel} a las ${reservation.timeLabel}...`;
                          const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}` : null;

                          return (
                            <div
                              key={reservation.code}
                              className="admin-list-card rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all hover:bg-slate-50 hover:shadow-sm"
                            >
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                
                                {/* Info Layout */}
                                <div className="flex items-start gap-4 min-w-0">
                                  {/* Big Time Block */}
                                  <div className="shrink-0 flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-100 px-3.5 py-2.5 shadow-sm text-center min-w-[70px]">
                                    <Clock className="h-4 w-4 text-pink-600 mb-1" />
                                    <span className="text-base font-bold text-slate-900 leading-none">
                                      {reservation.timeLabel}
                                    </span>
                                  </div>

                                  {/* Details */}
                                  <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      {/* Status Badge */}
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
                                          Cita Expirada (Sin Pago)
                                        </span>
                                      )}
                                      {status === 'CANCELADA' && (
                                        <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                          Cancelada
                                        </span>
                                      )}

                                      {/* Attendance Badge */}
                                      {reservation.attended ? (
                                        <span className="rounded-full bg-emerald-100/70 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                                          Asistió
                                        </span>
                                      ) : reservation.paymentStatus === 'PAGO_CONFIRMADO' ? (
                                        <span className="rounded-full bg-pink-50 border border-pink-100 text-pink-700 px-2 py-0.5 text-[10px] font-bold">
                                          Espera Asistencia
                                        </span>
                                      ) : null}
                                    </div>

                                    <h4 className="text-base font-bold text-slate-800 truncate">
                                      {reservation.name}
                                    </h4>
                                    <p className="text-xs font-semibold text-slate-600">
                                      {reservation.service}
                                    </p>
                                    
                                    <div className="text-[11px] text-slate-500 space-y-0.5 leading-tight">
                                      <p>{reservation.email}</p>
                                      <p>{reservation.phone || 'Sin teléfono registrado'}</p>
                                      <p className="font-mono text-[10px] text-slate-400">Código: {reservation.code}</p>
                                      {status === 'PENDIENTE_PAGO' && reservation.paymentExpiresAt && (
                                        <p className="text-amber-600 font-medium">
                                          Vence pago: {format(new Date(reservation.paymentExpiresAt), 'dd/MM HH:mm')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Actions Layout */}
                                <div className="flex flex-wrap items-center gap-2 shrink-0 sm:flex-col sm:items-stretch sm:min-w-[170px]">
                                  
                                  {/* Confirm Button */}
                                  {status === 'PENDIENTE_PAGO' && (
                                    <button
                                      type="button"
                                      disabled={confirmingPaymentCode === reservation.code}
                                      onClick={() => handleConfirmPayment(reservation.code)}
                                      className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 shadow-sm transition disabled:opacity-50"
                                    >
                                      {confirmingPaymentCode === reservation.code ? (
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Check className="h-3.5 w-3.5" />
                                      )}
                                      Confirmar Pago
                                    </button>
                                  )}

                                  {/* Reactivate Expired Button */}
                                  {status === 'EXPIRADA' && (
                                    <button
                                      type="button"
                                      disabled={confirmingPaymentCode === reservation.code}
                                      onClick={() => handleConfirmPayment(reservation.code)}
                                      className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-4 py-2.5 shadow-sm transition disabled:opacity-50"
                                    >
                                      {confirmingPaymentCode === reservation.code ? (
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <RotateCcw className="h-3.5 w-3.5" />
                                      )}
                                      Reactivar y Confirmar
                                    </button>
                                  )}

                                  {/* Validate Attendance Button */}
                                  {status === 'PAGO_CONFIRMADO' && !reservation.attended && (
                                    <button
                                      type="button"
                                      disabled={submittingCode === reservation.code}
                                      onClick={() => handleValidate(reservation.code)}
                                      className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold text-xs px-4 py-2.5 shadow-sm transition disabled:opacity-50"
                                    >
                                      {submittingCode === reservation.code ? (
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                      )}
                                      Validar Asistencia
                                    </button>
                                  )}

                                  {/* Direct Contact & Calendar Icons */}
                                  <div className="flex gap-2 w-full justify-end sm:justify-start">
                                    {reservation.htmlLink && (
                                      <a
                                        href={reservation.htmlLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Ver en Google Calendar"
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition shadow-sm shrink-0"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </a>
                                    )}
                                    {waUrl && (
                                      <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Chatear por WhatsApp"
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition shadow-sm shrink-0"
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                      </a>
                                    )}
                                  </div>

                                  {!reservation.attended && status !== 'CANCELADA' && (
                                    <div className="grid w-full grid-cols-3 gap-1.5 border-t border-slate-100 pt-2">
                                      <button
                                        type="button"
                                        onClick={() => openActionPanel('reschedule', reservation)}
                                        className="rounded-lg border border-sky-100 bg-sky-50 px-2 py-2 text-[10px] font-black text-sky-700 transition hover:bg-sky-100"
                                      >
                                        Reagendar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openActionPanel('edit', reservation)}
                                        className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-[10px] font-black text-slate-700 transition hover:bg-slate-100"
                                      >
                                        Editar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => runReservationAction('cancel', reservation.code)}
                                        disabled={actionSubmitting}
                                        className="rounded-lg border border-rose-100 bg-rose-50 px-2 py-2 text-[10px] font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  )}

                                </div>
                              </div>

                              {actionPanel?.code === reservation.code && actionPanel.mode !== 'cancel' && (
                                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                  <div className="mb-3 flex items-center justify-between gap-3">
                                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">
                                      {actionPanel.mode === 'reschedule' ? 'Reagendar cita' : 'Editar datos'}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={closeActionPanel}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>

                                  {actionPanel.mode === 'reschedule' ? (
                                    <div className="grid gap-3 sm:grid-cols-3">
                                      <label className="text-[11px] font-bold text-slate-600">
                                        Fecha
                                        <input
                                          type="date"
                                          value={actionDraft.date || ''}
                                          onChange={(event) => updateActionDraft('date', event.target.value)}
                                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-pink-400"
                                        />
                                      </label>
                                      <label className="text-[11px] font-bold text-slate-600">
                                        Hora
                                        <input
                                          type="time"
                                          value={actionDraft.start || ''}
                                          onChange={(event) => updateActionDraft('start', event.target.value)}
                                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-pink-400"
                                        />
                                      </label>
                                      <label className="text-[11px] font-bold text-slate-600">
                                        Duracion min.
                                        <input
                                          type="number"
                                          min="15"
                                          step="15"
                                          value={actionDraft.durationMin || ''}
                                          onChange={(event) => updateActionDraft('durationMin', event.target.value)}
                                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-pink-400"
                                        />
                                      </label>
                                    </div>
                                  ) : (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      <label className="text-[11px] font-bold text-slate-600">
                                        Nombre
                                        <input
                                          type="text"
                                          value={actionDraft.name || ''}
                                          onChange={(event) => updateActionDraft('name', event.target.value)}
                                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-pink-400"
                                        />
                                      </label>
                                      <label className="text-[11px] font-bold text-slate-600">
                                        Telefono
                                        <input
                                          type="tel"
                                          value={actionDraft.phone || ''}
                                          onChange={(event) => updateActionDraft('phone', event.target.value)}
                                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-pink-400"
                                        />
                                      </label>
                                      <label className="text-[11px] font-bold text-slate-600">
                                        Email
                                        <input
                                          type="email"
                                          value={actionDraft.email || ''}
                                          onChange={(event) => updateActionDraft('email', event.target.value)}
                                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-pink-400"
                                        />
                                      </label>
                                      <label className="text-[11px] font-bold text-slate-600">
                                        Servicio
                                        <input
                                          type="text"
                                          value={actionDraft.service || ''}
                                          onChange={(event) => updateActionDraft('service', event.target.value)}
                                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-pink-400"
                                        />
                                      </label>
                                    </div>
                                  )}

                                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={closeActionPanel}
                                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                      Cancelar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => runReservationAction(actionPanel.mode, reservation.code)}
                                      disabled={actionSubmitting}
                                      className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                                    >
                                      {actionSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                      Guardar cambios
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

          {/* Sidebar Area (Right 1 Col) */}
          <div className="space-y-6 xl:sticky xl:top-28">
            
            {/* PIN authorization */}
            <div className="admin-surface-card rounded-3xl border border-white/70 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Lock className="h-4.5 w-4.5 text-pink-600" />
                Seguridad de operaciones
              </h3>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <Lock className="h-4 w-4 text-slate-500" />
                  PIN requerido
                </div>
                <p className="text-slate-600 leading-normal">
                  La sesion admin permite entrar al panel. Para confirmar pagos, validar asistencia o liberar reservas vencidas, ingresa el PIN de 4 digitos.
                </p>

                <input
                  id="admin-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength="4"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="PIN"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-center text-base tracking-[0.3em] font-mono text-slate-900 outline-none transition focus:border-pink-400 bg-white"
                />

                <p className="text-[10px] text-slate-400">
                  El device token fue eliminado del frontend: era comodo, pero no era una autorizacion segura para operaciones criticas.
                </p>
              </div>

              {/* Sweep Expired bookings */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSweepExpiredPayments}
                  disabled={sweepingPayments}
                  className="w-full rounded-xl border border-pink-200 bg-pink-50/30 px-4 py-2.5 text-xs font-bold text-pink-700 transition hover:bg-pink-50 hover:text-pink-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sweepingPayments ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  {sweepingPayments ? 'Liberando vencidas...' : 'Liberar Vencidas Manual'}
                </button>
                <p className="text-[10px] text-slate-400 mt-2 text-center leading-normal">
                  El sistema limpia las citas automáticamente cada 15 minutos. Usá este botón si querés forzar la limpieza ahora.
                </p>
              </div>
            </div>

            {/* Summary statistics */}
            <div className="admin-surface-card rounded-3xl border border-white/70 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                Resumen de Citas (Rango)
              </h3>
              
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                  <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Total</p>
                  <p className="mt-1 text-xl font-extrabold text-slate-800">{paymentSummary.total}</p>
                </div>
                
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-3">
                  <p className="text-amber-700 font-bold uppercase tracking-wider text-[9px]">Pendientes</p>
                  <p className="mt-1 text-xl font-extrabold text-amber-800">{paymentSummary.pending}</p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3">
                  <p className="text-emerald-700 font-bold uppercase tracking-wider text-[9px]">Confirmadas</p>
                  <p className="mt-1 text-xl font-extrabold text-emerald-800">{paymentSummary.confirmed}</p>
                </div>

                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-3">
                  <p className="text-rose-700 font-bold uppercase tracking-wider text-[9px]">Expiradas</p>
                  <p className="mt-1 text-xl font-extrabold text-rose-800">{paymentSummary.expired}</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </AdminShell>
  );
}
