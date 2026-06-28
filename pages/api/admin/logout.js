import { buildClearAdminSessionCookie } from '../../../lib/adminSession';
import { enforceAllowedOrigin, handleCorsPreflight, setCorsHeaders } from '../../../lib/cors';

export default function handler(req, res) {
  if (handleCorsPreflight(req, res, { methods: 'POST, OPTIONS' })) return;
  setCorsHeaders(req, res, { methods: 'POST, OPTIONS' });

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!enforceAllowedOrigin(req, res)) return;

  res.setHeader('Set-Cookie', buildClearAdminSessionCookie());
  return res.status(200).json({ ok: true });
}
