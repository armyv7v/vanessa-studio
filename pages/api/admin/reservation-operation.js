import { verifyAdminRequest } from '../../../lib/adminSession';
import { getBackendApiUrl } from '../../../lib/backendRouting';
import { enforceAllowedOrigin, handleCorsPreflight, setCorsHeaders } from '../../../lib/cors';
import { applyRateLimit, setRateLimitHeaders } from '../../../lib/rateLimit';

const OPERATION_TO_BACKEND_PATH = {
  'confirm-payment': 'confirm-payment',
  'validate-attendance': 'validate-attendance',
  'expire-pending-payments': 'expire-pending-payments',
  'reservation-update': 'reservation-update',
  'reservation-reschedule': 'reservation-reschedule',
  'reservation-cancel': 'reservation-cancel',
};

function getAdminValidationPin() {
  return process.env.ADMIN_VALIDATION_PIN || '';
}

export default async function handler(req, res) {
  try {
    if (handleCorsPreflight(req, res, { methods: 'POST, OPTIONS' })) return;
    setCorsHeaders(req, res, { methods: 'POST, OPTIONS' });

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!enforceAllowedOrigin(req, res)) return;

    if (!(await verifyAdminRequest(req))) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const rateLimit = applyRateLimit(req, { keyPrefix: 'admin-reservation-operation', limit: 30 });
    setRateLimitHeaders(res, rateLimit);
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: 'Demasiadas operaciones admin. Intenta nuevamente mas tarde.' });
    }

    const adminPin = getAdminValidationPin();
    if (!adminPin) {
      return res.status(500).json({ error: 'ADMIN_VALIDATION_PIN no esta configurado en el servidor.' });
    }

    const { operation, payload = {} } = req.body || {};
    const backendPath = OPERATION_TO_BACKEND_PATH[operation];
    if (!backendPath) {
      return res.status(400).json({ error: 'Operacion admin no permitida.' });
    }

    const backendResponse = await fetch(`${getBackendApiUrl()}/${backendPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://vanessa-studio.vercel.app',
      },
      body: JSON.stringify({ ...payload, adminPin }),
    });

    const text = await backendResponse.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!backendResponse.ok) {
      return res.status(backendResponse.status).json({
        error: data?.error || 'No se pudo ejecutar la operacion admin.',
        details: data,
      });
    }

    return res.status(200).json(data || { success: true });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Error ejecutando operacion admin.' });
  }
}
