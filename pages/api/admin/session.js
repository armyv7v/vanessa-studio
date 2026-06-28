import { verifyAdminRequest } from '../../../lib/adminSession';
import { enforceAllowedOrigin, handleCorsPreflight, setCorsHeaders } from '../../../lib/cors';

export default async function handler(req, res) {
  if (handleCorsPreflight(req, res, { methods: 'GET, OPTIONS' })) return;
  setCorsHeaders(req, res, { methods: 'GET, OPTIONS' });

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!enforceAllowedOrigin(req, res)) return;

  const authenticated = await verifyAdminRequest(req);
  return res.status(authenticated ? 200 : 401).json({ authenticated });
}
