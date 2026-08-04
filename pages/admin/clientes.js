import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DateTime } from 'luxon';
import AdminShell from '../../components/AdminShell';
import AdminMetricIcon from '../../components/AdminMetricIcon';
import { hasAdminToken } from '../../lib/adminAuth';
import {
  SparkleIcon,
  UsersIcon,
  CloseIcon,
  SearchIcon,
  WhatsAppIcon,
  MailIcon,
  GiftIcon,
  ChartIcon,
  ClockIcon,
  SuspendIcon,
  UserPlusIcon,
  ClipboardListIcon,
  PolishBottleIcon,
} from '../../components/BrandMotifs';
import { services } from '../../lib/services';
import { getAvailableSlots } from '../../lib/api';

/**
 * Componente Portal para asegurar que todos los modales se rendericen en document.body
 * y queden perfectamente centrados en la ventana del navegador (viewport) independientemente del scroll.
 */
function ModalPortal({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

export default function AdminClientes() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState(null);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all');

  // Selección múltiple para envíos masivos
  const [selectedEmails, setSelectedEmails] = useState(new Set());

  // Modal de detalle de cliente
  const [selectedClient, setSelectedClient] = useState(null);

  // Agendamiento Rápido
  const [quickBookingClient, setQuickBookingClient] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    serviceId: String(services[0]?.id || ''),
    date: DateTime.now().setZone('America/Santiago').plus({ days: 1 }).toISODate(),
    start: '',
    extraCupo: false,
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState(null);

  // Campañas / Envíos de Email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    subject: '💅 ¡Es hora de renovar tus uñas en Vanessa Nails Studio!',
    bodyHtml: `Hola <b>{nombre}</b>,<br><br>Han pasado unos días desde tu última visita ({ultima_cita}). ¡Queremos invitarte a mantener tus uñas impecables y perfectas!<br><br>Recordá que podés agendar tu próximo turno en segundos.`,
    isScheduled: false,
    scheduledAt: DateTime.now().setZone('America/Santiago').plus({ days: 1 }).toFormat("yyyy-MM-dd'T'10:00"),
  });
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailNotice, setEmailNotice] = useState(null);

  // Histórico / Suspensión de Campañas
  const [showCampaignsModal, setShowCampaignsModal] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  useEffect(() => {
    if (!hasAdminToken()) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
      fetchClients();
    }
  }, [router]);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/clientes');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar clientes');
      setClients(data.clients || []);
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const res = await fetch('/api/admin/reminders');
      const data = await res.json();
      if (res.ok) setCampaigns(data.campaigns || []);
    } catch (err) {
      console.warn('Error al cargar campañas:', err.message);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const loadSlotsForQuickBooking = useCallback(async (dateStr, serviceId) => {
    if (!dateStr || !serviceId) return;
    setLoadingSlots(true);
    try {
      const dateObj = new Date(`${dateStr}T12:00:00`);
      const busySlots = await getAvailableSlots(dateObj, serviceId);
      const potentialStarts = ['10:00', '11:30', '13:00', '15:00', '16:30', '18:00'];
      const free = potentialStarts.filter((timeStr) => !busySlots.includes(timeStr));

      setAvailableSlots(free.length > 0 ? free : ['10:00', '12:30', '15:00', '17:30']);
      setBookingForm((prev) => ({ ...prev, start: free[0] || '10:00' }));
    } catch {
      setAvailableSlots(['10:00', '12:00', '15:00', '17:00']);
      setBookingForm((prev) => ({ ...prev, start: '10:00' }));
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (quickBookingClient && bookingForm.date && bookingForm.serviceId) {
      loadSlotsForQuickBooking(bookingForm.date, bookingForm.serviceId);
    }
  }, [quickBookingClient, bookingForm.date, bookingForm.serviceId, loadSlotsForQuickBooking]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.phone.includes(query);

      if (!matchesSearch) return false;

      if (filterMode === 'frequent') return client.totalReservations >= 3;
      if (filterMode === 'loyalty') return client.loyalty?.rewardAvailable || client.loyalty?.stamps > 0;
      if (filterMode === 'inactive') {
        if (!client.lastAppointmentDate) return true;
        const lastDate = DateTime.fromISO(client.lastAppointmentDate);
        if (!lastDate.isValid) return false;
        return DateTime.now().diff(lastDate, 'days').days > 45;
      }
      return true;
    });
  }, [clients, searchTerm, filterMode]);

  const toggleSelectEmail = (email) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEmails.size === filteredClients.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredClients.map((c) => c.email)));
    }
  };

  const stats = useMemo(() => {
    const total = clients.length;
    const frequent = clients.filter((c) => c.totalReservations >= 3).length;
    const rewardsAvailable = clients.filter((c) => c.loyalty?.rewardAvailable).length;
    const totalBookings = clients.reduce((acc, c) => acc + c.totalReservations, 0);
    const avgBookings = total > 0 ? (totalBookings / total).toFixed(1) : 0;
    return { total, frequent, rewardsAvailable, avgBookings };
  }, [clients]);

  const handleOpenQuickBooking = (client) => {
    const favService = services.find((s) => s.name === client.favoriteServices?.[0]);
    const serviceId = favService ? String(favService.id) : String(services[0]?.id || '');

    setBookingForm({
      serviceId,
      date: DateTime.now().setZone('America/Santiago').plus({ days: 1 }).toISODate(),
      start: '',
      extraCupo: false,
    });
    setBookingSuccess(null);
    setBookingError(null);
    setQuickBookingClient(client);
  };

  const handleConfirmQuickBooking = async (e) => {
    e.preventDefault();
    if (!quickBookingClient) return;

    setBookingSubmitting(true);
    setBookingError(null);
    setBookingSuccess(null);

    const selectedSvc = services.find((s) => String(s.id) === String(bookingForm.serviceId));

    try {
      const res = await fetch('/api/admin/cita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: bookingForm.serviceId,
          serviceName: selectedSvc?.name || 'Servicio General',
          date: bookingForm.date,
          start: bookingForm.start,
          durationMin: selectedSvc?.duration || 120,
          extraCupo: bookingForm.extraCupo,
          client: {
            name: quickBookingClient.name,
            email: quickBookingClient.email,
            phone: quickBookingClient.phone,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo agendar la cita');

      setBookingSuccess(`¡Cita agendada con éxito para ${quickBookingClient.name}!`);
      setTimeout(() => {
        setQuickBookingClient(null);
        fetchClients();
      }, 1800);
    } catch (err) {
      setBookingError(err.message || 'Error al crear la reserva.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleOpenEmailModal = () => {
    setEmailNotice(null);
    setShowEmailModal(true);
  };

  const handleSendOrScheduleEmail = async (e) => {
    e.preventDefault();
    setEmailSubmitting(true);
    setEmailNotice(null);

    const targetClients = clients.filter((c) => selectedEmails.has(c.email));

    const payload = {
      action: emailForm.isScheduled ? 'schedule' : 'send-immediate',
      recipients: targetClients.map((c) => ({
        email: c.email,
        name: c.name,
        lastAppointmentDate: c.lastAppointmentDate,
      })),
      subject: emailForm.subject,
      bodyHtml: emailForm.bodyHtml,
      scheduledAt: emailForm.isScheduled ? emailForm.scheduledAt : null,
    };

    try {
      const res = await fetch('/api/admin/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar envíos');

      setEmailNotice({
        type: 'success',
        message: emailForm.isScheduled
          ? 'Campaña programada exitosamente.'
          : `¡Se enviaron ${data.sentCount || targetClients.length} correos exitosamente!`,
      });

      setTimeout(() => {
        setShowEmailModal(false);
        setSelectedEmails(new Set());
      }, 2000);
    } catch (err) {
      setEmailNotice({ type: 'error', message: err.message || 'No se pudo enviar los correos.' });
    } finally {
      setEmailSubmitting(false);
    }
  };

  const handleSuspendCampaign = async (campaignId) => {
    if (!confirm('¿Seguro que deseas suspender esta campaña programada?')) return;
    try {
      const res = await fetch('/api/admin/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suspend', campaignId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al suspender');
      fetchCampaigns();
    } catch (err) {
      alert(err.message || 'No se pudo suspender la campaña');
    }
  };

  const formatWhatsAppUrl = (phone, name = '') => {
    if (!phone) return null;
    const cleanDigits = phone.replace(/\D/g, '');
    const formattedPhone = cleanDigits.startsWith('56') ? cleanDigits : `56${cleanDigits}`;
    const text = encodeURIComponent(`¡Hola ${name}! Te escribimos de Vanessa Nails Studio ✨`);
    return `https://wa.me/${formattedPhone}?text=${text}`;
  };

  const formatDateLabel = (isoString) => {
    if (!isoString) return 'Sin registro';
    const dt = DateTime.fromISO(isoString);
    if (!dt.isValid) return isoString;
    return dt.setLocale('es').toFormat('dd/MM/yyyy HH:mm');
  };

  if (!isAuthenticated) return null;

  return (
    <AdminShell
      title="Gestión de Clientes & Campañas"
      description="Base de datos consolidada de clientes, agendamiento rápido en 1-clic y envío de recordatorios masivos."
    >
      <Head>
        <title>Clientes | Admin Vanessa Nails Studio</title>
      </Head>

      {/* Tarjetas KPI */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Clientes</span>
            <AdminMetricIcon variant="default">
              <UsersIcon className="h-5 w-5 text-pink-600" />
            </AdminMetricIcon>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-800">{stats.total}</p>
          <p className="mt-1 text-xs text-slate-500">Clientes únicos registrados</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Clientes Frecuentes</span>
            <AdminMetricIcon variant="success">
              <SparkleIcon className="h-5 w-5 text-emerald-600" />
            </AdminMetricIcon>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-600">{stats.frequent}</p>
          <p className="mt-1 text-xs text-slate-500">Con 3 o más citas agendadas</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Premio Fidelidad</span>
            <AdminMetricIcon variant="warning">
              <GiftIcon className="h-5 w-5 text-amber-500" />
            </AdminMetricIcon>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-amber-600">{stats.rewardsAvailable}</p>
          <p className="mt-1 text-xs text-slate-500">Recompensa lista para canje</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Promedio Citas</span>
            <AdminMetricIcon variant="default">
              <ChartIcon className="h-5 w-5 text-slate-700" />
            </AdminMetricIcon>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-800">{stats.avgBookings}</p>
          <p className="mt-1 text-xs text-slate-500">Citas por cliente promedio</p>
        </div>
      </div>

      {/* Barra Superior de Acciones y Filtros */}
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por Nombre, Email o Teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm font-medium text-slate-800 transition focus:border-pink-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
          <span className="absolute left-4 top-3.5">
            <SearchIcon className="h-4 w-4" />
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'frequent', label: 'Frecuentes (3+)' },
            { id: 'loyalty', label: 'Con Fidelidad' },
            { id: 'inactive', label: 'Inactivos (>45 días)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id)}
              className={`rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                filterMode === tab.id
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-500/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={() => {
              setShowCampaignsModal(true);
              fetchCampaigns();
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-slate-800"
          >
            <ClipboardListIcon className="h-4 w-4" />
            Campañas Programadas
          </button>
        </div>
      </div>

      {/* Barra de Acciones Flotante al Seleccionar Clientes */}
      {selectedEmails.size > 0 && (
        <div className="sticky top-20 z-30 mb-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 p-4 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-black">
              {selectedEmails.size}
            </span>
            <p className="text-sm font-bold">Clientes seleccionados para envío masivo</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenEmailModal}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-extrabold text-pink-700 shadow hover:bg-pink-50 transition"
            >
              <MailIcon className="h-4 w-4" />
              Redactar Correo Masivo
            </button>
            <button
              onClick={() => setSelectedEmails(new Set())}
              className="rounded-xl bg-pink-800/60 px-3 py-2 text-xs font-bold hover:bg-pink-800 transition"
            >
              Desmarcar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de Clientes */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
          <p className="mt-4 text-sm font-semibold text-slate-600">Cargando clientes desde Google Sheets...</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700 shadow-sm">
          <p className="font-bold">⚠️ Error</p>
          <p className="mt-1 text-sm">{error}</p>
          <button onClick={fetchClients} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow">
            Reintentar
          </button>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <PolishBottleIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-lg font-bold text-slate-800">No se encontraron clientes</h3>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedEmails.size === filteredClients.length && filteredClients.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                    />
                  </th>
                  <th className="px-6 py-4 font-bold">Cliente</th>
                  <th className="px-6 py-4 font-bold">Contacto</th>
                  <th className="px-6 py-4 font-bold">Citas (Total / Asistidas)</th>
                  <th className="px-6 py-4 font-bold">Última Visita</th>
                  <th className="px-6 py-4 font-bold">Fidelidad</th>
                  <th className="px-6 py-4 text-right font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => {
                  const isSelected = selectedEmails.has(client.email);
                  const waUrl = formatWhatsAppUrl(client.phone, client.name);
                  const initial = client.name ? client.name.charAt(0).toUpperCase() : 'C';

                  return (
                    <tr key={client.email} className={`transition ${isSelected ? 'bg-pink-50/80' : 'hover:bg-pink-50/30'}`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectEmail(client.email)}
                          className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 font-bold text-white shadow-sm">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{client.name}</p>
                            {client.favoriteServices.length > 0 && (
                              <span className="mt-0.5 inline-block rounded-md bg-pink-100 px-2 py-0.5 text-[10px] font-semibold text-pink-700">
                                {client.favoriteServices[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-slate-700">{client.email}</p>
                        <p className="text-xs text-slate-500">{client.phone || 'Sin teléfono'}</p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800">
                            {client.totalReservations} citas
                          </span>
                          <span className="rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            {client.attendedCount} asistidas
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-slate-600">
                        {formatDateLabel(client.lastAppointmentDate)}
                      </td>

                      <td className="px-6 py-4">
                        {client.loyalty?.rewardAvailable ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">
                            <GiftIcon className="h-3.5 w-3.5" />
                            Premio Listo ({client.loyalty.stamps}/6)
                          </span>
                        ) : client.loyalty?.stamps > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-800">
                            <SparkleIcon className="h-3.5 w-3.5 text-pink-600" />
                            {client.loyalty.stamps} / 6 sellos
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Sin tarjeta activa</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* BOTÓN AGENDAMIENTO RÁPIDO */}
                          <button
                            onClick={() => handleOpenQuickBooking(client)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-pink-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-pink-700"
                            title="Agendar nueva cita con datos pre-rellenados"
                          >
                            <UserPlusIcon className="h-3.5 w-3.5 text-white" />
                            Agendar
                          </button>

                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow transition hover:bg-emerald-600"
                              title="Abrir WhatsApp"
                            >
                              <WhatsAppIcon className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedClient(client)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-pink-500 hover:text-pink-600"
                          >
                            Detalle
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL 1: AGENDAMIENTO RÁPIDO EN PORTAL BODY --- */}
      {quickBookingClient && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl my-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <UserPlusIcon className="h-5 w-5" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Agendamiento Rápido</h3>
                    <p className="text-xs text-slate-500">Cliente: <b>{quickBookingClient.name}</b> ({quickBookingClient.email})</p>
                  </div>
                </div>
                <button onClick={() => setQuickBookingClient(null)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmQuickBooking} className="mt-4 space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Servicio</label>
                  <select
                    value={bookingForm.serviceId}
                    onChange={(e) => setBookingForm((p) => ({ ...p, serviceId: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-800 font-semibold focus:border-pink-500 focus:outline-none"
                  >
                    {services.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name} ({svc.duration} min)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Fecha</label>
                  <input
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-800 font-semibold focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Horario Libre (Google Calendar)</label>
                  {loadingSlots ? (
                    <p className="text-xs text-pink-600 font-bold animate-pulse">Consultando disponibilidad en tiempo real...</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => setBookingForm((p) => ({ ...p, start: slot }))}
                          className={`rounded-xl py-2 text-xs font-bold transition ${
                            bookingForm.start === slot
                              ? 'bg-pink-600 text-white shadow-md'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {slot} hrs
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="extraCupo"
                    checked={bookingForm.extraCupo}
                    onChange={(e) => setBookingForm((p) => ({ ...p, extraCupo: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-pink-600"
                  />
                  <label htmlFor="extraCupo" className="text-xs font-semibold text-slate-700">
                    Modalidad Extra Cupo (18:00 - 20:00)
                  </label>
                </div>

                {bookingError && <p className="text-xs font-bold text-rose-600">{bookingError}</p>}
                {bookingSuccess && <p className="text-xs font-bold text-emerald-600">{bookingSuccess}</p>}

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setQuickBookingClient(null)}
                    className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={bookingSubmitting}
                    className="rounded-2xl bg-pink-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-pink-700 disabled:opacity-50"
                  >
                    {bookingSubmitting ? 'Confirmando...' : 'Confirmar y Agendar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* --- MODAL 2: EDITOR DE CAMPAÑA / EMAIL MASIVO EN PORTAL BODY --- */}
      {showEmailModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl my-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <MailIcon className="h-5 w-5" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Envío Masivo de Recordatorios</h3>
                    <p className="text-xs text-slate-500">Destinatarios: <b>{selectedEmails.size} clientes seleccionados</b></p>
                  </div>
                </div>
                <button onClick={() => setShowEmailModal(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSendOrScheduleEmail} className="mt-4 space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Asunto del Correo</label>
                  <input
                    type="text"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm((p) => ({ ...p, subject: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-800 font-semibold focus:border-pink-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Cuerpo del Mensaje (Etiquetas: {'{nombre}'} y {'{ultima_cita}'})
                  </label>
                  <textarea
                    rows={5}
                    value={emailForm.bodyHtml}
                    onChange={(e) => setEmailForm((p) => ({ ...p, bodyHtml: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-800 font-medium focus:border-pink-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="emailMode"
                        checked={!emailForm.isScheduled}
                        onChange={() => setEmailForm((p) => ({ ...p, isScheduled: false }))}
                        className="text-pink-600"
                      />
                      Envío Inmediato
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="emailMode"
                        checked={emailForm.isScheduled}
                        onChange={() => setEmailForm((p) => ({ ...p, isScheduled: true }))}
                        className="text-pink-600"
                      />
                      Programar Envío Futuro
                    </label>
                  </div>

                  {emailForm.isScheduled && (
                    <div className="mt-3">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Fecha y Hora de Envío</label>
                      <input
                        type="datetime-local"
                        value={emailForm.scheduledAt}
                        onChange={(e) => setEmailForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                        className="rounded-xl border border-slate-300 p-2 text-xs font-bold"
                      />
                    </div>
                  )}
                </div>

                {emailNotice && (
                  <div
                    className={`rounded-2xl p-3 text-xs font-bold ${
                      emailNotice.type === 'error' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {emailNotice.message}
                  </div>
                )}

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={emailSubmitting}
                    className="rounded-2xl bg-pink-600 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-pink-700 disabled:opacity-50"
                  >
                    {emailSubmitting
                      ? 'Procesando...'
                      : emailForm.isScheduled
                      ? 'Programar Campaña'
                      : 'Enviar Correos Ahora'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* --- MODAL 3: HISTORIAL & SUSPENSIÓN DE CAMPAÑAS EN PORTAL BODY --- */}
      {showCampaignsModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl my-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <ClipboardListIcon className="h-5 w-5" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Campañas Programadas y Envíos</h3>
                    <p className="text-xs text-slate-500">Historial y gestión de suspensión de envíos futuros</p>
                  </div>
                </div>
                <button onClick={() => setShowCampaignsModal(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4">
                {loadingCampaigns ? (
                  <div className="py-8 text-center text-xs font-bold text-slate-500">Cargando campañas...</div>
                ) : campaigns.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">No hay campañas registradas o programadas aún.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {campaigns.map((camp) => (
                      <div key={camp.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-2 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{camp.subject}</span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                camp.status === 'ENVIADO'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : camp.status === 'SUSPENDIDO'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {camp.status}
                            </span>
                          </div>
                          <p className="mt-1 text-slate-500">
                            ID: {camp.id} • {camp.recipientsCount} destinatarios • Fecha programada: {formatDateLabel(camp.scheduledAt)}
                          </p>
                        </div>

                        {camp.status === 'PENDIENTE' && (
                          <button
                            onClick={() => handleSuspendCampaign(camp.id)}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 font-bold text-rose-700 hover:bg-rose-100 transition"
                          >
                            <SuspendIcon className="h-3.5 w-3.5" />
                            Suspender Envío
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                <button
                  onClick={() => setShowCampaignsModal(false)}
                  className="rounded-2xl border border-slate-200 bg-slate-100 px-5 py-2 text-xs font-bold text-slate-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL 4: DETALLE CLIENTE EN PORTAL BODY */}
      {selectedClient && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl my-auto">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 text-xl font-bold text-white shadow">
                    {selectedClient.name ? selectedClient.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedClient.name}</h3>
                    <p className="text-xs text-slate-500">{selectedClient.email} • {selectedClient.phone || 'Sin teléfono'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedClient(null)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="my-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Total Citas</span>
                  <p className="mt-1 text-2xl font-black text-slate-800">{selectedClient.totalReservations}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                  <span className="text-xs font-bold text-emerald-600 uppercase">Asistidas</span>
                  <p className="mt-1 text-2xl font-black text-emerald-700">{selectedClient.attendedCount}</p>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-2xl bg-pink-50 p-4 text-center">
                  <span className="text-xs font-bold text-pink-600 uppercase">Fidelidad</span>
                  <p className="mt-1 text-lg font-bold text-pink-700">{selectedClient.loyalty?.stamps || 0} / 6 Sellos</p>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Historial de Citas</h4>
                <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-100 divide-y divide-slate-100">
                  {selectedClient.appointments.map((app, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{app.service}</p>
                        <p className="text-slate-400">{formatDateLabel(app.date)} ({app.duration} min)</p>
                      </div>
                      <div>
                        {app.attended ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-bold text-emerald-700">Asistió</span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-500">Agendada</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  onClick={() => {
                    const client = selectedClient;
                    setSelectedClient(null);
                    handleOpenQuickBooking(client);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-pink-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-pink-700 transition"
                >
                  <UserPlusIcon className="h-4 w-4 text-white" />
                  Agendar Cita Rápida
                </button>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="rounded-2xl border border-slate-200 bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </AdminShell>
  );
}
