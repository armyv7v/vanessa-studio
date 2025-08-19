export const config = { runtime: 'edge' };
// Reutilizamos el handler de /api/availability,
// forzando ?legacy=1 para devolver { times: [...] }
import availability from './availability';
export default async function handler(req) {
  const url = new URL(req.url);
  if (!url.searchParams.has('legacy')) {
    url.searchParams.set('legacy', '1');
  }
  // Mantiene método/headers del request original
  const proxiedReq = new Request(url.toString(), req);
  return availability(proxiedReq);
}
