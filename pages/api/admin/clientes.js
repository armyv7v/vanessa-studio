// pages/api/admin/clientes.js
import { verifyAdminRequest } from '../../../lib/adminSession';
import { getBackendApiUrl, getGasWebhookUrl } from '../../../lib/backendRouting';
import { enforceAllowedOrigin, handleCorsPreflight, setCorsHeaders } from '../../../lib/cors';
import { applyRateLimit, setRateLimitHeaders } from '../../../lib/rateLimit';

function getAdminValidationPin() {
  return process.env.ADMIN_VALIDATION_PIN || '';
}

function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

/**
 * Agrupa y consolida filas de Reservas en perfiles de cliente
 */
function aggregateClientsFromReservations(reservations = [], loyaltyData = []) {
  const loyaltyMap = new Map();
  if (Array.isArray(loyaltyData)) {
    for (const item of loyaltyData) {
      const email = normalizeEmail(item.email || item[0]);
      if (email) {
        loyaltyMap.set(email, {
          stamps: Number(item.stamps || item[2]) || 0,
          lastDate: item.lastDate || item[3] || null,
          deadline: item.deadline || item[4] || null,
          rewardAvailable: item.rewardAvailable === true || item[5] === 'SI',
          inPenalty: item.inPenalty === true || item[6] === 'SI',
        });
      }
    }
  }

  const clientsMap = new Map();

  for (const res of reservations) {
    const rawEmail = res.email || res.Email || (Array.isArray(res) ? res[2] : '');
    const email = normalizeEmail(rawEmail);
    if (!email) continue;

    const name = (res.name || res.nombre || res.Nombre || (Array.isArray(res) ? res[1] : '') || '').trim();
    const phone = (res.phone || res.telefono || res.Teléfono || (Array.isArray(res) ? res[3] : '') || '').trim();
    const service = (res.service || res.servicio || res.Servicio || (Array.isArray(res) ? res[4] : '') || '').trim();
    const date = res.startLocal || res.date || res.fecha || res['Inicio Cita'] || (Array.isArray(res) ? res[5] : '') || '';
    const duration = Number(res.duration || res.duracion || (Array.isArray(res) ? res[7] : '') || 0);
    const attendedRaw = res.attended || res.asistio || res.Asistió || (Array.isArray(res) ? res[12] : '');
    const attended = String(attendedRaw).trim().toUpperCase() === 'SI';
    const validationCode = res.validationCode || res['Código Validación'] || (Array.isArray(res) ? res[11] : '') || '';

    if (!clientsMap.has(email)) {
      clientsMap.set(email, {
        email,
        name: name || 'Cliente Sin Nombre',
        phone: phone || '',
        totalReservations: 0,
        attendedCount: 0,
        firstAppointmentDate: date,
        lastAppointmentDate: date,
        serviceCounts: {},
        appointments: [],
        loyalty: loyaltyMap.get(email) || { stamps: 0, rewardAvailable: false, inPenalty: false },
      });
    }

    const client = clientsMap.get(email);

    // Actualizar nombre y teléfono al más reciente / no vacío
    if (name && (client.name === 'Cliente Sin Nombre' || !client.name)) client.name = name;
    if (phone) client.phone = phone;

    client.totalReservations += 1;
    if (attended) client.attendedCount += 1;

    if (date) {
      if (!client.firstAppointmentDate || date < client.firstAppointmentDate) {
        client.firstAppointmentDate = date;
      }
      if (!client.lastAppointmentDate || date > client.lastAppointmentDate) {
        client.lastAppointmentDate = date;
      }
    }

    if (service) {
      client.serviceCounts[service] = (client.serviceCounts[service] || 0) + 1;
    }

    client.appointments.push({
      date,
      service: service || 'Servicio General',
      duration,
      attended,
      validationCode,
    });
  }

  const clients = Array.from(clientsMap.values()).map((c) => {
    // Ordenar citas por fecha descendente
    c.appointments.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

    // Servicios favoritos ordenados por frecuencia
    const favoriteServices = Object.entries(c.serviceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([svc]) => svc);

    return {
      email: c.email,
      name: c.name,
      phone: c.phone,
      totalReservations: c.totalReservations,
      attendedCount: c.attendedCount,
      firstAppointmentDate: c.firstAppointmentDate,
      lastAppointmentDate: c.lastAppointmentDate,
      favoriteServices,
      loyalty: c.loyalty,
      appointments: c.appointments,
    };
  });

  // Ordenar clientes por su última cita descendente
  clients.sort((a, b) => String(b.lastAppointmentDate || '').localeCompare(String(a.lastAppointmentDate || '')));

  return clients;
}

export default async function handler(req, res) {
  try {
    if (handleCorsPreflight(req, res, { methods: 'GET, POST, OPTIONS' })) return;
    setCorsHeaders(req, res, { methods: 'GET, POST, OPTIONS' });

    if (req.method !== 'GET' && req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!enforceAllowedOrigin(req, res)) return;

    if (!(await verifyAdminRequest(req))) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const rateLimit = applyRateLimit(req, { keyPrefix: 'admin-clientes', limit: 30 });
    setRateLimitHeaders(res, rateLimit);
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta más tarde.' });
    }

    const adminPin = getAdminValidationPin();

    // 1. Intentar backend en Netlify
    try {
      const backendUrl = `${getBackendApiUrl()}/clientes`;
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://vanessa-studio.vercel.app',
        },
        body: JSON.stringify({ adminPin }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.clients) {
          return res.status(200).json({ success: true, clients: data.clients });
        }
      }
    } catch (backendErr) {
      console.warn('Backend Netlify no disponible o dio error, intentando GAS:', backendErr.message);
    }

    // 2. Fallback: Google Apps Script Webhook
    const GAS_URL = getGasWebhookUrl();
    if (GAS_URL) {
      const workerUrl = new URL(GAS_URL);
      workerUrl.searchParams.set('action', 'getClients');

      const gasResponse = await fetch(workerUrl.toString());
      if (gasResponse.ok) {
        const gasData = await gasResponse.json();
        if (gasData?.clients) {
          return res.status(200).json({ success: true, clients: gasData.clients });
        }
        if (Array.isArray(gasData?.reservations)) {
          const aggregated = aggregateClientsFromReservations(gasData.reservations, gasData.loyalty);
          return res.status(200).json({ success: true, clients: aggregated });
        }
      }
    }

    return res.status(500).json({ error: 'No se pudo obtener la información de clientes de Google Sheets.' });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Error al procesar la lista de clientes.' });
  }
}
