// pages/api/client.js

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  const email = new URL(req.url).searchParams.get('email');

  if (!email) {
    return jsonResponse({ error: 'El parámetro email es requerido' }, 400);
  }

  const GAS_URL = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL;

  if (!GAS_URL) {
    return jsonResponse({ error: 'La URL del script de Google no está configurada.' }, 500);
  }

  try {
    const url = new URL(GAS_URL);
    url.searchParams.set('action', 'getClient');
    url.searchParams.set('email', email);

    const gasResponse = await fetch(url.toString());
    const data = await gasResponse.json();

    if (!gasResponse.ok) {
      throw new Error(data?.error || 'Error al contactar el servicio de Google.');
    }

    return jsonResponse({ client: data.client || null });
  } catch (error) {
    console.error('Error en /api/client:', error);
    return jsonResponse({ error: error.message || 'Error interno del servidor' }, 500);
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
