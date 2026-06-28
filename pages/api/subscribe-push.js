import { isEmailValid, isValidPushSubscription } from '../../lib/apiValidation';
import { getGasWebhookUrl } from '../../lib/backendRouting';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const GAS_URL = getGasWebhookUrl();
  if (!GAS_URL) return res.status(500).json({ error: 'La URL del webhook no esta configurada.' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Body JSON invalido.' });
  }

  const { subscription, email } = body;

  if (!isValidPushSubscription(subscription)) {
    return res.status(400).json({ error: 'Suscripcion push invalida.' });
  }

  if (email != null && email !== '' && !isEmailValid(email)) {
    return res.status(400).json({ error: 'Email invalido.' });
  }

  const payload = {
    action: 'saveSubscription',
    subscription,
    email: typeof email === 'string' ? email.trim() : '',
  };

  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'No se pudo guardar la suscripcion push.' });
    }

    return res.status(201).json({ success: true });
  } catch {
    return res.status(502).json({ error: 'No se pudo guardar la suscripcion push.' });
  }
}
