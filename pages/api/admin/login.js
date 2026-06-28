import {
  buildAdminSessionCookie,
  createAdminSessionToken,
  validateAdminPassword,
} from '../../../lib/adminSession';
import { enforceAllowedOrigin, handleCorsPreflight, setCorsHeaders } from '../../../lib/cors';

export default async function handler(req, res) {
  if (handleCorsPreflight(req, res, { methods: 'POST, OPTIONS' })) return;
  setCorsHeaders(req, res, { methods: 'POST, OPTIONS' });

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!enforceAllowedOrigin(req, res)) return;

  const { password } = req.body || {};
  const passwordResult = await validateAdminPassword(password);

  if (!passwordResult.ok) {
    const status = passwordResult.error?.includes('configurada') ? 500 : 401;
    return res.status(status).json({ error: status === 401 ? 'Credenciales inválidas' : passwordResult.error });
  }

  try {
    const token = await createAdminSessionToken();
    res.setHeader('Set-Cookie', buildAdminSessionCookie(token));
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'No se pudo crear la sesión admin.' });
  }
}
