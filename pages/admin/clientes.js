import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DateTime } from 'luxon';
import AdminShell from '../../components/AdminShell';
import AdminMetricIcon from '../../components/AdminMetricIcon';
import { hasAdminToken } from '../../lib/adminAuth';
import { SparkleIcon, UsersIcon, CloseIcon } from '../../components/BrandMotifs';

export default function AdminClientes() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState(null);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'frequent', 'loyalty', 'inactive'

  // Modal de detalle de cliente
  const [selectedClient, setSelectedClient] = useState(null);

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
      const res = await fetch('/api/admin/clientes', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al cargar clientes');
      }
      setClients(data.clients || []);
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrado de clientes en memoria
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.phone.includes(query);

      if (!matchesSearch) return false;

      if (filterMode === 'frequent') {
        return client.totalReservations >= 3;
      }
      if (filterMode === 'loyalty') {
        return client.loyalty?.rewardAvailable || client.loyalty?.stamps > 0;
      }
      if (filterMode === 'inactive') {
        if (!client.lastAppointmentDate) return true;
        const lastDate = DateTime.fromISO(client.lastAppointmentDate);
        if (!lastDate.isValid) return false;
        const daysDiff = DateTime.now().diff(lastDate, 'days').days;
        return daysDiff > 45;
      }

      return true;
    });
  }, [clients, searchTerm, filterMode]);

  // Métricas agregadas
  const stats = useMemo(() => {
    const total = clients.length;
    const frequent = clients.filter((c) => c.totalReservations >= 3).length;
    const rewardsAvailable = clients.filter((c) => c.loyalty?.rewardAvailable).length;
    const totalBookings = clients.reduce((acc, c) => acc + c.totalReservations, 0);
    const avgBookings = total > 0 ? (totalBookings / total).toFixed(1) : 0;

    return { total, frequent, rewardsAvailable, avgBookings };
  }, [clients]);

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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminShell
      title="Gestión de Clientes"
      description="Base de datos consolidada de clientes según registros de Google Sheets e historial de citas."
    >
      <Head>
        <title>Clientes | Admin Vanessa Nails Studio</title>
      </Head>

      {/* Tarjetas de Métricas KPI */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Clientes</span>
            <AdminMetricIcon variant="default">
              <UsersIcon className="h-5 w-5 text-pink-600" />
            </AdminMetricIcon>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-800">{stats.total}</p>
          <p className="mt-1 text-xs text-slate-500">Clientes únicos registrados</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Clientes Frecuentes</span>
            <AdminMetricIcon variant="success">
              <SparkleIcon className="h-5 w-5 text-emerald-600" />
            </AdminMetricIcon>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-600">{stats.frequent}</p>
          <p className="mt-1 text-xs text-slate-500">Con 3 o más citas agendadas</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Premio Fidelidad</span>
            <AdminMetricIcon variant="warning">
              <span className="text-sm font-black">🎁</span>
            </AdminMetricIcon>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-amber-600">{stats.rewardsAvailable}</p>
          <p className="mt-1 text-xs text-slate-500">Recompensa disponible para canje</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Promedio Citas</span>
            <AdminMetricIcon variant="default">
              <span className="text-sm font-black">📊</span>
            </AdminMetricIcon>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-800">{stats.avgBookings}</p>
          <p className="mt-1 text-xs text-slate-500">Citas por cliente promedio</p>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por Nombre, Email o Teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm font-medium text-slate-800 transition focus:border-pink-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
          <span className="absolute left-4 top-3.5 text-slate-400">🔍</span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-3 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
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
        </div>
      </div>

      {/* Estado de Carga / Error */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
          <p className="mt-4 text-sm font-semibold text-slate-600">Cargando clientes desde Google Sheets...</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700 shadow-sm">
          <p className="font-bold">⚠️ Error</p>
          <p className="mt-1 text-sm">{error}</p>
          <button
            onClick={fetchClients}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-rose-700"
          >
            Reintentar
          </button>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-4xl">💅</p>
          <h3 className="mt-3 text-lg font-bold text-slate-800">No se encontraron clientes</h3>
          <p className="mt-1 text-sm text-slate-500">Prueba ajustando los términos de búsqueda o filtros.</p>
        </div>
      ) : (
        /* Listado de Clientes */
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs uppercase text-slate-500">
                <tr>
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
                  const waUrl = formatWhatsAppUrl(client.phone, client.name);
                  const initial = client.name ? client.name.charAt(0).toUpperCase() : 'C';

                  return (
                    <tr key={client.email} className="transition hover:bg-pink-50/30">
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
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800 animate-pulse">
                            🎁 Premio Listo ({client.loyalty.stamps}/6)
                          </span>
                        ) : client.loyalty?.stamps > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-800">
                            ✨ {client.loyalty.stamps} / 6 sellos
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Sin tarjeta activa</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow transition hover:bg-emerald-600"
                              title="Abrir WhatsApp"
                            >
                              💬
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedClient(client)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-pink-500 hover:text-pink-600"
                          >
                            Ver Detalle
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

      {/* Modal / Drawer de Detalle de Cliente */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
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
              <button
                onClick={() => setSelectedClient(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Resumen de Fidelidad y Métricas */}
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
                <p className="mt-1 text-lg font-bold text-pink-700">
                  {selectedClient.loyalty?.stamps || 0} / 6 Sellos
                </p>
              </div>
            </div>

            {/* Servicios Preferidos */}
            {selectedClient.favoriteServices.length > 0 && (
              <div className="mb-6">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Servicios Solicitados</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedClient.favoriteServices.map((svc) => (
                    <span key={svc} className="rounded-xl bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-800">
                      💅 {svc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Historial de Citas */}
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
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-bold text-emerald-700">
                          Asistió
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-500">
                          Agendada
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Modal con Contacto Directo */}
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              {formatWhatsAppUrl(selectedClient.phone, selectedClient.name) && (
                <a
                  href={formatWhatsAppUrl(selectedClient.phone, selectedClient.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow transition hover:bg-emerald-600"
                >
                  💬 Contactar por WhatsApp
                </a>
              )}
              <button
                onClick={() => setSelectedClient(null)}
                className="rounded-2xl border border-slate-200 bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
