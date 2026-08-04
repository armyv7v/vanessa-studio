// pages/api/admin/reminders.js
import { verifyAdminRequest } from '../../../lib/adminSession';
import { getBackendApiUrl, getGasWebhookUrl } from '../../../lib/backendRouting';
import { enforceAllowedOrigin, handleCorsPreflight, setCorsHeaders } from '../../../lib/cors';
import { applyRateLimit, setRateLimitHeaders } from '../../../lib/rateLimit';

function getAdminValidationPin() {
  return process.env.ADMIN_VALIDATION_PIN || '2308';
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

    const rateLimit = applyRateLimit(req, { keyPrefix: 'admin-reminders', limit: 20 });
    setRateLimitHeaders(res, rateLimit);
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: 'Demasiadas solicitudes de recordatorios. Intenta más tarde.' });
    }

    const adminPin = getAdminValidationPin();

    if (req.method === 'GET') {
      // Obtener lista de campañas
      try {
        const backendUrl = `${getBackendApiUrl()}/campaigns?adminPin=${adminPin}`;
        const response = await fetch(backendUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          return res.status(200).json({ success: true, campaigns: data.campaigns || [] });
        }
      } catch (err) {
        console.warn('Error al obtener campañas del backend:', err.message);
      }
      return res.status(200).json({ success: true, campaigns: [] });
    }

    if (req.method === 'POST') {
      const { action = 'send-immediate', recipients = [], subject, bodyHtml, scheduledAt, campaignId } = req.body || {};

      if (!Array.isArray(recipients) || recipients.length === 0) {
        if (action !== 'suspend') {
          return res.status(400).json({ error: 'Debes incluir al menos un destinatario.' });
        }
      }

      if ((action === 'send-immediate' || action === 'schedule') && (!subject || !bodyHtml)) {
        return res.status(400).json({ error: 'El asunto y el mensaje son requeridos.' });
      }

      // Enviar al backend de Netlify para procesamiento Brevo / Sheets
      try {
        const backendUrl = `${getBackendApiUrl()}/reminders`;
        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://vanessa-studio.vercel.app',
          },
          body: JSON.stringify({
            adminPin,
            action,
            recipients,
            subject,
            bodyHtml,
            scheduledAt,
            campaignId,
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          return res.status(response.status).json({ error: data?.error || 'Error al procesar campaña en el backend.' });
        }

        return res.status(200).json(data || { success: true });
      } catch (backendErr) {
        return res.status(500).json({ error: backendErr?.message || 'Error de conexión con el backend de envíos.' });
      }
    }
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Error procesando la solicitud de recordatorios.' });
  }
}
