// pages/api/client.js
export const runtime = 'edge';

const jsonRes = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export default async function handler(req) {
  if (req.method !== 'GET') return jsonRes({ error: 'Method Not Allowed' }, 405);

  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) return jsonRes({ error: 'El parametro email es requerido' }, 400);

  const GAS_URL = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL || process.env.GAS_WEBAPP_URL;
  if (!GAS_URL) return jsonRes({ error: 'La URL del script de Google no esta configurada.' }, 500);

  try {
    const workerUrl = new URL(GAS_URL);
    workerUrl.searchParams.set('action', 'getClient');
    workerUrl.searchParams.set('email', email);

    const gasResponse = await fetch(workerUrl.toString());
    const data = await gasResponse.json();

    if (!gasResponse.ok) throw new Error(data?.error || 'Error al contactar el servicio de Google.');

    return jsonRes({ client: data.client || null });
  } catch (error) {
    return jsonRes({ error: error.message || 'Error interno del servidor' }, 500);
  }
}
